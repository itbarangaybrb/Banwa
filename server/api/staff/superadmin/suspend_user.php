<?php
/**
 * Sets response type to JSON and includes necessary configuration and audit log functions.
 * Starts a session for authentication checks.
 */
header("Content-Type: application/json");
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
session_start();

/**
 * Checks if the user is authenticated by verifying session variables.
 * Returns 401 Unauthorized if any required session variable is missing.
 */
if (
    !isset($_SESSION['supabase_user_id']) ||
    !isset($_SESSION['user_id']) ||
    !isset($_SESSION['role_id'])
) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

/**
 * Parses input JSON and validates that 'user_id' is provided.
 * Returns an error if the request is invalid.
 */
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['user_id'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

/**
 * Fetches the user from the database, suspends the user, 
 * writes an audit log, and returns a success response.
 * Handles any PDO exceptions with an error message.
 */
$userId = $input['user_id'];

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET status = 'suspended' WHERE user_id = ?");
    $stmt->execute([$userId]);

    writeAuditLog($pdo, 'SUSPEND', 'users', $userId, $user, null, 'USER');

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
