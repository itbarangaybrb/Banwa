<?php
require_once __DIR__ . '/../../sessions/session.php'; // path from API file
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

// Must be logged in
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user']['id'];

try {
    // UTILITIES
    $stmt1 = $pdo->prepare("SELECT id, applicant_name AS fullname, date_of_request AS request_date, 'utilities' AS type 
                        FROM utility_doc 
                        WHERE user_id = ?");
    $stmt1->execute([$user_id]);
    $utilities = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // CONSTRUCTION
    $stmt2 = $pdo->prepare("SELECT id, fullname, request_date AS request_date, 'construction' AS type 
                        FROM construction_doc 
                        WHERE user_id = ?");
    $stmt2->execute([$user_id]);
    $construction = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // BUSINESS
    $stmt3 = $pdo->prepare("SELECT id, owner_name AS fullname, application_date AS request_date, 'business' AS type 
                        FROM business_doc
                        WHERE user_id = ?");
    $stmt3->execute([$user_id]);
    $business = $stmt3->fetchAll(PDO::FETCH_ASSOC);


    // Combine everything
    $applications = array_merge($utilities, $construction, $business);

    echo json_encode([
        'success' => true,
        'applications' => $applications
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
