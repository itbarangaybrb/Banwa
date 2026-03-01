// Configuration
const BUSINESS_HANDLER_URL = '/Banwa/server/handlers/staff/business/business_handler.php';
const UPLOADS_BASE_PATH = '/Banwa/server/handlers/staff/business/uploads/';
let applications = [];

// ===============================================
// GLOBAL SWEETALERT CONFIG - ALWAYS ON TOP
// ===============================================
const swalTopConfig = {
    target: document.body,
    backdrop: true,
    allowOutsideClick: false,
    customClass: {
        container: 'sweetalert-top'
    }
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
        filterApplications();
    } catch (err) {
        console.warn('Error handling staffMapFilterChanged in business:', err);
    }
});

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

    if (!mapFilterVisible) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 40px; color:#999;">Hidden by map filters.</td>
            </tr>`;
        return;
    }

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';

    tbody.innerHTML = '';

    if (!applications || !Array.isArray(applications) || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 40px; color:#999;">
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
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${app.id})">Verify Payment</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">Finalize</button>`;
        }
        else if (app.status === 'Approved') {
            actionBtn = `<button class="btn-secondary" onclick="generateClearance(${app.id})">Clearance</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">Update</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td style="font-weight:600;">${app.business_name}</td>
            <td>${app.first_name} ${app.middle_name} ${app.last_name} ${app.suffix}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'Unpaid'}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn-info" onclick="viewDetails(${app.id})" title="View Details">View</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Fetches business applications from the server API
 * Updates the global applications array with retrieved data
 * 
 * @returns {Promise} Promise resolving to the applications array
 */
/**
 * Fetches business applications from the server API
 * Updates the global applications array with retrieved data
 * Robustly handles JSON errors to prevent infinite loading
 */
async function loadApplicationsFromDB() {
    const tableBody = document.getElementById('tableBody');

    try {
        const response = await fetch(`${BUSINESS_HANDLER_URL}?action=fetch`);

        // 1. Check for HTTP errors (like 404 or 500)
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        // 2. Get text first to debug "Unexpected end of JSON"
        const textData = await response.text();

        if (!textData || textData.trim() === "") {
            throw new Error("Server returned empty response.");
        }

        // 3. Try parsing
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("Raw Server Response:", textData); // Check console to see the PHP error!
            throw new Error("Invalid JSON response from server. Check console for details.");
        }

        if (data.status === 'success') {
            applications = data.data;
        } else {
            console.error('Server reported error:', data.message);
            // Optional: alert('Error: ' + data.message);
            applications = [];
        }
        return applications;

    } catch (error) {
        console.error('Critical Error fetching applications:', error);
        applications = [];

        // Update UI to show error state instead of infinite loading
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 40px; color:#dc3545;">
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
}, 30000);


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
    fetch(`${BUSINESS_HANDLER_URL}?action=chart_business_type`)
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
 * Includes DSS evaluation results display and status tracking
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
    console.debug('fetchDSSEvaluation ->', BUSINESS_HANDLER_URL, appId);
    fetch(`${BUSINESS_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            console.debug('DSS response for', appId, data);
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
            <h3>DSS Evaluation Result</h3>
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
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal('updateModal');
            Swal.fire({
                ...swalTopConfig,
                icon: 'success',
                title: 'Success',
                text: 'Application updated successfully!',
                timer: 2000,
                showConfirmButton: false
            });
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

    const businessStatus = app.business_status || 'Not specified';

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
    fetch(`${BUSINESS_HANDLER_URL}?action=get_application_details&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
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
                ocrHtml += `
                    <div style="
                        max-height: 250px;
                        overflow-y: auto;
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

                    return `
                                <details style="margin-bottom: 12px;">
                                    <summary style="
                                        cursor: pointer;
                                        padding: 10px;
                                        background: ${isLatest ? '#e3f2fd' : '#f5f5f5'};
                                        border-radius: 4px;
                                        font-weight: ${isLatest ? '600' : '500'};
                                        line-height: 1.5;
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
                        <button class="btn-secondary" id="rerunOcrBtn-${appId}">Re-run OCR</button>
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
                                        // Re-render OCR card by triggering the same insertion flow
                                        const modalBody = document.getElementById('modalBody');
                                        // Remove old OCR card then re-open modal content (simple approach: close and re-open)
                                        // Instead we'll call fetchDSSEvaluation and reload the OCR section
                                        fetchDSSEvaluation(appId, app);
                                        // Re-fetch application details to update the OCR card
                                        // Slight delay to allow DB writes
                                        setTimeout(() => {
                                            fetch(`${BUSINESS_HANDLER_URL}?action=get_application_details&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store', credentials: 'same-origin' })
                                                .then(r2 => r2.json())
                                                .then(d2 => {
                                                    if (d2 && d2.status === 'success' && d2.application) {
                                                        // Replace OCR card
                                                        const existing = document.getElementById('ocrResultsCard');
                                                        if (existing) existing.remove();
                                                        // Insert updated OCR HTML by reusing this block: simpler to reload modal
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
                                    });                        }
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
            <button class="btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download</button>
            <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print</button>
        </div>
    `;
}

/**
 * Archives an application by sending a request to the server
 * Requires user confirmation before proceeding with archival
 * 
 * @param {number} appId - The application ID to archive
 */
function archiveApplication(appId) {
    Swal.fire({
        ...swalTopConfig,
        title: 'Are you sure?',
        text: "You want to archive this application? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, archive it!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${BUSINESS_HANDLER_URL}?action=archive&id=${appId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            ...swalTopConfig,
                            title: 'Archived!',
                            text: 'Application has been archived successfully.',
                            icon: 'success',
                            timer: 2500,
                            showConfirmButton: false
                        });
                        loadManagementTable();
                    } else {
                        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Error', text: data.message || 'Failed to archive.' });
                    }
                })
                .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error' }));
        }
    });
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
 * Restores body scrolling to enable normal page interaction
 * 
 * @param {string} modalId - The ID of the modal element to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

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
                // Auto-print when page loads
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 100);
                };
                
                // Also close when print dialog is cancelled
                window.onafterprint = function() {
                    setTimeout(function() {
                        window.close();
                    }, 100);
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

    const businessStatus = app.business_status || 'Not specified';
    const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';

    // Determine first uploaded filename (support JSON array or plain string)
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
        ? `<li><strong>Uploaded File:</strong> <a href="${UPLOADS_BASE_PATH}${firstUploaded}" style="color:#007bff; text-decoration: none;">View Document (${firstUploaded})</a></li>`
        : '<li><strong>Uploaded File:</strong> No file uploaded</li>';

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
            <title>Business Application Summary Report - ${app.id}</title>
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
                <h1>Business Application Summary Report</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>

                <h2>Business Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Business Name:</strong> ${app.business_name}</li>
                        <li><strong>Type of Business:</strong> ${app.type_of_business}</li>
                        <li><strong>Nature of Business:</strong> ${app.nature_of_business}</li>
                        <li><strong>Business Address:</strong> ${app.address_of_business}</li>
                        <li><strong>Business Address Status:</strong> ${businessStatus}</li>
                        <li><strong>Business Telephone:</strong> ${app.telephone_no_business}</li>
                        <li><strong>Email Address:</strong> ${app.email_address}</li>
                    </ul>
                </div>

                <h2>Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Telephone:</strong> ${app.telephone_no_owner}</li>
                        <li><strong>Owner Address:</strong> ${app.address_owner}</li>
                    </ul>
                </div>

                <h2>Structure & Requirements</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Structure Type:</strong> ${app.type_of_structure}</li>
                        <li><strong>Number of Employees:</strong> ${app.no_of_employees}</li>
                        <li><strong>Required Documents:</strong> 
                            <ul style="padding-left: 20px; margin-top: 5px; list-style-type: disc;"><li>${requirementsList}</li></ul>
                        </li>
                        ${fileUploadText}
                    </ul>
                </div>

                <h2>Application Status</h2>
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

    const grantee_name = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`;
    const businessName = app.business_name;
    const or_number = app.or_number || 'N/A';
    const date_issued = app.payment_date || app.application_date || getCurrentDateString();

    const natureOfApplication = app.nature_of_application ? app.nature_of_application.toLowerCase() : 'new';

    const date = new Date(date_issued);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear().toString().slice(-2);

    const CAPTAIN_NAME = "MARIA DELA CRUZ";
    const SECRETARY_NAME = "JUAN M. DELOS SANTOS";

    const isChecked = (type) => natureOfApplication === type ? 'checked' : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Blue Ridge B - Business Clearance</title>
    <style>
        :root {
            --sidebar-bg: #eef7e3; 
            --text-color: #000;
            --logo-url: url('../../../scripts/staff/business_staff/assets/logo.png'); 
        }

        body {
            font-family: "Times New Roman", Serif, sans-serif;
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            background-color: #f4f4f4;
        }

        .document-container {
            width: 8.5in;
            min-height: 11in;
            margin: 0 auto;
            background-color: white;
            padding: 40px 50px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
        }

        header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }

        .logo-container {
            position: absolute;
            left: 0;
            top: 0;
        }

        .logo-container img {
            width: 110px;
            height: auto;
        }

        .header-text {
            text-align: center;
            line-height: 1.4;
        }

        .header-text div { font-size: 14px; }
        .header-text h1 { margin: 10px 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;}
        .header-text h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }

        .doc-title {
            text-align: center;
            text-transform: uppercase;
            font-size: 28px;
            font-weight: bold;
            margin: 40px 0 50px 0;
            position: relative;
            z-index: 2;
            text-shadow: 2px 2px 0px white;
        }

        .content-wrapper {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 30px;
            position: relative;
            z-index: 2;
        }

        .content-wrapper::before {
            content: "";
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            height: 90%;
            background-image: var(--logo-url);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.12; 
            z-index: -1;
        }

        .sidebar {
            background-color: var(--sidebar-bg);
            padding: 20px 15px;
            border: 1px solid #cddbad;
            font-size: 13px;
            height: fit-content;
        }

        .sidebar .official-group { margin-bottom: 20px; }
        .sidebar .name { font-weight: bold; display: block; margin-top: 12px; text-transform: uppercase;}
        .sidebar .title { font-style: italic; display: block; font-size: 12px; }
        .sidebar .main-title { text-align: center; font-weight: bold; margin-bottom: 20px; display: block;}

        .main-body {
            font-size: 15px;
            line-height: 1.6;
        }

        .salutation {
            font-weight: bold;
            margin-bottom: 25px;
            display: block;
        }

        .fill-line {
            border-bottom: 1px solid black;
            display: inline-block;
            min-width: 50px;
            padding: 0 5px;
        }
        
        .fill-block {
            width: 100%;
        }

        .business-nature-section { margin: 20px 0; }
        .checkbox-group { margin-left: 40px; font-weight: bold; }
        .checkbox-option { display: block; margin: 5px 0; }
        .checkbox-option::before { content: "☐ "; font-weight: normal;}
        .checkbox-option.checked::before { content: "☑ "; font-weight: normal; }

        .issue-date { margin-top: 30px; text-align: right; }
        .or-details { margin-top: 30px; font-size: 14px;}
        .or-details div { margin-bottom: 5px; }

        footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            position: relative;
            z-index: 2;
            page-break-inside: avoid;
        }

        .signature-block {
            width: 45%;
            text-align: center;
        }

        .attested-by { text-align: left; margin-bottom: 40px; }
        .signature-line {
            border-bottom: 1px solid black;
            margin-bottom: 5px;
            font-weight: bold;
            text-transform: uppercase;
        }

        @media print {
            body { background-color: white; padding: 0; }
            .document-container {
                width: 100%; height: auto; box-shadow: none; margin: 0; padding: 30px 40px;
            }
            .sidebar, .content-wrapper::before {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>

    <div class="document-container">
        <header>
            <div class="header-text">
                <div>Republic of the Philippines</div>
                <div>Quezon City</div>
                <div>District III</div>
                <h1>BARANGAY BLUE RIDGE B</h1>
                <h2>OFFICE OF THE BARANGAY CHAIRMAN</h2>
            </div>
        </header>

        <div class="doc-title">BARANGAY BUSINESS CLEARANCE</div>

        <div class="content-wrapper">
            <aside class="sidebar">
                <div class="official-group" style="text-align: center;">
                    <span class="name">HON. ${CAPTAIN_NAME}</span>
                    <span class="title">Punong Barangay</span>
                </div>

                <span class="main-title">KAGAWADS</span>

                <div class="official-group">
                    <span class="name">HON. [KAGAWAD 1]</span>
                    <span class="name">HON. [KAGAWAD 2]</span>
                    <span class="name">HON. [KAGAWAD 3]</span>
                    <span class="name">HON. [KAGAWAD 4]</span>
                    <span class="name">HON. [KAGAWAD 5]</span>
                    <span class="name">HON. [KAGAWAD 6]</span>
                    <span class="name">HON. [KAGAWAD 7]</span>
                </div>

                <div class="official-group">
                    <span class="name">HON. [SK CHAIR NAME]</span>
                    <span class="title">S.K Chairperson</span>
                </div>

                <div class="official-group">
                    <span class="name">MR. ${SECRETARY_NAME}</span>
                    <span class="title">Brgy. Secretary</span>
                </div>

                <div class="official-group">
                    <span class="name">MR. [TREASURER NAME]</span>
                    <span class="title">Brgy. Treasurer</span>
                </div>
            </aside>

            <main class="main-body">
                <span class="salutation">TO WHOM IT MAY CONCERN:</span>

                <p>
                    This clearance is hereby granted to <span class="fill-line fill-block">${grantee_name}</span> with business address at <span class="fill-line" style="font-weight: bold;">Barangay Blue Ridge B, Quezon City</span>, to operate or engage in business trade or occupation in the vicinity of the Barangay for:
                </p>

                <div class="business-nature-section">
                    Business Name/Trade Name: <span class="fill-line fill-block">${businessName}</span>
                    <div class="checkbox-group">
                        <span class="checkbox-option ${isChecked('new')}">NEW</span> 
                        <span class="checkbox-option ${isChecked('renewal')}">RENEWAL</span> 
						<span class="checkbox-option ${isChecked('closure')}">CLOSURE</span> 
                    </div>
                </div>

                <p>
                    As having been complied with the requirements of the Barangay.
                </p>

                <p>
                    This clearance is issued upon request of the herein interested party for whatever purposes it may serve.
                </p>

                <p class="issue-date">
                    Issued this <span class="fill-line" style="width: 50px; text-align: center;">${day}</span> day of <span class="fill-line" style="width: 100px; text-align: center;">${month}</span>, 20<span class="fill-line" style="width: 30px;">${year}</span>.
                </p>

                <div class="or-details">
                    <div>Issued at OR No.: <span class="fill-line fill-block">${or_number}</span></div>
                    <div>Date Issued: <span class="fill-line fill-block">${date_issued}</span></div>
                    <div>Issued at: <span class="fill-line fill-block">Barangay Blue Ridge B Hall</span></div>
                </div>
            </main>
        </div>

        <footer>
            <div class="signature-block" style="text-align: left;">
                <div class="attested-by">Attested by:</div>
                <div class="signature-line">MR. ${SECRETARY_NAME}</div>
                <div class="title">Barangay Secretary</div>
            </div>

            <div class="signature-block">
                <div class="attested-by" style="text-align: center;">Approved by:</div>
                <div class="signature-line" style="margin-top: 40px;">HON. ${CAPTAIN_NAME}</div>
                <div class="title">Punong Barangay</div>
            </div>
        </footer>
    </div>
</body>
</html>
    `;

    const w = window.open('', '_blank', 'height=800,width=1000');
    w.document.write(html);
    w.document.close();
    w.onload = () => {
        w.print();
        w.onafterprint = () => w.close();
    };
}


/**
 * Creates a new business application
 */
async function createApplication(event) {
    event.preventDefault();           // ← Stops native form submit
    event.stopImmediatePropagation(); // ← Prevents any other listeners

    const form = document.getElementById('createForm');
    if (!form) return;

    // ==================== VALIDATION (your existing code) ====================
    let isValid = true;
    const errorMsgs = form.querySelectorAll('.error-msg');
    errorMsgs.forEach(msg => msg.textContent = '');

    function showError(input, message) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-msg')) errorDiv.textContent = message;
        isValid = false;
    }

    // Required text/email/tel inputs
    const requiredInputs = form.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]):not([type="file"]), select[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            showError(input, 'This field is required');
        }
    });

    // Radio groups: typeOfBusiness, businessStatus
    if (!form.querySelector('input[name="typeOfBusiness"]:checked')) {
        showError(form.querySelector('input[name="typeOfBusiness"]'), 'Please select a business type');
    }
    if (!form.querySelector('input[name="businessStatus"]:checked')) {
        showError(form.querySelector('input[name="businessStatus"]'), 'Please select business address status');
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
    const reqChecks = form.querySelectorAll('input[name="requirements"]:checked');
    if (reqChecks.length === 0) {
        showError(form.querySelector('.checkbox-group'), 'Please select at least one requirement');
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
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Validation Error', text: 'Please fix the highlighted errors.' });
        return;
    }

    // ==================== FORM DATA ====================
    const formData = new FormData();
    formData.append('action', 'create');

    for (let [key, value] of new FormData(form)) {
        formData.append(key, value);
    }

    const typeBiz = document.querySelector('input[name="typeOfBusiness"]:checked')?.value;
    if (typeBiz) formData.set('typeOfBusiness', typeBiz);

    const bizStatus = document.querySelector('input[name="businessStatus"]:checked')?.value;
    if (bizStatus) formData.set('businessStatus', bizStatus);

    const reqs = Array.from(form.querySelectorAll('input[name="requirements"]:checked')).map(cb => cb.value);
    if (reqs.length) formData.set('requirements', JSON.stringify(reqs));

    const appDate = document.getElementById('applicationDate');
    if (appDate) formData.set('applicationDate', appDate.value || new Date().toISOString().split('T')[0]);

    // ==================== SUBMIT (only once) ====================
    Swal.fire({ ...swalTopConfig, title: 'Submitting Application...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const resp = await fetch(BUSINESS_HANDLER_URL, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();

        if (data.status === 'success') {
            Swal.fire({ ...swalTopConfig, icon: 'success', title: 'Success!', text: data.message || 'Application created!' })
                .then(() => {
                    form.reset();
                    if (document.getElementById('management')?.classList.contains('active')) loadManagementTable();
                });
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (err) {
        console.error('Submission error:', err);
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Submission Failed', text: err.message });
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
window.onclick = function (event) {
    const modals = document.querySelectorAll('.staff-modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    });
}

// Status templates for quick text insertion
const statusTemplates = {
    'For Payment': "Your application is approved. Please pay the assessment amount of ₱[amount] via the portal or at the Treasury office.",
    'Disapproved': "Your application was disapproved due to: [reason]. You may re-apply once requirements are met.",
    'Missing Docs': "Some documents are unclear or missing. Please re-upload your DTI and Barangay Clearance.",
    'Approved': "Your Business Permit is now ready for pick-up/download."
};

// Event listener for status change to update textarea with templates
document.addEventListener('DOMContentLoaded', function () {
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

// Enhanced styles - SweetAlert2 forced to front layer
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .hidden { display: none !important; }
        
        /* FORCE SWEETALERT TO ALWAYS BE ON TOP OF MODALS */
        .swal2-container,
        .sweetalert-top {
            z-index: 2147483647 !important;
        }
        .swal2-popup {
            z-index: 2147483647 !important;
        }
        .swal2-backdrop {
            z-index: 2147483646 !important;
        }
    </style>
`);

// ==================== ATTACH FORM SUBMIT (THIS WAS MISSING!) ====================
document.addEventListener('DOMContentLoaded', function () {
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', createApplication);
        console.log('✅ createApplication successfully attached to form');
    } else {
        console.error('❌ Form with id="createForm" not found in the HTML!');
    }
});

// DO NOT REMOVE!!! - JEP
// /**
//  * Fetch audit logs from the server
//  * Clears and re-renders the entire audit table
//  *
//  * @async
//  * @returns {Promise<void>}
//  */
// async function fetchAuditLogs() {
//     try {
//         const resp = await fetch('/Banwa/server/api/shared/get_audit_logs.php', {
//             credentials: 'include',
//             cache: 'no-store'
//         });

//         const logs = await resp.json();

//         if (!Array.isArray(logs)) {
//             console.error('Invalid audit log response');
//             return;
//         }

//         const tbody = document.getElementById('auditTableBody');
//         if (!tbody) return;

//         tbody.innerHTML = '';

//         logs.forEach(log => {
//             const tr = document.createElement('tr');

//             tr.innerHTML = `
//                 <td>${log.id}</td>
//                 <td>${log.action}</td>
//                 <td>${log.full_name}</td>
//                 <td>${log.table_name}</td>
//                 <td>${log.record_id}</td>
//                 <td>${log.role_id}</td>
//                 <td>${log.created_at}</td>
//             `;

//             tbody.appendChild(tr);
//         });

//     } catch (err) {
//         console.error('Failed to fetch audit logs:', err);
//     }
// }

// fetchAuditLog