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
            <p>Process payments, penalties, and generate receipts</p>
            <div class="header-actions">
                <button class="btn-info" onclick="openModal('instructionsModal')">ℹ️ Payment Instructions</button>
                <button class="btn-warning" onclick="openPenaltyModal()">⚠️ Pay Annual Penalties</button>
            </div>
        </header>

        <div class="nav-tabs">
            <button class="tab-button active" onclick="switchTab(event, 'pending')">⏳ For Payment</button>
            <button class="tab-button" onclick="switchTab(event, 'history')">📜 Payment History</button>
        </div>

        <div class="content">
            <div id="alert-container"></div>

            <div id="pending" class="tab-pane active">
                <h2>Applications For Payment</h2>
                <div class="search-box">
                    <input type="text" id="searchPending" placeholder="Search by App ID or Payer Name..." onkeyup="filterTable('pendingTable', 'searchPending')">
                </div>
                <div class="table-responsive">
                    <table id="pendingTable">
                        <thead>
                            <tr>
                                <th>App ID</th>
                                <th>Payer Name</th>
                                <th>Type</th>
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
                <div class="search-box">
                    <input type="text" id="searchHistory" placeholder="Search by OR Number or Name..." onkeyup="filterTable('historyTable', 'searchHistory')">
                </div>
                <div class="table-responsive">
                    <table id="historyTable">
                        <thead>
                            <tr>
                                <th>OR/Ref No.</th>
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
                        <input type="number" step="0.01" id="amountDue" name="amountDue" readonly>
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
                        <input type="text" id="change" readonly value="0.00" style="color: green; font-weight: bold;">
                    </div>
                    <div class="form-group">
                        <label for="balance">Balance Due</label>
                        <input type="text" id="balance" readonly value="0.00" style="color: red; font-weight: bold;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" style="width: 100%;">
                        <label for="proofFile">Upload Proof of Payment (Image/PDF)</label>
                        <input type="file" id="proofFile" name="proofFile" accept="image/*,application/pdf">
                        <small>Required for GCash/Landbank online transfers.</small>
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn-success">✅ Confirm Payment</button>
                    <button type="button" class="btn-secondary" onclick="closeModal('paymentModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div id="penaltyModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>⚠️ Process Annual Penalty</h2>
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
                    <button type="submit" class="btn-warning">Process Penalty</button>
                    <button type="button" class="btn-secondary" onclick="closeModal('penaltyModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div id="instructionsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>ℹ️ Payment Instructions for Residents</h2>
                <button class="close-btn" onclick="closeModal('instructionsModal')">&times;</button>
            </div>
            <div style="padding: 10px; line-height: 1.6;">
                <p><strong>Cash Payment:</strong></p>
                <ul>
                    <li>Proceed to Window 3 (Treasury Office).</li>
                    <li>Present your Assessment Form.</li>
                    <li>Wait for your Official Receipt (OR).</li>
                </ul>
                <hr>
                <p><strong>GCash Payment:</strong></p>
                <ul>
                    <li>Send amount to Official Number: <strong>09XX-XXX-XXXX</strong>.</li>
                    <li>Use Business Name as the "Message".</li>
                    <li>Save the Screenshot/Reference No. for validation.</li>
                </ul>
                <hr>
                <p><strong>Landbank Online:</strong></p>
                <ul>
                    <li>Account Name: <strong>Municipality Treasury</strong></li>
                    <li>Account No: <strong>1234-5678-90</strong></li>
                    <li>Upload proof of transfer via portal or present printed copy.</li>
                </ul>
            </div>
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