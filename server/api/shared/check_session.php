<?php

/**
 * Initializes the session and checks if the user is logged in with a valid role.
 * Redirects to the sign-in page if the user is not authenticated.
 */
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role_id'])) {
    header("Location: /client/index.php");
    exit;
}

/**
 * Includes the database configuration to enable PDO access.
 * Allows querying user information securely.
 */
require_once __DIR__ . '/../../configs/database.php';

/**
 * Fetches the current user's status and role from the database.
 * If the user is suspended, role has changed, or user not found, 
 * destroys the session and redirects appropriately.
 */
$userId = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT status, role_id FROM users WHERE user_id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // User not found in database - clear session and redirect to login
    session_destroy();
    header("Location: /client/index.php");
    exit;
}

// Check if user is suspended
if ($user['status'] === 'suspended') {
    session_destroy();
    header("Location: /client/pages/auth/suspended.php");
    exit;
}

// Check if role has changed in the database
if ($user['role_id'] != $_SESSION['role_id']) {
    // Role has changed - log the user out immediately
    session_destroy();
    header("Location: /client/index.php?message=role_changed");
    exit;
}

/**
 * Sends headers to prevent caching of this page.
 * Ensures sensitive data is not stored in browser cache.
 */
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
