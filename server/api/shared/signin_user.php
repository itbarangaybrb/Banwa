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
    // Fetch user info including role
    $stmt = $pdo->prepare("SELECT user_id, full_name, role_id FROM users WHERE supabase_user_id = :supabase_user_id");
    $stmt->execute([":supabase_user_id" => $supabase_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Set session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['supabase_user_id'] = $supabase_user_id;
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role_id'] = $user['role_id'];
        // Mark staff status for handlers that check `is_staff` (non-resident roles)
        // role_id == 1 => resident; others are considered staff/admin
        $_SESSION['is_staff'] = ($user['role_id'] != 1);

        // Redirect based on role
        switch ($user['role_id']) {
            case 1: // resident
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/resident/home.php"]);
                break;
            case 2: // super admin
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/superadmin/dashboard.php"]);
                break;
            case 3: // admin
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/admin/dashboard.php"]);
                break;
            case 4: // business staff
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/business_staff/business.php"]);
                break;
            case 5: // construction staff
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/construction_staff/construction.php"]);
                break;
            case 6: // utilities staff
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/utilities_staff/utilities.php"]);
                break;
            case 7: // incident report staff
                echo json_encode(["success" => true, "redirect" => "/Banwa/client/pages/staff/incident_report_staff/manage.php"]);
                break;
            default:
                echo json_encode(["success" => false, "message" => "Unknown role. Contact support."]);
                break;
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
