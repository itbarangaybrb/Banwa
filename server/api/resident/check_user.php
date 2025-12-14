<?php
error_log("check_user.php: Script started.");
session_start();
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['email'])) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

// Trim whitespace and convert to lowercase for consistent matching
$email = trim(strtolower($input['email']));

if (empty($email)) {
    echo json_encode(["success" => false, "message" => "Email cannot be empty"]);
    exit;
}

try {
    // Use LOWER() in the query for case-insensitive comparison
    $stmt = $pdo->prepare("SELECT user_id, full_name, supabase_user_id FROM users WHERE LOWER(email) = :email");
    $stmt->execute([":email" => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // User exists → store session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['supabase_user_id'] = $user['supabase_user_id'];
        $_SESSION['full_name'] = $user['full_name'];

        echo json_encode(["success" => true, "message" => "User exists", "user" => $user]);
    } else {
        // For debugging, you can temporarily return the email that was checked
        echo json_encode(["success" => false, "message" => "User not found", "checked_email" => $email]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
