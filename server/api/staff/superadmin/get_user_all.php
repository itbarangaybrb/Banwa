<?php
/**
 * Initializes session and sets response type.
 * Includes database configuration for PDO access.
 */
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../../configs/database.php';

/**
 * Retrieves all users from the database and returns them as JSON.
 * If a database error occurs, returns HTTP 500 with an error message.
 */
try {
    $stmt = $pdo->query("SELECT user_id, full_name, email, role_id, is_archived, status FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
