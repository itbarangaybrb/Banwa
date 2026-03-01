<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';

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

    <link rel="stylesheet" href="../../../styles/staff/superadmin/main.css">
    <link rel="stylesheet" href="../../../styles/staff/superadmin/dashboard.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/loader.css">
</head>

<body>
    <?php include '../../../components/loader.php'; ?>

    <header class="header">
        <h1>
            Dashboard
        </h1>
    </header>

    <aside class="aside">
        <div class="menuToggle" id="openMenu">
            <img src="../../../img/menu-icon.svg" alt="Menu" class="icon">
        </div>

        <div class="menuToggle" id="closeMenu">
            <img src="../../../img/close-icon.svg" alt="close menu" class="icon">
        </div>

        <div class="divider"></div>

        <nav class="nav" id="sideNav">
            <ul class="list">
                <li class="items">
                    <a class="links" href="../superadmin/dashboard.php">
                        <img src="../../../img/home-icon.svg" alt="dashboard" class="icon">
                        <p class="links-name">Dashboard</p>
                    </a>
                </li>
                <li class="items">
                    <a class="links" href="../superadmin/manage_users.php">
                        <img src="../../../img/users-icon.svg" alt="manage users" class="icon">
                        <p class="links-name">Manage Users</p>
                    </a>
                </li>
                <li class="items">
                    <a class="links" href="../superadmin/audits.php">
                        <img src="../../../img/file-search-corner-icon.svg" alt="audit" class="icon">
                        <p class="links-name">Audits</p>
                    </a>
                </li>
                <li class="items">
                    <a class="links" href="../superadmin/archives.php">
                        <img src="../../../img/archive-icon.svg" alt="audit" class="icon">
                        <p class="links-name">Audits</p>
                    </a>
                </li>
            </ul>

            <ul class="list">
                <li class="items">
                    <a class="links" id="signoutBtn" href="#">
                        <img src="../../../img/log-out-icon.svg" alt="Logout" class="icon">
                        <p class="links-name">Logout</p>
                    </a>
                </li>
            </ul>
        </nav>
    </aside>

    <main class="main">
        <section class="sections">
            <div class="analytics-container-1">
                <div class="analytics-row">
                    <div class="charts">
                        <canvas id="chart1"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart2"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart3"></canvas>
                    </div>
                </div>
                <div class="analytics-row">
                    <div class="charts">
                        <canvas id="chart4"></canvas>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/main.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/dashboard.js"></script>

    <script type="module" src="../../../scripts/utils/loader.js"></script>


</body>

</html>