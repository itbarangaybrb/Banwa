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
    // WARNING: 
    // DO NOT REMOVE THIS COMMENTS, BECAUSE WILL USE THIS LATER FOR OTHER APPLICATION!
    // - JEP
    // ================================================================================


    // // UTILITIES
    // $stmt1 = $pdo->prepare("SELECT id, applicant_name AS fullname, date_of_request AS request_date, 'utilities' AS type 
    //                     FROM utility_doc 
    //                     WHERE supabase_user_id = ?");
    // $stmt1->execute([$supabase_user_id]);
    // $utilities = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // // CONSTRUCTION
    // $stmt2 = $pdo->prepare("SELECT id, fullname, request_date AS request_date, 'construction' AS type 
    //                     FROM construction_doc 
    //                     WHERE supabase_user_id = ?");
    // $stmt2->execute([$supabase_user_id]);
    // $construction = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // BUSINESS
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

    // $applications = array_merge($utilities, $construction, $business);

    echo json_encode([
        'success' => true,
        'applications' => $business
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
