<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

if (!isset($_SESSION['supabase_user_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

try {
    // ================================================================================
    // UTILITIES (Aligned with Business Structure)
    // ================================================================================
    $stmt1 = $pdo->prepare("SELECT id, 
                                   first_name, 
                                   middle_name, 
                                   last_name, 
                                   status, 
                                   approval_comments, 
                                   first_name || ' ' || middle_name || ' ' || last_name AS fullname,
                                   application_date AS request_date, 
                                   'Utilities' AS type 
                            FROM utility_applications
                            WHERE supabase_user_id = ?");
    $stmt1->execute([$supabase_user_id]);
    $utilities = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // ================================================================================
    // BUSINESS
    // ================================================================================
    $stmt3 = $pdo->prepare("SELECT id, 
                                   first_name, 
                                   middle_name, 
                                   last_name, 
                                   status, 
                                   approval_comments, 
                                   first_name || ' ' || middle_name || ' ' || last_name AS fullname,
                                   application_date AS request_date, 
                                   'Business' AS type
                            FROM business_applications
                            WHERE supabase_user_id = ?");
    $stmt3->execute([$supabase_user_id]);
    $business = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    // Merge results if you want to display both
    $all_applications = array_merge($utilities, $business);

    echo json_encode([
        'success' => true,
        'applications' => $all_applications
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}