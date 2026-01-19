// Configuration
const API_URL = '../../../scripts/staff/utilities_staff/utilities_handler.php';
// NOTE: Adjust this path to where your 'uploads' folder is located relative to this 'utilities.php' file.
const UPLOADS_BASE_PATH = '../../../scripts/staff/utilities_staff/uploads/'; // <--- This must be correct for file links to work
let applications = [];

// Normalize server/app shapes to the UI shape expected by this script.
function normalizeApp(a) {
    if (!a || typeof a !== 'object') return a;

    const first_name = a.first_name || '';
    const middle_name = a.middle_name || '';
    const last_name = a.last_name || '';
    const fullnameFromParts = [first_name, middle_name, last_name].filter(Boolean).join(' ');

    const normalized = Object.assign({}, a, {
        id: a.id,
        // provider/fullname mapping
        provider: a.provider || a.business_name || fullnameFromParts || a.fullname || '',
        fullname: a.fullname || fullnameFromParts || a.business_name || '',
        // contact/address mapping
        contactNo: a.contactNo || a.telephone_no_business || a.telephone_no_owner || a.contact_no || '',
        address: a.address || a.address_of_business || a.address_owner || '',
        // nature/type mapping
        natureOfWork: a.natureOfWork || a.nature_of_business || '',
        // requirements / uploads
        requirements: Array.isArray(a.requirements) ? a.requirements : (a.requirements ? [a.requirements] : []),
        requirement_upload: a.requirement_upload || a.requirementUpload || '',
        requirementUpload: a.requirement_upload || a.requirementUpload || '',
        // payment/status
        payment_status: a.payment_status || a.paymentStatus || 'Unpaid',
        amount_due: parseFloat(a.amount_due || a.amountDue || 0) || 0,
        status: a.status || 'Pending',
        approval_comments: a.approval_comments || a.approvalComments || '',
        disapproval_reason: a.disapproval_reason || a.disapprovalReason || '',
        application_date: a.application_date || a.requestDate || ''
    });

    return normalized;
}

// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', function () {
    initializeSidebarNav();
});

function initializeSidebarNav() {
    const navItems = document.querySelectorAll('.nav_select[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(e, tabName);
        });
    });

    // Placeholder for user profile button
    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // Placeholder function - add user profile functionality here
            console.log('User profile button clicked - add functionality here');
        });
    }

    // Load initial tab
    loadAnalyticsTab();
}

// TAB SWITCHING
function switchTab(event, tabName) {
    event.preventDefault();
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav_select[data-tab]').forEach(item => item.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.closest('.nav_select').classList.add('active');

    if (tabName === 'review') loadReviewTable();
    else if (tabName === 'process') loadProcessTable();
    else if (tabName === 'summary') loadSummarySelect();
    else if (tabName === 'analytics') loadAnalyticsTab();
}

function loadApplicationsFromDB() {
    return fetch(`${API_URL}?action=fetch`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') applications = data.data.map(a => normalizeApp(a));
            return applications;
        });
}

function loadReviewTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        applications.forEach(app => {
            // Status Badge Logic
            let badgeClass = 'pending';
            if (app.status === 'Approved') badgeClass = 'approved';
            if (app.status === 'Disapproved') badgeClass = 'disapproved';
            if (app.status === 'Paid') badgeClass = 'paid';
            if (app.status === 'For Payment') badgeClass = 'for-payment';

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.provider}</td>
                    <td>${app.fullname}</td>
                    <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
                    <td>${app.payment_status || 'N/A'}</td>
                    <td><button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                    <button class="btn-delete" onclick="archiveApplication(${app.id})">🗄️ Archive</button></td>
                </tr>
            `;
        });
    });
}

function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        tbody.innerHTML = '';

        // Filter: Show everything NOT cancelled, so they can be processed
        const actionable = applications.filter(a => a.status !== 'Cancelled');

        actionable.forEach(app => {
            let btnText = "⚙️ Update";
            let btnClass = "btn-secondary";

            // Highlight actions based on flow
            if (app.status === 'Pending') { btnText = "Assess / Review"; btnClass = "btn-primary"; }
            else if (app.status === 'Paid') { btnText = "Finalize Approval"; btnClass = "btn-success"; }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.provider}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${app.payment_status || 'Unpaid'}</td>
                    <td>
                        <button class="${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>
                    </td>
                </tr>
            `;
        });
    });
}

let chart1Instance;
let chart2Instance;

