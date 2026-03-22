// Configuration
import { initSocket, sockets } from '../../utils/socketUtils.js';
import { archiveRecord } from '../../utils/archives.js';
const UTILITY_HANDLER_URL = '/server/handlers/staff/utility/utility_handler.php';

let applications = [];

// ===============================================
// 1. GLOBAL STYLE FIX (Inject this at the very top)
// ===============================================
const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    .swal2-popup {
        padding: 2.5rem 0 !important; /* Forces vertical breathing room */
        border-radius: 15px !important;
    }
    .swal2-icon {
        margin-top: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        border-width: 4px !important;
    }
    .swal2-title {
        color: #00247C !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.5rem !important;
    }
    .swal2-html-container {
        margin-bottom: 1.5rem !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }
`;
document.head.appendChild(swalStyle);

// Status templates for quick text insertion - Utilities
const utilityStatusTemplates = {
    // 'Complied': "Your submitted requirements have been verified.",
    'Disapproved': "Your utility application was disapproved due to: [reason]. You may re-apply once requirements are met.",
    'Approved': "Your Utilities Permit is now ready for pick-up/download."
};

// ===============================================
// GLOBAL SWEETALERT CONFIG - ALWAYS ON TOP
// ===============================================
const swalTopConfig = {
    target: document.body,
    backdrop: true,
    allowOutsideClick: false,
    width: '30rem',
    padding: '0',
    customClass: {
        container: 'sweetalert-top'
    },
    didOpen: (modal) => {
        const icon = modal.querySelector('.swal2-icon');
        const title = modal.querySelector('.swal2-title');
        const content = modal.querySelector('.swal2-html-container');
        const actions = modal.querySelector('.swal2-actions');

        if (icon) {
            icon.style.marginTop = '3rem';
            icon.style.marginBottom = '1rem';
        }
        if (title) {
            title.style.margin = '0.5rem 0';
            title.style.fontSize = '2rem';
            title.style.color = '#00247C';
        }
        if (content) {
            content.style.marginBottom = '2.5rem';
            content.style.fontSize = '1.1rem';
        }
        if (actions) {
            actions.style.marginTop = '0';
            actions.style.marginBottom = '2rem';
        }
    }
};

// Map filter visibility flag for this management page


// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', function () {
    initializeSidebarNav();
});

/**
 * Initializes the sidebar navigation with tab switching functionality
 * and adds hamburger menu toggle for mobile responsiveness
 */
function initializeSidebarNav() {
    const navItems = document.querySelectorAll('.nav_select[data-tab]');
    const navLogo = document.querySelector('.nav_logo');
    const sideNav = document.querySelector('.side_nav');

    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
            setTimeout(function () {
                if (typeof map !== 'undefined' && map) {
                    map.invalidateSize();
                }
            }, 320);
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(e, tabName);
        });
    });

    loadAnalyticsTab();
}

/**
 * Switches between different application tabs and loads appropriate data
 * Handles tab activation and deactivation while maintaining UI state
 * 
 * @param {Event} event - The click event triggering tab switch
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(event, tabName) {
    if (event) event.preventDefault();
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav_select').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabName);
    if (target) target.classList.add('active');

    if (event) {
        const link = event.target.closest('.nav_select');
        if (link) link.classList.add('active');
    }

    if (tabName === 'management') {
        loadManagementTable();
    } else if (tabName === 'process') {
        loadProcessTable();
    } else if (tabName === 'summary') {
        loadSummarySelect();
    } else if (tabName === 'dashboard') {
        loadAnalyticsTab();
    }
}

/**
 * Loads the management table with applications from database
 */
function loadManagementTable() {
    loadApplicationsFromDB().finally(() => {
        filterApplications();
    });
}

/**
 * Filters and renders applications in the management table based on search criteria
 */
function filterApplications() {
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody');

    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
    tbody.innerHTML = '';

    if (!applications || !Array.isArray(applications) || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">
                    <div class="spinner"></div>Loading applications...
                </td>
            </tr>`;
        return;
    }

    const filtered = applications.filter(app => {
        const natureOfWork = (app.nature_of_work || '').toLowerCase();
        const fullName = ((app.first_name || '') + ' ' + (app.middle_name || '') + ' ' + (app.last_name || '') + ' ' + (app.suffix || '')).toLowerCase();
        const id = (app.id || '').toString();
        const address = (app.address_of_utility || '').toLowerCase();

        return natureOfWork.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            id.includes(searchTerm) ||
            address.includes(searchTerm);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">
                    No matching applications found.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(app => {
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Complied') badgeClass = 'complied';

        let actionBtn = '';

        if (app.status === 'Pending') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'Complied') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">Finalize</button>`;
        }
        else if (app.status === 'Approved' && !app.or_number) {
            actionBtn = `<button class="btn-secondary" onclick="generateUtilitiesPermit(${app.id})">Clearance</button>`;
        }
        else if (app.status === 'Approved' && app.or_number) {
            actionBtn = `<button class="btn-info" onclick="viewUtilitiesPermit(${app.id})">View Permit</button>`;
        }
        else if (app.status === 'Disapproved') {
            actionBtn = ``;
        }
        else if (app.status === 'Cancelled') {
            actionBtn = ``;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">Update</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.first_name ?? ''} ${app.middle_name ?? ''} ${app.last_name ?? ''} ${app.suffix ?? ''}</td>
            <td>${app.owner_contact_no || 'N/A'}</td>
            <td>${app.provider || 'N/A'}</td>
            <td>${app.nature_of_work || 'N/A'}</td>
            <td>${app.address_of_utility || 'N/A'}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn-info" onclick="viewDetails(${app.id})" title="View Details">View</button>
                    <button class="btn-secondary archive-btn" data-id="${app.id}" data-table="utility_applications">Archive</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Fetches utility applications from the server API
 * 
 * @returns {Promise} Promise resolving to the applications array
 */
function loadApplicationsFromDB() {
    return fetch(`${UTILITY_HANDLER_URL}?action=fetch`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                applications = (data.data || []).filter(app => !app.is_archived);
            } else {
                applications = [];
            }
            return applications;
        })
        .catch(error => {
            console.error('Error fetching applications:', error);
            applications = [];
            return applications;
        });
}

/**
 * Refreshes the currently active tab's content with latest application data.
 */
let isRefreshing = false;
function refreshActiveTab() {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || isRefreshing) return;

    const activeTabId = activeTab.id;
    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    if (activeTabId === 'management') {
        loadApplicationsFromDB().finally(() => { filterApplications(); finish(); });
    } else if (activeTabId === 'process') {
        loadApplicationsFromDB().finally(() => { loadProcessTable(); finish(); });
    } else if (activeTabId === 'summary') {
        loadApplicationsFromDB().finally(() => { loadSummarySelect(); finish(); });
    } else if (activeTabId === 'dashboard') {
        loadApplicationsFromDB().finally(() => { loadAnalyticsTab(); finish(); });
    } else {
        finish();
    }
}

