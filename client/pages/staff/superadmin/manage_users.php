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
    <title>Manage Users</title>



    <link rel="stylesheet" href="../../../styles/staff/superadmin/main.css">
    <link rel="stylesheet" href="../../../styles/staff/superadmin/manage_users.css">
</head>

<body>
    <div id="page-loader">
        <div class="spinner"></div>
        <p>Loading…</p>
    </div>

    <header class="header">
        <h1>
            Manage Users
        </h1>

        <p id="userStatus"></p>
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
            <button class="buttons create-btn" type="button" data-modal="createModal">Create New User</button>

            <div class="divider"></div>

            <div class="row containers">
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search users...">
                    <img src="../../../img/search-icon.svg" alt="Search" class="icon">
                </div>

                <div class="filters-container">
                    <button class="buttons" type="button" data-modal="manageColumnsModal">Manage Columns</button>
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
                            <th id="nameFilter">
                                <span class="th-content">
                                    <img src="../../../img/arrow-down-up-icon.svg" alt="">
                                    Name
                                </span>
                            </th>
                            <th id="emailFilter"> <span class="th-content">
                                    <img src="../../../img/arrow-down-up-icon.svg" alt="">
                                    Email Address
                                </span></th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
        </section>

        <div class="containers form-container modal" id="createModal">
            <form class="form" id="createForm">
                <div class="header-and-parags">
                    <h5>Create New Account</h5>
                </div>

                <span id="formMessage"></span>

                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="role">Role</label>
                        <select name="role" id="role">
                            <option value="">Select</option>
                            <option value="1">Resident</option>
                            <option value="2">Super Admin</option>
                            <option value="3">Admin</option>
                            <option value="4">Business staff</option>
                            <option value="5">Construction staff</option>
                            <option value="6">Utility staff</option>
                            <option value="7">Finance staff</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="fullName">Full Name</label>
                        <input type="text" id="fullName" name="fullName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" autocomplete="username">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" autocomplete="new-password">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="retypePassword">Re-type password</label>
                        <input type="password" id="retypePassword" name="retypePassword" autocomplete="new-password">
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Create</button>
                </div>
            </form>
        </div>

        <div class="containers form-container modal" id="editModal">
            <form class="form" id="editForm">
                <div class="header-and-parags">
                    <h5>Edit Account</h5>
                </div>

                <span id="formMessage"></span>

                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="editFullName">Full Name</label>
                        <input type="text" id="editFullName" name="editFullName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" name="editEmail">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="editRole">Role</label>
                        <select name="editRole" id="editRole">
                            <option value="">Select</option>
                            <option value="1">Resident</option>
                            <option value="2">Super Admin</option>
                            <option value="3">Admin</option>
                            <option value="4">Business staff</option>
                            <option value="5">Construction staff</option>
                            <option value="6">Utility staff</option>
                            <option value="7">Finance staff</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Update</button>
                </div>
            </form>
        </div>
    </main>

    <script src="../../../scripts/staff/superadmin/main.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/manage_users.js"></script>
    <script src="../../../scripts/archives.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</body>

</html>