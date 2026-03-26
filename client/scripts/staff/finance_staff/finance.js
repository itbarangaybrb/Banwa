// Configuration
import { initSocket, sockets } from '../../utils/socket.js';

const API_URL = '/server/handlers/staff/finance/finance_handler.php';

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    /* Universal Popup Spacing */
    .swal2-popup {
        padding: 2rem 1.5rem !important; 
        border-radius: 15px !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Consistent Icon Margins for Success/Error/Warning */
    .swal2-icon {
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        border-width: 4px !important;
    }

    /* Standardized Titles */
    .swal2-title {
        color: #00247C !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        margin: 0.5rem 0 !important;
        padding: 0 !important;
    }

    /* Standardized Text Content */
    .swal2-html-container {
        margin: 1rem 0 !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }

    /* Button Spacing */
    .swal2-actions {
        margin-top: 1.5rem !important;
        margin-bottom: 0.5rem !important;
    }
`;
document.head.appendChild(swalStyle);

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
        if (activeTab && activeTab.id === 'dashboard') loadAnalyticsTab();
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

    if (tabName === 'dashboard') {
        loadAnalyticsTab();
    } else if (tabName === 'pending') {
        loadPendingTable();
    } else if (tabName === 'history') {
        loadHistoryTable();
    } else if (tabName === 'audits') {
        fetchAuditLogs();
    }
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
                    const appType = app.application_type || 'business';

                    if (app.payment_status === 'Pending Verification') {
                        actionButton = '<button class="btn btn-verify" onclick="openVerificationModal(' + app.id + ', \'' + appType + '\')">Verify</button>';
                    } else {
                        actionButton = '<button class="btn btn-process" onclick="openPaymentModal(' + app.id + ', ' + app.amount_due + ', \'' + appType + '\')">Process</button>';
                    }

                    const row = '<tr><td>' + app.id + '</td><td style="text-transform: capitalize;">' + appType + '</td><td>' + name + '</td><td>' + (app.business_name || 'N/A') + '</td><td>PHP ' + parseFloat(app.amount_due || 0).toFixed(2) + '</td><td>' + app.status + ' / ' + paymentStatusDisplay + '</td><td>' + actionButton + '<button class="btn btn-view" onclick="viewSummary(' + app.id + ', \'pending\', \'' + appType + '\')">View</button></td></tr>';

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
                    const appType = app.application_type || 'business';

                    // Format OR/Reference number - show '---' if null/empty
                    const orNumber = app.or_number && app.or_number.trim() !== '' ? app.or_number : '---';

                    const row = '<tr><td>' + orNumber + '</td><td style="text-transform: capitalize;">' + appType + '</td><td>' + app.id + '</td><td>' + name + '</td><td>PHP ' + parseFloat(app.amount_paid).toFixed(2) + '</td><td>' + app.payment_date + '</td><td><button class="btn btn-view" onclick="viewSummary(' + app.id + ', \'paid\', \'' + appType + '\')">View</button><button class="btn btn-receipt" onclick="generateReceipt(' + app.id + ', \'' + appType + '\')">Receipt</button></td></tr>';
                    tbody.innerHTML += row;
                });
            }
        });
}

let isRefreshing = false;
function refreshActiveTab() {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || isRefreshing) return;

    const activeTabId = activeTab.id;
    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    if (activeTabId === 'pending') {
        loadPendingTable().finally(finish);
    } else if (activeTabId === 'history') {
        loadHistoryTable().finally(finish);
    } else if (activeTabId === 'audits') {
        fetchAuditLogs().finally(finish);
    } else {
        finish();
    }
};

function openVerificationModal(appId, appType) {
    const app = pendingApps.find(a => a.id == appId && a.application_type === appType);
    if (!app) return;

    const proofFile = app.requirement_upload_json && Array.isArray(app.requirement_upload_json) ? app.requirement_upload_json[0] : app.requirement_upload;

    const paymentMethod = app.payment_method || '';

    // --- NEW PREVIEW LOGIC ---
    let proofPreview = '<p style="color:red;">No proof</p>';

    if (proofFile) {
        // Check file extension to determine how to display it
        const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(proofFile);
        const isPdf = /\.pdf$/i.test(proofFile);

        if (isImage) {
            proofPreview = `
                <div style="text-align: center;">
                    <img src="${proofFile}" alt="Proof of Payment" style="max-width: 100%; max-height: 350px; border-radius: 4px; border: 1px solid #ccc; object-fit: contain;">
                </div>
                <div style="text-align: center; margin-top: 5px;">
                    <a href="${proofFile}" target="_blank" style="font-size: 12px; color: #007bff;">Open in new tab</a>
                </div>`;
        } else if (isPdf) {
            proofPreview = `
                <iframe src="${proofFile}" style="width: 100%; height: 350px; border: 1px solid #ccc; border-radius: 4px;"></iframe>
                <div style="text-align: center; margin-top: 5px;">
                    <a href="${proofFile}" target="_blank" style="font-size: 12px; color: #007bff;">Open in new tab</a>
                </div>`;
        } else {
            // Fallback for unknown file types (e.g., .docx, .zip)
            proofPreview = `<a href="${proofFile}" target="_blank" style="display: inline-block; padding: 8px 12px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Download / View Proof File</a>`;
        }
    }
    // -------------------------

    // Only show OR number field if payment method is GCash/QR
    const showOrNumberField = paymentMethod === 'GCash/QR';

    const orNumberFieldHtml = showOrNumberField ? `
        <!-- OR NUMBER TEXT INPUT -->
        <div style="margin-top: 16px; background: #e9ecef; padding: 15px; border-radius: 8px;">
            <label for="orNumberInput" style="font-weight: bold; display: block; margin-bottom: 5px; color: #00247C;">Official Receipt (OR) Number *</label>
            <input type="text" id="orNumberInput" placeholder="Enter OR number" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: white; box-sizing: border-box;">
        </div>
    ` : '';

    const html = `
        <div style="text-align:left;">
            <p><strong>Applicant:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Amount:</strong> PHP ${parseFloat(app.amount_due).toFixed(2)}</p>
            <p><strong>Status:</strong> ${app.payment_status}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <hr>
            <p><strong>Resident's Proof:</strong></p>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                ${proofPreview}
            </div>
            
            ${orNumberFieldHtml}
            
            <hr>
            
            <!-- OR FILE UPLOAD - ALWAYS VISIBLE -->
            <div style="margin-top: 16px; background: #e9ecef; padding: 15px; border-radius: 8px;">
                <label for="orFileInput" style="font-weight: bold; display: block; margin-bottom: 5px; color: #00247C;">Upload Official Receipt (OR) File *</label>
                <input type="file" id="orFileInput" accept=".jpg,.jpeg,.png,.pdf" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: white; box-sizing: border-box;">
                <small style="display: block; margin-top: 5px; color: #666;">Upload a clear photo or scanned copy of the Official Receipt.</small>
            </div>
        </div>
    `;

    Swal.fire({
        title: 'Verify Payment',
        html: html,
        icon: 'info',
        showCloseButton: true,
        showDenyButton: true,
        confirmButtonText: 'Approve',
        denyButtonText: 'Reject',
        confirmButtonColor: '#28a745',
        denyButtonColor: '#dc3545',
        width: '600px',
        preConfirm: () => {
            const orFileInput = document.getElementById('orFileInput');

            if (!orFileInput || !orFileInput.files.length) {
                Swal.showValidationMessage('You must upload an Official Receipt file to approve.');
                return false;
            }

            // Only validate OR number if payment method is GCash/QR
            if (showOrNumberField) {
                const orNumber = document.getElementById('orNumberInput')?.value.trim();

                if (!orNumber) {
                    Swal.showValidationMessage('You must enter an Official Receipt number to approve.');
                    return false;
                }

                return {
                    orNumber: orNumber,
                    orFile: orFileInput.files[0]
                };
            }

            return {
                orFile: orFileInput.files[0]
            };
        }
    }).then(result => {
        if (result.isConfirmed) {
            // Pass orFile and conditionally orNumber
            if (showOrNumberField) {
                submitVerification(appId, 'Approved', appType, result.value.orFile, result.value.orNumber);
            } else {
                submitVerification(appId, 'Approved', appType, result.value.orFile, null);
            }
        } else if (result.isDenied) {
            submitVerification(appId, 'Rejected', appType, null, null);
        }
    });
}

