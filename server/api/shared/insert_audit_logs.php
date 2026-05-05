<?php
require_once __DIR__ . '/../../services/broadcast.php';

/**
 * Writes an entry to audit_logs table
 *
 * @param PDO    $pdo
 * @param string $action        (CREATE, UPDATE, SUSPEND, etc.)
 * @param string $tableName
 * @param mixed  $recordId
 * @param array|null $oldData
 * @param array|null $newData
 * @param string|null $category
 *
 * @throws PDOException
 */
function writeAuditLog(
    PDO $pdo,
    string $action,
    string $tableName,
    $recordId,
    ?array $oldData = null,
    ?array $newData = null,
    ?string $category = null
) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
    $roleId         = $_SESSION['role_id'] ?? null;
    $fullName       = $_SESSION['full_name'] ?? null;

    if (!$roleId) {
        throw new Exception('Missing role_id for audit log');
    }

    $stmt = $pdo->prepare("
        INSERT INTO audit_logs 
        (supabase_user_id, role_id, full_name, category, action, table_name, record_id, old_data, new_data)
        VALUES
        (:supabaseId, :roleId, :fullName, :category, :action, :tableName, :recordId, :oldData, :newData)
        RETURNING id, action, full_name, table_name, record_id, role_id, created_at
    ");

    $stmt->execute([
        ':supabaseId' => $supabaseUserId,
        ':roleId'     => (int) $roleId,
        ':fullName'   => $fullName,
        ':category'   => $category,
        ':action'     => strtoupper($action),
        ':tableName'  => $tableName,
        ':recordId'   => $recordId,
        ':oldData'    => $oldData ? json_encode($oldData) : null,
        ':newData'    => $newData ? json_encode($newData) : null
    ]);

    $newLog = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($newLog) {
        if ($newLog['created_at']) {
            $newLog['created_at'] = date('M j, Y, g:i:s A', strtotime($newLog['created_at']));
        }
        broadcastEvent('new_audit_log', ['payload' => $newLog]);
    }
}
