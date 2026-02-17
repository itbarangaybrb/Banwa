<?php
require_once __DIR__ . '/../../configs/database.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- Session check ---
$userRoleId = $_SESSION['role_id'] ?? null;

if (!$userRoleId) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// OPTIONAL: restrict only superadmin role_id = 1 (adjust if needed)
// if ((int)$userRoleId !== 1) {
//     http_response_code(403);
//     echo json_encode(['error' => 'Forbidden']);
//     exit;
// }

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

    // Decode JSON fields
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
