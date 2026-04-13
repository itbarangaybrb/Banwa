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
    <title>Manage Users</title>

    <link rel="stylesheet" href="../../../styles/staff/superadmin/main.css">
    <link rel="stylesheet" href="../../../styles/staff/superadmin/manage_users.css">
    <link rel="stylesheet" href="../../../styles/components/loader.css">
    <link rel="stylesheet" href="../../../styles/utils/pagination.css">
</head>

<body>
    <?php include '../../../components/loader.php'; ?>

    <header class="header">
        <h1>
            Manage Users
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
                <!-- <li class="items">
                    <a class="links" href="../superadmin/audits.php">
                        <img src="../../../img/file-search-corner-icon.svg" alt="audit" class="icon">
                        <p class="links-name">Audits</p>
                    </a>
                </li> -->
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
                    <button class="buttons create-btn" type="button" data-modal="createModal">Create New User</button>
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
                            <th id="nameFilter" class="th-filter">
                                <span class="th-content">
                                    <img src="../../../img/arrow-down-up-icon.svg" alt="">
                                    Name
                                </span>
                            </th>
                            <th id="emailFilter" class="th-filter">
                                <span class="th-content">
                                    <img src="../../../img/arrow-down-up-icon.svg" alt="">
                                    Email Address
                                </span>
                            </th>
                            <th>House No.</th>
                            <th>Street</th>
                            <th>Status</th>
                            <th>Role</th>
                            <!-- <th>Details</th> -->
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
                <div class="pagination-container" id="usersPagination"></div>
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
                    <div class="label-and-input">
                        <label for="lotNo">House No. <span id="createLotRequired" style="color:#BB1B1B; display:none;">*</span></label>
                        <input type="text" id="lotNo" name="lotNo" maxlength="10">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="createStreet">Street Name <span id="createStreetRequired" style="color:#BB1B1B; display:none;">*</span></label>
                        <select name="street" id="createStreet">
                            <option value="" disabled selected>Select</option>
                            <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City</option>
                            <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City</option>
                            <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City</option>
                            <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City</option>
                            <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City</option>
                            <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City</option>
                            <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City</option>
                            <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                            <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City</option>
                            <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City</option>
                            <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City</option>
                            <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City</option>
                            <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City</option>
                            <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <input type="hidden" id="latitude" name="latitude">
                    <input type="hidden" id="longitude" name="longitude">
                </div>

                <div class="buttons-container">
                    <button type="button" class="buttons cancel-btn">Cancel</button>
                    <button type="submit" class="buttons">Create</button>
                </div>
            </form>
        </div>

        <div class="containers form-container modal" id="editModal">
            <form class="form" id="editForm">
                <div class="header-and-parags">
                    <h5>Edit Account</h5>
                </div>

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
                    <div class="label-and-input">
                        <label for="editLotNo">House No. <span id="editLotRequired" style="color:#BB1B1B; display:none;">*</span></label>
                        <input type="text" id="editLotNo" name="editLotNo" maxlength="10">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="editStreet">Street Name <span id="editStreetRequired" style="color:#BB1B1B; display:none;">*</span></label>
                        <select name="street" id="editStreet">
                            <option value="" disabled selected>Select</option>
                            <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City</option>
                            <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City</option>
                            <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City</option>
                            <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City</option>
                            <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City</option>
                            <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City</option>
                            <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City</option>
                            <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                            <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City</option>
                            <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City</option>
                            <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City</option>
                            <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City</option>
                            <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City</option>
                            <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <input type="hidden" id="editLatitude" name="latitude">
                    <input type="hidden" id="editLongitude" name="longitude">
                </div>

                <div class="buttons-container">
                    <button type="button" class="buttons cancel-btn">Cancel</button>
                    <button type="button" class="buttons archive-btn" id="editArchiveBtn">Archive</button>
                    <button type="submit" class="buttons">Update</button>
                    <!-- <button type="button" class="buttons suspend-btn" id="editSuspendBtn">Suspend</button> -->
                    <!-- <button type="button" class="buttons unsuspend-btn" id="editUnsuspendBtn" style="display:none;">Unsuspend</button> -->
                </div>
            </form>
        </div>

        <div class="containers form-container modal" id="suspendModal">
            <form class="form" id="suspendForm">
                <div class="header-and-parags">
                    <h5>Suspend Account</h5>
                </div>

                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="suspendReason">Suspension Reason</label>
                        <select name="suspendReason" id="suspendReason">
                            <option value="" disabled selected>Select</option>
                            <option value="Test Auto Unsuspend">Test Auto Unsuspend</option>
                            <option value="Violation of Terms of Service">Violation of Terms of Service</option>
                            <option value="Fraudulent Activity">Fraudulent Activity</option>
                            <option value="Suspicious or Unusual Activity">Suspicious or Unusual Activity</option>
                            <option value="Harassment or Abuse">Harassment or Abuse</option>
                            <option value="Repeated Policy Violations">Repeated Policy Violations</option>
                            <option value="Unauthorized Data Access or Misuse">Unauthorized Data Access or Misuse</option>
                            <option value="Impersonation or Identity Misrepresentation">Impersonation or Identity Misrepresentation</option>
                            <option value="Failure to Meet Verification Requirements">Failure to Meet Verification Requirements</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <div id="reasonTemplates" class="reason-buttons-container"></div>
                        <label for="suspendReasonDetails">Detailed Reason</label>
                        <textarea name="suspendReasonDetails" id="suspendReasonDetails" rows="4" placeholder="Describe specific reason for suspension"></textarea>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" class="buttons" id="suspendBackBtn">Back</button>
                    <button type="submit" class="buttons suspend-btn">Suspend</button>
                </div>
            </form>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script src="https://cdn.socket.io/4.8.3/socket.io.min.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/main.js"></script>
    <script type="module" src="../../../scripts/staff/superadmin/manage_users.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script type="module" src="../../../scripts/utils/archives.js"></script>
    <script type="module" src="../../../scripts/components/loader.js"></script>

</body>

</html>