function loadAnalyticsTab() {
    fetch('/Banwa/client/scripts/staff/utilities_staff/utilities_handler.php?action=chart_utilities_type')
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.provider);
            const values2 = res.data_by_type.map(x => x.total);

            // Your fixed colors
            // Will change this later to dynamic colors based on number of utilities types
            // - jep
            const dateColors = [
                '#4F46E5',
                '#2563EB',
                '#0284C7',
                '#0891B2',
                '#0D9488',
                '#14B8A6'
            ];

            const typeColors = [
                '#F59E0B',
                '#F97316',
                '#EF4444',
                '#8B5CF6',
                '#EC4899',
                '#84CC16'
            ];

            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();

            chart1Instance = new Chart(document.getElementById('chart1'), {
                type: 'line',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Utilities Dates',
                        data: values1,
                        backgroundColor: dateColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            chart2Instance = new Chart(document.getElementById('chart2'), {
                type: 'bar',
                data: {
                    labels: labels2,
                    datasets: [{
                        label: 'Utilities Types',
                        data: values2,
                        backgroundColor: typeColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        });
}

// NEW: UPDATE / ASSESS LOGIC
function openUpdateModal(id) {
    const app = applications.find(a => a.id == id);
    document.getElementById('updateAppId').value = id;
    document.getElementById('displayCurrentStatus').value = app.status;
    document.getElementById('updateForm').reset();
    if (app.status === 'For Payment' && app.amount_due) {
        document.getElementById('assessmentAmount').value = parseFloat(app.amount_due).toFixed(2);
    }
    toggleAmountField(); // Reset visibility
    openModal('updateModal');
}

function toggleAmountField() {
    const status = document.getElementById('newStatus').value;
    const amountGroup = document.getElementById('amountFieldGroup');
    const amountInput = document.getElementById('assessmentAmount');

    if (status === 'For Payment') {
        amountGroup.classList.remove('hidden');
        amountInput.required = true;
    } else {
        amountGroup.classList.add('hidden');
        amountInput.required = false;
        amountInput.value = '';
    }
}

function submitUpdate(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('updateForm'));
    formData.append('action', 'update_status');

    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal('updateModal');
                alert('Application updated successfully!');
                loadReviewTable();
                loadProcessTable();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

// VIEW DETAILS (MODIFIED to include comments & file link)
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    const businessStatus = app.business_status || 'Not specified';
    const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';

    // Build the uploaded file link HTML (support both keys)
    const uploadedFile = app.requirementUpload || app.requirement_upload || '';
    const fileUploadHtml = uploadedFile
        ? `<a href="${UPLOADS_BASE_PATH}${uploadedFile}" target="_blank">View Document (${uploadedFile})</a>`
        : 'No file uploaded';

    // Build comments HTML
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<p><strong>Approval Comments:</strong> ${app.approval_comments}</p>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<p><strong>Disapproval Reason:</strong> ${app.disapproval_reason}</p>`;
    }

    // CONDITIONAL PAYMENT BLOCK
    const paymentInfo = app.amount_due > 0
        ? `<div class="summary-card">
        <h3>💰 Assessment & Payment</h3>
        <p><strong>Amount Due:</strong> ₱${app.amount_due}</p>
        <p><strong>Payment Status:</strong> ${app.payment_status}</p>
        <p><strong>OR Number:</strong> ${app.or_number || 'N/A'}</p>
       </div>`
        : '';

    // COMBINE ALL HTML BLOCKS INTO ONE VARIABLE
    const fullModalContent = `
        <div class="summary-card">
            <h3>📍 Utility Information</h3>
            <p><strong>Application ID:</strong> ${app.id}</p>
            <p><strong>Provider:</strong> ${app.provider}</p>
            <p><strong>Nature of Work:</strong> ${app.natureOfWork}</p>
            <p><strong>Utility Address:</strong> ${app.address}</p>
            <p><strong>Utility Status:</strong> ${businessStatus}</p>
            <p><strong>Telephone:</strong> ${app.contactNo}</p>
            <p><strong>Email Address:</strong> ${app.email_address}</p>
            <p><strong>Requested Date:</strong> ${app.requestDate}</p>
            <p><strong>Date of Work:</strong> ${app.dateOfWork || 'N/A'}</p>
        </div>

        <div class="summary-card">
            <h3>👤 Contact Information</h3>
            <p><strong>Name:</strong> ${app.fullname}</p>
            <p><strong>Telephone:</strong> ${app.contactNo}</p>
            <p><strong>Address:</strong> ${app.address}</p>
        </div>

        <div class="summary-card">
            <h3>🏢 Structure</h3>
            <p><strong>Structure Type:</strong> ${app.type_of_structure}</p>
            <p><strong>Number of Employees:</strong> ${app.no_of_employees}</p>
        </div>

        <div class="summary-card">
            <h3>📋 Requirements</h3>
            <p><strong>Submitted:</strong> ${requirementsList}</p>
            <p><strong>Uploaded File:</strong> ${fileUploadHtml}</p>
        </div>

        <div class="summary-card">
            <h3>📅 Application Details</h3>
            <p><strong>Application Date:</strong> ${app.application_date}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></p>
            ${commentsHtml}
        </div>
        
        ${paymentInfo} `;

    // SET THE MODAL CONTENT
    document.getElementById('modalBody').innerHTML = fullModalContent;

    // OPEN THE MODAL
    openModal('detailsModal');
}

// CREATE APPLICATION
function createApplication(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('createForm'));
    formData.append('action', 'create');

    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('createForm').reset();
                showAlert(`Utilities Application created successfully! ID: ${data.id}`, 'success');
                loadApplicationsFromDB().then(() => { loadReviewTable(); loadProcessTable(); });
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to create application', 'danger');
        });
}

// LOAD SUMMARY SELECT OPTIONS
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.provider || app.fullname}</option>`;
        }
        );
    });
}