/**
 * Loads applications into the process table with actionable statuses
 */
export function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const excludedStatuses = ['Cancelled', 'Archived'];

        const actionable = applications.filter(app => {
            return !excludedStatuses.includes(app.status);
        });

        if (actionable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No applications to process.</td></tr>';
            return;
        }

        actionable.forEach(app => {
            let btnText = "Update";
            let btnClass = "secondary";
            let buttonsHtml = "";

            if (app.status === 'Pending') {
                btnClass = "primary";
            } else if (app.status === 'Complied') {
                btnText = "Finalize Approval";
                btnClass = "success";
            } else if (app.status === 'Approved' || app.status === 'Completed') {
                btnText = "View Details";
                btnClass = "info";
            }

            buttonsHtml += `<button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>`;

            if (['Complied', 'Approved', 'Completed'].includes(app.status)) {
                buttonsHtml += `
                    <button class="btn-primary" onclick="generateUtilitiesPermit(${app.id})" style="margin-left: 5px;">
                        Clearance
                    </button>
                `;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.nature_of_work || 'N/A'}</td>
                    <td>${app.first_name ?? ''} ${app.middle_name ?? ''} ${app.last_name ?? ''} ${app.suffix ?? ''}</td>
                    <td>${app.provider}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${buttonsHtml}</td>
                </tr>
            `;
        });
    });
}

//Generate Utility Permit
function generateUtilitiesPermit(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) {
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Not Found', text: `Application data not found for ID: ${appId}` });
        return;
    }

    const grantee_name = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`.trim();
    const address = app.address_of_utility || 'N/A'; // Fixed here
    const or_number = app.or_number || 'N/A';
    const date_issued = app.payment_date || app.application_date || getCurrentDateString();

    const workDate = app.date_of_work ? // Fixed here
        new Date(app.date_of_work).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })
        : "N/A";

    const currentYear = new Date().getFullYear();
    const permitNumber = `BRB-UP-${currentYear}-${String(app.id).padStart(4, '0')}`;
    const date = new Date(date_issued);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const yearIssued = date.getFullYear();

    const CAPTAIN_NAME = "SESSAN CASTRO-LEE";
    const SECRETARY_NAME = "ROVIE ROSE B. BAYLON";

    const KAGAWAD_1 = "KATHERINE T. DE JESUS";
    const KAGAWAD_2 = "MARGARETTE K. DE JESUS";
    const KAGAWAD_3 = "ANA FRANCESCA L. MARISTELA";
    const KAGAWAD_4 = "AUGUSTO D. ILAGAN";
    const KAGAWAD_5 = "NATALIA L. MARISTELA";
    const KAGAWAD_6 = "MODESTO CARLO M. RUIZ JR.";

    const nature = (app.nature_of_work || '').toLowerCase(); // Fixed here
    const isInstall = nature.includes('install') ? 'checked' : '';
    const isRepair = (nature.includes('repair') || nature.includes('maintenance')) ? 'checked' : '';
    const isDisconnect = nature.includes('disconnect') ? 'checked' : '';
    const isReconnect = nature.includes('reconnect') ? 'checked' : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: "Times New Roman", serif; margin:0; padding:20px; background:#f4f4f4; }
        .document-container { width: 8.5in; min-height: 11in; margin:0 auto; background:white; padding:45px 50px; box-shadow:0 0 20px rgba(0,0,0,0.1); position:relative; }
        header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
        .logo img { width:105px; }
        .header-center { text-align:center; flex:1; padding:0 20px; }
        .header-center h1 { font-size:23px; margin:6px 0 3px; text-transform:uppercase; letter-spacing:1px; }
        .header-center h2 { font-size:15px; margin:0; font-weight:bold; }
        .clearance-no { text-align:right; font-size:13.5px; font-weight:bold; }
        .doc-title { text-align:center; font-size:27px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin:35px 0 40px 0; }
        .content-wrapper { display:grid; grid-template-columns:235px 1fr; gap:35px; }
        .sidebar { background:#b8bad9; padding:20px 18px; border:1.5px solid #b8bad9; font-size:13px; line-height:1.65; }
        .main-body { font-size:15.2px; line-height:1.75; }
        .fill-line { border-bottom:1px solid #000; display:inline-block; min-width:200px; text-align:center; font-weight: bold; }
        .gate-pass-highlight { border: 2px dashed #333; padding: 15px; margin: 20px 0; text-align: center; }
        .checkbox-option { margin:6px 0; font-weight:600; text-transform: uppercase; }
        .checkbox-option::before { content:"☐ "; }
        .checkbox-option.checked::before { content:"☑ "; }
        .signature-area { margin-top:70px; display:flex; justify-content:space-between; }
        .signature-block { width:46%; text-align:center; }
        .signature-line { border-bottom:1px solid black; margin:8px auto 4px auto; width:90%; padding-top:25px; font-weight:bold; text-transform:uppercase; }
        .seal-note { text-align:center; margin-top:55px; font-size:12.8px; font-style:italic; color:#222; }
        @media print { body { background:white; padding:0; } .document-container { box-shadow:none; padding:40px 48px; } }
    </style>
</head>
<body>
    <div class="document-container">
        <header>
            <div class="logo"><img class="logo" src="../../../img/banwalogo.png" alt="BANWA Logo"></div>
            <div class="header-center">
                <div>Republic of the Philippines</div>
                <div>Quezon City • District III</div>
                <h1>BARANGAY BLUE RIDGE B</h1>
                <h2>OFFICE OF THE PUNONG BARANGAY</h2>
            </div>
            <div class="clearance-no">Permit No.<br><span style="font-size:15.5px;">${permitNumber}</span></div>
        </header>

        <div class="doc-title">UTILITIES PERMIT & GATE PASS</div>

        <div class="content-wrapper">
            <div class="sidebar">
                <strong>HON. ${CAPTAIN_NAME}</strong><br><span>Punong Barangay</span><br><br>
                <strong>KAGAWADS</strong><br>HON. ${KAGAWAD_1}<br>HON. ${KAGAWAD_2}<br>HON. ${KAGAWAD_3}<br>HON. ${KAGAWAD_4}<br>HON. ${KAGAWAD_5}<br>HON. ${KAGAWAD_6}<br><br>
                <strong>MR. ${SECRETARY_NAME}</strong><br><span>Barangay Secretary</span>
            </div>

            <div class="main-body">
                <strong>TO THE SECURITY PERSONNEL:</strong><br><br>
                <p>This serves as an official entry clearance for utility personnel to conduct works at <strong>${address}</strong> for the account of <strong>${grantee_name}</strong>.</p>
                
                <div class="gate-pass-highlight">
                    <span style="font-size: 14px; text-transform: uppercase; color: #555;">Authorized Date of Entry:</span><br>
                    <span style="font-size: 20px; font-weight: bold;">${workDate}</span>
                </div>

                <strong>Nature of Utility Work:</strong>
                <div style="margin: 10px 0 20px 40px;">
                    <div class="checkbox-option ${isInstall}">INSTALLATION</div>
                    <div class="checkbox-option ${isRepair}">REPAIR / MAINTENANCE</div>
                    <div class="checkbox-option ${isDisconnect}">PERMANENT DISCONNECTION</div>
                    <div class="checkbox-option ${isReconnect}">RECONNECTION</div>
                </div>

                <div style="text-align:center;">
                    Issued this <span class="fill-line" style="min-width:40px;">${day}</span> day of <span class="fill-line" style="min-width:100px;">${month}</span>, ${yearIssued}.
                </div>
            </div>
        </div>

        <div class="signature-area">
            <div class="signature-block">
                <div>Attested by:</div><div class="signature-line">${SECRETARY_NAME}</div><div>Barangay Secretary</div>
            </div>
            <div class="signature-block">
                <div>Approved by:</div><div class="signature-line">${CAPTAIN_NAME}</div><div>Punong Barangay</div>
            </div>
        </div>
        <div class="seal-note">*** THIS DOCUMENT IS NOT VALID WITHOUT THE OFFICIAL DRY SEAL ***</div>
    </div>
</body>
</html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
}

/**
 * Views an existing utility permit (reuses generate function)
 * 
 * @param {number} appId - The application ID to view permit for
 */
function viewUtilitiesPermit(appId) {
    generateUtilitiesPermit(appId);
}

let chart1Instance;
let chart2Instance;
let chart3Instance;

/**
 * Loads analytics data and renders charts for utility application statistics
 */
function loadAnalyticsTab() {
    fetch(`${UTILITY_HANDLER_URL}?action=chart_utilities_type`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_type.map(x => x.provider);
            const values2 = res.data_by_type.map(x => x.total);
            const totals2 = values2.slice();
            const percentages2 = res.data_by_type.map(x => x.percentage);

            const labels3 = res.data_by_dss.map(x => x.dss_status);
            const totals3 = res.data_by_dss.map(x => x.total);
            const percentages3 = res.data_by_dss.map(x => x.percentage);

            const dateColors = ['#4F46E5', '#2563EB', '#0284C7', '#0891B2', '#0D9488', '#14B8A6'];
            const typeColors = ['#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#84CC16'];
            const dssColors = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'];

            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();
            if (chart3Instance) chart3Instance.destroy();

            chart1Instance = new Chart(document.getElementById('chart1'), {
                type: 'line',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Utility Applications',
                        data: values1,
                        backgroundColor: dateColors,
                        borderWidth: 2,
                        tension: 0.4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals1[context.dataIndex];
                                    const percent = percentages1[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });

            chart2Instance = new Chart(document.getElementById('chart2'), {
                type: 'bar',
                data: {
                    labels: labels2,
                    datasets: [{
                        label: 'Utility Providers',
                        data: values2,
                        backgroundColor: typeColors,
                        borderWidth: 1,
                        borderRadius: '4',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals2[context.dataIndex];
                                    const percent = percentages2[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });

            chart3Instance = new Chart(document.getElementById('chart3'), {
                type: 'doughnut',
                data: {
                    labels: labels3,
                    datasets: [{
                        label: 'DST Status Distribution',
                        data: totals3,
                        backgroundColor: dssColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            align: 'center'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals3[context.dataIndex];
                                    const percent = percentages3[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading analytics:', error);
        });
}

/**
 * Applies pre-defined text prompts to the update comments textarea
 * 
 * @param {string} text - The text prompt to insert into the comments field
 */
function applyPrompt(text) {
    const textarea = document.getElementById('updateComments');
    if (textarea) {
        textarea.value = text;
        textarea.focus();
    }
}

/**
 * Opens the update modal for a specific application
 * 
 * @param {number} appId - The application ID to open in the update modal
 */
function openUpdateModal(appId) {
    const app = applications.find(a => a.id == appId);

    if (!app) {
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Not Found', text: 'Application data not found.' });
        return;
    }

    document.getElementById('updateAppId').value = app.id;
    document.getElementById('displayCurrentStatus').value = app.status;
    document.getElementById('newStatus').value = "";
    document.getElementById('updateComments').value = "";

    const existingDSSSection = document.getElementById('dssEvaluationSection');
    if (existingDSSSection) existingDSSSection.remove();

    addBasicDSSSection(app);
    fetchDSSEvaluation(appId, app);

    document.getElementById('updateModal').classList.add('active');
}

/**
 * Fetches DSS evaluation details from the server for a specific application
 * 
 * @param {number} appId - The application ID to fetch evaluation for
 * @param {Object} app - The application object containing basic application data
 */
function fetchDSSEvaluation(appId, app) {
    fetch(`${UTILITY_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            const existing = document.getElementById('dssEvaluationSection');
            if (data && data.status === 'success' && data.evaluation) {
                if (existing) existing.remove();
                addDSSSectionToModal(data.evaluation, app);
            } else {
                if (existing) existing.querySelector('.dss-loading')?.remove();
                const msg = (data && data.message) ? data.message : 'Detailed evaluation not available.';
                if (existing) {
                    const note = document.createElement('div');
                    note.className = 'dss-error-msg';
                    note.textContent = msg;
                    existing.appendChild(note);
                } else {
                    addBasicDSSSection(app);
                    const created = document.getElementById('dssEvaluationSection');
                    if (created) {
                        const note = document.createElement('div');
                        note.className = 'dss-error-msg';
                        note.textContent = msg;
                        created.appendChild(note);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching DSS evaluation:', error);
            const existing = document.getElementById('dssEvaluationSection');
            if (existing) existing.querySelector('.dss-loading')?.remove();
            const errMsg = error && error.message ? error.message : 'Failed to load evaluation.';
            if (existing) {
                const note = document.createElement('div');
                note.className = 'dss-error-msg';
                note.textContent = errMsg;
                existing.appendChild(note);
            } else {
                addBasicDSSSection(app);
                const created = document.getElementById('dssEvaluationSection');
                if (created) {
                    const note = document.createElement('div');
                    note.className = 'dss-error-msg';
                    note.textContent = errMsg;
                    created.appendChild(note);
                }
            }
        });
}

/**
 * Creates and inserts a detailed DSS evaluation section into the update modal
 * 
 * @param {Object} evaluation - The DSS evaluation data object
 * @param {Object} app - The application object for context
 */
function addDSSSectionToModal(evaluation, app) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingDSS = document.getElementById('dssEvaluationSection');
    if (existingDSS) existingDSS.remove();

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const details = evaluation.evaluation_details || {};
    const dssStatus = evaluation.dss_status || 'Pending Evaluation';
    const score = details.score || 0;
    const maxScore = details.max_score || 5;
    const probability = typeof details.approval_probability === 'number' ? details.approval_probability : (parseFloat(details.approval_probability) || 0);
    const passedRules = details.passed_rules || [];
    const failedRules = details.failed_rules || [];
    const recommendations = details.recommendations || [];

    let statusColor, statusBg;
    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Additional Requirements Needed':
            statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Rejected':
            statusColor = '#721c24'; statusBg = '#f8d7da'; break;
        default:
            statusColor = '#0c5460'; statusBg = '#d1ecf1';
    }

    dssSection.innerHTML = `
    <div class="dss-evaluation-section">
        <div class="dss-header">
            <h3>Evaluation Result</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg}; padding: 8px 12px;">
                ${dssStatus}
            </span>
        </div>
        <div class="dss-score-summary">
            <div class="dss-score">
                <strong>Score</strong>
                <span>${score}/${maxScore}</span>
            </div>
            <div class="dss-probability">
                <strong>Approval Probability</strong>
                <span>${probability.toFixed(2)}%</span>
            </div>
        </div>
        <div class="dss-progress-container">
            <div class="dss-progress-label">
                <span>Approval Progress</span>
                <span class="dss-progress-percentage">${probability}%</span>
            </div>
            <div class="dss-progress-bar">
                <div class="dss-progress-fill" style="width: ${Math.max(0, Math.min(100, probability))}%"></div>
            </div>
        </div>
        <div class="dss-rules-summary">
            <div class="dss-rules-column">
                <h4>Passed Rules (${passedRules.length})</h4>
                ${passedRules.length > 0 ?
            `<ul class="dss-rules-list passed">${passedRules.map(rule => `<li>${rule}</li>`).join('')}</ul>` :
            `<p style="color:#999; font-size:13px; margin:0; padding:8px 0;">No rules passed</p>`
        }
            </div>
            <div class="dss-rules-column">
                <h4>Failed Rules (${failedRules.length})</h4>
                ${failedRules.length > 0 ?
            `<ul class="dss-rules-list failed">${failedRules.map(rule => `<li>${rule}</li>`).join('')}</ul>` :
            `<p style="color:#999; font-size:13px; margin:0; padding:8px 0;">No rules failed</p>`
        }
            </div>
        </div>
        ${recommendations.length > 0 ? `
            <div class="dss-recommendations">
                <h4>Recommendations</h4>
                <ul class="dss-recommendations-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        ${evaluation.evaluated_at ? `
            <div class="dss-timestamp">
                Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
            </div>
        ` : ''}
    </div>
`;

    updateForm.insertBefore(dssSection, updateForm.firstChild);
}

/**
 * Creates a basic DSS section when detailed evaluation data is unavailable
 * 
 * @param {Object} app - The application object containing basic DSS status
 */
function addBasicDSSSection(app) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingDSS = document.getElementById('dssEvaluationSection');
    if (existingDSS) existingDSS.remove();

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const dssStatus = app.dss_status || 'Pending Evaluation';
    let statusColor, statusBg;

    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Additional Requirements Needed':
            statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Rejected':
            statusColor = '#721c24'; statusBg = '#f8d7da'; break;
        default:
            statusColor = '#0c5460'; statusBg = '#d1ecf1';
    }

    dssSection.innerHTML = `
        <div class="dss-header">
            <h3>DSS Evaluation</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg}; padding: 8px 12px;">
                ${dssStatus}
            </span>
        </div>
        <p class="dss-loading">Loading detailed evaluation...</p>
    `;

    updateForm.insertBefore(dssSection, updateForm.firstChild);
}

/**
 * Submits application status update to the server via API
 * Handles form data submission and displays success/error messages
 * 
 * @param {Event} event - The form submission event
 */
function submitUpdate(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('updateForm'));
    formData.append('action', 'update_status');

    fetch(`${UTILITY_HANDLER_URL}?action=update_status`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('updateModal').classList.remove('active');
                document.body.style.overflow = 'auto';
                Swal.fire({
                    ...swalTopConfig,
                    icon: 'success',
                    title: 'Success',
                    text: 'Application updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });

                if (sockets["utility_applications"] && sockets["utility_applications"].readyState === WebSocket.OPEN) {
                    sockets["utility_applications"].send(JSON.stringify({ type: "utility_applications_update", action: "status_update" }));
                }
                if (sockets["applications"] && sockets["applications"].readyState === WebSocket.OPEN) {
                    sockets["applications"].send(JSON.stringify({ type: "applications_update", action: "status_update" }));
                }
                if (sockets["utility"] && sockets["utility"].readyState === WebSocket.OPEN) {
                    sockets["utility"].send(JSON.stringify({ type: "utility_update", action: "status_update" }));
                }
                if (sockets["audit"] && sockets["audit"].readyState === WebSocket.OPEN) {
                    sockets["audit"].send(JSON.stringify({
                        type: "new_audit_log",
                        action: "new_audit_log",
                    }));
                }

                loadManagementTable();
                loadProcessTable();
                try { new BroadcastChannel('barangay_status_update').postMessage('status_update'); } catch(e) {}
            } else {
                Swal.fire({
                    ...swalTopConfig,
                    icon: 'error',
                    title: 'Update Failed',
                    text: data.message || 'An unknown error occurred.'
                });
            }
        })
        .catch(err => {
            console.error('Submit update error:', err);
            Swal.fire({
                ...swalTopConfig,
                icon: 'error',
                title: 'Network Error',
                text: 'Please check your connection.'
            });
        });
}

/**
 * Displays detailed application information in a modal view
 * Shows utility details, owner information, and assessment data
 * 
 * @param {number} appId - The application ID to view details for
 */
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    const utilityAddress = app.address_of_utility || 'Not specified';

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const content = `
        <div class="details-container">
            <div class="details-header-card">
                <div class="details-title">
                    <h2>${app.nature_of_work || 'Utility Application'}</h2>
                    <div class="details-id">Application ID: #${app.id}</div>
                </div>
                <div style="text-align:right;">
                    <span style="background:${statusBg}; color:${statusColor}; padding:6px 12px; border-radius:20px; font-weight:bold; text-transform:uppercase; font-size:12px;">
                        ${app.status}
                    </span>
                    <div style="font-size:12px; color:#666; margin-top:5px;">Date: ${app.request_date || 'N/A'}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="col-left">
                    <div class="detail-card">
                        <h3>Utility Information</h3>
                        <div class="detail-row"><span class="detail-label">Nature of Work</span> <span class="detail-value">${app.nature_of_work || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Provider</span> <span class="detail-value">${app.provider || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${utilityAddress}</span></div>
                        <div class="detail-row"><span class="detail-label">Coordinates</span> <span class="detail-value">${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</span></div>
                    </div>
                    <div class="detail-card" style="margin-top:20px;">
                        <h3>Owner Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${app.owner_contact_no || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.owner_address || 'N/A'}</span></div>
                    </div>
                </div>
                <div class="col-right">
                    <div class="detail-card">
                        <h3>Schedule & Agreement</h3>
                        <div class="detail-row"><span class="detail-label">Request Date</span> <span class="detail-value">${app.request_date || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Date of Work</span> <span class="detail-value">${app.date_of_work || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Agreement</span> <span class="detail-value">${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</span></div>
                    </div>
                    <div class="detail-card" style="margin-top:20px; border-color: #bee5eb;">
                        <h3>Evaluation Status</h3>
                        <div class="detail-row"><span class="detail-label">DST Status</span> <span class="detail-value" style="color:#0c5460; font-weight:bold;">${app.dss_status || 'Pending Evaluation'}</span></div>
                    </div>
                </div>
            </div>

            ${app.approval_comments || app.disapproval_reason ? `
            <div class="detail-card" style="background:#fff8e1; border-color:#ffeeba;">
                <h3 style="color:#856404; border-color:#ffeeba;">Official Remarks</h3>
                <p style="margin:0; color:#555;">${app.approval_comments || app.disapproval_reason}</p>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('modalBody').innerHTML = content;
    openModal('detailsModal');
}

/**
 * Loads application options into the summary select dropdown
 */
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.nature_of_work || 'Utility Application'}</option>`;
        });
    });
}

/**
 * Updates the summary display with detailed application information
 */
function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const summaryOutput = document.getElementById('summaryOutput');

    if (!appId) {
        summaryOutput.innerHTML = `
            <div class="placeholder-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Select a utility application from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const dateApplied = new Date(app.request_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    summaryOutput.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Utility Permit Profile</h1>
                <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${app.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>Utility Details</h3>
                    <div class="info-row"><span class="info-label">Nature of Work</span> <span class="info-value">${app.nature_of_work || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Provider</span> <span class="info-value">${app.provider || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.address_of_utility || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Coordinates</span> <span class="info-value">${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</span></div>
                </div>
                <div class="report-section">
                    <h3>Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.owner_contact_no || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Owner Address</span> <span class="info-value">${app.owner_address || 'N/A'}</span></div>
                </div>
            </div>
            <div class="report-column">
                <div class="report-section">
                    <h3>Schedule & Agreement</h3>
                    <div class="info-row"><span class="info-label">Request Date</span> <span class="info-value">${app.request_date || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Date of Work</span> <span class="info-value">${app.date_of_work || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Agreement</span> <span class="info-value">${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</span></div>
                </div>
            </div>
        </div>

        ${app.approval_comments ? `
        <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
            <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download</button>
            <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print</button>
        </div>
    `;
}

/**
 * Opens a modal dialog by adding the 'active' class
 * 
 * @param {string} modalId - The ID of the modal element to open    
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Closes a modal dialog by removing the 'active' class
 * Restores body scrolling to allow background interaction**/
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('close-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    if (e.target.classList.contains('cancel-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ESC key support
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

/**
 * Displays a temporary alert message to the user
 * 
 * @param {string} message - The alert message to display
 * @param {string} type - The alert type (success, danger, warning, info)
 */
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

/**
 * Prints the current summary report to a new window
 */
function printSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    if (!appId) {
        Swal.fire({
            ...swalTopConfig,
            icon: 'warning',
            title: 'No Application Selected',
            text: 'Please select an application to print.'
        });
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const dateApplied = new Date(app.request_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Utility Application Summary - #${app.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
        </head>
        <body>
            <div class="print-container">
                <div class="report-header">
                    <div class="report-title">
                        <h1>Utility Permit Profile</h1>
                        <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </div>
                    <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                        ${app.status}
                    </div>
                </div>
                <div class="report-grid">
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Utility Details</h3>
                            <div class="info-row"><span class="info-label">Nature of Work</span><span class="info-value">${app.nature_of_work || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Provider</span><span class="info-value">${app.provider || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Address</span><span class="info-value">${app.address_of_utility || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Coordinates</span><span class="info-value">${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</span></div>
                        </div>
                        <div class="report-section">
                            <h3>Ownership</h3>
                            <div class="info-row"><span class="info-label">Owner Name</span><span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                            <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${app.owner_contact_no || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Owner Address</span><span class="info-value">${app.owner_address || 'N/A'}</span></div>
                        </div>
                    </div>
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Schedule & Agreement</h3>
                            <div class="info-row"><span class="info-label">Request Date</span><span class="info-value">${app.request_date || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Date of Work</span><span class="info-value">${app.date_of_work || 'N/A'}</span></div>
                            <div class="info-row"><span class="info-label">Agreement</span><span class="info-value">${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</span></div>
                        </div>
                    </div>
                </div>
                ${app.approval_comments ? `
                <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
                    <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
                    <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
                </div>` : ''}
                <div class="footer-note">
                    <p>Document generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p>Barangay Utility Management System</p>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 100); };
                window.onafterprint = function() { setTimeout(function() { window.close(); }, 100); };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    printWindow.document.write(printHTML);
    printWindow.document.close();
}

/**
 * Downloads a summary report as a Word document
 * 
 * @param {number} appId - The application ID to download summary for
 */
function downloadSummary(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    const utilityAddress = app.address_of_utility || 'Not specified';

    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<div class="comment-box approval"><h3>Approval Comments</h3><p>${app.approval_comments}</p></div>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<div class="comment-box disapproval"><h3>Disapproval Reason</h3><p>${app.disapproval_reason}</p></div>`;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Utility Application Summary Report - ${app.id}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                h1 { color: #5B479B; border-bottom: 3px solid #826EEA; padding-bottom: 10px; font-size: 24pt; }
                h2 { color: #826EEA; margin-top: 30px; font-size: 16pt; }
                .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
                .info-list { list-style-type: none; padding: 0; }
                .info-list li { margin-bottom: 8px; }
                .info-list strong { display: inline-block; width: 180px; font-weight: bold; }
                .status-badge { background-color: ${app.status === 'Approved' ? '#d4edda' : app.status === 'Disapproved' ? '#f8d7da' : '#fff3cd'}; color: ${app.status === 'Approved' ? '#155724' : app.status === 'Disapproved' ? '#721c24' : '#856404'}; padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 10pt;}
                .comment-box { margin-top: 20px; padding: 15px; border-radius: 5px; }
                .comment-box h3 { font-size: 12pt; }
                .comment-box.approval { border: 1px solid #c3e6cb; background-color: #d4edda; }
                .comment-box.disapproval { border: 1px solid #f5c6cb; background-color: #f8d7da; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Utility Permit Summary Report</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>
                <h2>Utility Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Nature of Work:</strong> ${app.nature_of_work}</li>
                        <li><strong>Provider:</strong> ${app.provider}</li>
                        <li><strong>Utility Address:</strong> ${utilityAddress}</li>
                        <li><strong>Coordinates:</strong> ${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</li>
                        <li><strong>Request Date:</strong> ${app.request_date}</li>
                        <li><strong>Date of Work:</strong> ${app.date_of_work}</li>
                        <li><strong>Agreement:</strong> ${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</li>
                    </ul>
                </div>
                <h2>Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Contact:</strong> ${app.owner_contact_no}</li>
                        <li><strong>Owner Address:</strong> ${app.owner_address}</li>
                    </ul>
                </div>
                <h2>Application Status</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Submission Date:</strong> ${app.request_date}</li>
                        <li><strong>Current Status:</strong> <span class="status-badge">${app.status}</span></li>
                        <li><strong>DSS Evaluation:</strong> ${app.dss_status || 'Pending Evaluation'}</li>
                    </ul>
                    ${commentsHtml}
                </div>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Utility_Application_${app.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Creates a new utility application
 */
function createApplication(event) {
    event.preventDefault();
    Swal.fire({
        ...swalTopConfig,
        icon: 'info',
        title: 'Coming Soon',
        text: 'Create functionality is not implemented yet.'
    });
}

// ====================== STAFF CREATE FORM ======================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('staffCreateForm');
    if (!form) return;

    const submitBtn = document.getElementById('staffSubmitBtn');
    const clearBtn = document.getElementById('staffClearBtn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            form.reset();
            document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        let isValid = true;
        const requiredIds = ['firstName', 'lastName', 'contactNoOwner', 'addressOwner', 'utilityLotNo', 'utilityStreet', 'requestDate', 'dateOfWork', 'natureOfWork', 'provider'];

        requiredIds.forEach(id => {
            const field = document.getElementById(id);
            if (!field) return;
            const group = field.closest('.form-group');
            const err = group ? group.querySelector('.error-msg') : null;

            if (!field.value.trim() || (field.tagName === 'SELECT' && (field.value === '' || field.value === 'select'))) {
                isValid = false;
                if (group) group.classList.add('error');
                if (err) err.textContent = 'This field is required';
            } else {
                if (group) group.classList.remove('error');
                if (err) err.textContent = '';
            }
        });

        if (!isValid) {
            Swal.fire({ ...swalTopConfig, icon: 'warning', title: 'Incomplete Form', text: 'Please fill all required fields.' });
            return;
        }

        const formData = new FormData();
        formData.append('action', 'create');
        formData.append('firstName', document.getElementById('firstName').value.trim());
        formData.append('middleName', document.getElementById('middleName').value.trim());
        formData.append('lastName', document.getElementById('lastName').value.trim());
        formData.append('suffix', document.getElementById('suffix').value.trim());
        formData.append('contactNoOwner', document.getElementById('contactNoOwner').value.trim());
        formData.append('addressOwner', document.getElementById('addressOwner').value.trim());
        formData.append('utilityLotNo', document.getElementById('utilityLotNo').value.trim());
        formData.append('utilityStreet', document.getElementById('utilityStreet').value.trim());
        formData.append('latitude2', document.getElementById('latitude2').value || '');
        formData.append('longitude2', document.getElementById('longitude2').value || '');
        formData.append('requestDate', document.getElementById('requestDate').value);
        formData.append('dateOfWork', document.getElementById('dateOfWork').value);
        formData.append('natureOfWork', document.getElementById('natureOfWork').value);
        formData.append('provider', document.getElementById('provider').value);
        formData.append('agreed', '1');

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Application...';

        try {
            const res = await fetch(UTILITY_HANDLER_URL, { method: 'POST', body: formData, credentials: 'include' });
            const data = await res.json();

            if (data.status === 'success') {
                Swal.fire({
                    ...swalTopConfig,
                    icon: 'success',
                    title: 'Success!',
                    text: `Application created! ID: ${data.id || 'N/A'}`,
                    timer: 2500
                });
                form.reset();
            } else {
                Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Failed', text: data.message || 'Server error' });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error', text: 'Could not connect to server' });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

/**
 * Filters applications in review table
 */
function filterReviewApplications() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Returns the current date as a formatted string (YYYY-MM-DD)
 * 
 * @returns {string} Current date in YYYY-MM-DD format
 */
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Updates the application date input field with the current date
 */
function updateApplicationDate() {
    const dateInput = document.getElementById('applicationDate');
    if (dateInput) {
        dateInput.value = getCurrentDateString();
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

// ====================== DOMContentLoaded: Socket Initialization ======================
document.addEventListener('DOMContentLoaded', () => {
    fetchAuditLogs();
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);

    if (!sockets["utility_applications"]) {
        initSocket("utility_applications", "ws://localhost:8081", data => {
            if (data.type === "utility_applications_update") {
                refreshActiveTab();
                loadManagementTable();
                loadProcessTable();
            }
        });
    }

    if (!sockets["audit"]) {
        initSocket("audit", "ws://localhost:8081", (data) => {
            if (data.type === "new_audit_log") {
                if (data.payload) appendAuditRow(data.payload);
                else if (data.id) appendAuditRow(data);
                else fetchAuditLogs();
            }
        });
    }

    if (!sockets["archives"]) {
        initSocket("archives", "ws://localhost:8081", data => {
            if (data.type === "archives_update") {
                loadManagementTable();
                loadProcessTable();
            }
        });
    }

    if (!sockets["utility"]) {
        initSocket("utility", "ws://localhost:8081", data => {
            if (data.type === "utility_update") {
                refreshActiveTab();
            }
        });
    }

    // Event listener for status change to update textarea with templates
    const statusSelect = document.getElementById('newStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            const status = this.value;
            const commentBox = document.getElementById('updateComments');

            if (utilityStatusTemplates[status] && commentBox) {
                commentBox.value = utilityStatusTemplates[status];
            } else if (commentBox) {
                // Clear the box if a status without a template is selected
                commentBox.value = "";
            }
        });
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('archive-btn')) return;

    const tableName = e.target.dataset.table;
    if (tableName !== 'utility_applications') return;

    e.preventDefault();
    const appId = e.target.dataset.id;

    if (!appId || appId === 'undefined') {
        console.error('Invalid application ID:', appId);
        Swal.fire({
            ...swalTopConfig,
            icon: 'error',
            title: 'Error',
            text: 'Invalid application ID. Please try again.'
        });
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: 'This application will be archived.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, archive it',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            popup: 'archive-swal2-popup'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await archiveRecord('utility_applications', appId);

            // Remove the row immediately from the UI
            const row = e.target.closest('tr');
            if (row) row.remove();

            // Refresh both tables to ensure consistency
            loadManagementTable();
            loadProcessTable();
        }
    });
});

// Enhanced styles - SweetAlert2 forced to front layer
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .hidden { display: none !important; }
        .swal2-container, .sweetalert-top { z-index: 2147483647 !important; }
        .swal2-popup { z-index: 2147483647 !important; }
        .swal2-backdrop { z-index: 2147483646 !important; }
    </style>
`);

document.head.insertAdjacentHTML("beforeend", `
    <style>
        .swal2-title, .swal2-html-container { text-align: center !important; }
        .swal2-popup { text-align: center !important; }
    </style>
`);

// ===============================================
// EXPOSE ALL FUNCTIONS TO GLOBAL SCOPE
// ===============================================
window.loadApplicationsFromDB = loadApplicationsFromDB;
window.filterApplications = filterApplications;
window.createApplication = createApplication;
window.openUpdateModal = openUpdateModal;
window.viewDetails = viewDetails;
window.submitUpdate = submitUpdate;
window.applyPrompt = applyPrompt;
window.loadSummarySelect = loadSummarySelect;
window.updateSummary = updateSummary;
window.downloadSummary = downloadSummary;
window.printSummary = printSummary;
window.loadProcessTable = loadProcessTable;
window.loadAnalyticsTab = loadAnalyticsTab;
window.generateUtilitiesPermit = generateUtilitiesPermit;
window.generateUtilityPermit = generateUtilitiesPermit;
window.generateUtilitiesClearance = generateUtilitiesPermit;
window.viewUtilitiesPermit = viewUtilitiesPermit;
window.switchTab = switchTab;
window.initializeSidebarNav = initializeSidebarNav;
window.getCurrentDateString = getCurrentDateString;
window.updateApplicationDate = updateApplicationDate;
window.filterReviewApplications = filterReviewApplications;
window.showAlert = showAlert;
window.openModal = openModal;