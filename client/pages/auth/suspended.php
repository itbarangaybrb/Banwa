<?php
session_start();
header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/../../../server/configs/database.php';

/**
 * Get the current user ID from session
 * @var int|null $userId The ID of the logged-in user, or null if not logged in
 */
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
  header("Location: /Banwa/client/pages/auth/signin.php");
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
  header("Location: /Banwa/client/pages/resident/home.php");
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
if ($suspendedUntil) {
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
  <meta charset="UTF-8" />
  <title>Account Suspended</title>
  <link rel="stylesheet" href="../../styles/auth/confirm_verification.css" />
</head>

<body>
  <div class="suspended-container">
    <h1 style="color: red; margin-bottom: 56px;">Account Suspended</h1>
    <h3 style="margin-bottom: 8px;"><?php echo htmlspecialchars($reason); ?></h3>
    <p><?php echo htmlspecialchars($details); ?></p>
  </div>
</body>

</html>