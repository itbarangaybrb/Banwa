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
 * Triggers DSS re-evaluation for a report after updates
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the report to re-evaluate
 */
function triggerDSSevaluation($pdo, $reportId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) return;

        $dss = new IncidentReportDSS();
        $evaluationResult = $dss->evaluateReport($report);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM incident_evaluations WHERE report_id = :report_id");
        $checkStmt->execute([':report_id' => $reportId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE incident_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE report_id = :report_id
            ");

            $evalStmt->execute([
                ':report_id' => $reportId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, :status, :details, NOW())
            ");

            $evalStmt->execute([
                ':report_id' => $reportId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        }

        $updateReportStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateReportStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $reportId
        ]);

        logEvaluation($reportId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE incident_reports 
                SET dss_status = 'Evaluation Error'
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $reportId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created incident report
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the newly created report
 */
function createInitialDSSEvaluation($pdo, $reportId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :report_id");
        $stmt->execute([':report_id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) return;

        $dss = new IncidentReportDSS();
        $evaluationResult = $dss->evaluateReport($report);

        $sql = "INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, :status, :details, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':report_id' => $reportId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $reportId
        ]);

        logEvaluation($reportId, $evaluationResult);
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation: " . $e->getMessage());

        $sql = "INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, 'Evaluation Error', '{}', NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':report_id' => $reportId]);
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
            'max_score' => 5,
            'priority_level' => 'Low',
            'urgency_score' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => [],
            'recommendations' => []
        ];
    }

    return [
        'score' => $evaluationDetails['score'] ?? 0,
        'max_score' => $evaluationDetails['max_score'] ?? 5,
        'priority_level' => $evaluationDetails['priority_level'] ?? 'Low',
        'urgency_score' => $evaluationDetails['urgency_score'] ?? 0,
        'passed_count' => count($evaluationDetails['passed_rules'] ?? []),
        'failed_count' => count($evaluationDetails['failed_rules'] ?? []),
        'passed_rules' => $evaluationDetails['passed_rules'] ?? [],
        'failed_rules' => $evaluationDetails['failed_rules'] ?? [],
        'recommendations' => $evaluationDetails['recommendations'] ?? []
    ];
}

/**
 * Returns a summary object for a given DSS status with icon, message, and color
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'High Priority' => [
            'icon' => '🚨',
            'message' => 'Report requires immediate attention',
            'color' => 'red'
        ],
        'Medium Priority' => [
            'icon' => '⚠️',
            'message' => 'Report needs attention within 24 hours',
            'color' => 'orange'
        ],
        'Low Priority' => [
            'icon' => 'ℹ️',
            'message' => 'Report can be addressed within 48 hours',
            'color' => 'blue'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'gray'
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
 * Logs DSS evaluation results
 * 
 * @param int $reportId ID of the evaluated report
 * @param array $evaluationResult Complete evaluation result from DSS engine
 */
function logEvaluation($reportId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/dss_incident_evaluations.log';
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'report_id' => $reportId,
            'dss_status' => $evaluationResult['status'],
            'priority_level' => $evaluationResult['evaluation_details']['priority_level'] ?? 'Low',
            'urgency_score' => $evaluationResult['evaluation_details']['urgency_score'] ?? 0,
            'score' => $evaluationResult['evaluation_details']['score'] ?? 0,
            'max_score' => $evaluationResult['evaluation_details']['max_score'] ?? 5,
            'passed_rules' => count($evaluationResult['evaluation_details']['passed_rules'] ?? []),
            'failed_rules' => count($evaluationResult['evaluation_details']['failed_rules'] ?? [])
        ];

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}
