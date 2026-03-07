<?php
/**
 * Sets response type to JSON and includes database configuration.
 * Parses input JSON to check for 'email'.
 */
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';


/**
 * Returns false if email is not provided.
 */
$input = json_decode(file_get_contents("php://input"), true);
$email = $input['email'] ?? '';
if (!$email) {
    echo json_encode(['exists' => false]);
    exit;
}

/**
 * Queries the database to check if the email exists.
 * Returns a JSON response indicating existence.
 */
$stmt = $pdo->prepare("SELECT user_id FROM public.users WHERE email = ?");
$stmt->execute([$email]);

echo json_encode([
    'exists' => $stmt->rowCount() > 0
]);
