<?php
session_start();

// Destroy session variables
$_SESSION = [];
session_unset();
session_destroy();

// Destroy the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 3600,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

// Redirect AFTER cleanup
header("Location: /Banwa/client/pages/auth/signin.php");
exit;
