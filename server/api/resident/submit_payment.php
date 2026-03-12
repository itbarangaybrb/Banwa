<?php
error_reporting(E_ALL); 
ini_set('display_errors', 0); 
ini_set('log_errors', 1); 
ini_set('error_log', __DIR__ . '/error_log.log'); 
ob_start(); 

session_start(); 
require_once __DIR__ . '/../../configs/database.php'; 

header('Content-Type: application/json');

function get_input($key, $default = null) {
    return isset($_POST[$key]) && trim($_POST[$key]) !== '' ? trim($_POST[$key]) : $default;
}

function generateUniqueFilename($originalName) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid('proof_') . '.' . $extension;
}

try {
    // Note: Ensuring we check the correct session variable for your resident login
    if (!isset($_SESSION['user_id']) && !isset($_SESSION['supabase_user_id'])) {
        throw new Exception("User not logged in.");
    }

    // Collect form data
    $applicationId = get_input('application_id');
    $paymentMethod = get_input('paymentMethod');
    $amountPaid = get_input('amountPaid');
    $dateOfPayment = get_input('dateOfPayment');
    $orNumber = get_input('orNumber'); 
    
    // NEW: Capture the application type sent from status.js
    $appType = get_input('payment_purpose_app_type'); 

    if (!$applicationId || !$paymentMethod || !$amountPaid || !$dateOfPayment || !$appType) {
        throw new Exception("Missing required form data.");
    }

    // NEW: Determine the correct database table based on the application type
    $tableName = '';
    if ($appType === 'Business') {
        $tableName = 'business_applications';
    } elseif ($appType === 'Construction') {
        $tableName = 'construction_applications';
    } else {
        throw new Exception("Invalid application type provided.");
    }

    // Handle file upload
    $proofOfPaymentPath = null;
    if (isset($_FILES['proofOfPayment']) && $_FILES['proofOfPayment']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/payment_proofs/'; 
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = generateUniqueFilename($_FILES['proofOfPayment']['name']);
        $targetFile = $uploadDir . $fileName;

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        $fileExtension = strtolower(pathinfo($_FILES['proofOfPayment']['name'], PATHINFO_EXTENSION));

        if (!in_array($fileExtension, $allowedExtensions)) {
            throw new Exception("Invalid file type. Only JPG, PNG, PDF are allowed.");
        }

        if (move_uploaded_file($_FILES['proofOfPayment']['tmp_name'], $targetFile)) {
            // Store relative path for database - added leading slash for absolute path mapping
            $proofOfPaymentPath = '/server/api/resident/uploads/payment_proofs/' . $fileName;
        } else {
            throw new Exception("Failed to move uploaded proof of payment file.");
        }
    } else {
        throw new Exception("Proof of Payment file is required.");
    }

    /**
     * SQL UPDATE: Now dynamically targets $tableName
     */
    $sql = "UPDATE {$tableName} SET 
                payment_method = :payment_method, 
                amount_paid = :amount_paid, 
                payment_date = :payment_date, 
                or_number = :or_number, 
                payment_status = :payment_status,
                status = :main_status,
                requirement_upload = :proof_path 
            WHERE id = :application_id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':payment_method' => $paymentMethod,
        ':amount_paid'    => $amountPaid,
        ':payment_date'   => $dateOfPayment,
        ':or_number'      => $orNumber,
        ':payment_status' => 'Pending Verification',
        ':main_status'    => 'Payment Submitted',
        ':proof_path'     => $proofOfPaymentPath,
        ':application_id' => $applicationId
    ]);

    ob_clean(); 
    echo json_encode(["status" => "success", "message" => "Payment details updated successfully."]);

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(400); 
    echo json_encode(["status" => "error", "message" => "Submission Error: " . $e->getMessage()]);
}
ob_end_flush();
?>