<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finance & Payment Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/finance_staff/finance.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>💰 Finance Management System</h1>
            <p>Process payments and generate receipts for applications</p>
        </header>

        <div class="nav-tabs">
            <button class="tab-button active" onclick="switchTab(event, 'pending')">⏳ For Payment</button>
            <button class="tab-button" onclick="switchTab(event, 'history')">📜 Payment History</button>
        </div>

        <div class="content">
            <div id="alert-container"></div>

            <div id="pending" class="tab-pane active">
                <h2>Applications For Payment</h2>
                <p class="form-description">List of applications approved by departments and awaiting payment.</p>
                
                <div class="search-box">
                    <input type="text" id="searchPending" placeholder="Search by App ID or Payer Name..." onkeyup="filterTable('pendingTable', 'searchPending')">
                </div>

                <div class="table-responsive">
                    <table id="pendingTable">
                        <thead>
                            <tr>
                                <th>App ID</th>
                                <th>Payer Name</th>
                                <th>Application Type</th>
                                <th>Assessment Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="pendingTableBody">
                            <tr><td colspan="6" class="loading"><div class="spinner"></div>Loading pending payments...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="history" class="tab-pane">
                <h2>Payment History</h2>
                <p class="form-description">View completed transactions and reprint receipts.</p>
                
                <div class="search-box">
                    <input type="text" id="searchHistory" placeholder="Search by OR Number or Name..." onkeyup="filterTable('historyTable', 'searchHistory')">
                </div>

                <div class="table-responsive">
                    <table id="historyTable">
                        <thead>
                            <tr>
                                <th>OR Number</th>
                                <th>App ID</th>
                                <th>Payer Name</th>
                                <th>Amount Paid</th>
                                <th>Date Paid</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr><td colspan="6" class="loading"><div class="spinner"></div>Loading history...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div id="paymentModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>💳 Process Payment</h2>
                <button class="close-btn" onclick="closeModal('paymentModal')">&times;</button>
            </div>
            <form id="paymentForm" onsubmit="submitPayment(event)">
                <input type="hidden" id="payAppId" name="id">
                
                <div class="summary-card">
                    <p><strong>Application ID:</strong> <span id="dispAppId"></span></p>
                    <p><strong>Payer:</strong> <span id="dispPayer"></span></p>
                    <p><strong>Type:</strong> <span id="dispType"></span></p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="amountDue">Amount Due (PHP) *</label>
                        <input type="number" step="0.01" id="amountDue" name="amountDue" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="amountPaid">Amount Tendered *</label>
                        <input type="number" step="0.01" id="amountPaid" name="amountPaid" required>
                    </div>
                    <div class="form-group">
                        <label for="change">Change</label>
                        <input type="text" id="change" readonly value="0.00">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="orNumber">Official Receipt (OR) No. *</label>
                        <input type="text" id="orNumber" name="orNumber" required placeholder="e.g., OR-2023-001">
                    </div>
                    <div class="form-group">
                        <label for="paymentMethod">Payment Method *</label>
                        <select id="paymentMethod" name="paymentMethod" required>
                            <option value="Cash">Cash</option>
                            <option value="Check">Check</option>
                            <option value="Online">Online Transfer</option>
                        </select>
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn-success">✅ Confirm Payment</button>
                    <button type="button" class="btn-secondary" onclick="closeModal('paymentModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div id="detailsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Application Summary</h2>
                <button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
            </div>
            <div id="summaryBody"></div>
        </div>
    </div>

    <script src="../../../scripts/staff/finance_staff/finance.js"></script>
</body>
</html>