<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../../configs/database.php';

try {
    $stmt = $pdo->query("SELECT user_id, full_name, email, role_id FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
