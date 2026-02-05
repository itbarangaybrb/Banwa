<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid JSON"]);
    exit;
}

$supabase_user_id = $input["user_id"];
$full_name = $input["fullname"];
$email = $input["email"];

$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->rowCount() > 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'email already registered.'
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Insert into users
    $stmtUser = $pdo->prepare("
        INSERT INTO users (supabase_user_id, full_name, email, role_id)
        VALUES (:supabase_user_id, :full_name, :email, '3')
    ");
    $stmtUser->execute([
        ":supabase_user_id" => $supabase_user_id,
        ":full_name" => $full_name,
        ":email" => $email,
    ]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
