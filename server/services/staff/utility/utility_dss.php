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
 * Triggers DSS re-evaluation for an application after updates
 * Fetches application data, runs through DSS rule engine, and updates evaluation records
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application to re-evaluate
 */
function triggerDSSevaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM utility_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE utility_evaluations 
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
                INSERT INTO utility_evaluations 
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
            UPDATE utility_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateAppStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE utility_applications 
                SET dss_status = 'Evaluation Error'
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $applicationId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created utility application
 * This ensures all applications have a DSS evaluation record even before evaluation
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the newly created application
 */
function createInitialDSSEvaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :app_id");
        $stmt->execute([':app_id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);

        $sql = "INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE utility_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation: " . $e->getMessage());

        $sql = "INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, 'Evaluation Error', '{}', NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':app_id' => $applicationId]);
    }
}

/**
 * Extracts summary statistics from DSS evaluation details
 * Provides score, probability, and rule pass/fail counts for frontend display
 * 
 * @param array $evaluationDetails DSS evaluation details array
 * @return array Summary statistics including score, probability, and counts
 */
function getDSSSummary($evaluationDetails)
{
    if (!$evaluationDetails || !is_array($evaluationDetails)) {
        return [
            'score' => 0,
            'max_score' => 5,
            'probability' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => []
        ];
    }

    return [
        'score' => $evaluationDetails['score'] ?? 0,
        'max_score' => $evaluationDetails['max_score'] ?? 5,
        'probability' => $evaluationDetails['approval_probability'] ?? 0,
        'passed_count' => count($evaluationDetails['passed_rules'] ?? []),
        'failed_count' => count($evaluationDetails['failed_rules'] ?? []),
        'passed_rules' => $evaluationDetails['passed_rules'] ?? [],
        'failed_rules' => $evaluationDetails['failed_rules'] ?? [],
        'recommendations' => $evaluationDetails['recommendations'] ?? []
    ];
}

/**
 * Returns a summary object for a given DSS status with icon, message, and color
 * Used for frontend display of evaluation status
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'Pre-Approved' => [
            'icon' => '✅',
            'message' => 'Application meets all requirements for pre-approval',
            'color' => 'green'
        ],
        'Additional Requirements Needed' => [
            'icon' => '⚠️',
            'message' => 'Some requirements need attention before approval',
            'color' => 'orange'
        ],
        'Rejected' => [
            'icon' => '❌',
            'message' => 'Application does not meet basic requirements',
            'color' => 'red'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'blue'
        ],
        'Evaluation Error' => [
            'icon' => '❓',
            'message' => 'Evaluation encountered an error',
            'color' => 'gray'
        ]
    ];

    return $summaries[$dssStatus] ?? [
        'icon' => '❓',
        'message' => 'Evaluation status unknown',
        'color' => 'gray'
    ];
}

/**
 * Logs DSS evaluation results to a file for analytics and auditing purposes
 * 
 * @param int $applicationId ID of the evaluated application
 * @param array $evaluationResult Complete evaluation result from DSS engine
 */
function logEvaluation($applicationId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/dss_evaluations.log';
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

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}