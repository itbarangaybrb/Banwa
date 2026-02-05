<?php
/**
 * Simple OCR worker CLI
 * Usage: php ocr_worker.php
 *
 * Polls the `ocr_jobs` table for pending jobs and processes them.
 */

chdir(__DIR__);
require_once __DIR__ . '/../configs/database.php';
require_once __DIR__ . '/../configs/ocr_config.php';
require_once __DIR__ . '/../api/shared/ocr_service.php';

$runOnce = false;
// Support a --once flag to process current pending jobs and exit
if (isset($argv) && is_array($argv)) {
    foreach ($argv as $a) {
        if ($a === '--once') { $runOnce = true; break; }
    }
}

if (!defined('OCR_WORKER_POLL_INTERVAL')) {
    define('OCR_WORKER_POLL_INTERVAL', 3);
}

$uploadsDir = realpath(__DIR__ . '/../handlers/staff/business/uploads/') . DIRECTORY_SEPARATOR;
if ($uploadsDir === false) {
    echo "Uploads directory not found, check path.\n";
    exit(1);
}

echo "OCR Worker started. Poll interval: " . OCR_WORKER_POLL_INTERVAL . "s\n";

while (true) {
    try {
        $pdo->beginTransaction();

        // Fetch one pending job and lock it
        $jobStmt = $pdo->prepare("SELECT * FROM ocr_jobs WHERE status = 'pending' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1");
        $jobStmt->execute();
        $job = $jobStmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            $pdo->commit();
            if ($runOnce) {
                echo "No pending jobs; exiting (once mode).\n";
                break;
            }
            sleep(OCR_WORKER_POLL_INTERVAL);
            continue;
        }

        $jobId = $job['id'];

        // mark processing
        $updateProcessing = $pdo->prepare("UPDATE ocr_jobs SET status = 'processing', attempts = attempts + 1, processed_at = NOW() WHERE id = :id");
        $updateProcessing->execute([':id' => $jobId]);
        $pdo->commit();

        $payload = json_decode($job['payload'], true);
        if (!$payload) {
            $err = 'Invalid job payload';
            $pdo->prepare("UPDATE ocr_jobs SET status='failed', last_error=:err WHERE id=:id")->execute([':err'=>$err, ':id'=>$jobId]);
            continue;
        }

        if (($job['job_type'] ?? '') !== 'application_files') {
            $pdo->prepare("UPDATE ocr_jobs SET status='failed', last_error=:err WHERE id=:id")->execute([':err'=>'Unsupported job_type', ':id'=>$jobId]);
            continue;
        }

        $applicationId = $payload['application_id'] ?? null;
        $files = $payload['files'] ?? [];
        $requirements = $payload['requirements'] ?? [];

        if (!$applicationId || empty($files)) {
            $pdo->prepare("UPDATE ocr_jobs SET status='failed', last_error=:err WHERE id=:id")->execute([':err'=>'Missing application_id or files', ':id'=>$jobId]);
            continue;
        }

        // Build fake $_FILES to pass into analyze_files
        $fake = ['name'=>[], 'tmp_name'=>[], 'error'=>[]];
        foreach ($files as $f) {
            $fake['name'][] = $f;
            $fake['tmp_name'][] = $uploadsDir . $f;
            $fake['error'][] = UPLOAD_ERR_OK;
        }

        echo "Processing job {$jobId} for application {$applicationId} (" . count($files) . " files)\n";

        $analysis = analyze_files($fake, $requirements);

        // persist results
        $detectedTypesFromFiles = [];
        if (!empty($analysis['results']) && is_array($analysis['results'])) {
            foreach ($analysis['results'] as $res) {
                $detected = $res['detected'] ?? [];
                $detectedTypesFromFiles = array_merge($detectedTypesFromFiles, $detected);

                $filename = $res['filename'] ?? '';
                $text = $res['text'] ?? '';

                // insert into business_ocr_results
                $ins = $pdo->prepare("INSERT INTO business_ocr_results (application_id, filename, saved_filename, file_url, ocr_result, created_at) VALUES (:app_id, :filename, :saved_filename, :file_url, :ocr_result::jsonb, NOW())");
                $ins->execute([
                    ':app_id' => $applicationId,
                    ':filename' => $filename,
                    ':saved_filename' => $filename,
                    ':file_url' => '/Banwa/server/handlers/staff/business/uploads/' . $filename,
                    ':ocr_result' => json_encode(['detected' => array_values($detected), 'text' => $text])
                ]);

                // insert into business_files if not exists
                $chk = $pdo->prepare("SELECT 1 FROM business_files WHERE application_id = :app AND saved_filename = :sf LIMIT 1");
                $chk->execute([':app'=>$applicationId, ':sf'=>$filename]);
                if (!$chk->fetch()) {
                    $ins2 = $pdo->prepare("INSERT INTO business_files (application_id, filename, saved_filename, file_url, created_at) VALUES (:app_id, :filename, :saved_filename, :file_url, NOW())");
                    $ins2->execute([':app_id'=>$applicationId, ':filename'=>$filename, ':saved_filename'=>$filename, ':file_url'=>'/Banwa/server/handlers/staff/business/uploads/' . $filename]);
                }
            }
        }

        $detectedTypesFromFiles = array_unique($detectedTypesFromFiles);

        // Merge detected types into requirements
        $appStmt = $pdo->prepare("SELECT requirements, requirement_upload_json FROM business_applications WHERE id = :id LIMIT 1");
        $appStmt->execute([':id'=>$applicationId]);
        $appRow = $appStmt->fetch(PDO::FETCH_ASSOC);

        $submittedReqs = json_decode($appRow['requirements'] ?? '[]', true) ?: [];
        $mergedReqs = array_values(array_unique(array_merge($submittedReqs, $detectedTypesFromFiles)));

        $upd = $pdo->prepare("UPDATE business_applications SET requirements = :reqs::json, requirement_upload_json = :files::jsonb WHERE id = :id");
        $upd->execute([':reqs'=>json_encode($mergedReqs), ':files'=>json_encode($files), ':id'=>$applicationId]);

        // mark job done
        $pdo->prepare("UPDATE ocr_jobs SET status='done', processed_at = NOW() WHERE id = :id")->execute([':id'=>$jobId]);

        echo "Job {$jobId} done. Merged requirements: " . json_encode($mergedReqs) . "\n";

        if ($runOnce) {
            // Continue loop - it will exit when no more pending jobs are found
            continue;
        }

    } catch (Exception $e) {
        // mark job failed
        if (isset($jobId)) {
            $pdo->prepare("UPDATE ocr_jobs SET status='failed', last_error=:err WHERE id=:id")->execute([':err'=>$e->getMessage(), ':id'=>$jobId]);
        }
        echo "Worker error: " . $e->getMessage() . "\n";
        sleep(1);
    }

}

?>
