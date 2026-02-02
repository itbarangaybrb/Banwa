<?php
require_once __DIR__ . '/../../../configs/database.php';

ob_start();
session_start();

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!extension_loaded('pdo_pgsql')) {
    ob_clean();
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

ob_clean();

/**
 * Triggers DSS re-evaluation for a construction application
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application to re-evaluate
 */
function triggerDSSevaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            error_log("Application not found for DSS re-evaluation: " . $applicationId);
            return;
        }

        $dss = new ConstructionDSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM construction_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE construction_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO construction_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        }

        $updateAppStmt = $pdo->prepare("
            UPDATE construction_applications 
            SET dss_status = :dss_status,
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateAppStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed for application {$applicationId}: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE construction_applications 
                SET dss_status = 'Evaluation Error',
                    updated_at = NOW()
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $applicationId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created construction application
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the newly created application
 */
function createInitialDSSEvaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :app_id");
        $stmt->execute([':app_id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            error_log("Application not found for DSS evaluation: " . $applicationId);
            return;
        }

        $dss = new ConstructionDSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);

        // Check if evaluation already exists
        $checkStmt = $pdo->prepare("SELECT id FROM construction_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        
        if ($checkStmt->fetch()) {
            $sql = "UPDATE construction_evaluations 
                    SET dss_status = :status, 
                        evaluation_details = :details, 
                        evaluated_at = NOW()
                    WHERE application_id = :app_id";
        } else {
            $sql = "INSERT INTO construction_evaluations 
                    (application_id, dss_status, evaluation_details, evaluated_at) 
                    VALUES (:app_id, :status, :details, NOW())";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        // Update application with DSS status
        $updateStmt = $pdo->prepare("
            UPDATE construction_applications 
            SET dss_status = :dss_status,
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
        
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation for application {$applicationId}: " . $e->getMessage());

        // Create error record
        try {
            $errorSql = "INSERT INTO construction_evaluations 
                        (application_id, dss_status, evaluation_details, evaluated_at, error_message) 
                        VALUES (:app_id, 'Evaluation Error', '{}', NOW(), :error)";
            $errorStmt = $pdo->prepare($errorSql);
            $errorStmt->execute([
                ':app_id' => $applicationId,
                ':error' => $e->getMessage()
            ]);
        } catch (Exception $ex) {
            error_log("Failed to create error evaluation record: " . $ex->getMessage());
        }
    }
}

/**
 * Extracts summary statistics from DSS evaluation details
 * 
 * @param array $evaluationDetails DSS evaluation details array
 * @return array Summary statistics
 */
function getDSSSummary($evaluationDetails)
{
    if (!$evaluationDetails || !is_array($evaluationDetails)) {
        return [
            'score' => 0,
            'max_score' => 7,
            'probability' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => [],
            'recommendations' => []
        ];
    }

    $passedRules = $evaluationDetails['passed_rules'] ?? [];
    $failedRules = $evaluationDetails['failed_rules'] ?? [];
    $score = $evaluationDetails['score'] ?? 0;
    $maxScore = $evaluationDetails['max_score'] ?? 7;
    $probability = $evaluationDetails['approval_probability'] ?? 0;

    return [
        'score' => $score,
        'max_score' => $maxScore,
        'probability' => $probability,
        'passed_count' => count($passedRules),
        'failed_count' => count($failedRules),
        'passed_rules' => $passedRules,
        'failed_rules' => $failedRules,
        'recommendations' => $evaluationDetails['recommendations'] ?? [],
        'failed_critical' => $evaluationDetails['failed_critical'] ?? [],
        'passed_critical' => $evaluationDetails['passed_critical'] ?? []
    ];
}

/**
 * Returns a summary object for a given DSS status
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'Pre-Approved' => [
            'icon' => '✅',
            'message' => 'Construction permit meets all requirements for pre-approval',
            'color' => 'green',
            'bg_color' => '#d4edda',
            'text_color' => '#155724'
        ],
        'Additional Requirements Needed' => [
            'icon' => '⚠️',
            'message' => 'Some safety or documentation requirements need attention',
            'color' => 'orange',
            'bg_color' => '#fff3cd',
            'text_color' => '#856404'
        ],
        'Rejected' => [
            'icon' => '❌',
            'message' => 'Construction permit application does not meet basic requirements',
            'color' => 'red',
            'bg_color' => '#f8d7da',
            'text_color' => '#721c24'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'blue',
            'bg_color' => '#d1ecf1',
            'text_color' => '#0c5460'
        ],
        'Evaluation Error' => [
            'icon' => '❓',
            'message' => 'Evaluation encountered an error',
            'color' => 'gray',
            'bg_color' => '#e2e3e5',
            'text_color' => '#383d41'
        ]
    ];

    return $summaries[$dssStatus] ?? [
        'icon' => '❓',
        'message' => 'Evaluation status unknown',
        'color' => 'gray',
        'bg_color' => '#e2e3e5',
        'text_color' => '#383d41'
    ];
}

/**
 * Logs DSS evaluation results to a file
 * 
 * @param int $applicationId ID of the evaluated application
 * @param array $evaluationResult Complete evaluation result
 */
function logEvaluation($applicationId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/construction_dss_evaluations.log';
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'application_id' => $applicationId,
            'dss_status' => $evaluationResult['status'],
            'score' => $evaluationResult['evaluation_details']['score'] ?? 0,
            'max_score' => $evaluationResult['evaluation_details']['max_score'] ?? 0,
            'probability' => $evaluationResult['evaluation_details']['approval_probability'] ?? 0,
            'passed_rules' => count($evaluationResult['evaluation_details']['passed_rules'] ?? []),
            'failed_rules' => count($evaluationResult['evaluation_details']['failed_rules'] ?? [])
        ];

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}