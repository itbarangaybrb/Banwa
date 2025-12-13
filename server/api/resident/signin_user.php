<?php
session_start();
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['supabase_user_id'])) {
    echo json_encode(["success" => false, "message" => "Supabase ID is required"]);
    exit;
}

$supabase_user_id = $input['supabase_user_id'];

try {
    $stmt = $pdo->prepare("SELECT user_id, full_name FROM users WHERE supabase_user_id = :supabase_user_id");
    $stmt->execute([":supabase_user_id" => $supabase_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['supabase_user_id'] = $supabase_user_id;
        $_SESSION['full_name'] = $user['full_name'];

        echo json_encode(["success" => true, "message" => "Logged in", "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "User not found in custom DB"]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
