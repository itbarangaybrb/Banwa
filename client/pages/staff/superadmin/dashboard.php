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

    <link rel="stylesheet" href="../../styles/superadmin/main.css">
    <link rel="stylesheet" href="../../styles/superadmin/manage_users.css">
</head>

<body>
    <header class="header">
        <h1>
            Dashboard
        </h1>
    </header>

    <aside class="aside">
        <div class="menuToggle" id="openMenu">
            <img src="../../img/menu-icon.svg" alt="Menu" class="icon">
        </div>

        <div class="menuToggle" id="closeMenu">
            <img src="../../img/close-icon.svg" alt="close menu" class="icon">
        </div>

        <div class="divider"></div>

        <nav class="nav" id="sideNav">
            <ul class="list">
                <li class="items">
                    <a class="links" href="../superadmin/dashboard.php">
                        <img src="../../img/home-icon.svg" alt="Home" class="icon">
                        <p class="links-name">Dashboard</p>
                    </a>
                </li>
                <li class="items">
                    <a class="links" href="../superadmin/manage_users.php">
                        <img src="../../img/users-icon.svg" alt="Users" class="icon">
                        <p class="links-name">Manage Users</p>
                    </a>
                </li>
            </ul>
            
            <ul class="list">
                <li class="items">
                    <a class="links" id="signoutBtn" href="#">
                        <img src="../../img/log-out-icon.svg" alt="Logout" class="icon">
                        <p class="links-name">Logout</p>
                    </a>
                </li>
                <li class="items">
                    <a class="links" href="../superadmin/dashboard.php">
                        <img src="../../img/home-icon.svg" alt="Home" class="icon">
                        <p class="links-name" id="userStatus"></p>
                    </a>
                </li>
            </ul>
        </nav>
    </aside>

    <main class="main">
        <h1>Dashboard</h1>
    </main>

    <script src="../../scripts/superadmin/incident_report.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>