<?php
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['supabase_user_id'], $data['email'], $data['full_name'], $data['role_id'])) {
        throw new Exception("Missing required fields.");
    }

    $supabase_user_id = $data['supabase_user_id'];
    $email = $data['email'];
    $full_name = $data['full_name'];
    $role_id = intval($data['role_id']);

    $pdo->beginTransaction();

    // Insert user
    $stmt = $pdo->prepare("
        INSERT INTO users (supabase_user_id, email, full_name, role_id)
        VALUES (:uid, :email, :name, :role)
    ");

    $stmt->execute([
        ':uid' => $supabase_user_id,
        ':email' => $email,
        ':name' => $full_name,
        ':role' => $role_id
    ]);

    // $userRecord = $stmt->fetch(PDO::FETCH_ASSOC);
    $recordId = $pdo->lastInsertId();
    // $recordId = $userRecord['user_id'] ?? null;

    // Temporarily set session for audit
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['supabase_user_id'] = $supabase_user_id;
    $_SESSION['role_id'] = $role_id;
    $_SESSION['full_name'] = $full_name;

    // Write audit log
    writeAuditLog(
        $pdo,
        'CREATE',
        'users',
        $recordId,
        null, // old data
        [
            'supabase_user_id' => $supabase_user_id,
            'email' => $email,
            'full_name' => $full_name,
            'role_id' => $role_id
        ],
        'USER CREATION'
    );

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'User created successfully']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
