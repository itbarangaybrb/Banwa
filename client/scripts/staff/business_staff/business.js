// Configuration
import { initSocket, sockets } from '../../utils/socketUtils.js';
import { archiveRecord } from '../../utils/archives.js';
const BUSINESS_HANDLER_URL = '/server/handlers/staff/business/business_handler.php';
const UPLOADS_BASE_PATH = '/server/handlers/staff/business/uploads/';
let applications = [];

// SweetAlert config scoped to business page alerts only
const swalTopConfig = {
    target: document.body,
    backdrop: true,
    allowOutsideClick: false,
    width: '30rem',
    customClass: {
        container: 'sweetalert-top',
        popup: 'biz-swal-popup'
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
            // After transition completes, tell Leaflet to redraw to new size
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

    // Add overlay for map grayout effect when sidebar is expanded
    initializeMapOverlay();

    loadAnalyticsTab();
}

/**
 * Creates and initializes the overlay element for the map grayout effect
 * when the sidebar is expanded (similar to Google Maps sidebar behavior)
 */
function initializeMapOverlay() {
    const mainWrapper = document.querySelector('.main-wrapper');
    if (!mainWrapper) return;

    // Create the overlay element if it doesn't exist
    if (!document.querySelector('.modal-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        mainWrapper.insertBefore(overlay, mainWrapper.firstChild);

        // Close sidebar when clicking on the overlay
        overlay.addEventListener('click', function () {
            const sideNav = document.querySelector('.side_nav');
            if (sideNav && sideNav.classList.contains('expanded')) {
                sideNav.classList.remove('expanded');
            }
        });
    }
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
 * Serves as the main entry point for the management tab functionality
 */
function loadManagementTable() {
    loadApplicationsFromDB().finally(() => {
        filterApplications();
    });
}

/**
 * Filters and renders applications in the management table based on search criteria
 * Handles search term filtering, status filtering, and smart action button generation
 * Displays appropriate status badges and action buttons based on application state
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
                <td colspan="10" style="text-align:center; padding: 40px; color:#999;">
                    <div class="spinner"></div>Loading applications...
                </td>
            </tr>`;
        return;
    }

    const filtered = applications.filter(app => {
        const businessName = (app.business_name || '').toLowerCase();
        const fullName = ((app.first_name || '') + ' ' + (app.middle_name || '') + ' ' + (app.last_name || '') + ' ' + (app.suffix || '')).toLowerCase();
        const id = (app.id || '').toString();

        return businessName.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            id.includes(searchTerm);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 40px; color:#999;">
                    No matching applications found.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(app => {
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Paid') badgeClass = 'paid';
        if (app.status === 'For Payment') badgeClass = 'for-payment';

        let actionBtn = '';

        if (app.status === 'Pending') {
            actionBtn = `<button class="btn btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn btn-secondary" id="verifyPaymentBtn" onclick="openUpdateModal(${app.id})">Verify Payment</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn btn-success" onclick="openUpdateModal(${app.id})">Finalize</button>`;
        }
        else if (app.status === 'Approved') {
            actionBtn = `<button class="btn btn-secondary" onclick="generateClearance(${app.id})">Clearance</button>`;
        }
        else {
            actionBtn = `<button class="btn btn-secondary" onclick="openUpdateModal(${app.id})">Update</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td style="font-weight:600;">${app.business_name}</td>
            <td>${app.first_name ?? ''} ${app.middle_name ?? ''} ${app.last_name ?? ''} ${app.suffix ?? ''}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'Unpaid'}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn btn-info" onclick="viewDetails(${app.id})" title="View Details">View</button>
                    <button class="btn btn-secondary archive-btn" data-id="${app.id}" data-table="business_applications">Archive</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Fetches business applications from the server API
 * Updates the global applications array with retrieved data
 * Robustly handles JSON errors to prevent infinite loading
 */
async function loadApplicationsFromDB() {
    const tableBody = document.getElementById('tableBody');

    try {
        const response = await fetch(`${BUSINESS_HANDLER_URL}?action=fetch`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const textData = await response.text();

        if (!textData || textData.trim() === "") {
            throw new Error("Server returned empty response.");
        }

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("Raw Server Response:", textData);
            throw new Error("Invalid JSON response from server. Check console for details.");
        }

        if (data.status === 'success') {
            applications = (data.data || []).filter(app => !app.is_archived);
        } else {
            console.error('Server reported error:', data.message);
            applications = [];
        }
        return applications;

    } catch (error) {
        console.error('Critical Error fetching applications:', error);
        applications = [];

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding: 40px; color:#dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 
                        Error loading data: ${error.message}<br>
                        <small>Check the console (F12) for details.</small>
                    </td>
                </tr>`;
        }
        return applications;
    }
}

/**
 * Refreshes the currently active tab's content with latest application data.
 * Triggered by WebSocket construction updates.
 * 
 * Uses `isRefreshing` flag to prevent concurrent refreshes.
 * 
 * @see {@link loadApplicationsFromDB} - Fetches fresh data
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
};

/**
 * Loads applications into the process table with actionable statuses
 * Filters out excluded statuses and shows appropriate action buttons based on current status
 */
function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const excludedStatuses = ['Cancelled', 'Archived'];

        const actionable = applications.filter(app => {
            return !excludedStatuses.includes(app.status);
        });

        if (actionable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No applications to process.</td></tr>';
            return;
        }

        actionable.forEach(app => {
            let btnText = "Update";
            let btnClass = "secondary";

            if (app.status === 'Pending') { btnClass = "primary"; }
            else if (app.status === 'For Payment') { btnText = "Verify Payment"; btnClass = "warning"; }
            else if (app.status === 'Paid') { btnText = "Finalize Approval"; btnClass = "success"; }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.business_name}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${app.payment_status || 'Unpaid'}</td>
                    <td>
                        <button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>
                        ${app.status === 'Approved'
                    ? `<button class="btn-success" style="margin-left:6px;" onclick="generateClearance(${app.id})">Generate Clearance</button>`
                    : ''
                }
                    </td>
                </tr>
            `;
        });
    });
}

let chart1Instance;
let chart2Instance;
let chart3Instance;

/**
 * Loads analytics data and renders charts for business application statistics
 * Creates three charts: timeline chart, business type distribution, and DSS status distribution
 */
