// Configuration
const API_URL = '/Banwa/server/handlers/staff/finance/finance_handler.php';

let pendingApps = [];
let paidApps = [];
// Map filter visibility flag for this management page
const PAGE_CATEGORY = 'business';
let mapFilterVisible = true;

window.addEventListener('staffMapFilterChanged', (e) => {
    try {
        const detail = e && e.detail && e.detail.activeFilters;
        if (!detail) return;
        if (Array.isArray(detail)) {
            mapFilterVisible = detail.includes(PAGE_CATEGORY);
        } else {
            mapFilterVisible = !!detail[PAGE_CATEGORY];
        }
        // Refresh currently visible table
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab && activeTab.id === 'pending') loadPendingTable();
        if (activeTab && activeTab.id === 'history') loadHistoryTable();
    } catch (err) {
        console.warn('Error handling staffMapFilterChanged in finance:', err);
    }
});

// UPDATED TAB SWITCHING FOR NEW SIDEBAR LAYOUT
document.addEventListener('DOMContentLoaded', function () {
    const navLogo = document.querySelector('.nav_logo');
    const sideNav = document.querySelector('.side_nav');

    // TOGGLE SIDEBAR ON CLICK
    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
        });
    }
});

// UPDATED TAB SWITCHING
function switchTab(event, tabName) {
    if (event) event.preventDefault();

    // 1. Switch Content
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabName);
    if (target) target.classList.add('active');

    // 2. Switch Sidebar Active State
    document.querySelectorAll('.nav_select').forEach(link => link.classList.remove('active'));

    // Find and highlight the clicked link
    if (event) {
        const clickedLink = event.target.closest('.nav_select');
        if (clickedLink) clickedLink.classList.add('active');
    }

    // 3. Load Data
    if (tabName === 'pending') loadPendingTable();
    else if (tabName === 'history') loadHistoryTable();
}

// LOAD TABLES
function loadPendingTable() {
    fetch(`${API_URL}?action=fetch_pending`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('pendingTableBody');
            tbody.innerHTML = '';
            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#999;">Hidden by map filters.</td></tr>';
                return;
            }
            if (data.status === 'success') {
                pendingApps = data.data;
                if (pendingApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No applications for payment or verification.</td></tr>';
                    return;
                }
                pendingApps.forEach(app => {
                    const name = `${app.first_name} ${app.last_name}`;

                    let actionButton;
                    let paymentStatusDisplay = app.payment_status || 'N/A';

                    if (app.payment_status === 'Pending Verification') {
                        // NEW: Button for verifying online payment submission
                        actionButton = `<button class="btn-success verify-action-btn" onclick="openVerificationModal(${app.id})">Verify Payment</button>`;
                    } else {
                        // Existing: Button for over-the-counter payment processing
                        actionButton = `<button class="btn-primary process-action-btn" onclick="openPaymentModal(${app.id}, ${app.amount_due})">Process Payment</button>`;
                    }

                    const row = `<tr>
                        <td>${app.id}</td>
                        <td>${name}</td>
                        <td>${app.business_name || 'N/A'}</td>
                        <td>₱${parseFloat(app.amount_due || 0).toFixed(2)}</td>
                        <td>${app.status} / ${paymentStatusDisplay}</td>
                        <td>
                            ${actionButton}
                            <button class="btn-info" onclick="viewSummary(${app.id}, 'pending')">View Details</button>
                        </td>
                    </tr>`;

                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error loading data: ${data.message}</td></tr>`;
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            document.getElementById('pendingTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Network Error.</td></tr>';
        });
}

function loadHistoryTable() {
    fetch(`${API_URL}?action=fetch_history`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';
            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#999;">Hidden by map filters.</td></tr>';
                return;
            }
            if (data.status === 'success') {
                paidApps = data.data;
                if (paidApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No payment history found.</td></tr>';
                    return;
                }
                paidApps.forEach(app => {
                    const name = `${app.first_name} ${app.last_name}`;
                    // Display OR if Cash/Landbank, Ref# if GCash (Assumed stored in or_number column)
                    const row = `<tr>
                        <td><strong>${app.or_number}</strong></td>
                        <td>${app.id}</td>
                        <td>${name}</td>
                        <td>₱${parseFloat(app.amount_paid).toFixed(2)}</td>
                        <td>${app.payment_date}</td>
                        <td>
                            <button class="btn-info" onclick="viewSummary(${app.id}, 'paid')">View</button>
                            <button class="btn-secondary" onclick="generateReceipt(${app.id})">Receipt</button>
                        </td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        });
}

/**
 * Automatically refreshes the active tab every 30 seconds.
 * Fetches the latest application data depending on which tab is active
 * and updates the UI accordingly.
 * 
 * @note Uses a flag (`isRefreshing`) to prevent overlapping fetches.
 */
let isRefreshing = false;
setInterval(() => {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || isRefreshing) return;

    const activeTabId = activeTab.id;
    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    if (activeTabId === 'pending') {
        loadPendingTable().finally(finish);
    } else if (activeTabId === 'history') {
        loadHistoryTable().finally(finish);
    } else {
        finish();
    }
}, 30000);

