<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No valid JSON received']);
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO resident (
        household_head_name, address, household_size, contact_no,
        household_status, registered_date
    ) VALUES (
        :firstName, :middleName, :lastName, :suffix,
        :contactNo, :address
    )
");

try {
    $stmt->execute([
        ':firstName' => $data['fullname'] ?? null,
        ':middleName' => $data['address'] ?? null,
        ':lastName' => $data['contactNo'] ?? null,
        ':suffix' => $data['requestDate'] ?? null,
        ':contactNo' => $data['dateOfWork'] ?? null,
        ':address' => $data['provider'] ?? null,
    ]);

    echo json_encode(['success' => true, 'message' => 'Utilities application submitted successfully.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
