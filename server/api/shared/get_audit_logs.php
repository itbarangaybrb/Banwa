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
 * Retrieve role and Supabase user ID from the active session.
 *
 * @var int|null    $userRoleId     The authenticated user's role ID.
 * @var string|null $supabaseUserId The authenticated user's Supabase UUID.
 */
$userRoleId     = $_SESSION['role_id'] ?? null;
$supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

/**
 * Guard: reject unauthenticated requests.
 */
if (!$userRoleId) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

/**
 * Guard: reject roles not permitted to access audit logs.
 *
 * Allowed roles:
 *   2 → Superadmin (full access)
 *   4, 5, 6, 8 → Restricted roles (own records only)
 */
$allowedRoles = [2, 4, 5, 6, 7, 8];
if (!in_array((int)$userRoleId, $allowedRoles)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
    
/**
 * Fetch audit logs from the database.
 *
 * Restricted roles (4, 5, 6, 8) receive only rows matching their supabase_user_id.
 * Superadmin (role 2) receives all rows.
 *
 * old_data and new_data are stored as JSON strings and decoded to arrays.
 *
 * @throws PDOException On database query failure.
 */
try {
    /** @var bool $isRestricted True when the user should only see their own audit records. */
    $isRestricted = in_array((int)$userRoleId, [4, 5, 6, 7, 8]);

    if ($isRestricted) {
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
            WHERE supabase_user_id = :supabase_user_id
            ORDER BY created_at DESC
        ");
        $stmt->execute(['supabase_user_id' => $supabaseUserId]);
    } else {
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
    }

    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($logs as &$log) {
        $log['old_data'] = $log['old_data'] ? json_decode($log['old_data'], true) : null;
        $log['new_data'] = $log['new_data'] ? json_decode($log['new_data'], true) : null;
    }

    echo json_encode($logs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}