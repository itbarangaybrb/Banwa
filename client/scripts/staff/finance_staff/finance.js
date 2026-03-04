// Configuration
const API_URL = '/Banwa/server/handlers/staff/finance/finance_handler.php';

let pendingApps = [];
let paidApps = [];
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
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab && activeTab.id === 'pending') loadPendingTable();
        if (activeTab && activeTab.id === 'history') loadHistoryTable();
    } catch (err) {
        console.warn('Error handling staffMapFilterChanged in finance:', err);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const navLogo = document.querySelector('.nav_logo');
    const sideNav = document.querySelector('.side_nav');

    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
        });
    }
});

function switchTab(event, tabName) {
    if (event) event.preventDefault();

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabName);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav_select').forEach(link => link.classList.remove('active'));

    if (event) {
        const clickedLink = event.target.closest('.nav_select');
        if (clickedLink) clickedLink.classList.add('active');
    }

    if (tabName === 'pending') loadPendingTable();
    else if (tabName === 'history') loadHistoryTable();
}

// FIXED: Now returns promises so .finally() works
function loadPendingTable() {
    return fetch(`${API_URL}?action=fetch_pending`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('pendingTableBody');
            tbody.innerHTML = '';
            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#999;">Hidden by map filters.</td></tr>';
                return;
            }
            if (data.status === 'success') {
                pendingApps = data.data;
                if (pendingApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No applications found.</td></tr>';
                    return;
                }
                pendingApps.forEach(app => {
                    const name = app.first_name + ' ' + app.last_name;
                    let actionButton;
                    let paymentStatusDisplay = app.payment_status || 'N/A';

                    if (app.payment_status === 'Pending Verification') {
                        actionButton = '<button class="btn btn-verify" onclick="openVerificationModal(' + app.id + ')"><i class="fas fa-check-circle"></i> Verify</button>';
                    } else {
                        actionButton = '<button class="btn btn-process" onclick="openPaymentModal(' + app.id + ', ' + app.amount_due + ')"><i class="fas fa-credit-card"></i> Process</button>';
                    }

                    const row = '<tr><td>' + app.id + '</td><td>' + (app.application_type || 'Business') + '</td><td>' + name + '</td><td>' + (app.business_name || 'N/A') + '</td><td>PHP ' + parseFloat(app.amount_due || 0).toFixed(2) + '</td><td>' + app.status + ' / ' + paymentStatusDisplay + '</td><td>' + actionButton + '<button class="btn btn-view" onclick="viewSummary(' + app.id + ', \'pending\')"><i class="fas fa-eye"></i> View</button></td></tr>';

                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Error: ' + data.message + '</td></tr>';
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            document.getElementById('pendingTableBody').innerHTML = '<tr><td colspan="7" style="color:red;">Network Error</td></tr>';
        });
}

// FIXED: Now returns promises so .finally() works
function loadHistoryTable() {
    return fetch(`${API_URL}?action=fetch_history`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';
            if (!mapFilterVisible) {
                tbody.innerHTML = '<tr><td colspan="7">Hidden by filters</td></tr>';
                return;
            }
            if (data.status === 'success') {
                paidApps = data.data;
                if (paidApps.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7">No history found</td></tr>';
                    return;
                }
                paidApps.forEach(app => {
                    const name = app.first_name + ' ' + app.last_name;
                    const row = '<tr><td>' + app.or_number + '</td><td>' + (app.application_type || 'Business') + '</td><td>' + app.id + '</td><td>' + name + '</td><td>PHP ' + parseFloat(app.amount_paid).toFixed(2) + '</td><td>' + app.payment_date + '</td><td><button class="btn btn-view" onclick="viewSummary(' + app.id + ', \'paid\')"><i class="fas fa-eye"></i> View</button><button class="btn btn-receipt" onclick="generateReceipt(' + app.id + ')"><i class="fas fa-receipt"></i> Receipt</button></td></tr>';
                    tbody.innerHTML += row;
                });
            }
        });
}

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

