<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$email = $_GET['email'] ?? '';

if (!$email) {
    echo json_encode(['exists' => false]);
    exit;
}

$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->rowCount() > 0) {
    echo json_encode(['exists' => true]);
} else {
    echo json_encode(['exists' => false]);
}