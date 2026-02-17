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
 * Parses input JSON and validates that 'archive_id' is provided.
 * Returns an error if validation fails.
 */
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['archive_id'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

/**
 * Restores an archived record based on archive_id.
 * If the archived record belongs to 'users', marks the user as not archived.
 * Updates the archive entry to mark it as restored.
 * Writes an audit log and returns a success response.
 * Handles any PDO exceptions with an error message.
 */
$archiveId = $input['archive_id'];

try {
    // Fetch the archived record
    $stmt = $pdo->prepare("SELECT * FROM archives WHERE archive_id = ?");
    $stmt->execute([$archiveId]);
    $archive = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$archive) {
        echo json_encode(["success" => false, "message" => "Archive not found"]);
        exit;
    }

    $table = $archive['table_name'];

    if ($table === 'users') {
        // Soft restore: mark as not archived
        $stmt = $pdo->prepare("UPDATE users SET is_archived = FALSE WHERE user_id = ?");
        $stmt->execute([$archive['record_id']]);

        // Optionally mark as restored in archives
        $stmt = $pdo->prepare("UPDATE archives SET is_restored = TRUE, restored_at = NOW() WHERE archive_id = ?");
        $stmt->execute([$archiveId]);
    }


    writeAuditLog(
        $pdo,
        'RESTORE',
        $table,
        $archive['record_id'],
        null,
        $archive,
        'ARCHIVE'
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
