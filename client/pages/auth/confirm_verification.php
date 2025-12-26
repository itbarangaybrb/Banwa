<?php
session_start();
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>

  <link rel="stylesheet" href="../../styles/auth/confirm_verification.css" />
</head>
<body>

  <p id="status">Verifying your email…</p>

  <script type="module" src="../../scripts/auth/confirm_verification.js"></script>
</body>
</html>