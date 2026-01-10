<?php
session_start();

// If no session, redirect to signin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role_id'])) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}

header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1.
header("Pragma: no-cache"); // HTTP 1.0.
header("Expires: 0"); // Proxies
?>
