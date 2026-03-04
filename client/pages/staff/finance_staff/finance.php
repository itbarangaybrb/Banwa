<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../../server/api/shared/get_fullname.php';

if ($_SESSION['role_id'] != 7) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}

$full_name = getCurrentUserName();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finance & Collection Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/finance_staff/finance.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body>
    <aside class="side_nav">
        <div class="nav_header">
            <div class="nav_logo">☰</div>
            <div class="logo_title">
                <img class="logo" src="../../../img/banwalogo.png" alt="Logo">
                <span class="company_name">BANWA</span>
            </div>
        </div>
        <ul class="nav_list">
            <div>
                <li>
                    <a href="#" class="nav_select active" onclick="switchTab(event, 'pending')">
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span class="nav_text">For Payment</span>
                    </a>
                </li>

                <li>
                    <a href="#" class="nav_select" onclick="switchTab(event, 'history')">
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span class="nav_text">Transaction History</span>
                    </a>
                </li>

                <li>
                    <a href="#" class="nav_select" onclick="openPenaltyModal(); return false;">
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span class="nav_text">Issue Penalty</span>
                    </a>
                </li>
                <li>
                    <a class="nav_select" id="signoutBtn" href="#">
                        <i class="fa-solid fa-arrow-right-from-bracket fa-lg" style="color: rgb(255, 255, 255);"></i>
                        <span class="nav_text">Logout</span>
                    </a>
                </li>
            </div>

            <div>
                <li>
                    <button class="nav_select_btn" id="userProfileBtn">
                        <div class="user_image_container">
                            <span class="user_avatar_sidebar">A</span>
                        </div>
                        <span class="nav_text">Profile</span>
                    </button>
                </li>
            </div>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="top-header">
            <div class="header-left">
                <h1>Finance & Collection Management</h1>
            </div>
            <div class="header-right">
                <div class="user-greeting">
                    <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                </div>
            </div>
        </header>

        <div class="content">
            <div id="alert-container"></div>

            <div id="pending" class="tab-pane active">
                <div class="section-title">Applications For Payment</div>
                <p class="form-description">Process over-the-counter payments or verify online transactions.</p>

                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search..." onkeyup="filterTable('pendingTable', 'searchPending')">
                    <select id="statusApplications" style="width: max-content;">
                        <option value="">All Status</option>
                        <option value="Pending / Unpaid">Pending / Unpaid</option>
                        <option value="Pending / Paid">Pending / Paid</option>
                        <option value="Pending / Pending Verification">Pending / Pending Verification</option>
                        <option value="Complied / Unpaid">Complied / Unpaid</option>
                        <option value="Complied / Paid">Complied / Paid</option>
                        <option value="Complied / Pending Verification">Complied / Pending Verification</option>
                        <option value="Approved / Unpaid">Approved / Unpaid</option>
                        <option value="Approved / Paid">Approved / Paid</option>
                        <option value="Approved / Pending Verification">Approved / Pending Verification</option>
                        <option value="Rejected / Unpaid">Rejected / Unpaid</option>
                        <option value="Rejected / Paid">Rejected / Paid</option>
                        <option value="Rejected / N/A">Rejected / N/A</option>
                    </select>
                    <button class="btn-navy" type="button" data-modal="exportApplicationsTable" style="margin-left: auto;">Export As PDF</button>
                </div>

                <!-- FIX: Added id="exportApplicationsTable" wrapper div so exportAs.js can find
                     the container via data-modal="exportApplicationsTable". Without this, 
                     exportAs.js threw: Cannot read properties of null (reading 'querySelectorAll') -->
                <div id="exportApplicationsTable">
                    <div class="table-responsive" style="max-height: 580px;">
                        <table id="pendingTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Payer</th>
                                    <th>Business / Project</th>
                                    <th>Assessment Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="pendingTableBody">
                                <tr>
                                    <td colspan="7" class="loading">
                                        <div class="spinner"></div>Loading pending payments...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="history" class="tab-pane">
                <div class="section-title">Transaction History</div>
                <p class="form-description">View past transactions and reprint receipts.</p>

                <div class="search-box">
                    <input type="text" id="searchHistory" placeholder="Search by OR Number or Name..." onkeyup="filterTable('historyTable', 'searchHistory')">
                </div>

                <div class="table-responsive" style="max-height: 580px;">
                    <table id="historyTable">
                        <thead>
                            <tr>
                                <th>OR/Ref No.</th>
                                <th>Type</th>
                                <th>ID</th>
                                <th>Payer</th>
                                <th>Amount Paid</th>
                                <th>Date Paid</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr>
                                <td colspan="7" class="loading">
                                    <div class="spinner"></div>Loading history...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>
    <script src="../../../scripts/staff/finance_staff/finance.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script>
        // Simple script to handle active class on sidebar items
        const navItems = document.querySelectorAll('.nav_select');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            });
        });
    </script>
</body>

</html>