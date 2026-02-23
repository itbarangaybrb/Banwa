<?php

/**
 * Starts a session, sets response type to JSON, and includes database configuration.
 */
session_start();
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';

/**
 * Parses input JSON and validates that 'supabase_user_id' is provided and not empty.
 * Returns an error if validation fails.
 */
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['supabase_user_id'])) {
    echo json_encode(["success" => false, "message" => "Supabase ID is required"]);
    exit;
}

$supabase_user_id = trim($input['supabase_user_id']);
if (empty($supabase_user_id)) {
    echo json_encode(["success" => false, "message" => "Supabase ID cannot be empty"]);
    exit;
}

/**
 * Fetches the user by supabase_user_id from the database.
 * Sets session variables and returns a JSON response with the appropriate redirect based on role.
 * Handles any PDO exceptions with an internal server error response.
 */
try {
    $stmt = $pdo->prepare("SELECT user_id, full_name, role_id, status, suspend_reason FROM users WHERE supabase_user_id = :supabase_user_id");
    $stmt->execute([":supabase_user_id" => $supabase_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user['status'] === 'suspended') {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['supabase_user_id'] = $supabase_user_id;
        $_SESSION['role_id'] = $user['role_id'];
        echo json_encode([
            "success" => true,
            "redirect" => "/Banwa/client/pages/auth/suspended.php",
            "reason" => $user['suspend_reason'] ?? "Your account is temporarily suspended."
        ]);
        exit;
    }

    if ($user) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['supabase_user_id'] = $supabase_user_id;
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['is_staff'] = ($user['role_id'] != 1);

        switch ($user['role_id']) {
            case 1:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/resident/home.php"]);
                break;
            case 2:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/superadmin/dashboard.php"]);
                break;
            case 3:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/admin/dashboard.php"]);
                break;
            case 4:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/business_staff/business.php"]);
                break;
            case 5:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/construction_staff/construction.php"]);
                break;
            case 6:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/utilities_staff/utilities.php"]);
                break;
            case 7:
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/incident_report_staff/incident_report.php"]);
                break;
            default:
                echo json_encode(["success" => false, "message" => "Unknown role. Contact support."]);
                break;
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    echo json_encode(["success" => false, "message" => "Internal server error"]);
}
