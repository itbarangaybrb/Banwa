<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

if (empty($_SESSION['supabase_user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    exit;
}

$allowed = ['firstName' => 'first_name', 'middleName' => 'middle_name', 'lastName' => 'last_name', 'suffix' => 'suffix', 'contactNo' => 'contact_no', 'address' => 'address', 'email' => 'email'];
$set = [];
$params = [':uid' => $supabase_user_id];

foreach ($allowed as $k => $col) {
    if (isset($input[$k]) && $input[$k] !== null) {
        $set[] = "$col = :$col";
        $params[":$col"] = trim($input[$k]);
    }
}

if (empty($set)) {
    echo json_encode(['success' => false, 'error' => 'Nothing to update']);
    exit;
}

try {
    $sql = 'UPDATE resident SET ' . implode(', ', $set) . ' WHERE supabase_user_id = :uid';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB error']);
}

?>