// =================================================================
// PAYMENT VERIFICATION LOGIC (NEW)
// =================================================================

/**
 * Opens the modal to display payment details and proof for verification.
 * @param {number} appId The ID of the application to verify.
 */
function openVerificationModal(appId) {
    const app = pendingApps.find(a => a.id == appId);
    if (!app) return;

    const modalBody = document.getElementById('verificationBody');
    const proofPath = app.requirement_upload ? `../../../server/${app.requirement_upload}` : '#';
    const proofLink = app.requirement_upload 
        ? `<a href="${proofPath}" target="_blank" class="btn-info">View Proof of Payment</a>`
        : `<p style="color: red;">No proof of payment uploaded.</p>`;

    modalBody.innerHTML = `
        <h3>Payment Details for Application ID: ${app.id}</h3>
        <div class="summary-card">
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Business:</strong> ${app.business_name || 'N/A'}</p>
            <p><strong>Amount Due:</strong> ₱${parseFloat(app.amount_due || 0).toFixed(2)}</p>
            <p><strong>Amount Paid:</strong> ₱${parseFloat(app.amount_paid || 0).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${app.payment_method || 'N/A'}</p>
            <p><strong>OR Number:</strong> ${app.or_number || 'N/A'}</p>
            <p><strong>Date of Payment:</strong> ${app.payment_date || 'N/A'}</p>
        </div>
        <hr>
        <h3>Action:</h3>
        ${proofLink}
        <div class="form-actions" style="margin-top: 20px;">
            <button class="btn-success" onclick="verifyPayment(${app.id}, 'Approved')">Approve Payment</button>
            <button class="btn-warning" onclick="verifyPayment(${app.id}, 'Rejected')">Reject Payment</button>
        </div>
    `;
    openModal('verificationModal');
}

/**
 * Submits the verification decision to the backend.
 * @param {number} id The application ID.
 * @param {string} action 'Approved' or 'Rejected'.
 */
