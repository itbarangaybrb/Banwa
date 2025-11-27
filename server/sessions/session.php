<?php
// ============================
// Session Security Settings
// ============================
ini_set('session.cookie_httponly', 1);   // Prevent JS access
ini_set('session.cookie_secure', 0);     // Set 1 if using HTTPS
ini_set('session.cookie_samesite', 'Strict'); // Prevent CSRF
ini_set('display_errors', 1);            // Temporary: show errors for debugging
error_reporting(E_ALL);

session_start();

require_once __DIR__ . '/../configs/database.php';
define('SESSION_TIMEOUT', 3600); // 1 hour

$isApi = strpos($_SERVER['REQUEST_URI'], '/api/') !== false;

try {
    // ============================
    // Get Supabase JWT from Authorization header
    // ============================
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    $supabaseToken = null;

    if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $supabaseToken = $matches[1];
    }

    if (!$supabaseToken) {
        throw new Exception('Not logged in');
    }

    // ============================
    // Decode JWT payload (basic verification)
    // ============================
    $parts = explode('.', $supabaseToken);
    if (count($parts) !== 3) {
        throw new Exception('Invalid token');
    }

    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    $email = $payload['email'] ?? null;

    if (!$email) {
        throw new Exception('Email missing in token');
    }

    // ============================
    // Check session timeout
    // ============================
    if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY']) > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        throw new Exception('Session timed out');
    }
    $_SESSION['LAST_ACTIVITY'] = time();

    // ============================
    // Fetch user info from DB
    // ============================
    $stmt = $pdo->prepare("SELECT user_id, full_name, role_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User not found');
    }

    $_SESSION['user'] = [
        'id' => $user['user_id'],
        'fullname' => $user['full_name'],
        'role_id' => $user['role_id']
    ];
    
} catch (Exception $e) {
    // Always return JSON on error
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit();
}
