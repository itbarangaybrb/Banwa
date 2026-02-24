<?php

/**
 * Initializes session and sets response type.
 * Includes database configuration for PDO access.
 */
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../../configs/database.php';

/**
 * Generates chart data for business analytics including application trends by date,
 * business type distribution, and DSS status breakdown
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartUsers($pdo)
{
    $sql1 = "
        SELECT DATE(created_at) AS created_date, COUNT(*) AS total
        FROM users
        GROUP BY DATE(created_at)
        ORDER BY created_date ASC;
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $sql2 = "
        SELECT role_id,
        COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM users
        GROUP BY role_id
        ORDER BY total ASC;
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByRole = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $sql3 = "
        SELECT status,
        COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM users
        GROUP BY status
        ORDER BY total ASC;
    ";

    $stmt3 = $pdo->query($sql3);
    $dataByStatus = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    $sql4 = "
        SELECT suspend_reason, reason_details, COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM users
        GROUP BY suspend_reason, reason_details
        ORDER BY total DESC;
    ";

    $stmt4 = $pdo->query($sql4);
    $dataBySuspensions = $stmt4->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data_by_date" => $dataByDate,
        "data_by_role" => $dataByRole,
        "data_by_status" => $dataByStatus,
        "data_by_suspensions" => $dataBySuspensions
    ]);
}

handleChartUsers($pdo);