function submitVerification(appId, status, appType, orFile = null, orNumber = null) {
    const formData = new FormData();
    formData.append('action', 'verify_payment');
    formData.append('id', appId);
    formData.append('verification_action', status);
    formData.append('type', appType);

    if (status === 'Approved') {
        if (orFile) formData.append('or_file', orFile);
        if (orNumber) formData.append('or_number', orNumber);
    }

    Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(`${API_URL}?action=verify_payment`, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire('Success', 'Payment processed successfully.', 'success').then(() => {
                    const socket = sockets["main"];
                    if (!socket) return;

                    [
                        "business_applications_update",
                        "construction_applications_update"
                    ].forEach(event => {
                        socket.emit(event, { action: "status_update" });
                    });

                    loadPendingTable();
                    fetchAuditLogs();
                });
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Network error', 'error');
        });
}

// Helper function to add summary cards above charts
function addSummaryCards(summary) {
    // Check if summary container already exists
    let summaryContainer = document.querySelector('.summary-cards');

    if (!summaryContainer) {
        // Create summary container
        summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-cards';
        summaryContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        `;

        // Insert before the first chart
        const analyticsContainer = document.querySelector('.analytics-container');
        if (analyticsContainer) {
            analyticsContainer.parentNode.insertBefore(summaryContainer, analyticsContainer);
        }
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Create summary cards HTML
    summaryContainer.innerHTML = `
        <div class="summary-card" style="background: linear-gradient(135deg, #4F46E5, #6366F1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Applications</div>
                    <div style="font-size: 28px; font-weight: bold;">${(summary?.total_business || 0) + (summary?.total_construction || 0)}</div>
                </div>
                <i class="fas fa-file-alt" style="font-size: 40px; opacity: 0.3;"></i>
            </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #059669, #10B981);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Paid Applications</div>
                    <div style="font-size: 28px; font-weight: bold;">${(summary?.business_paid || 0) + (summary?.construction_paid || 0)}</div>
                </div>
                <i class="fas fa-check-circle" style="font-size: 40px; opacity: 0.3;"></i>
            </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #B45309, #F59E0B);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Revenue</div>
                    <div style="font-size: 24px; font-weight: bold;">${formatCurrency(summary?.total_revenue)}</div>
                </div>
                <i class="fas fa-peso-sign" style="font-size: 40px; opacity: 0.3;"></i>
            </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #7B1FA2, #8B5CF6);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Collection Rate</div>
                    <div style="font-size: 28px; font-weight: bold;">
                        ${calculateCollectionRate(summary)}%
                    </div>
                </div>
                <i class="fas fa-chart-pie" style="font-size: 40px; opacity: 0.3;"></i>
            </div>
        </div>
    `;

    // Add styles for summary cards
    const style = document.createElement('style');
    style.textContent = `
        .summary-card {
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}

// Helper function to calculate collection rate
function calculateCollectionRate(summary) {
    const totalApps = (summary?.total_business || 0) + (summary?.total_construction || 0);
    const paidApps = (summary?.business_paid || 0) + (summary?.construction_paid || 0);

    if (totalApps === 0) return '0';
    return ((paidApps / totalApps) * 100).toFixed(1);
}

function openPaymentModal(appId, amountDue, appType) {
    const app = pendingApps.find(a => a.id == appId && a.application_type === appType);
    if (!app) return;

    const dbPaymentMethod = app.payment_method || '';

    const html = `
        <form style="text-align:left;">
            <div class="form-group">
                <label>Amount Due</label>
                <input type="text" value="${parseFloat(amountDue).toFixed(2)}" disabled style="width:100%; padding:10px;">
            </div>
            <div class="form-group">
                <label>Amount Paid *</label>
                <input type="number" id="amountPaid" required style="width:100%; padding:10px;" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label>Payment Method *</label>
                <select id="paymentMethod" required style="width:100%; padding:10px;" onchange="toggleReferenceField()">
                    <option value="">Select</option>
                    <option value="Cash (Over-the-Counter)" ${dbPaymentMethod === 'Cash (Over-the-Counter)' ? 'selected' : ''}>Cash</option>
                    <option value="GCash/QR" ${dbPaymentMethod === 'GCash/QR' ? 'selected' : ''}>GCash/QR</option>
                    <option value="Landbank" ${dbPaymentMethod === 'Landbank' ? 'selected' : ''}>Landbank</option>
                </select>
            </div>
            <div class="form-group" id="referenceFieldGroup" style="display: ${dbPaymentMethod === 'GCash/QR' ? 'block' : 'none'};">
                <label id="refLabel">OR Number ${dbPaymentMethod === 'GCash/QR' ? '*' : ''}</label>
                <input type="text" id="refNumber" ${dbPaymentMethod === 'GCash/QR' ? 'required' : ''} style="width:100%; padding:10px;">
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="paymentDate" style="width:100%; padding:10px;">
            </div>
            <div class="form-group" style="margin-top: 15px;">
                <label>Proof of Payment *</label>
                <input type="file" id="proofOfPayment" accept="image/*,application/pdf" style="width:100%; padding:10px; border: 1px solid #ccc;">
            </div>
            <div class="form-group" style="text-align: center; margin-top: 15px;">
                <img id="proofPreview" src="" alt="Proof Preview" style="max-width: 100%; max-height: 200px; display: none; border: 1px solid #ddd; padding: 5px; border-radius: 4px;" />
            </div>
        </form>`;

    Swal.fire({
        title: 'Process Payment',
        html: html,
        icon: 'question',
        confirmButtonText: 'Submit',
        showCancelButton: true,
        width: '600px',
        didOpen: () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('paymentDate').value = today;

            const proofInput = document.getElementById('proofOfPayment');
            const proofPreview = document.getElementById('proofPreview');

            proofInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        proofPreview.src = event.target.result;
                        proofPreview.style.display = 'inline-block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    proofPreview.style.display = 'none';
                }
            });
        },
        preConfirm: () => {
            const amountPaid = document.getElementById('amountPaid').value;
            const method = document.getElementById('paymentMethod').value;
            const refNumber = document.getElementById('refNumber').value;
            const date = document.getElementById('paymentDate').value;
            const proofFile = document.getElementById('proofOfPayment').files[0];

            if (!amountPaid || !method || !date || !proofFile) {
                Swal.showValidationMessage('Amount Paid, Payment Method, Date, and Proof of Payment are required');
                return false;
            }

            // For GCash/QR ONLY, reference number is required
            if (method === 'GCash/QR' && !refNumber) {
                Swal.showValidationMessage('OR Number is required for GCash/QR payments');
                return false;
            }

            return { amountPaid, method, refNumber, date, proofFile, appId, appType };
        }
    }).then(result => {
        if (result.isConfirmed) submitPayment(result.value, amountDue);
    });
}

