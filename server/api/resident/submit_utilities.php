<?php
header('Content-Type: application/json');

// ============================
// Include session to get logged-in user
// ============================
// require_once __DIR__ . '/../../sessions/session.php'; // MUST be first
require_once __DIR__ . '/../../configs/database.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No valid JSON received']);
    exit;
}

// ============================
// Insert utilities application
// ============================
$stmt = $pdo->prepare("
    INSERT INTO utility_doc (
        applicant_name, applicant_address, contact_no, date_of_request,
        date_of_work, service_provider, nature_of_work, authorization_name, waiver_acknowledgement
    ) VALUES (
        :fullname, :address, :contactNo, :requestDate,
        :dateOfWork, :provider, :natureOfWork, :authorizationName, :waiverAcknowledgement
    )
");

try {
    $stmt->execute([
        // ':user_id' => $_SESSION['user']['id'], // now valid
        ':fullname' => $data['fullname'] ?? null,
        ':address' => $data['address'] ?? null,
        ':contactNo' => $data['contactNo'] ?? null,
        ':requestDate' => $data['requestDate'] ?? null,
        ':dateOfWork' => $data['dateOfWork'] ?? null,
        ':provider' => $data['provider'] ?? null,
        ':natureOfWork' => $data['natureOfWork'] ?? null,
        ':authorizationName' => $data['authorizationName'] ?? null,
        ':waiverAcknowledgement' => !empty($data['agreed']) && $data['agreed'] ? 'Agreed' : 'Not Agreed'
    ]);

    echo json_encode(['success' => true, 'message' => 'Utilities application submitted successfully.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
