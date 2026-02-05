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
 * Logs status changes to utility_status_history table for audit trail
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application being updated
 * @param string $newStatus The new status being set
 * @param string $comments Optional comments about the status change
 */
function logStatusUpdate($pdo, $applicationId, $newStatus, $comments)
{
    try {
        $sql = "INSERT INTO utility_status_history 
                (application_id, status, comments, changed_at) 
                VALUES (:app_id, :status, :comments, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $newStatus,
            ':comments' => $comments
        ]);
    } catch (Exception $e) {
        error_log("Failed to log status update: " . $e->getMessage());
    }
}