function loadAnalyticsTab() {
    fetch(`${BUSINESS_HANDLER_URL}?action=chart_business_type`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_type.map(x => x.type_of_business);
            const values2 = res.data_by_type.map(x => x.total);
            const totals2 = values2.slice();
            const percentages2 = values2.map(v => ((v / values2.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

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
                        label: 'Business Applications',
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
                        label: 'Business Types',
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
                        label: 'DSS Status Distribution',
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
 * Used for quick insertion of common status update messages
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
 * Opens the update modal for a specific application and loads current data
 * Includes Evaluation Results display and status tracking
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
    document.getElementById('assessmentAmount').value = "";
    document.getElementById('amountFieldGroup').classList.add('hidden');

    const existingDSSSection = document.getElementById('dssEvaluationSection');
    if (existingDSSSection) existingDSSSection.remove();

    addBasicDSSSection(app);
    fetchDSSEvaluation(appId, app);

    document.getElementById('updateModal').classList.add('active');
}

/**
 * Fetches DSS evaluation details from the server for a specific application
 * Handles both successful and failed fetch scenarios
 * 
 * @param {number} appId - The application ID to fetch evaluation for
 * @param {Object} app - The application object containing basic application data
 */
function fetchDSSEvaluation(appId, app) {
    // console.debug('fetchDSSEvaluation ->', BUSINESS_HANDLER_URL, appId);
    fetch(`${BUSINESS_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            // console.debug('DSS response for', appId, data);
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
 * Displays evaluation scores, status, rule results, and recommendations
 * 
 * @param {Object} evaluation - The DSS evaluation data object
 * @param {Object} app - The application object for context
 */
function addDSSSectionToModal(evaluation, app) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingDSS = document.getElementById('dssEvaluationSection');
    if (existingDSS) {
        existingDSS.remove();
    }

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const details = evaluation.evaluation_details || {};
    const dssStatus = evaluation.dss_status || 'Pending Evaluation';
    const score = details.score || 0;
    const maxScore = details.max_score || 6;
    const probability = typeof details.approval_probability === 'number' ? details.approval_probability : (parseFloat(details.approval_probability) || 0);
    const passedRules = details.passed_rules || [];
    const failedRules = details.failed_rules || [];
    const recommendations = details.recommendations || [];

    let statusColor, statusBg;
    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
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
 * Provides minimal DSS status display as fallback
 * 
 * @param {Object} app - The application object containing basic DSS status
 */
function addBasicDSSSection(app) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingDSS = document.getElementById('dssEvaluationSection');
    if (existingDSS) {
        existingDSS.remove();
    }

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const dssStatus = app.dss_status || 'Pending Evaluation';
    let statusColor, statusBg;

    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
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
 * Toggles visibility of the payment amount field based on status selection
 * Only shows amount field when "For Payment" status is selected
 */
function toggleAmountField() {
    const statusSelect = document.getElementById('newStatus');
    const amountGroup = document.getElementById('amountFieldGroup');
    const amountInput = document.getElementById('assessmentAmount');

    if (statusSelect.value === 'For Payment') {
        amountGroup.classList.remove('hidden');
        amountInput.setAttribute('required', 'required');
    } else {
        amountGroup.classList.add('hidden');
        amountInput.removeAttribute('required');
    }
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

    fetch(`${BUSINESS_HANDLER_URL}`, {
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

                if (sockets["business_applications"] && sockets["business_applications"].readyState === WebSocket.OPEN) {
                    sockets["business_applications"].send(JSON.stringify({ type: "business_applications_update", action: "status_update" }));
                }
                if (sockets["applications"] && sockets["applications"].readyState === WebSocket.OPEN) {
                    sockets["applications"].send(JSON.stringify({ type: "applications_update", action: "status_update" }));
                }

                if (sockets["business"] && sockets["business"].readyState === WebSocket.OPEN) {
                    sockets["business"].send(JSON.stringify({ type: "business_update", action: "status_update" }));
                }

                if (sockets["audit"] && sockets["audit"].readyState === WebSocket.OPEN) {
                    sockets["audit"].send(JSON.stringify({
                        type: "new_audit_log",
                        action: "new_audit_log",
                    }));
                }

                loadManagementTable();
                loadProcessTable();
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
            Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error', text: 'Please check your connection.' });
        });
}

/**
 * Displays detailed application information in a modal view
 * Shows business details, owner information, documents, and assessment data
 * 
 * @param {number} appId - The application ID to view details for
 */
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // FIX 1: Strip out [""] from the business status string using regex
    const businessStatus = app.business_status 
        ? app.business_status.replace(/[\[\]"]/g, '') 
        : 'Not specified';

    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsList = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<span class="badge-req">✓ ${r}</span>`).join(' ')
        : '<span style="color:#999;">No requirements logged</span>';

    let fileHtml = '<div class="file-viewer-box"><p style="color:#666;">No document uploaded.</p></div>';

    // Normalize uploaded files - support new `requirement_upload_json` (array) or legacy `requirement_upload` (string or JSON array)
    let uploadedFiles = [];
    if (app.requirement_upload_json) {
        if (Array.isArray(app.requirement_upload_json)) uploadedFiles = app.requirement_upload_json;
        else {
            try { uploadedFiles = JSON.parse(app.requirement_upload_json); } catch (e) { uploadedFiles = []; }
        }
    }
    if (!uploadedFiles.length && app.requirement_upload) {
        if (Array.isArray(app.requirement_upload)) uploadedFiles = app.requirement_upload;
        else {
            try {
                const p = JSON.parse(app.requirement_upload);
                if (Array.isArray(p)) uploadedFiles = p;
                else uploadedFiles = [app.requirement_upload];
            } catch (e) {
                uploadedFiles = [app.requirement_upload];
            }
        }
    }

    if (uploadedFiles.length > 0) {
        const filename = uploadedFiles[0];
        const filePath = `${UPLOADS_BASE_PATH}${filename}`;
        const fileExt = (filename || '').split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
            fileHtml = `
                <div class="file-viewer-box">
                    <p style="margin-bottom:10px; font-weight:bold; color:#19316b;">Attached Document</p>
                    <a href="${filePath}" target="_blank">
                        <img src="${filePath}" alt="Document Preview" class="file-thumbnail" title="Click to enlarge">
                    </a>
                    <br>
                    <a href="${filePath}" target="_blank" class="btn-view-doc"><i class="fas fa-expand"></i> View Full Image</a>
                </div>`;
        }
        else {
            // Use a generic file icon for non-image types (detect pdf specifically for icon color)
            const isPdf = fileExt === 'pdf';
            const iconClass = isPdf ? 'fa-file-pdf' : 'fa-file-alt';
            const iconColor = isPdf ? '#dc3545' : '#6c757d';
            fileHtml = `
                <div class="file-viewer-box">
                    <i class="fas ${iconClass} fa-3x" style="color:${iconColor}; margin-bottom:10px;"></i>
                    <p style="margin-bottom:10px; font-weight:bold;">${filename}</p>
                    <a href="${filePath}" target="_blank" class="btn-view-doc"><i class="fas fa-external-link-alt"></i> Open Document</a>
                </div>`;
        }
    }

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const content = `
        <div class="details-container">
            <div class="details-header-card">
                <div class="details-title">
                    <h2>${app.business_name}</h2>
                    <div class="details-id">Application ID: #${app.id}</div>
                </div>
                <div style="text-align:right;">
                    <span style="background:${statusBg}; color:${statusColor}; padding:6px 12px; border-radius:20px; font-weight:bold; text-transform:uppercase; font-size:12px;">
                        ${app.status}
                    </span>
                    <div style="font-size:12px; color:#666; margin-top:5px;">Date: ${app.application_date}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="col-left">
                    <div class="detail-card">
                        <h3>Business Information</h3>
                        <div class="detail-row"><span class="detail-label">Type</span> <span class="detail-value">${app.type_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Nature</span> <span class="detail-value">${app.nature_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.address_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Premises</span> <span class="detail-value">${businessStatus}</span></div>
                        <div class="detail-row"><span class="detail-label">Phone</span> <span class="detail-value">${app.telephone_no_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Email</span> <span class="detail-value" style="word-break:break-all;">${app.email_address}</span></div>
                    </div>

                    <div class="detail-card" style="margin-top:20px;">
                        <h3>Owner Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${app.telephone_no_owner}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.address_owner}</span></div>
                    </div>
                </div>

                <div class="col-right">
                    <div class="detail-card">
                        <h3>Documents & Files</h3>
                        <div style="margin-bottom:15px;">
                            <span class="detail-label" style="display:block; margin-bottom:5px;">Checklist:</span>
                            <div style="font-size:12px; line-height:1.6;">${requirementsList}</div>
                        </div>
                        ${fileHtml}
                    </div>

                    <div class="detail-card" style="margin-top:20px; border-color: #bee5eb;">
                        <h3>Assessment</h3>
                        ${app.amount_due > 0 ? `
                        <div class="detail-row"><span class="detail-label">Amount Due</span> <span class="detail-value" style="color:#0c5460; font-weight:bold;">₱${app.amount_due}</span></div>
                        <div class="detail-row"><span class="detail-label">Payment Status</span> <span class="detail-value">${app.payment_status}</span></div>
                        <div class="detail-row"><span class="detail-label">OR Number</span> <span class="detail-value">${app.or_number || 'Pending'}</span></div>
                        ` : '<p style="color:#666; font-style:italic;">No assessment amount set yet.</p>'}
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

    // Fetch detailed application data (includes OCR results) and render OCR section
    fetch(`${BUSINESS_HANDLER_URL}?action=get_application_details&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (!data || data.status !== 'success' || !data.application) return;
            const appDetail = data.application;
            const colRight = document.querySelector('#modalBody .details-container .col-right');
            if (!colRight) return;

            const existingOCR = document.getElementById('ocrResultsCard');
            if (existingOCR) existingOCR.remove();

            const ocrResults = appDetail.ocr_results || [];

            // Helper to format timestamp nicely (browser local time)
            const formatTimestamp = (ts) => {
                if (!ts) return 'Unknown time';
                const date = new Date(ts);
                if (isNaN(date.getTime())) return 'Invalid date';
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) + ' ' + date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            };

            // Sort newest first using created_at
            ocrResults.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });

            let ocrHtml = `
                <div class="detail-card" id="ocrResultsCard">
                    <h3>OCR Results (${ocrResults.length} ${ocrResults.length === 1 ? 'run' : 'runs'})</h3>
            `;

            if (ocrResults.length === 0) {
                ocrHtml += `<p style="color:#666; font-style:italic;">No OCR results available.</p>`;
            } else {
                // FIX 2: Added overflow-x: hidden to prevent the container from breaking
                ocrHtml += `
                    <div style="
                        max-height: 250px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        padding: 8px;
                        background: #fafafa;
                    ">
                        ${ocrResults.map((r, index) => {
                    const isLatest = index === 0;
                    const resObj = r.ocr_result || {};
                    const detected = (resObj.detected && resObj.detected.length)
                        ? resObj.detected.join(', ')
                        : 'None/Unknown';

                    const rawText = resObj.text || '';
                    const displayText = rawText.trim() ? rawText : 'No text extracted';

                    const escapedText = displayText
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    const fileName = r.saved_filename || r.filename || 'Unknown file';
                    const fileUrl = r.file_url || (r.saved_filename ? `${UPLOADS_BASE_PATH}${r.saved_filename}` : '#');
                    const timestamp = formatTimestamp(r.created_at);

                    // FIX 2: Added word-wrap and word-break to the summary tag to wrap long filenames
                    return `
                                <details style="margin-bottom: 12px;">
                                    <summary style="
                                        cursor: pointer;
                                        padding: 10px;
                                        background: ${isLatest ? '#e3f2fd' : '#f5f5f5'};
                                        border-radius: 4px;
                                        font-weight: ${isLatest ? '600' : '500'};
                                        line-height: 1.5;
                                        overflow-wrap: break-word;
                                        word-break: break-word;
                                    ">
                                        <strong>Run on:</strong> ${timestamp}
                                        ${isLatest ? ' <em>(latest)</em>' : ''}
                                        &nbsp;&nbsp;|&nbsp;&nbsp;
                                        <strong>File:</strong> <a href="${fileUrl}" target="_blank" style="color:#1976d2;">${fileName}</a>
                                        &nbsp;&nbsp;|&nbsp;&nbsp;
                                        <strong>Detected:</strong> ${detected}
                                    </summary>
                                    <div style="
                                        padding: 12px 16px;
                                        background: white;
                                        border-left: 3px solid #90caf9;
                                        margin-top: 4px;
                                        max-height: 500px;
                                        overflow-y: auto;
                                        border-radius: 0 0 4px 4px;
                                    ">
                                        <pre style="
                                            margin: 0;
                                            white-space: pre-wrap;
                                            word-wrap: break-word;
                                            font-family: monospace;
                                            font-size: 13px;
                                            color: #333;
                                        ">${escapedText}</pre>
                                    </div>
                                </details>
                            `;
                }).join('')}
                    </div>
                `;
            }

            // Re-run button (always visible)
            ocrHtml += `
                    <div style="margin-top:8px; text-align:right;">
                        <button class="btn btn-secondary" id="rerunOcrBtn-${appId}">Re-run OCR</button>
                    </div>
                </div>
            `;

            colRight.insertAdjacentHTML('afterbegin', ocrHtml);

            // Attach handler for re-run button
            const rerunBtn = document.getElementById(`rerunOcrBtn-${appId}`);
            if (rerunBtn) {
                rerunBtn.addEventListener('click', async () => {
                    rerunBtn.disabled = true;
                    const original = rerunBtn.textContent;
                    rerunBtn.textContent = 'Running...';
                    try {
                        const fd = new FormData();
                        fd.append('action', 'analyze_documents');
                        fd.append('application_id', appId);

                        const res = await fetch(BUSINESS_HANDLER_URL, { method: 'POST', body: fd, credentials: 'include', headers: { 'Accept': 'application/json' } });
                        const data = await res.json();
                        if (data && data.status === 'success') {
                            // Refresh OCR results and DSS section
                            fetch(`${BUSINESS_HANDLER_URL}?action=get_application_details&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'same-origin' })
                                .then(r => r.json())
                                .then(d => {
                                    if (d && d.status === 'success' && d.application) {
                                        fetchDSSEvaluation(appId, app);
                                        // Slight delay to allow DB writes
                                        setTimeout(() => {
                                            fetch(`${BUSINESS_HANDLER_URL}?action=get_application_details&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'same-origin' })
                                                .then(r2 => r2.json())
                                                .then(d2 => {
                                                    if (d2 && d2.status === 'success' && d2.application) {
                                                        const existing = document.getElementById('ocrResultsCard');
                                                        if (existing) existing.remove();
                                                        viewDetails(appId); // reopen details to refresh content
                                                    }
                                                });
                                        }, 800);
                                    } else {
                                        Swal.fire({
                                            ...swalTopConfig,
                                            icon: 'error',
                                            title: 'OCR Failed',
                                            text: data.message || 'Unknown error'
                                        });
                                    }
                                });
                        } else {
                            Swal.fire({
                                ...swalTopConfig,
                                icon: 'error',
                                title: 'OCR Failed',
                                text: data.message || 'Unknown error'
                            });
                        }
                    } catch (err) {
                        console.error(err);
                        Swal.fire({
                            ...swalTopConfig,
                            icon: 'error',
                            title: 'Network Error',
                            text: 'Could not run OCR. Please try again.'
                        });
                    } finally {
                        rerunBtn.disabled = false;
                        rerunBtn.textContent = original;
                    }
                });
            }
        })
        .catch(err => console.warn('Failed to load OCR results:', err));
}

