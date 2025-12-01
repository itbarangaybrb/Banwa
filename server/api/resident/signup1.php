<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php'; // PDO connection

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No input data']);
    exit;
}

// Extract and validate
$username = $input['username'] ?? '';
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';
$full_name = $input['full_name'] ?? '';
$role_id = $input['role_id'] ?? 2;
$contact_no = $input['contact_no'] ?? '';
$address = $input['address'] ?? '';

// Hash password
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("
        INSERT INTO users (username, password, email, full_name, role_id) 
        VALUES (:username, :password, :email, :full_name, :role_id) 
        RETURNING user_id
    ");

    $stmt->execute([
        ':username' => $username,
        ':password' => $hashed_password,
        ':email' => $email,
        ':full_name' => $full_name,
        ':role_id' => $role_id
    ]);

    $user_id = $stmt->fetchColumn();

    echo json_encode(['success' => true, 'message' => 'User inserted', 'user_id' => $user_id]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
