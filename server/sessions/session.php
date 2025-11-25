<?php
// ============================
// Session Security Settings
// ============================
ini_set('session.cookie_httponly', 1);   // Prevent JS access
ini_set('session.cookie_secure', 1);     // Only HTTPS (if using HTTPS)
ini_set('session.cookie_samesite', 'Strict'); // Prevent CSRF

session_start();

include './server/configs/database.php';

define('SESSION_TIMEOUT', 3600); // 1 hr as recommended of sb

// ============================
// Get Supabase JWT from cookie
// ============================
$supabaseToken = $_COOKIE['sb-access-token'] ?? null;

if (!$supabaseToken) {
    header("Location: http://localhost:8080/Banwa/client/pages/auth/signin.php");
    exit();
}

// ============================
// Decode JWT payload (basic verification)
// ============================
$parts = explode('.', $supabaseToken);
if (count($parts) !== 3) {
    session_unset();
    session_destroy();
    header("Location: http://localhost:8080/Banwa/client/pages/auth/signin.php");
    exit();
}

// Decode payload
$payload = json_decode(base64_decode($parts[1]), true);

// Extract user email from JWT
$email = $payload['email'] ?? null;
if (!$email) {
    session_unset();
    session_destroy();
    header("Location: http://localhost:8080/Banwa/client/pages/auth/signin.php");
    exit();
}

// ============================
// Check session timeout
// ============================
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY']) > SESSION_TIMEOUT) {
    session_unset();
    session_destroy();
    header("Location: http://localhost:8080/Banwa/client/pages/auth/signin.php");
    exit();
}
$_SESSION['LAST_ACTIVITY'] = time(); // update last activity time

// ============================
// Fetch user info from DB
// ============================
$stmt = $conn->prepare("SELECT id, fullname, img, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if ($user) {
    $_SESSION['user']['id']       = $user['id'];
    $_SESSION['user']['fullname'] = $user['fullname'];
    $_SESSION['user']['img']      = $user['img'];
    $_SESSION['user']['role']     = $user['role']; // important for access control
} else {
    // User not found in DB
    session_unset();
    session_destroy();
    header("Location: http://localhost:8080/Banwa/client/pages/auth/signin.php");
    exit();
}
