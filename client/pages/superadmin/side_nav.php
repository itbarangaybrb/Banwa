<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 2) {
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
    <header class="header">
        <h1>Dashboard</h1>
    </header>

    <aside class="aside">
        <nav class="nav">
            <ul class="list">
                <li class="items">
                    <img src="" alt="" class="icon">
                    <a class="links" href="../superadmin/dashboard.php">Dashboard</a>
                </li>
                <li class="items">
                    <img src="" alt="" class="icon">
                    <a class="links" href="../superadmin/manage_users.php">Manage Users</a>
                </li>
                <li class="items">
                    <img src="" alt="" class="icon">
                    <a class="links" href="#" id="signoutBtn">Logout</a>
                </li>
            </ul>
        </nav>
    </aside>



    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>