/**
 * Loads application options into the summary select dropdown
 * Populates the dropdown with application IDs and business names
 */
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.business_name || 'Business Application'}</option>`;
        });
    });
}

/**
 * Updates the summary display with detailed application information
 * Generates a professional report view with formatted data
 */
function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const summaryOutput = document.getElementById('summaryOutput');

    if (!appId) {
        summaryOutput.innerHTML = `
            <div class="placeholder-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Select a business application from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')
        : '<li style="background:#fff3cd; color:#856404;">No documents logged</li>';

    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due
        ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : '₱0.00';

    const paymentStatus = app.payment_status || 'Unpaid';

    summaryOutput.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Business Profile</h1>
                <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${app.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>Business Identity</h3>
                    <div class="info-row"><span class="info-label">Business Name</span> <span class="info-value">${app.business_name}</span></div>
                    <div class="info-row"><span class="info-label">Type</span> <span class="info-value">${app.type_of_business}</span></div>
                    <div class="info-row"><span class="info-label">Nature</span> <span class="info-value">${app.nature_of_business}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.address_of_business}</span></div>
                </div>

                <div class="report-section">
                    <h3>Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.telephone_no_owner}</span></div>
                    <div class="info-row"><span class="info-label">Email</span> <span class="info-value">${app.email_address || 'N/A'}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>Operations & Docs</h3>
                    <div class="info-row"><span class="info-label">Structure</span> <span class="info-value">${app.type_of_structure}</span></div>
                    <div class="info-row"><span class="info-label">Employees</span> <span class="info-value">${app.no_of_employees}</span></div>
                    <div style="margin-top:15px;">
                        <span class="info-label" style="display:block; margin-bottom:5px;">Submitted Requirements:</span>
                        <ul class="doc-list">${requirementsHtml}</ul>
                    </div>
                </div>

                <div class="financial-box">
                    <h3 style="border:none; margin:0 0 10px 0;">Financial Status</h3>
                    <div class="info-row"><span class="info-label">Payment Status</span> <span class="info-value">${paymentStatus}</span></div>
                    <div class="info-row"><span class="info-label">OR Number</span> <span class="info-value">${app.or_number || '--'}</span></div>
                    <div class="financial-total">
                        <span>Total Assessment</span>
                        <span>${amountDue}</span>
                    </div>
                </div>
            </div>
        </div>

        ${app.approval_comments ? `
        <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
            <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download</button>
            <button class="btn btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print</button>
        </div>
    `;
}

