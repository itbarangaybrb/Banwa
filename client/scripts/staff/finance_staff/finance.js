// Configuration
const API_URL = '../../../scripts/staff/finance_staff/finance_handler.php';

let pendingApps = [];
let paidApps = [];

// TAB SWITCHING
function switchTab(event, tabName) {
    event.preventDefault();
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

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
            if (data.status === 'success') {
                pendingApps = data.data;
                if (pendingApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No applications for payment.</td></tr>';
                    return;
                }
                pendingApps.forEach(app => {
                    const name = `${app.first_name} ${app.last_name}`;
                    const row = `<tr>
                        <td>${app.id}</td>
                        <td>${name}</td>
                        <td>${app.type_of_business}</td>
                        <td>₱${parseFloat(app.amount_due || 0).toFixed(2)}</td>
                        <td><span class="status-badge status-pending">For Payment</span></td>
                        <td>
                            <button class="btn-info" onclick="viewSummary(${app.id}, 'pending')">👁️ View</button>
                            <button class="btn-success" onclick="openPaymentModal(${app.id})">💰 Process</button>
                        </td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        });
}

function loadHistoryTable() {
    fetch(`${API_URL}?action=fetch_history`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';
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
                            <button class="btn-info" onclick="viewSummary(${app.id}, 'paid')">👁️ View</button>
                            <button class="btn-secondary" onclick="generateReceipt(${app.id})">🖨️ Receipt</button>
                        </td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        });
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
document.getElementById('amountPaid').addEventListener('input', function() {
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
            .then(data => { if(data.status === 'success') printReceiptWindow(data.data); });
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

window.onload = function() { loadPendingTable(); };