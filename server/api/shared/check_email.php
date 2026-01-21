<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$input = json_decode(file_get_contents("php://input"), true);
$email = $input['email'] ?? '';

if (!$email) {
    echo json_encode(['exists' => false]);
    exit;
}

$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->execute([$email]);

echo json_encode([
    'exists' => $stmt->rowCount() > 0
]);
