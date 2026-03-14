<?php
session_start();

// --- ADDED: Prevent browser caching ---
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
// --------------------------------------

header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/../../../server/configs/database.php';

/**
 * Get the current user ID from session
 * @var int|null $userId The ID of the logged-in user, or null if not logged in
 */
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
  header("Location: /client/index.php");
  exit;
}

/**
 * Fetch user information from database
 * @var PDOStatement $stmt Prepared statement for user query
 * @var array|false $user User data array or false if not found
 */
$stmt = $pdo->prepare("SELECT status, suspend_reason, reason_details, suspended_until FROM users WHERE user_id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['status'] !== 'suspended') {
  header("Location: /client/pages/resident/home.php");
  exit;
}

/**
 * Extract suspension details from user data
 * @var string $reason The main reason for suspension
 * @var string $details Additional details about the suspension
 * @var string|null $suspendedUntil Date when suspension ends, or null for indefinite
 */
$reason = $user['suspend_reason'] ?? "Your account is temporarily suspended.";
$details = $user['reason_details'] ?? "";
$suspendedUntil = $user['suspended_until'] ?? null;

$suspensionEndDate = '';
if ($suspendedUntil && $suspendedUntil !== '1970-01-01 00:00:00') {
  $date = new DateTime($suspendedUntil);
  $suspensionEndDate = $date->format('F j, Y');

  if ($details) {
    $details .= " ";
  }
  $details .= "Your account suspension will end on " . $suspensionEndDate . ". After this date, you will be able to access your account again.";
} else {
  if ($details) {
    $details .= " ";
  }
  $details .= "This suspension is indefinite. Please contact support for more information.";
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

  <title>Account Suspended</title>
  <link rel="stylesheet" href="../../styles/auth/confirm_verification.css" />
</head>

<body>
  <div class="suspended-container">
    <h1 style="color: red; margin-bottom: 56px;">Account Suspended</h1>
    <h3 style="margin-bottom: 8px;"><?php echo htmlspecialchars($reason); ?></h3>
    <p><?php echo htmlspecialchars($details); ?></p>
    <a id="signoutBtn" href="/client/index.php" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 4px;">
      Logout
    </a>
  </div>
</body>
<script type="module" src="/client/scripts/auth/signout.js"></script>

</html>