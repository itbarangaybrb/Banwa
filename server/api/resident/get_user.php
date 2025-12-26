<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

if (empty($_SESSION['supabase_user_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

try {
    $stmt = $pdo->prepare("SELECT household_head_name, contact_no FROM resident WHERE supabase_user_id = ? LIMIT 1");
    $stmt->execute([$supabase_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    echo json_encode($user);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
