// Configuration
const API_URL = '/Banwa/server/handlers/staff/finance/finance_handler.php';

let pendingApps = [];
let paidApps = [];

const banwaFinanceSwal = Swal;

// Safe helper functions (use these everywhere in this file)
const financeSuccess = (title, text = '') => {
    banwaFinanceSwal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonColor: '#28a745'
    });
};

const financeError = (title, text = '') => {
    banwaFinanceSwal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#dc3545'
    });
};

const financeConfirm = async (title, text) => {
    const result = await banwaFinanceSwal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    });
    return result.isConfirmed;
};

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

function loadPendingTable() {
    fetch(`${API_URL}?action=fetch_pending`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('pendingTableBody');
            tbody.innerHTML = '';

            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Hidden by map filters.</td></tr>';
                return;
            }

            if (data.status === 'success') {
                pendingApps = data.data || [];
                if (!pendingApps.length) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No applications for payment or verification.</td></tr>';
                    return;
                }

                pendingApps.forEach(app => {
                    const typeLabel = app.application_type === 'construction' ? '🛠️ Construction' : '🏢 Business';
                    const displayBusiness = app.business_name || 'Construction Application';
                    const payer = `${app.first_name} ${app.last_name}`;

                    const actionButton = (app.payment_status === 'Pending Verification')
                        ? `<button class="btn-success" onclick="openVerificationModal(${app.id}, '${app.application_type}')">Verify Payment</button>`
                        : `<button class="btn-primary" onclick="openPaymentModal(${app.id}, '${app.application_type}')">Process Payment</button>`;

                    const row = `<tr>
                        <td>${app.id}</td>
                        <td><strong>${typeLabel}</strong></td>
                        <td>${payer}</td>
                        <td>${displayBusiness}</td>
                        <td>₱${parseFloat(app.amount_due || 0).toFixed(2)}</td>
                        <td>${app.status} / ${app.payment_status || 'N/A'}</td>
                        <td>${actionButton} <button class="btn-info" onclick="viewSummary(${app.id}, 'pending', '${app.application_type}')">View Details</button></td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        })
        .catch(() => document.getElementById('pendingTableBody').innerHTML = '<tr><td colspan="7" style="color:red;text-align:center;">Network Error</td></tr>');
}

function loadHistoryTable() {
    fetch(`${API_URL}?action=fetch_history`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';

            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Hidden by map filters.</td></tr>';
                return;
            }

            if (data.status === 'success') {
                paidApps = data.data || [];
                if (!paidApps.length) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No payment history found.</td></tr>';
                    return;
                }

                paidApps.forEach(app => {
                    const typeLabel = app.application_type === 'construction' ? '🛠️ Construction' : '🏢 Business';
                    const payer = `${app.first_name} ${app.last_name}`;

                    const row = `<tr>
                        <td><strong>${app.or_number || 'N/A'}</strong></td>
                        <td><strong>${typeLabel}</strong></td>
                        <td>${app.id}</td>
                        <td>${payer}</td>
                        <td>₱${parseFloat(app.amount_paid || 0).toFixed(2)}</td>
                        <td>${app.payment_date || 'N/A'}</td>
                        <td>
                            <button class="btn-info" onclick="viewSummary(${app.id}, 'paid', '${app.application_type || 'business'}')">View</button>
                            <button class="btn-secondary" onclick="generateReceipt(${app.id}, '${app.application_type || 'business'}')">Receipt</button>
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
function openVerificationModal(id, type = 'business') {
    currentAppType = type;
    const app = pendingApps.find(a => a.id == id);
    if (!app) return;

    const modalBody = document.getElementById('verificationBody');
    const proofFile = app.requirement_upload || '';
    const proofLink = proofFile 
        ? `<a href="../../../server/${proofFile}" target="_blank" class="btn-info">View Proof of Payment</a>` 
        : `<p style="color:red;">No proof uploaded.</p>`;

    modalBody.innerHTML = `
        <h3>Verify Payment — ID: ${app.id} (${app.application_type || 'Business'})</h3>
        <div class="summary-card">
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Business/Project:</strong> ${app.business_name || 'Construction Application'}</p>
            <p><strong>Amount Due:</strong> ₱${parseFloat(app.amount_due || 0).toFixed(2)}</p>
        </div>
        <hr>
        ${proofLink}
        <div style="margin-top:20px;">
            <button class="btn-success" onclick="verifyPayment(${app.id}, 'Approved')">✅ Approve Payment</button>
            <button class="btn-warning" onclick="verifyPayment(${app.id}, 'Rejected')">❌ Reject Payment</button>
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
    if (!await financeConfirm(`Set payment to ${action}?`, `Application ID ${id}`)) return;

    const body = new URLSearchParams({ action: 'verify_payment', id, verification_action: action, type: currentAppType });

    try {
        const res = await fetch(API_URL, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body });
        const result = await res.json();
        if (result.status === 'success') {
            financeSuccess('Success!', `Payment ${action} successfully!`);
            closeModal('verificationModal');
            loadPendingTable();
        } else throw new Error(result.message);
    } catch (e) {
        financeError('Error', e.message);
    }
}

let currentAppType = 'business';

function openPaymentModal(id, type = 'business') {
    currentAppType = type;
    const app = pendingApps.find(a => a.id == id);
    if (!app) return;

    document.getElementById('payAppId').value = app.id;
    document.getElementById('dispAppId').textContent = app.id;
    document.getElementById('dispPayer').textContent = `${app.first_name} ${app.last_name}`;

    document.getElementById('amountDue').value = app.amount_due || '0.00';
    document.getElementById('amountPaid').value = '';
    document.getElementById('change').value = '0.00';
    document.getElementById('balance').value = '0.00';
    document.getElementById('refNumber').value = '';
    document.getElementById('proofFile').value = '';
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentMethod').value = 'Cash';
    toggleReferenceInput();

    openModal('paymentModal');
}

// Toggle Label based on Method (Requirement: Cash(OR#), GCash(Ref#), Landbank(OR#))
function toggleReferenceInput() {
    const method = document.getElementById('paymentMethod').value;
    document.getElementById('refLabel').textContent = method === 'GCash' ? 'Reference Number (Ref#) *' : 'Official Receipt (OR) No. *';
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

// function submitPayment(event) {
//     event.preventDefault();
//     const formData = new FormData(document.getElementById('paymentForm'));
//     formData.append('action', 'process_payment');

//     // Validation
//     const balance = parseFloat(document.getElementById('balance').value);

//     // Note: If you want to ALLOW partial payment (Balance > 0), remove the blocking alert.
//     // If strict full payment is required, uncomment below:
//     /*
//     if (balance > 0) {
//         if(!confirm("Amount tendered is less than due. Proceed with partial payment?")) return;
//     }
//     */

//     fetch(API_URL, {
//         method: 'POST',
//         body: formData // FormData handles file uploads automatically
//     })
//         .then(res => res.json())
//     .then(data => {
//         if (data.status === 'success') {
//             closeModal('paymentModal');
//             financeSuccess('Payment Successful!', 'The transaction has been recorded.');
//             loadPendingTable();
//         } else {
//             financeError('Payment Failed', data.message || 'Unknown error occurred.');
//         }
//     });
// }

function submitPayment(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('paymentForm'));
    formData.append('action', 'process_payment');
    formData.append('type', currentAppType);   // ← This makes construction work

    fetch(API_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal('paymentModal');
                financeSuccess('Payment Successful!');
                loadPendingTable();
            } else financeError('Payment Failed', data.message);
        });
}

// === PENALTY MODAL LOGIC ===
function openPenaltyModal() {
    openModal('penaltyModal');
}

function submitPenalty(event) {
    event.preventDefault();
    // Logic to submit penalty would go here
    financeSuccess('Penalty Processed!', '(Demo Only - Backend integration coming soon)');
    closeModal('penaltyModal');
}

// === GENERIC FUNCTIONS ===

function generateReceipt(id, type = 'business') {
    const app = paidApps.find(a => a.id == id);
    if (app) printReceiptWindow(app);
}

function printReceiptWindow(app) {
    const isConstruction = app.application_type === 'construction';
    const receiptWindow = window.open('', 'PRINT', 'height=700,width=420');
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Official Receipt #${app.or_number || app.id}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 30px; background: #fff; color: #000; line-height: 1.4; }
                .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header h2 { font-size: 18px; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                td { padding: 6px 0; }
                .label { text-align: left; }
                .value { text-align: right; font-weight: bold; }
                .total { border-top: 2px solid #000; font-size: 1.1em; }
                .thankyou { text-align: center; margin-top: 30px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>BANWA MUNICIPALITY</h2>
                <p>OFFICIAL RECEIPT</p>
                <p>OR / Ref No.: ${app.or_number || 'N/A'}</p>
                <p>Date: ${app.payment_date || new Date().toLocaleString()}</p>
            </div>

            <p><strong>Payer:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Type:</strong> ${isConstruction ? 'Construction Permit' : 'Business Application'}</p>
            <p><strong>${isConstruction ? 'Project' : 'Business'}:</strong> ${app.business_name || 'N/A'}</p>

            <table>
                <tr><td class="label">Amount Due</td><td class="value">₱${parseFloat(app.amount_due || 0).toFixed(2)}</td></tr>
                <tr><td class="label">Amount Paid</td><td class="value">₱${parseFloat(app.amount_paid || 0).toFixed(2)}</td></tr>
                ${parseFloat(app.amount_paid || 0) > parseFloat(app.amount_due || 0) ? `
                <tr><td class="label">Change</td><td class="value">₱${(parseFloat(app.amount_paid) - parseFloat(app.amount_due)).toFixed(2)}</td></tr>` : ''}
            </table>

            <div class="total">
                <table>
                    <tr><td class="label"><strong>TOTAL PAID</strong></td><td class="value"><strong>₱${parseFloat(app.amount_paid || 0).toFixed(2)}</strong></td></tr>
                </table>
            </div>

            <div class="thankyou">
                Thank you for your payment!<br>
                This is an official receipt.<br>
                BANWA - Finance & Collection
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
    setTimeout(() => { receiptWindow.print(); receiptWindow.close(); }, 600);
}

function viewSummary(id, source, type = 'business') {
    const app = source === 'pending' 
        ? pendingApps.find(a => a.id == id) 
        : paidApps.find(a => a.id == id);
    if (!app) return;

    const modalBody = document.getElementById('summaryBody');
    const isConstruction = app.application_type === 'construction';

    modalBody.innerHTML = `
        <div class="summary-card">
            <h3 style="color:var(--primary);margin-bottom:15px;">${isConstruction ? '🛠️ Construction Permit' : '🏢 Business Application'}</h3>
            
            <p><strong>ID:</strong> ${app.id}</p>
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>${isConstruction ? 'Project' : 'Business'} Name:</strong> ${app.business_name || 'N/A'}</p>
            <p><strong>Status:</strong> ${app.status}</p>
            <p><strong>Payment Status:</strong> ${app.payment_status || 'N/A'}</p>
            
            <hr style="margin:15px 0;border-color:#ddd;">
            
            <p><strong>Amount Due:</strong> ₱${parseFloat(app.amount_due || 0).toFixed(2)}</p>
            ${app.amount_paid ? `<p><strong>Amount Paid:</strong> ₱${parseFloat(app.amount_paid).toFixed(2)}</p>` : ''}
            ${app.payment_method ? `<p><strong>Payment Method:</strong> ${app.payment_method}</p>` : ''}
            ${app.or_number ? `<p><strong>OR / Ref Number:</strong> ${app.or_number}</p>` : ''}
            ${app.payment_date ? `<p><strong>Date Paid:</strong> ${app.payment_date}</p>` : ''}
            
            ${app.requirement_upload ? `
            <p style="margin-top:15px;">
                <strong>Uploaded Proof:</strong> 
                <a href="../../../server/${app.requirement_upload}" target="_blank" style="color:var(--primary);text-decoration:underline;">View File</a>
            </p>` : ''}
        </div>
        
        <div style="text-align:center;margin-top:20px;">
            <button onclick="closeModal('detailsModal')" class="btn-secondary">Close</button>
        </div>
    `;
    openModal('detailsModal');
}

// Helpers
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function filterTable(tableId, inputId) {
    const filter = document.getElementById(inputId).value.toUpperCase();
    const rows = document.getElementById(tableId).getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        rows[i].style.display = rows[i].textContent.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

window.onload = () => loadPendingTable();