// UPDATE SUMMARY (MODIFIED to include comments & file link)
function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const summaryOutput = document.getElementById('summaryOutput');

    if (!appId) {
        summaryOutput.innerHTML = '';
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    const businessStatus = app.business_status || 'Not specified';
    const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';

    // Build the uploaded file link HTML
    const fileUploadHtml = app.requirement_upload
        ? `<a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" target="_blank">View Document (${app.requirement_upload})</a>`
        : 'No file uploaded';

    // Build comments HTML
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<p><strong>Approval Comments:</strong> ${app.approval_comments}</p>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<p><strong>Disapproval Reason:</strong> ${app.disapproval_reason}</p>`;
    }


    summaryOutput.innerHTML = `
        <div class="summary-card">
            <h3>📄 Utilities Application Summary Report</h3>
            <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Application ID:</strong> ${app.id}</p>
        </div>

        <div class="summary-card">
            <h3>📍 Utility Information</h3>
            <p><strong>Utility Name:</strong> ${app.business_name}</p>
            <p><strong>Type of Utility:</strong> ${app.type_of_business}</p>
            <p><strong>Nature:</strong> ${app.nature_of_business}</p>
            <p><strong>Address:</strong> ${app.address_of_business}</p>
            <p><strong>Status:</strong> ${businessStatus}</p>
            <p><strong>Telephone:</strong> ${app.telephone_no_business}</p>
            <p><strong>Email Address:</strong> ${app.email_address}</p>
        </div>

        <div class="summary-card">
            <h3>👤 Contact Information</h3>
            <p><strong>Contact Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</p>
            <p><strong>Contact Telephone:</strong> ${app.telephone_no_owner}</p>
            <p><strong>Contact Address:</strong> ${app.address_owner}</p>
        </div>

        <div class="summary-card">
            <h3>🏢 Structure & Operations</h3>
            <p><strong>Structure Type:</strong> ${app.type_of_structure}</p>
            <p><strong>Number of Employees:</strong> ${app.no_of_employees}</p>
        </div>

        <div class="summary-card">
            <h3>📋 Requirements Submitted</h3>
            <p><strong>Documents:</strong> ${requirementsList}</p>
            <p><strong>Uploaded File:</strong> ${fileUploadHtml}</p>
        </div>

        <div class="summary-card">
            <h3>📅 Application Status</h3>
            <p><strong>Submission Date:</strong> ${app.application_date}</p>
            <p><strong>Current Status:</strong> <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></p>
            ${commentsHtml}
        </div>

        <div class="button-group">
            <button class="btn-primary" onclick="printSummary()">🖨️ Print Summary</button>
            <button class="btn-secondary" onclick="downloadSummary(${app.id})">📥 Download</button>
        </div>
    `;
}

// FILTER APPLICATIONS
function filterApplications() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('tableBody');

    tbody.innerHTML = '';

    const filtered = applications.filter(app =>
        app.business_name.toLowerCase().includes(searchInput) ||
        (app.first_name + ' ' + app.last_name).toLowerCase().includes(searchInput) ||
        app.id.toString().includes(searchInput)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No applications found</td></tr>';
        return;
    }

    filtered.forEach(app => {
        // Status Badge Logic
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Paid') badgeClass = 'paid';
        if (app.status === 'For Payment') badgeClass = 'for-payment';

        const row = document.createElement('tr');
        const ownerName = app.first_name + (app.middle_name ? ' ' + app.middle_name : '') + ' ' + app.last_name;
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.business_name}</td>
            <td>${ownerName}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'N/A'}</td>
            <td>
                <button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                <button class="btn-delete" onclick="archiveApplication(${app.id})">🗄️ Archive</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// MODAL FUNCTIONS
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ALERT FUNCTION
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} active`;
    alertDiv.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('active');
    }, 4000);
}


