// Configuration
const API_URL = '../../../scripts/staff/construction_staff/construction_handler.php';
const UPLOADS_BASE_PATH = '../../../scripts/staff/construction_staff/uploads/';
let applications = [];

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

    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('User profile button clicked');
        });
    }

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
            if (data.status === 'success') applications = data.data;
            return applications;
        });
}

// ================= REVIEW TABLE =================
function loadReviewTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        applications.forEach(app => {
            let badgeClass = 'pending';
            if (app.status === 'Approved') badgeClass = 'approved';
            if (app.status === 'Disapproved') badgeClass = 'disapproved';
            if (app.status === 'Paid') badgeClass = 'paid';
            if (app.status === 'For Payment') badgeClass = 'for-payment';

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.nature_of_activity}</td>
                    <td>${app.first_name} ${app.last_name}</td>
                    <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
                    <td>${app.payment_status || 'N/A'}</td>
                    <td>
                        <button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                        <button class="btn-delete" onclick="archiveApplication(${app.id})">🗄️ Archive</button>
                    </td>
                </tr>
            `;
        });
    });
}

// ================= PROCESS TABLE =================
function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        tbody.innerHTML = '';

        const excludedStatuses = ['Cancelled', 'Archived'];
        const actionable = applications.filter(app => !excludedStatuses.includes(app.status));

        if (actionable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No applications to process.</td></tr>';
            return;
        }

        actionable.forEach(app => {
            let btnText = "⚙️ Update";
            let btnClass = "secondary";

            if (app.status === 'Pending') { btnClass = "primary"; }
            else if (app.status === 'For Payment') { btnText = "Verify Payment"; btnClass = "warning"; }
            else if (app.status === 'Paid') { btnText = "Finalize Approval"; btnClass = "success"; }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.nature_of_activity}</td>
                     <td>${app.first_name} ${app.last_name}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${app.payment_status || 'Unpaid'}</td>
                    <td>
                        <button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>
                        ${app.status === 'Approved'
                    ? `<button class="btn-success" style="margin-left:6px;" onclick="generateClearance(${app.id})">Generate Clearance</button>`
                    : ''}
                    </td>
                </tr>
            `;
        });
    });
}

let chart1Instance;
let chart2Instance;

function loadAnalyticsTab() {
    fetch('/Banwa/client/scripts/staff/construction_staff/construction_handler.php?action=chart_construction_type')
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.nature_of_activity);
            const values2 = res.data_by_type.map(x => x.total);

            // Your fixed colors
            // Will change this later to dynamic colors based on number of construction types
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
                        label: 'Construction Dates',
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
                        label: 'Construction Types',
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

// ================= UPDATE =================
function openUpdateModal(id) {
    const app = applications.find(a => a.id == id);
    document.getElementById('updateAppId').value = id;
    document.getElementById('displayCurrentStatus').value = app.status;
    document.getElementById('updateForm').reset();

    if (app.status === 'For Payment' && app.amount_due) {
        document.getElementById('assessmentAmount').value = parseFloat(app.amount_due).toFixed(2);
    }

    toggleAmountField();
    openModal('updateModal');
}

function toggleAmountField() {
    const status = document.getElementById('newStatus').value;
    const group = document.getElementById('amountFieldGroup');
    const input = document.getElementById('assessmentAmount');

    if (status === 'For Payment') {
        group.classList.remove('hidden');
        input.required = true;
    } else {
        group.classList.add('hidden');
        input.required = false;
        input.value = '';
    }
}

function submitUpdate(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('updateForm'));
    formData.append('action', 'update_status');

    fetch(API_URL, { method: 'POST', body: formData })
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

// ================= VIEW DETAILS =================
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    const fileUploadHtml = app.requirement_upload
        ? `<a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" target="_blank">View Document</a>`
        : 'No file uploaded';

    document.getElementById('modalBody').innerHTML = `
        <div class="summary-card">
            <h3>🏗 Construction Details</h3>
            <p><strong>Owner:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</p>
            <p><strong>Contact:</strong> ${app.contact_no_owner}</p>
            <p><strong>Construction Address:</strong> ${app.construction_address}</p>

            <h3>🛠 Work Information</h3>
            <p><strong>Nature of Work:</strong> ${app.nature_of_activity}</p>
            <p><strong>Type of Work:</strong> ${app.type_of_work}</p>
            <p><strong>Activity:</strong> ${app.nature_of_activity}</p>
            <p><strong>Details:</strong> ${app.details_of_work}</p>

            <h3>📅 Schedule</h3>
            <p><strong>Start:</strong> ${app.start_date}</p>
            <p><strong>End:</strong> ${app.end_date}</p>
            <p><strong>Working Days:</strong> ${app.number_of_working_days}</p>
            <p><strong>Workers:</strong> ${app.number_of_workers}</p>

            <h3>📋 Requirement</h3>
            ${fileUploadHtml}
        </div>
    `;

    openModal('detailsModal');
}

// ================= ARCHIVE =================
function archiveApplication(appId) {
    if (!confirm('Are you sure you want to archive this application?')) return;

    fetch(`${API_URL}?action=archive&id=${appId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Application archived successfully!', 'success');
                loadReviewTable();
                loadProcessTable();
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        });
}

// ================= SUMMARY =================
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.nature_of_activity}</option>`;
        });
    });
}

function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const out = document.getElementById('summaryOutput');
    if (!appId) return out.innerHTML = '';

    const app = applications.find(a => a.id == appId);

    out.innerHTML = `
        <div class="summary-card">
            <h3>📄 Construction Application Summary</h3>
            <p><strong>ID:</strong> ${app.id}</p>
            <p><strong>Owner:</strong> ${app.first_name} ${app.last_name}</p>
            <p><strong>Work:</strong> ${app.nature_of_activity}</p>
            <p><strong>Status:</strong> ${app.status}</p>
        </div>
    `;
}

// ================= FILTER =================
function filterApplications() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const filtered = applications.filter(app =>
        app.nature_of_activity.toLowerCase().includes(search) ||
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(search) ||
        app.id.toString().includes(search)
    );

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No applications found</td></tr>';
        return;
    }

    filtered.forEach(app => {
        tbody.innerHTML += `
            <tr>
                <td>${app.id}</td>
                <td>${app.first_name} ${app.last_name}</td>
                <td>${app.nature_of_activity}</td>
                <td>${app.status}</td>
                <td>${app.payment_status || 'N/A'}</td>
                <td>
                    <button onclick="viewDetails(${app.id})">👁️ View</button>
                </td>
            </tr>
        `;
    });
}

function applyPrompt(text) {
    const textarea = document.getElementById('updateComments');
    if (textarea) {
        // Option A: Replace everything
        textarea.value = text;

        // Option B: Append instead of replace (Uncomment below if preferred)
        // textarea.value += (textarea.value ? ' ' : '') + text;

        textarea.focus();
    }
}

// add generateClearance too...

// ================= MODALS & ALERT =================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showAlert(message, type) {
    const box = document.getElementById('alert-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type} active`;
    div.textContent = message;
    box.innerHTML = '';
    box.appendChild(div);
    setTimeout(() => div.classList.remove('active'), 4000);
}

window.onclick = function (event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target == modal) modal.classList.remove('active');
    });
};

// window.addEventListener('load', function () {
//     loadAnalyticsTab();
// });

document.head.insertAdjacentHTML("beforeend", `<style>.hidden{display:none!important}</style>`);
