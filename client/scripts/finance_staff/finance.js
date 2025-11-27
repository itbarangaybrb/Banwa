// Configuration
const API_URL = '../../scripts/finance_staff/finance_handler.php';

let pendingApps = [];
let paidApps = [];

// ===================================
// TAB SWITCHING
// ===================================
function switchTab(event, tabName) {
    event.preventDefault();
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'pending') loadPendingTable();
    else if (tabName === 'history') loadHistoryTable();
}

// ===================================
// LOAD TABLES
// ===================================
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

// ===================================
// PAYMENT MODAL LOGIC
// ===================================
function openPaymentModal(id) {
    const app = pendingApps.find(a => a.id == id);
    if (!app) return;

    document.getElementById('payAppId').value = app.id;
    document.getElementById('dispAppId').textContent = app.id;
    document.getElementById('dispPayer').textContent = `${app.first_name} ${app.last_name}`;
    document.getElementById('dispType').textContent = app.type_of_business;
    
    // Default assessment amount (can be edited if logic requires)
    document.getElementById('amountDue').value = app.amount_due || '0.00';
    document.getElementById('amountPaid').value = '';
    document.getElementById('change').value = '0.00';
    document.getElementById('orNumber').value = '';
    
    openModal('paymentModal');
}

// Auto-calculate change
document.getElementById('amountPaid').addEventListener('input', function() {
    const due = parseFloat(document.getElementById('amountDue').value) || 0;
    const paid = parseFloat(this.value) || 0;
    const change = paid - due;
    document.getElementById('change').value = change.toFixed(2);
});

function submitPayment(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('paymentForm'));
    formData.append('action', 'process_payment');

    // Validation: Check if paid amount is enough
    const due = parseFloat(formData.get('amountDue'));
    const paid = parseFloat(formData.get('amountPaid'));
    if (paid < due) {
        alert("Amount tendered is less than amount due!");
        return;
    }

    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal('paymentModal');
            alert('Payment Successful! Status changed to Paid.');
            loadPendingTable();
            // Optional: Auto generate receipt
             generateReceipt(data.id);
        } else {
            alert('Error: ' + data.message);
        }
    });
}

// ===================================
// GENERATE RECEIPT
// ===================================
function generateReceipt(id) {
    // Find in paidApps first, if not try fetching fresh
    let app = paidApps.find(a => a.id == id);
    
    // If we just paid, it might not be in the loaded 'paidApps' array yet
    if (!app) {
        fetch(`${API_URL}?action=fetch_one&id=${id}`)
            .then(res => res.json())
            .then(data => {
                if(data.status === 'success') printReceiptWindow(data.data);
            });
    } else {
        printReceiptWindow(app);
    }
}

function printReceiptWindow(app) {
    const receiptWindow = window.open('', 'PRINT', 'height=600,width=400');
    
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Official Receipt - ${app.or_number}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                .header { margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                .details { text-align: left; margin: 20px 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin-top: 10px; font-weight: bold; }
                .footer { margin-top: 30px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>MUNICIPAL TREASURER'S OFFICE</h2>
                <p>OFFICIAL RECEIPT</p>
                <p><strong>OR No: ${app.or_number}</strong></p>
            </div>
            <div class="details">
                <div class="row"><span>Date:</span> <span>${app.payment_date}</span></div>
                <div class="row"><span>Payer:</span> <span>${app.first_name} ${app.last_name}</span></div>
                <div class="row"><span>App ID:</span> <span>${app.id}</span></div>
                <div class="row"><span>Nature:</span> <span>${app.nature_of_business}</span></div>
                <div class="row"><span>Payment Method:</span> <span>${app.payment_method}</span></div>
            </div>
            <div class="total">
                <div class="row"><span>AMOUNT PAID:</span> <span>PHP ${parseFloat(app.amount_paid).toFixed(2)}</span></div>
            </div>
            <div class="footer">
                <p>Received by: Finance Officer</p>
                <p>Thank you for your payment!</p>
            </div>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => { receiptWindow.print(); receiptWindow.close(); }, 500);
}

// ===================================
// VIEW SUMMARY (Reused Logic)
// ===================================
function viewSummary(id, source) {
    let app;
    if (source === 'pending') app = pendingApps.find(a => a.id == id);
    else app = paidApps.find(a => a.id == id);

    const modalBody = document.getElementById('summaryBody');
    modalBody.innerHTML = `
        <div class="summary-card">
            <h3>📂 Application Details</h3>
            <p><strong>ID:</strong> ${app.id}</p>
            <p><strong>Business:</strong> ${app.business_name}</p>
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Address:</strong> ${app.address_of_business}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></p>
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

// Init
window.onload = function() { loadPendingTable(); };