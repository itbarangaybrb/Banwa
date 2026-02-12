<?php
require_once __DIR__ . '/../../../configs/database.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$user_id  = $data['user_id'] ?? null;
$fullName = trim($data['full_name'] ?? '');
$email    = trim($data['email'] ?? '');
$role_id  = $data['role_id'] ?? null;

if (!$user_id || !$fullName || !$email || !$role_id) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

try {

    // Check duplicate email (except current user)
    $checkStmt = $pdo->prepare(
        "SELECT user_id FROM users WHERE email = :email AND user_id != :user_id"
    );
    $checkStmt->execute([
        ':email' => $email,
        ':user_id' => $user_id
    ]);

    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already in use']);
        exit;
    }

    // Update user
    $stmt = $pdo->prepare(
        "UPDATE users 
         SET full_name = :full_name,
             email = :email,
             role_id = :role_id
         WHERE user_id = :user_id"
    );

    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':role_id' => $role_id,
        ':user_id' => $user_id
    ]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'details' => $e->getMessage() // remove in production
    ]);
}
