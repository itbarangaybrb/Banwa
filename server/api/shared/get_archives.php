<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['supabase_user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
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
        ORDER BY a.archived_at DESC
    ");

    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
