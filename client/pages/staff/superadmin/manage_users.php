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
    <title>Manage Users</title>

    <link rel="stylesheet" href="../../styles/superadmin/main.css">
    <link rel="stylesheet" href="../../styles/superadmin/manage_users.css">
</head>

<body>
    <header class="header">
        <h1>
            Manage Users
        </h1>

        <p id="userStatus"></p>
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

            <!-- <div class="containers suspend-container">
            <form class="suspend-form" id="suspendForm">
                <div class="header-and-parags">
                    <h1>Suspend User</h1>
                </div>
    
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="">Lorem</label>
                        <select name="role" id="role">
                            <option value="select" disabled>Select</option>
                            <option value="3" disabled>Admin</option>
                            <option value="4" disabled>Business staff</option>
                            <option value="5" disabled>Construction staff</option>
                            <option value="6" disabled>Utility staff</option>
                            <option value="7" disabled>Finance staff</option>
                        </select>
                    </div>
                    <div class="label-and-input">
                        <label for="email">Email</label>
                        <input type="email" id="email">
                    </div>
                    <div class="label-and-input">
                        <label for="password">Password</label>
                        <input type="password" id="password">
                    </div>
                    <div class="label-and-input">
                        <label for="retypePassword">Re-type password</label>
                        <input type="password" id="retypePassword">
                    </div>
                    <div class="label-and-input">
                        <label for="retypePassword">re-type password</label>
                        <input type="password" id="retypePassword">
                    </div>
                </div>
    
                <div class="buttons-container">
                    <button type="button">Back</button>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div> -->
        </section>
    </main>

    <script src="../../scripts/superadmin/main.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>