function openVerificationModal(appId) {
    const app = pendingApps.find(a => a.id == appId);
    if (!app) return;

    const proofFile = app.requirement_upload_json && Array.isArray(app.requirement_upload_json) ? app.requirement_upload_json[0] : app.requirement_upload;
    const proofLink = proofFile ? '<a href="' + proofFile + '" target="_blank">View Proof</a>' : '<p style="color:red;">No proof</p>';

    const html = '<div><p><strong>Applicant:</strong> ' + app.first_name + ' ' + app.last_name + '</p><p><strong>Amount:</strong> PHP ' + parseFloat(app.amount_due).toFixed(2) + '</p><p><strong>Status:</strong> ' + app.payment_status + '</p><hr><p><strong>Proof:</strong></p>' + proofLink + '</div>';

    Swal.fire({
        title: 'Verify Payment',
        html: html,
        icon: 'question',
        showDenyButton: true,
        confirmButtonText: 'Approve',
        denyButtonText: 'Reject',
        confirmButtonColor: '#28a745',
        denyButtonColor: '#dc3545',
        background: '#f8f9fa',
        color: '#333',
        width: '600px'
    }).then(result => {
        if (result.isConfirmed) {
            submitVerification(appId, 'Approved');
        } else if (result.isDenied) {
            submitVerification(appId, 'Rejected');
        }
    });
}

function submitVerification(appId, status) {
    const formData = new FormData();
    formData.append('action', 'verify_payment');
    formData.append('id', appId);
    formData.append('verification_action', status);
    formData.append('type', 'business');

    Swal.fire({
        title: 'Processing...',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
    });

    fetch(API_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Payment ' + status.toLowerCase(),
                    confirmButtonColor: '#00247c',
                    background: '#f8f9fa',
                    color: '#333'
                }).then(() => loadPendingTable());
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Network error', 'error');
        });
}

function openPaymentModal(appId, amountDue) {
    const app = pendingApps.find(a => a.id == appId);
    if (!app) return;

    const html = '<form style="text-align:left;"><div class="form-group"><label>Amount Due</label><input type="text" value="' + parseFloat(amountDue).toFixed(2) + '" disabled style="width:100%; padding:10px;"></div><div class="form-group"><label>Amount Paid *</label><input type="number" id="amountPaid" required style="width:100%; padding:10px;" step="0.01" min="0"></div><div class="form-group"><label>Payment Method *</label><select id="paymentMethod" required style="width:100%; padding:10px;" onchange="updateRefLabel()"><option>Select</option><option>Cash</option><option>GCash</option><option>Landbank</option></select></div><div class="form-group"><label id="refLabel">OR Number *</label><input type="text" id="refNumber" required style="width:100%; padding:10px;"></div><div class="form-group"><label>Date</label><input type="date" id="paymentDate" style="width:100%; padding:10px;"></div></form>';

    Swal.fire({
        title: 'Process Payment',
        html: html,
        icon: 'question',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        background: '#f8f9fa',
        color: '#333',
        width: '600px',
        showCancelButton: true,
        preConfirm: () => {
            const amountPaid = document.getElementById('amountPaid').value;
            const method = document.getElementById('paymentMethod').value;
            const refNumber = document.getElementById('refNumber').value;

            if (!amountPaid || !method || !refNumber) {
                Swal.showValidationMessage('Fill all fields');
                return false;
            }

            return { amountPaid, method, refNumber, appId };
        }
    }).then(result => {
        if (result.isConfirmed) {
            submitPayment(result.value, amountDue);
        }
    });

    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paymentDate').value = today;
    }, 100);
}

function updateRefLabel() {
    const method = document.getElementById('paymentMethod').value;
    const label = document.getElementById('refLabel');

    if (method === 'GCash') {
        label.textContent = 'Reference Number *';
    } else if (method === 'Landbank') {
        label.textContent = 'Transaction Number *';
    } else {
        label.textContent = 'OR Number *';
    }
}

