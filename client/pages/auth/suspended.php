<?php
session_start();
header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/../../../server/configs/database.php';

// Make sure the user is logged in
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    // Not logged in
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}

// Fetch user info
$stmt = $pdo->prepare("SELECT status, suspend_reason, reason_details FROM users WHERE user_id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Redirect if user not found or not suspended
if (!$user || $user['status'] !== 'suspended') {
    header("Location: /Banwa/client/pages/resident/home.php");
    exit;
}

// Get suspension reason
$reason = $user['suspend_reason'] ?? "Your account is temporarily suspended.";
$details = $user['reason_details'] ?? "Your account is temporarily suspended.";
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Account Suspended</title>
  <link rel="stylesheet" href="../../styles/auth/confirm_verification.css" />
</head>
<body>
  <div style="text-align: center;">
    <h1 style="color: red; margin-bottom: 56px;">Account Suspended</h1>
    <h3 style="margin-bottom: 8px;"><?php echo htmlspecialchars($reason); ?></h3>
    <p><?php echo htmlspecialchars($details); ?></p>
  </div>
</body>
</html>