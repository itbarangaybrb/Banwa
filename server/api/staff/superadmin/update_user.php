<?php
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';


header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['role_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$user_id  = $data['user_id'];
$fullName = trim($data['full_name']);
$email    = trim($data['email']);
$role_id  = $data['role_id'];

try {

    $pdo->beginTransaction();

    // Get old data
    $oldStmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :user_id");
    $oldStmt->execute([':user_id' => $user_id]);
    $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Update
    $stmt = $pdo->prepare("
        UPDATE users 
        SET full_name = :full_name,
            email = :email,
            role_id = :role_id
        WHERE user_id = :user_id
    ");

    $stmt->execute([
        ':full_name' => $fullName,
        ':email'     => $email,
        ':role_id'   => $role_id,
        ':user_id'   => $user_id
    ]);

    // New data
    $newData = [
        'full_name' => $fullName,
        'email'     => $email,
        'role_id'   => $role_id
    ];

    // Update session full_name
    $_SESSION['full_name'] = $fullName;

    // Audit log
    writeAuditLog(
        $pdo,
        'UPDATE',
        'users',
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