function toggleReferenceField() {
    const method = document.getElementById('paymentMethod').value;
    const refFieldGroup = document.getElementById('referenceFieldGroup');
    const refLabel = document.getElementById('refLabel');
    const refInput = document.getElementById('refNumber');

    if (method === 'GCash/QR') {
        // Show OR number field for GCash/QR
        refFieldGroup.style.display = 'block';
        refInput.setAttribute('required', 'required');
        refLabel.textContent = 'OR Number *';
    } else if (method) {
        // Hide reference field for all other methods (Cash, Landbank)
        refFieldGroup.style.display = 'none';
        refInput.removeAttribute('required');
    } else {
        // No method selected - hide reference field
        refFieldGroup.style.display = 'none';
        refInput.removeAttribute('required');
    }
}

function updateRefLabel() {
    toggleReferenceField();
}

function submitPayment(paymentData, amountDue) {
    const formData = new FormData();

    // These keys MUST match the get_input() calls in your PHP
    formData.append('application_id', paymentData.appId);
    // This ensures the first letter is Uppercase (e.g., "business" becomes "Business")
    const capitalizedType = paymentData.appType.charAt(0).toUpperCase() + paymentData.appType.slice(1).toLowerCase();
    formData.append('payment_purpose_app_type', capitalizedType);
    formData.append('amountPaid', paymentData.amountPaid);
    formData.append('paymentMethod', paymentData.method);
    formData.append('orNumber', paymentData.refNumber);
    formData.append('dateOfPayment', paymentData.date);
    formData.append('proofOfPayment', paymentData.proofFile);

    Swal.fire({
        title: 'Processing...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    // Replace the URL with the actual path to your submit_payment.php
    fetch('/server/api/resident/submit_payment.php', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const socket = sockets["main"];
                if (!socket) return;

                [
                    "business_applications_update",
                    "construction_applications_update"
                ].forEach(event => {
                    socket.emit(event, { action: "status_update" });
                });

                Swal.fire('Success', data.message, 'success').then(() => {
                    loadPendingTable();
                    fetchAuditLogs();
                });
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(err => Swal.fire('Error', 'Network error or file too large', 'error'));
}

function generateReceipt(id, appType) {
    let app = paidApps.find(a => a.id == id && a.application_type === appType);
    if (!app) {
        fetch(API_URL + '?action=fetch_one&id=' + id + '&type=' + appType)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') showReceiptModal(data.data);
            });
    } else {
        showReceiptModal(app);
    }
}

function viewSummary(id, source, appType) {
    let app;
    if (source === 'pending') app = pendingApps.find(a => a.id == id && a.application_type === appType);
    else app = paidApps.find(a => a.id == id && a.application_type === appType);

    if (!app) return;

    const businessField = appType === 'business' ? '<p><strong>Business:</strong> ' + (app.business_name || 'N/A') + '</p>' : '';

    const html = '<div style="text-align:left;"><p><strong>ID:</strong> ' + app.id + '</p><p><strong>Type:</strong> <span style="text-transform: capitalize;">' + appType + '</span></p><p><strong>Owner:</strong> ' + app.first_name + ' ' + app.last_name + '</p>' + businessField + '<p><strong>Assessment:</strong> PHP ' + parseFloat(app.amount_due || 0).toFixed(2) + '</p><hr><p><strong>Amount Paid:</strong> PHP ' + parseFloat(app.amount_paid || 0).toFixed(2) + '</p></div>';

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

function showReceiptModal(app) {
    const orNumber = app.or_number && app.or_number.trim() !== '' ? app.or_number : '(Not Available)';

    const html = '<div style="border:2px solid #00247c; border-radius:8px; padding:20px;"><h3 style="color:#00247c;">OFFICIAL RECEIPT</h3><p>OR/Ref: <strong>' + orNumber + '</strong></p><hr><p><strong>Payer:</strong> ' + app.first_name + ' ' + app.last_name + '</p><p><strong>Amount:</strong> PHP ' + parseFloat(app.amount_paid).toFixed(2) + '</p><p><strong>Date:</strong> ' + app.payment_date + '</p><p><strong>Method:</strong> ' + app.payment_method + '</p></div>';

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
    // Format OR/Reference number for print
    const orNumber = app.or_number && app.or_number.trim() !== '' ? app.or_number : 'N/A';

    const w = window.open('', 'PRINT', 'height=600,width=400');
    w.document.write(`
        <html>
        <head>
            <title>Receipt - ${orNumber}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px;}
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; text-align: left; }
                .total { border-top: 2px dashed #000; padding-top: 10px; font-weight: bold; }
                .na-message { color: #999; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="header">
                <h3>OFFICIAL RECEIPT</h3>
                <p>OR/Ref: ${orNumber}</p>
                <p>Date: ${app.payment_date || 'N/A'}</p>
            </div>
            <div class="details">
                <div class="row"><span>Payer:</span> <span>${app.first_name} ${app.last_name}</span></div>
                <div class="row"><span>Method:</span> <span>${app.payment_method || 'N/A'}</span></div>
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

// DO NOT REMOVE!!! - JEP
/**
 * Fetch audit logs from the server
 * Clears and re-renders the entire audit table
 *
 * @async
 * @returns {Promise<void>}
 */
async function fetchAuditLogs() {
    try {
        const resp = await fetch('/server/api/shared/get_audit_logs.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        if (!resp.ok) {
            console.error('Audit log fetch failed:', resp.status, resp.statusText);
            return;
        }

        const logs = await resp.json();

        if (!Array.isArray(logs)) {
            console.error('Invalid audit log response:', logs);
            return;
        }

        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No audit logs found.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.id = `audit-${log.id}`;
            tr.innerHTML = `
                <td>${log.id ?? '—'}</td>
                <td>${log.action ?? '—'}</td>
                <td>${log.record_id ?? '—'}</td>
                <td>${log.full_name ?? '—'}</td>
                <td>${log.created_at ?? '—'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
    }
}

/**
 * Append a new audit log row to the top of the audit table
 * Prevents duplicate rows based on log ID
 *
 * @param {Object} log - Audit log object
 * @param {number|string} log.id - Unique log identifier
 * @returns {void}
 */
function appendAuditRow(log) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (document.getElementById(`audit-${log.id}`)) return;

    const tr = document.createElement('tr');
    tr.id = `audit-${log.id}`;
    tr.innerHTML = `
        <td>${log.id ?? '—'}</td>
        <td>${log.action ?? '—'}</td>
        <td>${log.record_id ?? '—'}</td>
        <td>${log.full_name ?? '—'}</td>
        <td>${log.created_at ?? '—'}</td>
    `;
    tbody.prepend(tr);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAuditLogs();

    initSocket("main", "https://banwa-ws.onrender.com", (data) => {
        switch (data.type) {
            case "finance_applications_update":
                if (data.action === "new_payment_pending") {
                    Swal.fire({
                        icon: 'info',
                        title: 'New Payment Pending',
                        text: `Application #${data.application_id} is ready for payment processing`,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000
                    });
                }
                refreshActiveTab();
                break;

            case "business_applications_update":
            case "construction_applications_update":
                refreshActiveTab();
                break;

            case "new_audit_log":
                if (data.payload) appendAuditRow(data.payload);
                else if (data.id) appendAuditRow(data);
                refreshActiveTab();
                break;
        }
    });
});

window.onload = function () {
    console.log('Window loaded, loading pending table...'); // Debug log
    loadPendingTable();
};

// ===============================================
// EXPOSE ALL FUNCTIONS TO GLOBAL SCOPE (required for type="module")
// ===============================================

// Core payment functions
window.loadPendingTable = loadPendingTable;
window.loadHistoryTable = loadHistoryTable;
window.openPaymentModal = openPaymentModal;
window.openVerificationModal = openVerificationModal;
window.submitPayment = submitPayment;
window.submitVerification = submitVerification;
window.updateRefLabel = updateRefLabel;
window.toggleReferenceField = toggleReferenceField;

// Receipt functions
window.generateReceipt = generateReceipt;
window.showReceiptModal = showReceiptModal;
window.printReceiptWindow = printReceiptWindow;

// Summary and view functions
window.viewSummary = viewSummary;

// Penalty functions
window.openPenaltyModal = openPenaltyModal;

// Tab navigation
window.switchTab = switchTab;

// Helper functions
window.filterTable = filterTable;

// Audit functions
window.fetchAuditLogs = fetchAuditLogs;
window.appendAuditRow = appendAuditRow;