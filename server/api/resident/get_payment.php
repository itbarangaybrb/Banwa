<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

if (!isset($_SESSION['supabase_user_id'])) {
    echo json_encode(['error' => 'Not logged in', 'success' => false]);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

try {
    $sql = "
        SELECT 
            id, 
            business_name AS display_name,
            amount_paid AS amount, 
            payment_date, 
            payment_status AS status, 
            'Business' AS app_category,
            or_number AS reference_number,
            requirement_upload AS proof_file,
            or_file_path,
            NULL AS nature_of_activity
        FROM business_applications
        WHERE supabase_user_id = :supabase_user_id 
          AND payment_status IN ('Paid', 'For Payment', 'Pending Verification', 'Verified')

        UNION ALL

        SELECT 
            id, 
            'Construction Project' AS display_name,
            amount_paid AS amount, 
            payment_date, 
            payment_status AS status, 
            'Construction' AS app_category,
            or_number AS reference_number,
            requirement_upload AS proof_file,
            or_file_path,
            nature_of_activity
        FROM construction_applications
        WHERE supabase_user_id = :supabase_user_id 
          AND payment_status IN ('Paid', 'For Payment', 'Pending Verification', 'Verified')

        ORDER BY payment_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':supabase_user_id' => $supabase_user_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $payments = array_map(function ($row) {
        if ($row['app_category'] === 'Construction') {
            $type = 'Construction' . (!empty($row['nature_of_activity']) ? ': ' . $row['nature_of_activity'] : '');
        } else {
            $type = $row['app_category'] . ($row['display_name'] ? ': ' . $row['display_name'] : '');
        }
        return [
            'id' => $row['id'],
            'type' => $type,
            'amount' => $row['amount'],
            'payment_date' => $row['payment_date'],
            'status' => $row['status'],
            'reference_number' => $row['reference_number'],
            'file_url' => !empty($row['or_file_path']) ? $row['or_file_path'] : $row['proof_file']
        ];
    }, $results);

    echo json_encode(['success' => true, 'payments' => $payments]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'success' => false]);
}
