<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../../server/api/shared/get_fullname.php';

if ($_SESSION['role_id'] != 2) {
    header("Location: /client/index.php");
    exit;
}

$full_name = getCurrentUserName();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audits</title>

    <link rel="stylesheet" href="../../../styles/staff/superadmin/main.css">
    <link rel="stylesheet" href="../../../styles/staff/superadmin/manage_users.css">
    <link rel="stylesheet" href="../../../styles/components/loader.css">
</head>

<body>
    <?php include '../../../components/loader.php'; ?>

    <header class="header">
        <h1>
            Audits
        </h1>

        <?php echo htmlspecialchars($full_name); ?>
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
            <div class="row containers">
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search users...">
                    <img src="../../../img/search-icon.svg" alt="Search" class="icon">
                </div>

                <div class="buttons-container">
                    <button class="buttons" type="button" data-modal="exportUsers">Export As PDF</button>
                </div>
            </div>
        </section>

        <section class="sections">
            <div class="containers">
                <table id="usersTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Activity</th>
                            <th id="nameFilter" class="th-filter">
                                <span class="th-content">
                                    <img src="../../../img/arrow-down-up-icon.svg" alt="">
                                    Name
                                </span>
                            </th>
                            <th>Table</th>
                            <th>Record ID</th>
                            <th>Role ID</th>
                            <th>Created At</th>
                        </tr>
                    </thead>

                    <tbody id="auditTableBody"></tbody>
                </table>
            </div>
        </section>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script src="https://banwa.onrender.com/socket.io/socket.io.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/main.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script type="module" src="../../../scripts/components/loader.js"></script>

</body>

</html>