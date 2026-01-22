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
    <link rel="stylesheet" href="../../styles/superadmin/manage_users.css">
</head>

<body>
    <header class="header">
        <h1>Administrators</h1>
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
            <div class="containers registration-container">
                <form class="form" id="registrationForm">
                    <div class="header-and-parags">
                        <h5>Register New Account</h5>
                    </div>

                    <span id="formMessage"></span>

                    <div class="inputs-container">
                        <div class="label-and-input">
                            <label for="role">Role</label>
                            <select name="role" id="role" name="role">
                                <option value="" disabled selected>Select</option>
                                <option value="3">Admin</option>
                                <option value="4">Business staff</option>
                                <option value="5">Construction staff</option>
                                <option value="6">Utility staff</option>
                                <option value="7">Finance staff</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="retypePassword">Re-type password</label>
                            <input type="password" id="retypePassword" name="retypePassword">
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="buttons-container">
                        <button type="button">Back</button>
                        <button type="submit">Create</button>
                    </div>
                </form>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/auth/signout.js"></script>
    <script src="../../scripts/superadmin/main.js"></script>
    <script type="module" src="../../scripts/superadmin/manage_users.js"></script>
</body>

</html>