function submitPayment(paymentData, amountDue) {
    const formData = new FormData();
    formData.append('action', 'process_payment');
    formData.append('id', paymentData.appId);
    formData.append('type', 'business');
    formData.append('amountDue', amountDue);
    formData.append('amountPaid', paymentData.amountPaid);
    formData.append('paymentMethod', paymentData.method);
    formData.append('orNumber', paymentData.refNumber);

    Swal.fire({
        title: 'Processing...',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    fetch(API_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Payment processed',
                    confirmButtonColor: '#00247c'
                }).then(() => loadPendingTable());
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(err => Swal.fire('Error', 'Network error', 'error'));
}

function generateReceipt(id) {
    let app = paidApps.find(a => a.id == id);
    if (!app) {
        fetch(API_URL + '?action=fetch_one&id=' + id + '&type=business')
            .then(res => res.json())
            .then(data => { 
                if (data.status === 'success') showReceiptModal(data.data);
            });
    } else {
        showReceiptModal(app);
    }
}

function showReceiptModal(app) {
    const html = '<div style="border:2px solid #00247c; border-radius:8px; padding:20px;"><h3 style="color:#00247c;">OFFICIAL RECEIPT</h3><p>OR: ' + (app.or_number || 'N/A') + '</p><hr><p><strong>Payer:</strong> ' + app.first_name + ' ' + app.last_name + '</p><p><strong>Amount:</strong> PHP ' + parseFloat(app.amount_paid).toFixed(2) + '</p><p><strong>Date:</strong> ' + app.payment_date + '</p><p><strong>Method:</strong> ' + app.payment_method + '</p></div>';

    Swal.fire({
        title: 'Receipt',
        html: html,
        icon: 'success',
        confirmButtonText: 'Close',
        confirmButtonColor: '#00247c',
        showCancelButton: true,
        cancelButtonText: 'Print',
        cancelButtonColor: '#6c757d',
        background: '#f8f9fa',
        color: '#333',
        width: '600px'
    }).then(result => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
            printReceiptWindow(app);
        }
    });
}

function printReceiptWindow(app) {
    const w = window.open('', 'PRINT', 'height=600,width=400');
    w.document.write(`
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
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
}

function viewSummary(id, source) {
    let app;
    if (source === 'pending') app = pendingApps.find(a => a.id == id);
    else app = paidApps.find(a => a.id == id);

    if (!app) return;

    const html = '<div style="text-align:left;"><p><strong>ID:</strong> ' + app.id + '</p><p><strong>Owner:</strong> ' + app.first_name + ' ' + app.last_name + '</p><p><strong>Business:</strong> ' + (app.business_name || 'N/A') + '</p><p><strong>Assessment:</strong> PHP ' + parseFloat(app.amount_due || 0).toFixed(2) + '</p><hr><p><strong>Amount Paid:</strong> PHP ' + parseFloat(app.amount_paid || 0).toFixed(2) + '</p></div>';

    Swal.fire({
        title: 'Details',
        html: html,
        icon: 'info',
        confirmButtonText: 'Close',
        confirmButtonColor: '#00247c',
        background: '#f8f9fa',
        color: '#333',
        width: '600px'
    });
}

function openPenaltyModal() {
    const html = '<form style="text-align:left;"><div><label>Year *</label><input type="number" id="penaltyYear" required style="width:100%;padding:10px;" min="2000" value="' + new Date().getFullYear() + '"></div><div style="margin-top:10px;"><label>Amount *</label><input type="number" id="penaltyAmount" required style="width:100%;padding:10px;" step="0.01" min="0"></div><div style="margin-top:10px;"><label>Description</label><textarea id="penaltyDesc" style="width:100%;padding:10px;font-family:inherit;" rows="3"></textarea></div></form>';

    Swal.fire({
        title: 'Process Penalty',
        html: html,
        icon: 'warning',
        confirmButtonText: 'Process',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        background: '#f8f9fa',
        color: '#333',
        width: '600px',
        showCancelButton: true,
        preConfirm: () => {
            const year = document.getElementById('penaltyYear').value;
            const amount = document.getElementById('penaltyAmount').value;
            if (!year || !amount) {
                Swal.showValidationMessage('Fill required fields');
                return false;
            }
            return { year, amount };
        }
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Done',
                text: 'Penalty for ' + result.value.year + ' recorded',
                confirmButtonColor: '#00247c'
            });
        }
    });
}

function filterTable(tableId, inputId) {
    const filter = document.getElementById(inputId).value.toUpperCase();
    const rows = document.getElementById(tableId).getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        const txt = rows[i].textContent || rows[i].innerText;
        rows[i].style.display = txt.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
    }
}

window.onload = function() { loadPendingTable(); };