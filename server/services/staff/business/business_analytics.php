<?php
require_once __DIR__ . '/../../../configs/database.php';

ob_start();
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

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
 * Generates chart data for business analytics including application trends by date,
 * business type distribution, and DSS status breakdown
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartBusinessType($pdo)
{
    $sql1 = "
        SELECT application_date, COUNT(*) AS total
        FROM business_applications
        GROUP BY application_date
        ORDER BY total ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $sql2 = "
        SELECT type_of_business, COUNT(*) AS total
        FROM business_applications
        GROUP BY type_of_business
        ORDER BY total ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $sql3 = "
        SELECT COALESCE(be.dss_status, 'Pending Evaluation') as dss_status, COUNT(*) as total
        FROM business_applications ba
        LEFT JOIN business_evaluations be ON ba.id = be.application_id
        GROUP BY COALESCE(be.dss_status, 'Pending Evaluation')
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
}
