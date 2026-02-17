<?php
/**
 * Sets response type to JSON and includes database configuration and audit log functions.
 * Starts a session if none exists.
 */
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';
require_once __DIR__ . '/../../api/shared/insert_audit_logs.php';
if (session_status() === PHP_SESSION_NONE) session_start();

/**
 * Checks if the user is authenticated by verifying the session supabase_user_id.
 * Returns 401 Unauthorized if not authenticated.
 */
if (!isset($_SESSION['supabase_user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

/**
 * Parses input JSON and validates that 'table_name' and 'record_id' are provided.
 * Returns an error if validation fails.
 */
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['table_name'], $input['record_id'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

/**
 * Archives a record based on table_name and record_id.
 * For 'users', inserts a record into the archives table and marks the user as archived.
 * Writes an audit log and returns a success response.
 * Handles any PDO exceptions with an error message.
 */
$table = $input['table_name'];
$recordId = $input['record_id'];
$userId = $_SESSION['supabase_user_id'];

try {
    if ($table === 'users') {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
        $stmt->execute([$recordId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(["success" => false, "message" => "Record not found"]);
            exit;
        }

        $stmt = $pdo->prepare("
        INSERT INTO archives 
            (table_name, record_id, supabase_user_id, full_name, email, role_id, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
        $stmt->execute([
            $table,
            $recordId,
            $user['supabase_user_id'],
            $user['full_name'] ?? null,
            $user['email'] ?? null,
            $user['role_id'] ?? null
        ]);

        $stmt = $pdo->prepare("UPDATE users SET is_archived = TRUE WHERE user_id = ?");
        $stmt->execute([$recordId]);

        writeAuditLog(
            $pdo,
            'ARCHIVE',
            $table,
            $recordId,
            $user,
            null,
            'ARCHIVE'
        );
    }


    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
