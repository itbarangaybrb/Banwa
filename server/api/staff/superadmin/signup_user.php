<?php
/**
 * Includes database configuration and audit log functions.
 * Sets response type to JSON.
 */
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
header('Content-Type: application/json');

/**
 * Creates a new user in the database.
 * Validates required fields from input JSON.
 * Begins a transaction, inserts the user, sets session variables for audit,
 * writes an audit log, commits the transaction, and returns a success response.
 * Rolls back the transaction and returns a 500 error if an exception occurs.
 */
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

    $recordId = $pdo->lastInsertId();

    // Temporarily set session for audit
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['supabase_user_id'] = $supabase_user_id;
    $_SESSION['role_id'] = $role_id;
    $_SESSION['full_name'] = $full_name;

    writeAuditLog(
        $pdo,
        'CREATE',
        'users',
        $recordId,
        null,
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
