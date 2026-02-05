<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finance & Collection Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
                    <p class="username">Admin</p>
                    <div class="user_image">
                        <span class="user_avatar_header">A</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="content">
            <div id="alert-container"></div>

            <div id="pending" class="tab-pane active">
                <div class="section-title">Applications For Payment</div>
                <p class="form-description">Process over-the-counter payments or verify online transactions.</p>
                
                <div class="search-box">
                    <input type="text" id="searchPending" placeholder="Search by App ID or Payer Name..." onkeyup="filterTable('pendingTable', 'searchPending')">
                </div>

                <div class="table-responsive">
                    <table id="pendingTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Payer</th>
                                <th>Business Name</th>
                                <th>Assessment Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="pendingTableBody">
                            <tr>
                                <td colspan="6" class="loading">
                                    <div class="spinner"></div>Loading pending payments...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="history" class="tab-pane">
                <div class="section-title">Transaction History</div>
                <p class="form-description">View past transactions and reprint receipts.</p>

                <div class="search-box">
                    <input type="text" id="searchHistory" placeholder="Search by OR Number or Name..." onkeyup="filterTable('historyTable', 'searchHistory')">
                </div>

                <div class="table-responsive">
                    <table id="historyTable">
                        <thead>
                            <tr>
                                <th>OR/Ref No.</th>
                                <th>ID</th>
                                <th>Payer</th>
                                <th>Amount Paid</th>
                                <th>Date Paid</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr>
                                <td colspan="6" class="loading">
                                    <div class="spinner"></div>Loading history...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="paymentModal" class="staff-modal">
                <div class="staff-modal-content">
                    <div class="staff-modal-header">
                        <h2>Process Payment</h2>
                        <button class="close-btn" onclick="closeModal('paymentModal')">&times;</button>
                    </div>
                    <form id="paymentForm" onsubmit="submitPayment(event)" enctype="multipart/form-data">
                        <input type="hidden" id="payAppId" name="id">

                        <div class="summary-card">
                            <p><strong>Application ID:</strong> <span id="dispAppId"></span></p>
                            <p><strong>Payer:</strong> <span id="dispPayer"></span></p>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="paymentDate">Date of Payment *</label>
                                <input type="date" id="paymentDate" name="paymentDate" required>
                            </div>
                            <div class="form-group">
                                <label for="amountDue">Amount Due (PHP)</label>
                                <input type="number" step="0.01" id="amountDue" name="amountDue" readonly style="background-color: #f8f9fa;">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="paymentMethod">Payment Method *</label>
                                <select id="paymentMethod" name="paymentMethod" required onchange="toggleReferenceInput()">
                                    <option value="Cash">Cash</option>
                                    <option value="GCash">GCash</option>
                                    <option value="Landbank">Landbank</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label id="refLabel" for="refNumber">Official Receipt (OR) No. *</label>
                                <input type="text" id="refNumber" name="refNumber" required placeholder="Enter number...">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="amountPaid">Amount Tendered *</label>
                                <input type="number" step="0.01" id="amountPaid" name="amountPaid" required placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label for="change">Change</label>
                                <input type="text" id="change" readonly value="0.00" style="color: green; font-weight: bold; background-color: #f0fff4;">
                            </div>
                            <div class="form-group">
                                <label for="balance">Balance Due</label>
                                <input type="text" id="balance" readonly value="0.00" style="color: red; font-weight: bold; background-color: #fff5f5;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="proofFile">Upload Proof (Optional/Required for Online)</label>
                            <input type="file" id="proofFile" name="proofFile" accept="image/*,application/pdf">
                        </div>

                        <div class="button-group">
                            <button type="submit" class="btn-primary">Confirm Payment</button>
                            <button type="button" class="btn-secondary" onclick="closeModal('paymentModal')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="penaltyModal" class="staff-modal">
                <div class="staff-modal-content">
                    <div class="staff-modal-header">
                        <h2>Process Annual Penalty</h2>
                        <button class="close-btn" onclick="closeModal('penaltyModal')">&times;</button>
                    </div>
                    <form id="penaltyForm" onsubmit="submitPenalty(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="penaltyAppId">Application ID / Business ID</label>
                                <input type="text" id="penaltyAppId" name="penaltyAppId" required placeholder="Enter ID...">
                            </div>
                            <div class="form-group">
                                <label for="penaltyYear">Tax Year</label>
                                <input type="number" id="penaltyYear" name="penaltyYear" value="2024" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="penaltyAmount">Penalty Amount (PHP)</label>
                                <input type="number" step="0.01" id="penaltyAmount" name="penaltyAmount" required>
                            </div>
                            <div class="form-group">
                                <label for="penaltyReason">Reason / Violation</label>
                                <select id="penaltyReason" name="penaltyReason">
                                    <option value="Late Renewal">Late Renewal</option>
                                    <option value="Non-Compliance">Non-Compliance</option>
                                    <option value="Sanitary Violation">Sanitary Violation</option>
                                </select>
                            </div>
                        </div>
                        <div class="button-group">
                            <button type="submit" class="btn-danger">Process Penalty</button>
                            <button type="button" class="btn-secondary" onclick="closeModal('penaltyModal')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="detailsModal" class="staff-modal">
                <div class="staff-modal-content">
                    <div class="staff-modal-header">
                        <h2>Application Summary</h2>
                        <button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
                    </div>
                    <div id="summaryBody"></div>
                </div>
            </div>

            <div id="verificationModal" class="staff-modal">
                <div class="staff-modal-content">
                    <div class="staff-modal-header">
                        <h2>Verify Resident Payment</h2>
                        <button class="close-btn" onclick="closeModal('verificationModal')">&times;</button>
                    </div>
                    <div id="verificationBody"></div>
                </div>
            </div>

        </div> </div>
    <script src="../../../scripts/staff/finance_staff/finance.js"></script>
    
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