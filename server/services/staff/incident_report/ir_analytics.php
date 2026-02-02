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
 * Generates chart data for incident analytics
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartIncidentType($pdo)
{
    try {
        // Use date_reported instead of application_date
        $sql1 = "
            SELECT date_reported, COUNT(*) AS total
            FROM incident_reports
            GROUP BY date_reported
            ORDER BY date_reported ASC
        ";

        $stmt1 = $pdo->query($sql1);
        $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $sql2 = "
            SELECT incident_type, COUNT(*) AS total
            FROM incident_reports
            GROUP BY incident_type
            ORDER BY total ASC
        ";

        $stmt2 = $pdo->query($sql2);
        $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $sql3 = "
            SELECT 
                COALESCE(dss_status, 'Pending Evaluation') as dss_status, 
                COUNT(*) as total
            FROM incident_reports
            GROUP BY COALESCE(dss_status, 'Pending Evaluation')
            ORDER BY total ASC
        ";
        $stmt3 = $pdo->query($sql3);
        $dataByDSS = $stmt3->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data_by_date" => $dataByDate,
            "data_by_type" => $dataByType,
            "data_by_dss" => $dataByDSS
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Error generating chart data: " . $e->getMessage()
        ]);
    }
}
