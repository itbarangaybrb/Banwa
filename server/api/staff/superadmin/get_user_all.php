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
    $stmt = $pdo->query("
        SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.is_archived, u.status, u.reason_details, 
            u.street, u.lot_no
        FROM users u
        LEFT JOIN role r ON r.role_id = u.role_id
        ORDER BY u.full_name DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}