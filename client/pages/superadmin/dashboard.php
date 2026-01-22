<?php
include __DIR__ . '/../../components/sessions/superadmin_session.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>

    <link rel="stylesheet" href="../../styles/superadmin/main.css">
    <link rel="stylesheet" href="../../styles/superadmin/dashboard.css">
</head>

<body>
    <header class="header">
        <h1>Dashboard</h1>
    </header>

    <aside class="aside">
        <div id="openMenu">
            <img src="../../img/menu-icon.svg" alt="Menu" class="icon">
        </div>

        <div id="closeMenu">
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
                <li class="items">
                    <a class="links" id="signoutBtn" href="#">
                        <img src="../../img/log-out-icon.svg" alt="Logout" class="icon">
                        <p class="links-name">Logout</p>
                    </a>
                </li>
            </ul>
        </nav>
    </aside>

    <main class="main">
        <section class="sections">
            <div class="containers">
                <div class="col">
                    <div class="txt-and-icons">
                        <p>lorem</p>
                        <img src="" alt="icon" class="icon">
                    </div>
                    <p class="total-number" id="totalNum">0000</p>
                </div>
                <div class="col">
                    <div class="txt-and-icons">
                        <p>lorem</p>
                        <img src="" alt="icon" class="icon">
                    </div>
                    <p class="total-number" id="totalNum">0000</p>
                </div>
                <div class="col">
                    <div class="txt-and-icons">
                        <p>lorem</p>
                        <img src="" alt="icon" class="icon">
                    </div>
                    <p class="total-number" id="totalNum">0000</p>
                </div>
                <div class="col">
                    <div class="txt-and-icons">
                        <p>lorem</p>
                        <img src="" alt="icon" class="icon">
                    </div>
                    <p class="total-number" id="totalNum">0000</p>
                </div>
            </div>
        </section>

        <section class="sections">
            <div class="containers">
                <div class="row">
                    <div class="col">
                        <h5>Platform Activity</h5>
                        <p>All registered user accounts were active during the selected period.</p>
                    </div>
                    <div class="col"></div>
                </div>
                <div class="row">
                    <div class="col"></div>
                    <div class="col"></div>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/auth/signout.js"></script>
    <script src="../../scripts/superadmin/main.js"></script>
    <script type="module" src="../../scripts/superadmin/dashboard.js"></script>
</body>

</html>