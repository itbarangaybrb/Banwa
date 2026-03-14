<?php
session_start();
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['status' => 'unknown']);
    exit;
}

$stmt = $pdo->prepare("SELECT status FROM users WHERE user_id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode(['status' => $user['status'] ?? 'unknown']);