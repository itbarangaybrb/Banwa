<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';


if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user']['id'];

try {
    $stmt = $pdo->prepare("SELECT first_name, middle_name, last_name, suffix, contact_no, address FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    echo json_encode($user);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
