<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

if (empty($_SESSION['supabase_user_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$supabase_user_id = $_SESSION['supabase_user_id'];

try {
    $stmt = $pdo->prepare("SELECT first_name, middle_name, last_name, suffix, contact_no, address FROM resident WHERE supabase_user_id = ? LIMIT 1");
    $stmt->execute([$supabase_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Try to fetch account info from users table (full_name, created_at) if available
    try {
        $stmt2 = $pdo->prepare("SELECT full_name, created_at FROM users WHERE supabase_user_id = ? LIMIT 1");
        $stmt2->execute([$supabase_user_id]);
        $u = $stmt2->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            if (!empty($u['full_name'])) $user['full_name'] = $u['full_name'];
            if (!empty($u['created_at'])) {
                $ts = strtotime($u['created_at']);
                if ($ts !== false) $user['member_since'] = date('F Y', $ts);
            }
        }
    } catch (PDOException $inner) {
        // ignore if users table missing columns or query fails
    }

    echo json_encode($user);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
