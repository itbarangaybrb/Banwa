<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$userRoleId     = $_SESSION['role_id'] ?? null;
$supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

if (!$userRoleId || !$supabaseUserId) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = [2, 4, 5, 6, 7, 8];
if (!in_array((int)$userRoleId, $allowedRoles)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT a.archive_id,
               a.table_name,
               a.record_id,
               a.archived_at,
               a.restored_at,
               a.is_restored,
               a.full_name,
               a.role_id,
               a.email
        FROM archives a
        WHERE a.supabase_user_id = :supabase_user_id
        ORDER BY a.archived_at DESC
    ");
    $stmt->execute(['supabase_user_id' => $supabaseUserId]);

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}