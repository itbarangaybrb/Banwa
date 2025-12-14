<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

// Set error reporting and logging for better debugging (recommended)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.log');


if (!isset($_SESSION['supabase_user_id'])) {
    // Return an error if the user is not logged in
    echo json_encode(['error' => 'Not logged in', 'success' => false]);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

try {
    // We are now including 'Pending Verification' in the list of statuses
    // to show payments that the user just submitted.
    $sql = "SELECT 
                id, 
                business_name,
                amount_paid AS amount, 
                payment_date, 
                payment_status AS status, 
                'Business Application' AS type,
                or_number AS reference_number
            FROM business_applications
            WHERE supabase_user_id = :supabase_user_id 
              AND payment_status IN ('Paid', 'For Payment', 'Pending Verification')
            ORDER BY payment_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':supabase_user_id' => $supabase_user_id]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map database results to the structure expected by the frontend's loadPayments function
    $payments = array_map(function($app) {
        // Concatenate business name to type for better user context
        $app['type'] = 'Business Application: ' . ($app['business_name'] ?? 'N/A');
        unset($app['business_name']); // Remove redundant business_name
        return $app;
    }, $applications);


    echo json_encode([
        'success' => true,
        'payments' => $payments
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage(), 'success' => false]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred: ' . $e->getMessage(), 'success' => false]);
}