async function verifyPayment(id, action) {
    if (!confirm(`Confirm to set payment status to '${action}' for ID ${id}?`)) return;

    const actionText = action === 'Approved' ? 'Approving...' : 'Rejecting...';
    const buttons = document.querySelectorAll('.form-actions button');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.classList.contains('btn-success')) btn.textContent = actionText;
    });

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=verify_payment&id=${id}&verification_action=${action}`
        });
        const result = await res.json();

        if (result.status === 'success') {
            showAlert(`Payment ${action} successfully! Status updated.`, 'success');
            closeModal('verificationModal');
            loadPendingTable(); // Reload data
        } else {
            throw new Error(result.message || 'Failed to complete verification.');
        }

    } catch (e) {
        showAlert(`Verification Error: ${e.message}`, 'error');
        buttons.forEach(btn => btn.disabled = false);
        document.querySelector('.btn-success').textContent = 'Approve Payment';
    }
}

// === PAYMENT MODAL LOGIC ===

function openPaymentModal(id) {
    const app = pendingApps.find(a => a.id == id);
    if (!app) return;

    document.getElementById('payAppId').value = app.id;
    document.getElementById('dispAppId').textContent = app.id;
    document.getElementById('dispPayer').textContent = `${app.first_name} ${app.last_name}`;

    // Set Amounts
    document.getElementById('amountDue').value = app.amount_due || '0.00';
    document.getElementById('amountPaid').value = '';
    document.getElementById('change').value = '0.00';
    document.getElementById('balance').value = '0.00';

    // Reset Form Fields
    document.getElementById('refNumber').value = '';
    document.getElementById('proofFile').value = '';

    // Set Default Date to Today
    document.getElementById('paymentDate').valueAsDate = new Date();

    // Default Method
    document.getElementById('paymentMethod').value = 'Cash';
    toggleReferenceInput(); // Ensure correct label

    openModal('paymentModal');
}

// Toggle Label based on Method (Requirement: Cash(OR#), GCash(Ref#), Landbank(OR#))
function toggleReferenceInput() {
    const method = document.getElementById('paymentMethod').value;
    const label = document.getElementById('refLabel');
    const input = document.getElementById('refNumber');

    if (method === 'GCash') {
        label.textContent = 'Reference Number (Ref#) *';
        input.placeholder = "e.g., 901230xxxxx";
    } else if (method === 'Landbank') {
        label.textContent = 'Transaction / OR Number *';
        input.placeholder = "e.g., LBP-2023-xxxx";
    } else {
        label.textContent = 'Official Receipt (OR) No. *';
        input.placeholder = "e.g., OR-2023-001";
    }
}

// Auto-calculate Change AND Balance (Requirement: Add Balance instead of only Change)
document.getElementById('amountPaid').addEventListener('input', function () {
    const due = parseFloat(document.getElementById('amountDue').value) || 0;
    const paid = parseFloat(this.value) || 0;

    if (paid >= due) {
        // Full Payment or Overpayment
        const change = paid - due;
        document.getElementById('change').value = change.toFixed(2);
        document.getElementById('balance').value = '0.00';
    } else {
        // Partial Payment
        const balance = due - paid;
        document.getElementById('change').value = '0.00';
        document.getElementById('balance').value = balance.toFixed(2);
    }
});

function submitPayment(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('paymentForm'));
    formData.append('action', 'process_payment');

    // Validation
    const balance = parseFloat(document.getElementById('balance').value);

    // Note: If you want to ALLOW partial payment (Balance > 0), remove the blocking alert.
    // If strict full payment is required, uncomment below:
    /*
    if (balance > 0) {
        if(!confirm("Amount tendered is less than due. Proceed with partial payment?")) return;
    }
    */

    fetch(API_URL, {
        method: 'POST',
        body: formData // FormData handles file uploads automatically
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal('paymentModal');
                alert('Payment Successful!');
                loadPendingTable();
                // generateReceipt(data.id); // Optional auto-print
            } else {
                alert('Error: ' + data.message);
            }
        });
}

// === PENALTY MODAL LOGIC ===
function openPenaltyModal() {
    openModal('penaltyModal');
}

function submitPenalty(event) {
    event.preventDefault();
    // Logic to submit penalty would go here
    alert("Penalty Processed (Demo Only)");
    closeModal('penaltyModal');
}

// === GENERIC FUNCTIONS ===

function generateReceipt(id) {
    let app = paidApps.find(a => a.id == id);
    if (!app) {
        // Fetch specific if not in list
        fetch(`${API_URL}?action=fetch_one&id=${id}`)
            .then(res => res.json())
            .then(data => { if (data.status === 'success') printReceiptWindow(data.data); });
    } else {
        printReceiptWindow(app);
    }
}

function printReceiptWindow(app) {
    const receiptWindow = window.open('', 'PRINT', 'height=600,width=400');
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Receipt - ${app.or_number}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px;}
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; text-align: left; }
                .total { border-top: 2px dashed #000; padding-top: 10px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h3>OFFICIAL RECEIPT</h3>
                <p>OR/Ref: ${app.or_number}</p>
                <p>Date: ${app.payment_date}</p>
            </div>
            <div class="details">
                <div class="row"><span>Payer:</span> <span>${app.first_name} ${app.last_name}</span></div>
                <div class="row"><span>Method:</span> <span>${app.payment_method}</span></div>
                <div class="row"><span>Nature:</span> <span>${app.nature_of_business || 'Business Tax'}</span></div>
            </div>
            <div class="total">
                <div class="row"><span>TOTAL PAID:</span> <span>PHP ${parseFloat(app.amount_paid).toFixed(2)}</span></div>
            </div>
            <p style="margin-top:20px; font-size:12px;">Thank you for your payment.</p>
        </body>
        </html>
    `);
    receiptWindow.document.close();
    setTimeout(() => { receiptWindow.print(); receiptWindow.close(); }, 500);
}

function viewSummary(id, source) {
    let app;
    if (source === 'pending') app = pendingApps.find(a => a.id == id);
    else app = paidApps.find(a => a.id == id);

    const modalBody = document.getElementById('summaryBody');
    modalBody.innerHTML = `
        <div class="summary-card">
            <p><strong>ID:</strong> ${app.id}</p>
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Business:</strong> ${app.business_name || 'N/A'}</p>
            <p><strong>Status:</strong> ${app.status}</p>
            <p><strong>Assessment:</strong> ₱${app.amount_due || 0}</p>
        </div>
    `;
    openModal('detailsModal');
}
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    if (!container) return;

    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`; // Assumes you have CSS classes like .alert-success, .alert-error
    alertBox.innerHTML = `
        <strong>${type.toUpperCase()}!</strong> ${message}
        <button class="close-alert" onclick="this.parentElement.remove()">&times;</button>
    `;

    // Clear old alerts and append the new one
    container.innerHTML = '';
    container.appendChild(alertBox);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertBox.remove();
    }, 5000);
}

// Helpers
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function filterTable(tableId, inputId) {
    const filter = document.getElementById(inputId).value.toUpperCase();
    const rows = document.getElementById(tableId).getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        const txtValue = rows[i].textContent || rows[i].innerText;
        rows[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

window.onload = function () { loadPendingTable(); };