// PRINT & DOWNLOAD (MODIFIED for Styled HTML/DOC)

function printSummary() {
    window.print();
}

function downloadSummary(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // Prepare list data for HTML
    const businessStatus = app.business_status || 'Not specified';
    const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';

    // Generate HTML for file upload link
    const fileUploadText = app.requirement_upload
        ? `<li><strong>Uploaded File:</strong> <a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" style="color:#007bff; text-decoration: none;">View Document (${app.requirement_upload})</a></li>`
        : '<li><strong>Uploaded File:</strong> No file uploaded</li>';

    // Generate HTML for comments
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<div class="comment-box approval"><h3>✅ Approval Comments</h3><p>${app.approval_comments}</p></div>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<div class="comment-box disapproval"><h3>❌ Disapproval Reason</h3><p>${app.disapproval_reason}</p></div>`;
    }

    // Generate the full HTML content with embedded CSS for styling
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Utilities Application Summary Report - ${app.id}</title>
        <style>
            /* Define professional styles for Word to render */
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h1 { color: #5B479B; border-bottom: 3px solid #826EEA; padding-bottom: 10px; font-size: 24pt; }
            h2 { color: #826EEA; margin-top: 30px; font-size: 16pt; }
            .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
            .info-list { list-style-type: none; padding: 0; }
            /* Creates alignment for key/value pairs */
            .info-list li { margin-bottom: 8px; }
            .info-list strong { display: inline-block; width: 180px; font-weight: bold; } 
            /* Status badge styling */
            .status-badge { background-color: ${app.status === 'Approved' ? '#d4edda' : app.status === 'Disapproved' ? '#f8d7da' : '#fff3cd'}; color: ${app.status === 'Approved' ? '#155724' : app.status === 'Disapproved' ? '#721c24' : '#856404'}; padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 10pt;}
            /* Comments Box Styling */
            .comment-box { margin-top: 20px; padding: 15px; border-radius: 5px; }
            .comment-box h3 { font-size: 12pt; }
            .comment-box.approval { border: 1px solid #c3e6cb; background-color: #d4edda; }
            .comment-box.disapproval { border: 1px solid #f5c6cb; background-color: #f8d7da; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Utilities Application Summary Report</h1>
            <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Application ID:</strong> ${app.id}</p>

            <h2>📍 Utility Information</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Utility Name:</strong> ${app.business_name}</li>
                    <li><strong>Type:</strong> ${app.type_of_business}</li>
                    <li><strong>Nature:</strong> ${app.nature_of_business}</li>
                    <li><strong>Address:</strong> ${app.address_of_business}</li>
                    <li><strong>Status:</strong> ${businessStatus}</li>
                    <li><strong>Telephone:</strong> ${app.telephone_no_business}</li>
                    <li><strong>Email Address:</strong> ${app.email_address}</li>
                </ul>
            </div>

            <h2>👤 Contact Information</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Contact Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                    <li><strong>Contact Telephone:</strong> ${app.telephone_no_owner}</li>
                    <li><strong>Contact Address:</strong> ${app.address_owner}</li>
                </ul>
            </div>

            <h2>🏢 Structure & Requirements</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Structure Type:</strong> ${app.type_of_structure}</li>
                    <li><strong>Number of Employees:</strong> ${app.no_of_employees}</li>
                    <li><strong>Required Documents:</strong> 
                        <ul style="padding-left: 20px; margin-top: 5px; list-style-type: disc;"></ul>
                    </li>
                    ${fileUploadText}
                </ul>
            </div>

            <h2>📅 Application Status</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Submission Date:</strong> ${app.application_date}</li>
                    <li><strong>Current Status:</strong> <span class="status-badge">${app.status}</span></li>
                </ul>
                ${commentsHtml}
            </div>
        </div>
    </body>
    </html>
                `;

    // Use application/msword to force it to open in MS Word
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Utilities_Application_${app.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function getCurrentDateString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

//Updates the date input field with the current date.
function updateApplicationDate() {
    const dateInput = document.getElementById('applicationDate');

    if (dateInput) {
        dateInput.value = getCurrentDateString();
    }
}

// Wait for the DOM content to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);
});


// CLOSE MODAL ON OUTSIDE CLICK
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    });
}

// INITIALIZE ON LOAD
// window.addEventListener('load', function () {
//     loadAnalyticsTab();
// });

document.head.insertAdjacentHTML("beforeend", `<style>.hidden { display: none !important; }</style>`)