/**
 * Opens a modal dialog by adding the 'active' class
 * Disables body scrolling to prevent background interaction
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
    // X buttons
    if (e.target.classList.contains('close-btn')) {
        const modal = e.target.closest('.staff-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Cancel buttons
    if (e.target.classList.contains('cancel-btn')) {
        const modal = e.target.closest('.staff-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ESC key support
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        const activeModal = document.querySelector('.staff-modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

/**
 * Displays a temporary alert message to the user
 * Supports different alert types (success, danger, etc.) with automatic dismissal
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
 * Creates a print-friendly version of the summary content
 */
// function printSummary() {
//     const summaryToPrint = document.getElementById('summaryOutput');

//     const printWindow = window.open('', '', 'height=600,width=800');
//     printWindow.document.write('<html><head><title>Business Application Summary</title>');
//     printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
//     printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">');
//     printWindow.document.write('</head><body>');
//     printWindow.document.write(summaryToPrint.innerHTML);
//     printWindow.document.write('');
//     printWindow.document.write('</body></html>');
//     printWindow.document.close();
//     printWindow.focus();
// }

/**
 * Prints the current summary report to a new window
 * Creates a print-friendly version of the summary content with proper structure
 */
function printSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    if (!appId) {
        Swal.fire({ ...swalTopConfig, icon: 'warning', title: 'No Application Selected', text: 'Please select an application to print.' });
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // Get status colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Parse requirements
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')
        : '<li style="background:#fff3cd; color:#856404;">No documents logged</li>';

    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due
        ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : '₱0.00';

    const paymentStatus = app.payment_status || 'Unpaid';

    // Create print-specific HTML with the same structure as updateSummary()
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Business Application Summary - #${app.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">
            <link rel="stylesheet" href="../../../styles/staff/analytics.css">
            <link rel="stylesheet" href="../../../styles/staff/dss.css" />
            <link rel="stylesheet" href="../../../styles/staff/map_staff.css" />
            <style>
                /* Set half-inch margins for the printed page */
                @media print {
                    @page {
                        margin: 0.5in;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="report-header">
                    <div class="report-title">
                        <h1>Business Profile</h1>
                        <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </div>
                    <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                        ${app.status}
                    </div>
                </div>

                <div class="report-grid">
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Business Identity</h3>
                            <div class="info-row">
                                <span class="info-label">Business Name</span>
                                <span class="info-value">${app.business_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Type</span>
                                <span class="info-value">${app.type_of_business}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Nature</span>
                                <span class="info-value">${app.nature_of_business}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${app.address_of_business}</span>
                            </div>
                        </div>

                        <div class="report-section">
                            <h3>Ownership</h3>
                            <div class="info-row">
                                <span class="info-label">Owner Name</span>
                                <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Contact</span>
                                <span class="info-value">${app.telephone_no_owner}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Email</span>
                                <span class="info-value">${app.email_address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-column">
                        <div class="report-section">
                            <h3>Operations & Docs</h3>
                            <div class="info-row">
                                <span class="info-label">Structure</span>
                                <span class="info-value">${app.type_of_structure}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Employees</span>
                                <span class="info-value">${app.no_of_employees}</span>
                            </div>
                            <div style="margin-top:15px;">
                                <span class="info-label" style="display:block; margin-bottom:5px;">Submitted Requirements:</span>
                                <ul class="doc-list">${requirementsHtml}</ul>
                            </div>
                        </div>

                        <div class="financial-box">
                            <h3 style="border:none; margin:0 0 10px 0;">Financial Status</h3>
                            <div class="info-row">
                                <span class="info-label">Payment Status</span>
                                <span class="info-value">${paymentStatus}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">OR Number</span>
                                <span class="info-value">${app.or_number || '--'}</span>
                            </div>
                            <div class="financial-total">
                                <span>Total Assessment</span>
                                <span>${amountDue}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${app.approval_comments ? `
                <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
                    <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
                    <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
                </div>` : ''}

                <div class="footer-note">
                    <p>Document generated on ${new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    <p>Barangay Business Management System</p>
                </div>
            </div>
            
            <script>
                // Auto-print when page loads, but DO NOT close the window afterwards
                window.onload = function() {
                    window.print();
                };
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
 * Generates HTML content with embedded styles and triggers file download
 * 
 * @param {number} appId - The application ID to download summary for
 */
function downloadSummary(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // --- DATA PARSING ---
    const businessStatus = app.business_status || 'Not specified';
    
    // Parse requirements
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li style="margin-bottom: 4px;">&#10003; ${r}</li>`).join('')
        : '<li style="color:#856404;">No documents logged</li>';

    // Parse uploaded file
    let firstUploaded = null;
    if (app.requirement_upload_json) {
        if (Array.isArray(app.requirement_upload_json) && app.requirement_upload_json.length) firstUploaded = app.requirement_upload_json[0];
        else {
            try { const parsed = JSON.parse(app.requirement_upload_json); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; } catch (e) { }
        }
    }
    if (!firstUploaded && app.requirement_upload) {
        try { const parsed = JSON.parse(app.requirement_upload); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; else firstUploaded = app.requirement_upload; } catch (e) { firstUploaded = app.requirement_upload; }
    }

    const fileUploadText = firstUploaded
        ? `<div style="margin-top: 10px;"><strong>Uploaded File:</strong> <a href="${UPLOADS_BASE_PATH}${firstUploaded}" style="color:#00247C; text-decoration: underline;">View Document (${firstUploaded})</a></div>`
        : '<div style="margin-top: 10px; color:#666;"><strong>Uploaded File:</strong> No file uploaded</div>';

    // Parse Colors & Financials
    let statusColor = '#6c757d'; let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const amountDue = app.amount_due ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : '₱0.00';
    const paymentStatus = app.payment_status || 'Unpaid';

    // Parse Comments
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<div style="background:#d4edda; border:1px solid #c3e6cb; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#155724; font-size:14pt;">Official Remarks (Approval)</h3>
            <p style="margin:0; font-style:italic;">"${app.approval_comments}"</p>
        </div>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<div style="background:#f8d7da; border:1px solid #f5c6cb; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#721c24; font-size:14pt;">Disapproval Reason</h3>
            <p style="margin:0; font-style:italic;">"${app.disapproval_reason}"</p>
        </div>`;
    } else if (app.approval_comments) {
        commentsHtml = `<div style="background:#f8f9fa; border:1px solid #ddd; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#333; font-size:14pt;">Official Remarks</h3>
            <p style="margin:0; font-style:italic;">"${app.approval_comments}"</p>
        </div>`;
    }

    // --- HTML CONSTRUCTION FOR MS WORD ---
    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <title>Business Application Summary - #${app.id}</title>
            <style>
                @page { margin: 0.5in; }
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.4; color: #333; }
                .header-table { width: 100%; border-bottom: 2px solid #00247C; padding-bottom: 10px; margin-bottom: 20px; }
                .title { font-size: 24pt; color: #00247C; margin: 0; font-weight: bold; }
                .meta { color: #666; font-size: 11pt; }
                .badge { background: ${statusBg}; color: ${statusColor}; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11pt; text-align: center; border: 1px solid ${statusColor}; }
                .section-title { font-size: 14pt; color: #00247C; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; }
                .card { background: #fdfdfd; border: 1px solid #e2e2e2; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
                .label { color: #666; font-size: 9pt; text-transform: uppercase; margin-bottom: 2px; display: block; }
                .value { font-size: 11pt; font-weight: bold; margin-top: 0; margin-bottom: 12px; display: block; color: #222; }
                .footer { text-align: center; font-size: 9pt; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <table class="header-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="70%">
                        <h1 class="title">Business Profile</h1>
                        <div class="meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </td>
                    <td width="30%" align="right" valign="middle">
                        <span class="badge">${app.status}</span>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="10" cellspacing="0" border="0">
                <tr>
                    <td width="50%" valign="top" style="padding-left: 0;">
                        <div class="card">
                            <h3 class="section-title">Business Identity</h3>
                            
                            <span class="label">Business Name</span>
                            <span class="value">${app.business_name}</span>
                            
                            <span class="label">Type / Nature</span>
                            <span class="value">${app.type_of_business} &bull; ${app.nature_of_business}</span>
                            
                            <span class="label">Address</span>
                            <span class="value">${app.address_of_business}</span>

                            <span class="label">Address Status</span>
                            <span class="value">${businessStatus}</span>

                            <span class="label">Contact</span>
                            <span class="value">${app.telephone_no_business} &bull; ${app.email_address || 'N/A'}</span>
                        </div>

                        <div class="card">
                            <h3 class="section-title">Ownership</h3>
                            
                            <span class="label">Owner Name</span>
                            <span class="value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span>
                            
                            <span class="label">Owner Contact</span>
                            <span class="value">${app.telephone_no_owner}</span>

                            <span class="label">Owner Address</span>
                            <span class="value">${app.address_owner}</span>
                        </div>
                    </td>
                    <td width="50%" valign="top" style="padding-right: 0;">
                        <div class="card">
                            <h3 class="section-title">Operations & Docs</h3>
                            
                            <span class="label">Structure Type</span>
                            <span class="value">${app.type_of_structure}</span>
                            
                            <span class="label">Number of Employees</span>
                            <span class="value">${app.no_of_employees}</span>
                            
                            <span class="label">Submitted Requirements</span>
                            <ul style="margin-top: 5px; padding-left: 20px; font-size: 10pt; color: #222;">
                                ${requirementsHtml}
                            </ul>
                            ${fileUploadText}
                        </div>

                        <div class="card">
                            <h3 class="section-title">Financial Status</h3>
                            
                            <span class="label">Payment Status</span>
                            <span class="value">${paymentStatus}</span>
                            
                            <span class="label">OR Number</span>
                            <span class="value">${app.or_number || '--'}</span>
                            
                            <span class="label">Total Assessment</span>
                            <span class="value" style="color: #00247C;">${amountDue}</span>
                        </div>
                    </td>
                </tr>
            </table>

            ${commentsHtml}

            <div class="footer">
                Document generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br>
                Barangay Business Management System
            </div>
        </body>
        </html>
    `;

    // Trigger Download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Business_Application_${app.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Generates a business clearance document client-side using application data
 * Creates a professional HTML document with dynamic content and opens print dialog
 * 
 * @param {number} appId - The application ID to generate clearance for
 */
function generateClearance(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) {
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Not Found', text: `Application data not found for ID: ${appId}` });
        return;
    }

    const grantee_name = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`.trim();
    const businessName = app.business_name || 'N/A';
    const or_number = app.or_number || 'N/A';
    const date_issued = app.payment_date || app.application_date || getCurrentDateString();

    // === DYNAMIC CLEARANCE NUMBER (based on app.id) ===
    const currentYear = new Date().getFullYear();
    const clearanceNumber = `BRB-BC-${currentYear}-${String(app.id).padStart(4, '0')}`;

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


    const nature = (app.nature_of_application || 'new').toLowerCase();
    const isNew = nature.includes('new') ? 'checked' : '';
    const isRenewal = nature.includes('renew') ? 'checked' : '';
    const isClosure = nature.includes('closure') ? 'checked' : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Barangay Blue Ridge B - Business Clearance</title>
    <style>
        body { font-family: "Times New Roman", serif; margin:0; padding:20px; background:#f4f4f4; }
        .document-container {
            width: 8.5in; min-height: 11in; margin:0 auto; background:white;
            padding:45px 50px; box-shadow:0 0 20px rgba(0,0,0,0.1); position:relative;
        }
        header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
        .logo img { width:105px; }
        .header-center { text-align:center; flex:1; padding:0 20px; }
        .header-center h1 { font-size:23px; margin:6px 0 3px; text-transform:uppercase; letter-spacing:1px; }
        .header-center h2 { font-size:15px; margin:0; font-weight:bold; }
        .clearance-no { text-align:right; font-size:13.5px; font-weight:bold; }
        
        .doc-title { text-align:center; font-size:27px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin:35px 0 40px 0; }

        .content-wrapper { display:grid; grid-template-columns:235px 1fr; gap:35px; }
        .sidebar {
            background:#b8bad9; padding:20px 18px; border:1.5px solid #b8bad9;
            font-size:13px; line-height:1.65;
        }
        .main-body { font-size:15.2px; line-height:1.75; }
        
        .fill-line {
            border-bottom:1px solid #000; display:inline-block; min-width:260px; text-align:center;
        }
        .checkbox-group { margin:15px 0 25px 40px; }
        .checkbox-option { margin:8px 0; font-weight:600; }
        .checkbox-option::before { content:"☐ "; }
        .checkbox-option.checked::before { content:"☑ "; }

        .issue-date { margin:35px 0 25px 0; text-align:center; font-size:15.2px; }
        
        .signature-area {
            margin-top:70px; display:flex; justify-content:space-between;
        }
        .signature-block { width:46%; text-align:center; }
        .signature-line {
            border-bottom:1px solid black; margin:8px auto 4px auto; width:90%; padding-top:25px;
            font-weight:bold; text-transform:uppercase;
        }
        
        .seal-note {
            text-align:center; margin-top:55px; font-size:12.8px; font-style:italic; color:#222;
        }
        
        @media print {
            body { background:white; padding:0; }
            .document-container { box-shadow:none; padding:40px 48px; }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <header>
            <div class="logo">
                <img src="../../../scripts/staff/business_staff/assets/logo.png" alt="Barangay Logo">
            </div>
            
            <div class="header-center">
                <div>Republic of the Philippines</div>
                <div>Quezon City • District III</div>
                <h1>BARANGAY BLUE RIDGE B</h1>
                <h2>OFFICE OF THE PUNONG BARANGAY</h2>
            </div>

            <div class="clearance-no">
                Clearance No.<br>
                <span style="font-size:15.5px;">${clearanceNumber}</span>
            </div>
        </header>

        <div class="doc-title">BARANGAY BUSINESS CLEARANCE</div>

        <div class="content-wrapper">
            <!-- Sidebar (matches your screenshot exactly) -->
            <div class="sidebar">
                <strong>HON. ${CAPTAIN_NAME}</strong><br>
                <span style="font-size:12.5px;">Punong Barangay</span><br><br>
                
                <strong>KAGAWADS</strong><br>
                HON. ${KAGAWAD_1}<br>
                HON. ${KAGAWAD_2}<br>
                HON. ${KAGAWAD_3}<br>
                HON. ${KAGAWAD_4}<br>
                HON. ${KAGAWAD_5}<br>
                HON. ${KAGAWAD_6}<br><br>
                
                <strong>MR. ${SECRETARY_NAME}</strong><br>
                <span style="font-size:12.5px;">Barangay Secretary</span>
            </div>

            <!-- Main Content -->
            <div class="main-body">
                <strong>TO WHOM IT MAY CONCERN:</strong><br><br>
                
                <p>This is to certify that <span class="fill-line">${grantee_name}</span> of 
                <span class="fill-line">${businessName}</span> located at Barangay Blue Ridge B, 
                Quezon City, has complied with all the requirements of this Barangay.</p>

                <p>This clearance is hereby granted to operate or engage in the said business 
                for the purpose of securing a Mayor’s Permit.</p>

                <strong>Type of Application:</strong>
                <div class="checkbox-group">
                    <div class="checkbox-option ${isNew}">NEW</div>
                    <div class="checkbox-option ${isRenewal}">RENEWAL</div>
                    <div class="checkbox-option ${isClosure}">CLOSURE</div>
                </div>

                <div class="issue-date">
                    Issued this <span class="fill-line" style="min-width:48px;">${day}</span> 
                    day of <span class="fill-line" style="min-width:115px;">${month}</span>, 
                    ${yearIssued}.
                </div>

                <div style="margin-top:20px;">
                    <strong>OR No.:</strong> <span class="fill-line">${or_number}</span><br><br>
                    <strong>Date Issued:</strong> <span class="fill-line">${date_issued}</span>
                </div>
            </div>
        </div>

        <div class="signature-area">
            <div class="signature-block">
                <div>Attested by:</div>
                <div class="signature-line">${SECRETARY_NAME}</div>
                <div>Barangay Secretary</div>
            </div>
            <div class="signature-block">
                <div>Approved by:</div>
                <div class="signature-line">${CAPTAIN_NAME}</div>
                <div>Punong Barangay</div>
            </div>
        </div>

        <div class="seal-note">
            *** THIS DOCUMENT IS NOT VALID WITHOUT THE OFFICIAL DRY SEAL OF THE BARANGAY ***
        </div>
    </div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=1000,height=850');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
}


/**
 * Creates a new business application
 */
async function createApplication(event) {
    event.preventDefault();

    const createApplicationform = document.getElementById('createStaffForm');

    // ==================== CLIENT-SIDE VALIDATION ====================
    let isValid = true;
    const errorMsgs = createApplicationform.querySelectorAll('.error-msg');
    errorMsgs.forEach(msg => msg.textContent = ''); // Clear previous errors

    // Helper to show error
    function showError(input, message) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-msg')) {
            errorDiv.textContent = message;
        }
        isValid = false;
    }

    // Required text/email/tel inputs
    const requiredInputs = createApplicationform.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]):not([type="file"]), select[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            showError(input, 'This field is required');
        }
    });

    // Radio groups: typeOfBusiness, businessStatus
    if (!createApplicationform.querySelector('input[name="typeOfBusiness"]:checked')) {
        showError(createApplicationform.querySelector('input[name="typeOfBusiness"]'), 'Please select a business type');
    }
    if (!createApplicationform.querySelector('input[name="businessStatus"]:checked')) {
        showError(createApplicationform.querySelector('input[name="businessStatus"]'), 'Please select business address status');
    }

    // Phone patterns
    const phoneInputs = [document.getElementById('contactNoOwner'), document.getElementById('contactNoBusiness')];
    phoneInputs.forEach(input => {
        if (input.value && !/^\d{1,11}$/.test(input.value)) {
            showError(input, 'Invalid phone number (1-11 digits only)');
        }
    });

    // Email
    const email = document.getElementById('emailAddress');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showError(email, 'Invalid email format');
    }

    // Number of employees / lot nos
    const numInputs = [document.getElementById('noOfEmployees'), document.getElementById('lotNo'), document.getElementById('businessLotNo')];
    numInputs.forEach(input => {
        if (input.value && !/^\d{1,2}$/.test(input.value)) {
            showError(input, 'Must be 1-2 digits');
        }
    });

    // Checkboxes: requirements (optional, but if none warn?)
    const reqChecks = createApplicationform.querySelectorAll('input[name="requirements"]:checked');
    if (reqChecks.length === 0) {
        showError(createApplicationform.querySelector('.checkbox-group'), 'Please select at least one requirement');
    }

    // File upload validation
    const fileInput = document.getElementById('requirementUpload');
    if (fileInput.files.length === 0) {
        showError(fileInput, 'Please upload at least one attachment');
    } else {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        Array.from(fileInput.files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                showError(fileInput, 'Invalid file type. Only PDF, JPG, JPEG, PNG allowed.');
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showError(fileInput, 'File too large. Max 5MB per file.');
            }
        });
    }

    // Coordinates (if required, but hidden so optional)
    const lat = document.getElementById('latitude2');
    const lng = document.getElementById('longitude2');
    if (lat.value && !/^-?\d{1,2}\.\d{6,8}$/.test(lat.value)) {
        showError(lat, 'Invalid latitude format');
    }
    if (lng.value && !/^-?\d{1,3}\.\d{6,8}$/.test(lng.value)) {
        showError(lng, 'Invalid longitude format');
    }

    if (!isValid) {
        Swal.fire({
            ...swalTopConfig,
            icon: 'error',
            title: 'Validation Error',
            text: 'Please fix the highlighted errors before submitting.'
        });
        return;
    }

    // ==================== SUBMIT ====================
    Swal.fire({
        ...swalTopConfig,
        title: 'Submitting Application...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const formData = new FormData();
        formData.append('action', 'create');

        const originalFormData = new FormData(createApplicationform);
        for (let [key, value] of originalFormData) {
            if (key !== 'action' && key !== 'requirements' && key !== 'requirementUpload') {
                formData.append(key, value);
            }
        }

        // Append radios
        const typeOfBusiness = document.querySelector('input[name="typeOfBusiness"]:checked')?.value;
        if (typeOfBusiness) formData.set('typeOfBusiness', typeOfBusiness);

        const businessStatusVal = document.querySelector('input[name="businessStatus"]:checked')?.value;
        if (businessStatusVal) formData.set('businessStatus', businessStatusVal);

        // Append checkboxes as array
        const requirements = Array.from(createApplicationform.querySelectorAll('input[name="requirements"]:checked'))
            .map(checkbox => checkbox.value);
        requirements.forEach(val => {
            formData.append('requirements[]', val);
        });

        // Append files as array
        if (fileInput && fileInput.files.length > 0) {
            Array.from(fileInput.files).forEach(file => {
                formData.append('requirementUpload[]', file);
            });
        }

        // Append application date
        const applicationDateElem = document.getElementById('applicationDate');
        if (applicationDateElem) {
            const dateVal = new Date().toISOString().split('T')[0];
            applicationDateElem.value = dateVal;
            formData.append('applicationDate', dateVal);
        }

        const resp = await fetch(BUSINESS_HANDLER_URL, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }

        const data = await resp.json();

        if (data.status === 'success') {
            Swal.fire({
                ...swalTopConfig,
                icon: 'success',
                title: 'Application Created',
                text: 'Your business application has been submitted successfully!',
                confirmButtonText: 'OK'
            }).then(() => {
                createApplicationform.reset();
                if (document.getElementById('management')?.classList.contains('active')) {
                    loadManagementTable();
                }
            });
        } else {
            throw new Error(data.message || 'Failed to create application');
        }
    } catch (err) {
        console.error('Submission error:', err);
        Swal.fire({
            ...swalTopConfig,
            icon: 'error',
            title: 'Submission Failed',
            text: err.message || 'An error occurred while submitting the application. Please try again.'
        });
    }
}

/**
 * Returns the current date as a formatted string (YYYY-MM-DD)
 * Used for date input field population
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
 * Called on page load and periodically to keep date current
 */
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
// window.onclick = function (event) {
//     const modals = document.querySelectorAll('.staff-modal');
//     modals.forEach(modal => {
//         if (event.target == modal) {
//             modal.classList.remove('active');
//         }
//     });
// }


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

// Status templates for quick text insertion
const statusTemplates = {
    'For Payment': "Your application is approved. Please pay the assessment amount of ₱[amount] via the portal or at the Barangay Hall.",
    'Disapproved': "Your application was disapproved due to: [reason]. You may re-apply once requirements are met.",
    'Additional Requirements': "Some documents are unclear or missing. Please re-upload your DTI and Barangay Clearance.",
    'Approved': "Your Business Clearance is now ready for pick-up."
};

// Event listener for status change to update textarea with templates
document.addEventListener('DOMContentLoaded', function () {
    fetchAuditLogs();

    if (!sockets["business_applications"]) {
        initSocket("business_applications", "ws://localhost:8081", data => {
            if (data.type === "business_applications_update") {
                refreshActiveTab();
                loadManagementTable();
                loadProcessTable();
            }
        });
    }

    if (!sockets["audit"]) {
        initSocket("audit", "ws://localhost:8081", (data) => {
            if (data.type === "new_audit_log") {
                if (data.payload) {
                    appendAuditRow(data.payload);
                }
                else if (data.id) {
                    appendAuditRow(data);
                }
                else {
                    fetchAuditLogs();
                }
            }
        });
    }

    if (!sockets["business_applications"]) {
        initSocket("business_applications", "ws://localhost:8081", data => {
            if (data.type === "business_applications_update") {
                refreshActiveTab();
            }
        });
    }

    const statusSelect = document.getElementById('newStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            const status = this.value;
            const commentBox = document.getElementById('updateComments');
            const amountGroup = document.getElementById('amountFieldGroup');

            if (status === 'For Payment') {
                amountGroup.classList.remove('hidden');
            } else {
                amountGroup.classList.add('hidden');
            }

            if (statusTemplates[status]) {
                commentBox.value = statusTemplates[status];
            }
        });
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('archive-btn')) return;

    const tableName = e.target.dataset.table;

    if (tableName !== 'business_applications') return;

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

            await archiveRecord('business_applications', appId);

            const row = e.target.closest('tr');
            if (row) row.remove();

            // Refresh both tables to ensure consistency
            loadManagementTable();
            loadProcessTable();
        }
    });
});

// Force SweetAlert above all page modals — z-index only, no layout overrides
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .hidden { display: none !important; }
        .swal2-container, .sweetalert-top { z-index: 2147483647 !important; }
        .swal2-backdrop { z-index: 2147483646 !important; }
        .biz-swal-popup { z-index: 2147483647 !important; }
        .swal2-title, .swal2-html-container { text-align: center !important; } /* ADDED THIS LINE */
    </style>
`);

// ===============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ===============================================
window.loadApplicationsFromDB = loadApplicationsFromDB;
window.filterApplications = filterApplications;
window.createApplication = createApplication;
window.openUpdateModal = openUpdateModal;
window.viewDetails = viewDetails;
window.submitUpdate = submitUpdate;
window.toggleAmountField = toggleAmountField;
window.applyPrompt = applyPrompt;
window.loadSummarySelect = loadSummarySelect;
window.updateSummary = updateSummary;
window.downloadSummary = downloadSummary;
window.printSummary = printSummary;
window.loadProcessTable = loadProcessTable;
window.loadAnalyticsTab = loadAnalyticsTab;
window.generateClearance = generateClearance;
window.generateBusinessPermit = generateClearance;
window.generateBusinessClearance = generateClearance;
window.switchTab = switchTab;
window.initializeSidebarNav = initializeSidebarNav;
window.refreshActiveTab = refreshActiveTab;
window.getCurrentDateString = getCurrentDateString;
window.updateApplicationDate = updateApplicationDate;
// window.validateOwnerAddress = validateOwnerAddress;
// window.validateBusinessAddress = validateBusinessAddress;