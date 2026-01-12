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
    // $pdo = null;

    // // Check if the constants are defined (from database.php)
    // if (defined('DB_HOST') && defined('DB_PORT') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
    //     $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
    //     $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    //     error_log("DB_CONNECTION: Using defined constants for connection.");
    // } else {
    //     // Fallback: If constants are not defined, use hardcoded defaults (common for PostgreSQL)
    //     error_log("DB_CONNECTION: Constants not defined. Using fallback defaults.");
    //     $fallback_db_host = 'localhost';
    //     $fallback_db_port = '5432';
    //     $fallback_db_name = 'capstone'; // Common default from other files
    //     $fallback_db_user = 'postgres';
    //     $fallback_db_pass = '$Xz_11182025'; // Common default from other files

    //     $dsn = "pgsql:host=" . $fallback_db_host . ";port=" . $fallback_db_port . ";dbname=" . $fallback_db_name;
    //     $pdo = new PDO($dsn, $fallback_db_user, $fallback_db_pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // }

    $appId = $_GET['id'] ?? null;

    if (!$appId) {
        ob_clean();
        echo json_encode(["success" => false, "error" => "Application ID is required."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
    $stmt->execute([':id' => $appId]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$app) {
        ob_clean();
        echo json_encode(["success" => false, "error" => "Application not found."]);
        exit;
    }

    // Process JSON fields if they are stored as JSON strings in the DB
    if (isset($app['business_status']) && is_string($app['business_status'])) {
        $decoded = json_decode($app['business_status'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $app['business_status'] = $decoded;
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

?>