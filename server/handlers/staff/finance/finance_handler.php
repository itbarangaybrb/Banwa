<?php
// Prevent PHP errors from rendering HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

require_once __DIR__ . '/../../../configs/database.php';

ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

$action = $_REQUEST['action'] ?? null;
ob_clean();

// Helper: get correct table based on type (backward-compatible default = business)
function getTable($type) {
    return ($type === 'construction') ? 'construction_applications' : 'business_applications';
}

// Default type for backward compatibility
$type = $_REQUEST['type'] ?? $_POST['type'] ?? $_GET['type'] ?? 'business';
if (!in_array($type, ['business', 'construction'])) {
    $type = 'business';
}

switch ($action) {
    case 'fetch_pending':
        // MODIFIED & ENHANCED: Now returns BOTH business AND construction applications
        // that are either 'For Payment' or 'Pending Verification'.
        // Added `application_type` field so your frontend knows which table it belongs to.
        // requirement_upload_json (construction) is aliased to match the business column name.
        $business_sql = "
            SELECT 
                id,
                business_name,
                first_name,
                last_name,
                amount_due,
                status,
                payment_status,
                amount_paid,
                payment_date,
                payment_method,
                or_number,
                requirement_upload,
                'business' AS application_type,
                COALESCE(application_date, created_at) AS application_date
            FROM business_applications 
            WHERE status = 'For Payment' 
               OR payment_status = 'Pending Verification'
            ORDER BY application_date ASC";

        $construction_sql = "
            SELECT 
                id,
                NULL AS business_name,
                first_name,
                last_name,
                amount_due,
                status,
                payment_status,
                amount_paid,
                payment_date,
                payment_method,
                or_number,
                requirement_upload_json AS requirement_upload,
                'construction' AS application_type,
                COALESCE(application_date, created_at) AS application_date
            FROM construction_applications 
            WHERE status = 'For Payment' 
               OR payment_status = 'Pending Verification'
            ORDER BY application_date ASC";

        $business_stmt = $pdo->query($business_sql);
        $construction_stmt = $pdo->query($construction_sql);

        $business_data = $business_stmt->fetchAll(PDO::FETCH_ASSOC);
        $construction_data = $construction_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Merge and sort by application_date (oldest first)
        $all_data = array_merge($business_data, $construction_data);
        usort($all_data, function($a, $b) {
            $dateA = strtotime($a['application_date'] ?? '1970-01-01');
            $dateB = strtotime($b['application_date'] ?? '1970-01-01');
            return $dateA - $dateB;
        });

        echo json_encode(["status" => "success", "data" => $all_data]);
        break;

    case 'fetch_application_details':
        $id = $_GET['id'] ?? $_POST['id'] ?? null;
        $table = getTable($type);

        $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($data) {
            $data['application_type'] = $type;
        }
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    case 'process_payment':
        // Works for BOTH tables (type must be passed from frontend)
        $id = $_POST['id'];
        $table = getTable($type);

        $amountDue = $_POST['amountDue'];
        $amountPaid = $_POST['amountPaid'];
        $orNumber = $_POST['orNumber'];
        $method = $_POST['paymentMethod'];

        try {
            $sql = "UPDATE $table SET 
                    status = 'Paid',
                    payment_status = 'Paid',
                    amount_due = :due,
                    amount_paid = :paid,
                    or_number = :or,
                    payment_method = :method,
                    payment_date = NOW(),
                    updated_at = NOW()
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':due' => $amountDue,
                ':paid' => $amountPaid,
                ':or' => $orNumber,
                ':method' => $method,
                ':id' => $id
            ]);

            echo json_encode([
                "status" => "success",
                "id" => $id,
                "type" => $type,
                "message" => "Payment processed"
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'verify_payment':
        // NEW + ENHANCED: Works for BOTH tables
        $id = $_POST['id'];
        $table = getTable($type);
        $verificationAction = $_POST['verification_action']; // 'Approved' or 'Rejected'

        if ($verificationAction === 'Approved') {
            $newPaymentStatus = 'Paid';
            $newApplicationStatus = 'Paid';
        } else {
            $newPaymentStatus = 'Rejected';
            $newApplicationStatus = 'For Payment';
        }

        try {
            $sql = "UPDATE $table SET 
                    status = :new_status,
                    payment_status = :new_payment_status,
                    updated_at = NOW()
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':new_status' => $newApplicationStatus,
                ':new_payment_status' => $newPaymentStatus,
                ':id' => $id
            ]);

            echo json_encode([
                "status" => "success",
                "id" => $id,
                "type" => $type,
                "message" => "Payment verification set to " . $newPaymentStatus
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Verification error: " . $e->getMessage()]);
        }
        break;

    case 'fetch_history':
        // Optional: you can pass ?type=construction if you want only construction history
        $table = getTable($type);

        $stmt = $pdo->query("
            SELECT * FROM $table 
            WHERE payment_status = 'Paid' 
            ORDER BY payment_date DESC
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $data, "type" => $type]);
        break;

    case 'fetch_one':
        $id = $_GET['id'];
        $table = getTable($type);

        $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($data) {
            $data['application_type'] = $type;
        }
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid Action"]);
}