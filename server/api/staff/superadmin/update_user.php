<?php

/**
 * Includes database configuration and audit log functions.
 * Sets response type to JSON and starts a session if none exists.
 */
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if the user is authenticated by verifying the session role.
 * Returns 401 Unauthorized if not authenticated.
 */
if (!isset($_SESSION['role_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

/**
 * Ensures the request method is POST.
 * Returns 405 Method Not Allowed if a different HTTP method is used.
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/**
 * Updates the user's information in the database, updates the session, 
 * writes an audit log, and returns a success response.
 * Rolls back the transaction and returns a 500 error if a PDO exception occurs.
 */
$data = json_decode(file_get_contents("php://input"), true);
$user_id  = $data['user_id'];
$fullName = trim($data['full_name']);
$email    = trim($data['email']);
$role_id  = $data['role_id'];
$lot_no   = trim($data['lot_no'] ?? '');
$street   = trim($data['street'] ?? '');
$latitude = trim($data['latitude'] ?? '');
$longitude = trim($data['longitude'] ?? '');

try {

    $pdo->beginTransaction();
    $oldStmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :user_id");
    $oldStmt->execute([':user_id' => $user_id]);
    $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmt = $pdo->prepare("
        UPDATE users 
        SET full_name = :full_name,
            email = :email,
            role_id = :role_id,
            lot_no = :lot_no,
            street = :street,
            latitude = :latitude,
            longitude = :longitude
        WHERE user_id = :user_id
    ");

    $stmt->execute([
        ':full_name' => $fullName,
        ':email'     => $email,
        ':role_id'   => $role_id,
        ':lot_no'    => $lot_no,
        ':street'    => $street,
        ':latitude'  => $latitude,
        ':longitude' => $longitude,
        ':user_id'   => $user_id
    ]);

    $newData = [
        'full_name' => $fullName,
        'email'     => $email,
        'role_id'   => $role_id,
        'lot_no'    => $lot_no, 
        'street'    => $street,  
        'latitude'  => $latitude,
        'longitude' => $longitude
    ];

    $_SESSION['full_name'] = $fullName;

    writeAuditLog(
        $pdo,
        'UPDATE',
        'Users',
        $user_id,
        $oldData,
        $newData
    );

    $pdo->commit();

    echo json_encode(['success' => true]);
} catch (PDOException $e) {

    $pdo->rollBack();

    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}