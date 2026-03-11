<?php
// Prevent PHP errors from rendering HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';

ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

$action = $_REQUEST['action'] ?? null;
ob_clean();

// Helper: get correct table based on type (backward-compatible default = business)
function getTable($type)
{
    return ($type === 'construction') ? 'construction_applications' : 'business_applications';
}

// Default type for backward compatibility
$type = $_REQUEST['type'] ?? $_POST['type'] ?? $_GET['type'] ?? 'business';
if (!in_array($type, ['business', 'construction'])) {
    $type = 'business';
}

// Ensure all responses are JSON
header('Content-Type: application/json');

switch ($action) {
    case 'fetch_pending':
        // Pending applications - show oldest first (FIFO - First In, First Out)
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
            COALESCE(application_date, created_at) AS sort_date
        FROM business_applications 
        WHERE status = 'For Payment' 
           OR payment_status = 'Pending Verification'
        ORDER BY id ASC"; // Oldest first for FIFO

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
            requirement_upload,
            'construction' AS application_type,
            COALESCE(application_date, created_at) AS sort_date
        FROM construction_applications 
        WHERE status = 'For Payment' 
           OR payment_status = 'Pending Verification'
        ORDER BY id ASC"; // Oldest first for FIFO

        $business_stmt = $pdo->query($business_sql);
        $construction_stmt = $pdo->query($construction_sql);

        $business_data = $business_stmt->fetchAll(PDO::FETCH_ASSOC);
        $construction_data = $construction_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Merge and sort by id (oldest first for FIFO)
        $all_data = array_merge($business_data, $construction_data);
        usort($all_data, function ($a, $b) {
            return $a['id'] - $b['id']; // Ascending order (oldest first) - FIFO
        });

        echo json_encode(["status" => "success", "data" => $all_data]);
        break;
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
            COALESCE(application_date, created_at) AS sort_date
        FROM business_applications 
        WHERE status = 'For Payment' 
           OR payment_status = 'Pending Verification'
        ORDER BY id DESC";

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
            requirement_upload,
            'construction' AS application_type,
            COALESCE(application_date, created_at) AS sort_date
        FROM construction_applications 
        WHERE status = 'For Payment' 
           OR payment_status = 'Pending Verification'
        ORDER BY id DESC";

        $business_stmt = $pdo->query($business_sql);
        $construction_stmt = $pdo->query($construction_sql);

        $business_data = $business_stmt->fetchAll(PDO::FETCH_ASSOC);
        $construction_data = $construction_stmt->fetchAll(PDO::FETCH_ASSOC);

        $all_data = array_merge($business_data, $construction_data);
        usort($all_data, function ($a, $b) {
            return $b['id'] - $a['id'];
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
            // Get current data before update for audit log
            $oldStmt = $pdo->prepare("SELECT * FROM $table WHERE id = :id");
            $oldStmt->execute([':id' => $id]);
            $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

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

            // Get new data after update for audit log
            $newStmt = $pdo->prepare("SELECT * FROM $table WHERE id = :id");
            $newStmt->execute([':id' => $id]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            // Write audit log for payment processing
            writeAuditLog(
                $pdo,
                'PAYMENT PROCESSED',
                $table,
                $id,
                $oldData,
                $newData,
                'PAYMENT'
            );

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
        $id = $_POST['id'];
        $table = getTable($type);
        $verificationAction = $_POST['verification_action'];

        if ($verificationAction === 'Approved') {
            $newPaymentStatus = 'Paid';
            $newApplicationStatus = 'Paid';
        } else {
            $newPaymentStatus = 'Rejected';
            $newApplicationStatus = 'For Payment';
        }

        try {
            // Get current data before update for audit log
            $oldStmt = $pdo->prepare("SELECT * FROM $table WHERE id = :id");
            $oldStmt->execute([':id' => $id]);
            $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

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

            // Get new data after update for audit log
            $newStmt = $pdo->prepare("SELECT * FROM $table WHERE id = :id");
            $newStmt->execute([':id' => $id]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            // Write audit log for payment verification
            writeAuditLog(
                $pdo,
                'PAYMENT VERIFIED',
                $table,
                $id,
                $oldData,
                $newData,
                'PAYMENT'
            );

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
        $business_sql = "SELECT *, 'business' AS application_type FROM business_applications WHERE payment_status = 'Paid' ORDER BY payment_date ASC";
        $construction_sql = "SELECT *, 'construction' AS application_type FROM construction_applications WHERE payment_status = 'Paid' ORDER BY payment_date ASC";

        $b_stmt = $pdo->query($business_sql);
        $c_stmt = $pdo->query($construction_sql);

        $b_data = $b_stmt->fetchAll(PDO::FETCH_ASSOC);
        $c_data = $c_stmt->fetchAll(PDO::FETCH_ASSOC);

        $all_data = array_merge($b_data, $c_data);
        usort($all_data, function ($a, $b) {
            $dateA = strtotime($a['payment_date'] ?? '1970-01-01');
            $dateB = strtotime($b['payment_date'] ?? '1970-01-01');
            return $dateA - $dateB;
        });

        echo json_encode(["status" => "success", "data" => $all_data]);
        break;
        $business_sql = "SELECT *, 'business' AS application_type FROM business_applications WHERE payment_status = 'Paid' ORDER BY payment_date ASC";
        $construction_sql = "SELECT *, 'construction' AS application_type FROM construction_applications WHERE payment_status = 'Paid' ORDER BY payment_date ASC";

        $b_stmt = $pdo->query($business_sql);
        $c_stmt = $pdo->query($construction_sql);

        $b_data = $b_stmt->fetchAll(PDO::FETCH_ASSOC);
        $c_data = $c_stmt->fetchAll(PDO::FETCH_ASSOC);

        $all_data = array_merge($b_data, $c_data);
        usort($all_data, function ($a, $b) {
            $dateA = strtotime($a['payment_date'] ?? '1970-01-01');
            $dateB = strtotime($b['payment_date'] ?? '1970-01-01');
            return $dateA - $dateB;
        });

        echo json_encode(["status" => "success", "data" => $all_data]);
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