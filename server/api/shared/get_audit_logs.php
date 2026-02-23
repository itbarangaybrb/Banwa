<?php
/**
 * Includes database configuration and sets response type to JSON.
 * Starts a session if none exists.
 */
require_once __DIR__ . '/../../configs/database.php';
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Retrieves the user's role ID from the session and checks permissions.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 403 Forbidden if the user does not have admin privileges (role_id !== 2).
 */
$userRoleId = $_SESSION['role_id'] ?? null;

if (!$userRoleId) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ((int)$userRoleId !== 2) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

/**
 * Fetches audit logs from the database, decodes JSON fields, and returns them as JSON.
 * Handles any database errors with a 500 server response.
 */
try {
    $stmt = $pdo->prepare("
    SELECT 
        id,
        supabase_user_id,
        role_id,
        full_name,
        category,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        created_at
        FROM audit_logs
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($logs as &$log) {
        $log['old_data'] = $log['old_data'] ? json_decode($log['old_data'], true) : null;
        $log['new_data'] = $log['new_data'] ? json_decode($log['new_data'], true) : null;
    }

    echo json_encode($logs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'details' => $e->getMessage() // remove in production
    ]);
}
