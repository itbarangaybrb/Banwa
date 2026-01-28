<?php
require_once __DIR__ . '/../../configs/database.php';

ob_start();
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $appId = $_GET['id'] ?? null;

    if (!$appId) {
        ob_clean();
        echo json_encode(["success" => false, "error" => "Application ID is required."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
    $stmt->execute([':id' => $appId]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$app) {
        ob_clean();
        echo json_encode(["success" => false, "error" => "Application not found."]);
        exit;
    }

    // Process JSON fields if they are stored as JSON strings in the DB
    if (isset($app['utility_status']) && is_string($app['utility_status'])) {
        $decoded = json_decode($app['utility_status'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $app['utility_status'] = $decoded;
        }
    }
    if (isset($app['requirements']) && is_string($app['requirements'])) {
        $decoded = json_decode($app['requirements'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $app['requirements'] = $decoded;
        }
    }

    ob_clean();
    echo json_encode(["success" => true, "data" => $app]);
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error: " . $e->getMessage()]);
}
exit;
