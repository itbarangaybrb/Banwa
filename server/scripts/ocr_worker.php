<?php
/**
 * Fixed OCR Worker - Works for both Business and Construction
 * Usage: php ocr_worker.php --once
 */

chdir(__DIR__);
require_once __DIR__ . '/../configs/database.php';
require_once __DIR__ . '/../configs/ocr_config.php';
require_once __DIR__ . '/../api/shared/ocr_service.php';

$runOnce = in_array('--once', $argv ?? []);

if (!defined('OCR_WORKER_POLL_INTERVAL')) {
    define('OCR_WORKER_POLL_INTERVAL', 3);
}

echo "OCR Worker started. Poll interval: " . OCR_WORKER_POLL_INTERVAL . "s\n";

while (true) {
    try {
        $pdo->beginTransaction();

        $jobStmt = $pdo->prepare("SELECT * FROM ocr_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED");
        $jobStmt->execute();
        $job = $jobStmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            $pdo->commit();
            if ($runOnce) break;
            sleep(OCR_WORKER_POLL_INTERVAL);
            continue;
        }

        $jobId = $job['id'];
        $pdo->prepare("UPDATE ocr_jobs SET status = 'processing', attempts = attempts + 1, processed_at = NOW() WHERE id = :id")
            ->execute([':id' => $jobId]);

        $payload = json_decode($job['payload'], true) ?: [];
        $applicationId = $payload['application_id'] ?? null;
        $files = $payload['files'] ?? [];

        if (!$applicationId || empty($files)) {
            throw new Exception("Invalid payload: missing application_id or files");
        }

        $jobType = $job['job_type'] ?? '';

        if (!in_array($jobType, ['application_files', 'construction_application_files'])) {
            throw new Exception("Unsupported job_type: " . $jobType);
        }

        $isBusiness = ($jobType === 'application_files');
        $isConstruction = ($jobType === 'construction_application_files');

        $uploadsDir = realpath(__DIR__ . '/../handlers/staff/' . ($isBusiness ? 'business' : 'construction') . '/uploads/') . DIRECTORY_SEPARATOR;
        $ocrTable = $isBusiness ? 'business_ocr_results' : 'construction_ocr_results';

        if ($uploadsDir === false || !is_dir($uploadsDir)) {
            throw new Exception("Uploads directory not found: " . $uploadsDir);
        }

        echo "Processing job {$jobId} ({$jobType}) for application {$applicationId} (" . count($files) . " files)\n";

        // Build fake $_FILES
        $fake = ['name' => [], 'tmp_name' => [], 'error' => []];
        foreach ($files as $fileInfo) {
            $originalName = $fileInfo['filename'] ?? 'unknown';
            $savedName    = $fileInfo['saved_filename'] ?? $originalName;
            $filePath     = $uploadsDir . $savedName;

            if (!file_exists($filePath)) {
                error_log("Worker warning: File not found: {$filePath}");
                continue;
            }

            $fake['name'][] = $originalName;
            $fake['tmp_name'][] = $filePath;
            $fake['error'][] = UPLOAD_ERR_OK;
        }

        if (empty($fake['name'])) {
            throw new Exception("No valid files found for processing");
        }

        $analysis = analyze_files($fake, []); // requirements not used for construction

        // Save results
        if (!empty($analysis['results']) && is_array($analysis['results'])) {
            foreach ($analysis['results'] as $res) {
                $detected = $res['detected'] ?? [];
                $text = $res['text'] ?? '';

                $originalName = $res['filename'] ?? 'unknown';
                $savedName = basename($res['filename'] ?? '');

                $fileUrl = ($isBusiness 
                    ? '/Banwa/server/handlers/staff/business/uploads/' . $savedName 
                    : '/Banwa/server/handlers/staff/construction/uploads/' . $savedName);

                try {
                    $ins = $pdo->prepare("INSERT INTO {$ocrTable} 
                        (application_id, filename, saved_filename, file_url, ocr_result, created_at) 
                        VALUES (:app_id, :filename, :saved_filename, :file_url, :ocr_result::jsonb, NOW())");

                    $ins->execute([
                        ':app_id' => $applicationId,
                        ':filename' => $originalName,
                        ':saved_filename' => $savedName,
                        ':file_url' => $fileUrl,
                        ':ocr_result' => json_encode(['detected' => $detected, 'text' => $text])
                    ]);
                } catch (Exception $e) {
                    error_log("OCR insert failed for job {$jobId}: " . $e->getMessage());
                }
            }
        } else {
            error_log("OCR analysis returned no results for job {$jobId}");
        }

        $pdo->prepare("UPDATE ocr_jobs SET status = 'done', processed_at = NOW() WHERE id = :id")
            ->execute([':id' => $jobId]);

        echo "Job {$jobId} completed successfully.\n";

        $pdo->commit();

        if ($runOnce) break;

    } catch (Exception $e) {
        $pdo->rollBack();
        if (isset($jobId)) {
            $pdo->prepare("UPDATE ocr_jobs SET status = 'failed', last_error = :err WHERE id = :id")
                ->execute([':err' => $e->getMessage(), ':id' => $jobId]);
        }
        error_log("OCR Worker Error (job " . ($jobId ?? 'unknown') . "): " . $e->getMessage());
        echo "Worker error: " . $e->getMessage() . "\n";
        sleep(1);
    }
}
?>