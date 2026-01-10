<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';


if ($_SESSION['role_id'] != 3) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
</head>
<body>
    <h1>ADMIN PAGE</h1>
    <button id="signoutBtn">Logout</button>

    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>
</html>