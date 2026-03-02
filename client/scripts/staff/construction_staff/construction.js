// Configuration
const CONSTRUCTION_HANDLER_URL = '/Banwa/server/handlers/staff/construction/construction_handler.php';
const UPLOADS_BASE_PATH = '/Banwa/server/handlers/staff/construction/uploads/';
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
const PAGE_CATEGORY = 'construction';
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
        console.warn('Error handling staffMapFilterChanged in construction:', err);
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
    const navLogo = document.querySelector('.nav_logo'); // Select the hamburger icon
    const sideNav = document.querySelector('.side_nav'); // Select the sidebar

    // --- NEW CLICK TOGGLE LOGIC ---
    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
            // Redraw Leaflet map after sidebar transition
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

    // Load initial tab
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

    // Update this to match your actual tab names
    if (tabName === 'management') {
        loadManagementTable();
    } else if (tabName === 'process') {
        loadProcessTable();
    } else if (tabName === 'summary') {
        loadSummarySelect();
    } else if (tabName === 'dashboard') {
        loadAnalyticsTab();
    }
    // Add 'create' tab handling if needed
}

/**
 * Loads the management table with applications from database
 * Serves as the main entry point for the management tab functionality
 */
function loadManagementTable() {
    loadApplicationsFromDB().finally(() => {
        // Also trigger the filter function immediately to populate the table
        filterApplications();
    });
}

/**
 * Filters and renders applications in the management table based on search criteria
 * Handles search term filtering, status filtering, and smart action button generation
 * Displays appropriate status badges and action buttons based on application state
 */
function filterApplications() {
    // 1. GET ELEMENTS - Fixed IDs
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody'); // Direct ID

    // If the table body doesn't exist, stop immediately
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    // If map filter hides this category, show message and do not render
    if (!mapFilterVisible) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color:#999;">Hidden by map filters.</td>
            </tr>`;
        return;
    }

    // 2. GET SEARCH VALUE
    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';

    // Clear table body
    tbody.innerHTML = '';

    // 3. CHECK IF APPLICATIONS ARE LOADED
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color:#999;">
                    <div class="spinner"></div>Loading applications...
                </td>
            </tr>`;
        return;
    }

    // 4. FILTER LOGIC
    const filtered = applications.filter(app => {
        const natureOfActivity = (app.nature_of_activity || '').toLowerCase();
        const fullName = ((app.first_name || '') + ' ' + (app.last_name || '')).toLowerCase();
        const id = (app.id || '').toString();
        const address = (app.construction_address || '').toLowerCase();

        return natureOfActivity.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            id.includes(searchTerm) ||
            address.includes(searchTerm);
    });

    // 5. RENDER LOGIC
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color:#999;">
                    No matching applications found.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(app => {
        // A. Determine Status Color
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Paid') badgeClass = 'paid';
        if (app.status === 'For Payment') badgeClass = 'for-payment';

        // B. Determine "Smart Action" Button
        let actionBtn = '';

        if (app.status === 'Pending') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${app.id})">Verify Pay</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">Finalize</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">Update</button>`;
        }

        // C. Build Row - Match your table headers
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.first_name} ${app.middle_name} ${app.last_name} ${app.suffix}</td>
            <td>${app.nature_of_activity || 'N/A'}</td>
            <td>${app.contractor_name || 'N/A'}</td>
            <td>${app.contractor_contact_number || 'N/A'}</td>
            <td>${app.construction_address || 'N/A'}</td>
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
 * Fetches construction applications from the server API
 * Updates the global applications array with retrieved data
 * 
 * @returns {Promise} Promise resolving to the applications array
 */
function loadApplicationsFromDB() {
    return fetch(`${CONSTRUCTION_HANDLER_URL}?action=fetch`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') applications = data.data;
            return applications;
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
                    <td>${app.nature_of_activity}</td>
                    <td>${app.first_name} ${app.last_name}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${app.payment_status || 'Unpaid'}</td>
                    <td>
                        <button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>
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
 * Loads analytics data and renders charts for construction application statistics
 * Creates three charts: timeline chart, construction type distribution, and DSS status distribution
 */
function loadAnalyticsTab() {
    fetch(`${CONSTRUCTION_HANDLER_URL}?action=chart_construction_type`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_type.map(x => x.nature_of_activity);
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
                        label: 'Construction Applications',
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
                        label: 'Construction Types',
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
    // Find the specific application from our global array
    const app = applications.find(a => a.id == appId);

if (!app) {
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Not Found', text: 'Application data not found.' });
        return;
    }

    // Fill the hidden ID field and the visible "Current Status" text
    document.getElementById('updateAppId').value = app.id;
    document.getElementById('displayCurrentStatus').value = app.status;

    // Reset the form fields
    document.getElementById('newStatus').value = "";
    document.getElementById('updateComments').value = "";
    document.getElementById('assessmentAmount').value = "";
    document.getElementById('amountFieldGroup').classList.add('hidden');

    // Clear previous DSS content
    const existingDSSSection = document.getElementById('dssEvaluationSection');
    if (existingDSSSection) existingDSSSection.remove();

    // Insert a basic/loading DSS section immediately
    addBasicDSSSection(app);

    // Fetch DSS evaluation details and replace basic section when available
    fetchDSSEvaluation(appId, app);

    // Show the modal
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
    console.debug('fetchDSSEvaluation ->', CONSTRUCTION_HANDLER_URL, appId);
    fetch(`${CONSTRUCTION_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
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
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg};">
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

    // Only show the payment amount field if "For Payment" is selected
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

    fetch(`${CONSTRUCTION_HANDLER_URL}`, { method: 'POST', body: formData })
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
                Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Update Failed', text: data.message || 'An unknown error occurred.' });
            }
        })
        .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error', text: 'Please check your connection.' }));
}

/**
 * Displays detailed application information in a modal view.
 * Fetches fresh data and renders styled document previews and OCR result lists.
 * @param {number} appId - The application ID to view details for
 */
async function viewDetails(appId) {
    // 1. Show modal with loading state immediately
    openModal('detailsModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 15px; color: #666; font-weight: 500;">Loading application details and OCR results...</p>
        </div>`;

    try {
        // 2. Fetch the specific details from the server
        const response = await fetch(`${CONSTRUCTION_HANDLER_URL}?action=get_application_details&application_id=${appId}`);
        const data = await response.json();

        if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch details');

        const app = data.application;

        // === 3. AGGRESSIVE FILE EXTRACTION ===
        // Merged logic to handle all possible formats from the DB
        let files = [];
        const possibleFields = [app.requirement_upload_json, app.requirement_upload, app.documents, app.files];
        
        for (let field of possibleFields) {
            if (!field) continue;
            if (Array.isArray(field)) {
                files = field;
                break;
            }
            if (typeof field === 'string' && field.trim() !== '') {
                try {
                    const parsed = JSON.parse(field);
                    files = Array.isArray(parsed) ? parsed : [parsed];
                    break;
                } catch (e) {
                    // Fallback if it's just a single filename string
                    if (field.includes('.')) {
                        files = [{ filename: field }];
                        break;
                    }
                }
            }
        }

        const ocrRuns = Array.isArray(app.ocr_results) ? app.ocr_results : [];
        const constructionAddress = app.construction_address || 'Not specified';

        // Status Styling
        let statusColor = '#6c757d', statusBg = '#e2e3e5';
        switch (app.status) {
            case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
            case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
            case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
            case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
        }

        // === 4. GENERATE DOCUMENTS HTML ===
        let documentsHtml = '';
        if (files.length > 0) {
            documentsHtml = files.map(file => {
                const fileName = file.filename || file.name || "Document";
                const ext = fileName.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
                const isPdf = ext === 'pdf';
                const url = file.file_url || (UPLOADS_BASE_PATH + fileName);

                let previewContent = '';
                if (isImage) {
                    // Integrated the 'onerror' fallback here
                    previewContent = `
                        <img src="${url}" alt="Preview" style="width:100%; height:160px; object-fit:contain; background:#e9ecef; border-radius:4px; border:1px solid #dee2e6; cursor:pointer;" 
                             onclick="window.open('${url}')"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'height:160px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;\'><i class=\'fas fa-image-slash fa-3x\' style=\'color:#adb5bd;\'></i><span style=\'font-size:11px; color:#999; margin-top:5px;\'>Image Not Found</span></div>';">`;
                } else if (isPdf) {
                    previewContent = `<div style="height:160px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;"><i class="fas fa-file-pdf fa-4x" style="color:#dc3545;"></i><span style="font-size:12px; margin-top:5px; color:#666;">PDF Document</span></div>`;
                } else {
                    previewContent = `<div style="height:160px; display:flex; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;"><i class="fas fa-file-alt fa-4x" style="color:#6c757d;"></i></div>`;
                }

                return `
                    <div style="background:#f8f9fa; border:1px dashed #ced4da; padding:15px; border-radius:8px; margin-bottom:20px; text-align:center;">
                        <h4 style="margin:0 0 10px 0; color:#19316b; font-size:14px; overflow-wrap: break-word;">${fileName}</h4>
                        <div style="margin-bottom:12px;">${previewContent}</div>
                        <a href="${url}" target="_blank" class="btn-primary" style="display:inline-block; padding:8px 20px; text-decoration:none; font-size:13px; border-radius:4px; background-color: #19316b; color: white;">
                            <i class="fas fa-expand"></i> View Full File
                        </a>
                    </div>`;
            }).join('');
        } else {
            documentsHtml = `<div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ccc;">No documents uploaded yet.</div>`;
        }

        // === 5. GENERATE OCR RESULTS HTML ===
        let ocrHtml = `<h3 style="color: #777; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px;">OCR RESULTS (${ocrRuns.length} RUNS)</h3>`;
        
        if (ocrRuns.length > 0) {
            ocrHtml += `<div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">`;
            ocrHtml += ocrRuns.map((run, idx) => {
                const isLatest = idx === 0;
                const runDate = new Date(run.created_at).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                });

                let parsedOCR = { text: 'No text content', detected: [] };
                try { 
                    parsedOCR = typeof run.ocr_result === 'string' ? JSON.parse(run.ocr_result) : run.ocr_result || {}; 
                } catch(e) {}
                
                return `
                    <details ${isLatest ? 'open' : ''} style="margin-bottom: 10px; border: 1px solid ${isLatest ? '#bbdefb' : '#e9ecef'}; border-radius: 6px; background:${isLatest ? '#f0f7ff' : '#f8f9fa'}; overflow:hidden;">
                        <summary style="padding: 12px 15px; cursor: pointer; font-size: 13px; font-weight: 600; outline: none; display: flex; align-items: center;">
                            <i class="fas fa-play" style="font-size: 10px; margin-right: 10px; color: ${isLatest ? '#1976d2' : '#999'};"></i>
                            Run: ${runDate} ${isLatest ? '<span style="color:#1976d2; margin-left:8px;">(Latest)</span>' : ''}
                        </summary>
                        <div style="padding: 15px; background: #fff; border-top: 1px solid #eee; font-size: 13px;">
                            <div style="margin-bottom:8px;"><strong>File:</strong> <a href="${run.file_url}" target="_blank" style="color:#1976d2;">${run.filename || 'View Source'}</a></div>
                            <div style="margin-bottom:8px;"><strong>Detected:</strong> <span style="color:#28a745;">${(parsedOCR.detected || []).join(', ') || 'None'}</span></div>
                            <div style="background:#2c3e50; color:#ecf0f1; padding:12px; border-radius:4px; font-family:monospace; white-space:pre-wrap; max-height:150px; overflow-y:auto;">${parsedOCR.text}</div>
                        </div>
                    </details>`;
            }).join('');
            ocrHtml += `</div>`;
        } else {
            ocrHtml += `<div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">No OCR runs found.</div>`;
        }

        ocrHtml += `
            <div style="margin-top: 15px; text-align: right;">
                <button class="btn-secondary" onclick="reRunOCR(${app.id})" style="padding: 8px 16px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Re-run OCR Analysis
                </button>
            </div>`;

        // === 6. FINAL HTML ASSEMBLY ===
        modalBody.innerHTML = `
            <div class="details-container" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="details-header-card" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div class="details-title">
                        <h2 style="margin: 0; color: #19316b;">${app.nature_of_activity || 'Application'}</h2>
                        <div class="details-id" style="color: #777; font-size: 14px;">Application ID: #${app.id}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:${statusBg}; color:${statusColor}; padding:6px 12px; border-radius:20px; font-weight:bold; text-transform:uppercase; font-size:12px;">
                            ${app.status}
                        </span>
                        <div style="font-size:12px; color:#666; margin-top:5px;">Date: ${app.application_date || app.created_at}</div>
                    </div>
                </div>

                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="col-left" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h3 style="margin-top:0; color: #19316b; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Construction Information</h3>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Nature:</span> <span>${app.nature_of_activity}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Contractor:</span> <span>${app.contractor_name || 'N/A'}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Type of Work:</span> <span>${app.type_of_work}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Address:</span> <span>${constructionAddress}</span></div>
                        </div>

                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h3 style="margin-top:0; color: #19316b; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Owner Details</h3>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Name:</span> <span>${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Contact:</span> <span>${app.contact_no_owner}</span></div>
                        </div>

                        <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h2 style="margin-top: 0; color: #555; font-size: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; text-transform:uppercase;">Documents & Files</h2>
                            ${documentsHtml}
                        </div>
                    </div>

                    <div class="col-right" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            ${ocrHtml}
                        </div>

                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #17a2b8;">
                            <h3 style="margin-top:0; font-size:16px;">Assessment</h3>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Amount Due:</span> <span style="color:#0c5460; font-weight:bold;">₱${app.amount_due || '0.00'}</span></div>
                            <div style="display: flex; justify-content: space-between; font-size:14px;"><span style="font-weight: 600; color: #555;">Payment Status:</span> <span>${app.payment_status || 'Unpaid'}</span></div>
                        </div>
                    </div>
                </div>
            </div>`;

    } catch (error) {
        console.error('View Details Error:', error);
        modalBody.innerHTML = `<div style="text-align:center; padding:40px;"><p style="color:red;">${error.message}</p></div>`;
    }
}


/**
 * Loads application options into the summary select dropdown
 * Populates the dropdown with application IDs and construction activities
 */
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.nature_of_activity}</option>`;
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
                <p>Select a construction application from the list above to view the full report.</p>
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
                <h1>Construction Permit Profile</h1>
                <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${app.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>Construction Details</h3>
                    <div class="info-row"><span class="info-label">Activity</span> <span class="info-value">${app.nature_of_activity}</span></div>
                    <div class="info-row"><span class="info-label">Type of Work</span> <span class="info-value">${app.type_of_work}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.construction_address}</span></div>
                    <div class="info-row"><span class="info-label">Work Details</span> <span class="info-value">${app.details_of_work || 'N/A'}</span></div>
                </div>

                <div class="report-section">
                    <h3>Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.contact_no_owner}</span></div>
                    <div class="info-row"><span class="info-label">Owner Address</span> <span class="info-value">${app.address_owner}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>Schedule & Workforce</h3>
                    <div class="info-row"><span class="info-label">Start Date</span> <span class="info-value">${app.start_date}</span></div>
                    <div class="info-row"><span class="info-label">End Date</span> <span class="info-value">${app.end_date}</span></div>
                    <div class="info-row"><span class="info-label">Working Days</span> <span class="info-value">${app.number_of_working_days}</span></div>
                    <div class="info-row"><span class="info-label">Workers</span> <span class="info-value">${app.number_of_workers}</span></div>
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
            fetch(`${CONSTRUCTION_HANDLER_URL}?action=archive&id=${appId}`)
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
// function archiveApplication(appId) {
//     Swal.fire({
//         title: 'Are you sure?',
//         text: "You want to archive this application? This action cannot be undone.",
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#d33',
//         cancelButtonColor: '#3085d6',
//         confirmButtonText: 'Yes, archive it!'
//     }).then((result) => {
//         if (result.isConfirmed) {
//             fetch(`${CONSTRUCTION_HANDLER_URL}?action=archive&id=${appId}`)
//                 .then(res => res.json())
//                 .then(data => {
//                     if (data.status === 'success') {
//                         Swal.fire({
//                             title: 'Archived!',
//                             text: 'Application has been archived successfully.',
//                             icon: 'success',
//                             timer: 2500
//                         });
//                         loadManagementTable();
//                     } else {
//                         Swal.fire('Error', data.message || 'Failed to archive.', 'error');
//                     }
//                 })
//                 .catch(err => {
//                     console.error('Archive error:', err);
//                     Swal.fire('Error', 'Network error occurred.', 'error');
//                 });
//         }
//     });
// }

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
//     printWindow.document.write('<html><head><title>Construction Application Summary</title>');
//     printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
//     printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">');
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
            <title>Construction Application Summary - #${app.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
        </head>
        <body>
            <div class="print-container">
                <div class="report-header">
                    <div class="report-title">
                        <h1>Construction Permit Profile</h1>
                        <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </div>
                    <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                        ${app.status}
                    </div>
                </div>

                <div class="report-grid">
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Construction Details</h3>
                            <div class="info-row">
                                <span class="info-label">Activity</span>
                                <span class="info-value">${app.nature_of_activity}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Type of Work</span>
                                <span class="info-value">${app.type_of_work}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${app.construction_address}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Work Details</span>
                                <span class="info-value">${app.details_of_work || 'N/A'}</span>
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
                                <span class="info-value">${app.contact_no_owner}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Owner Address</span>
                                <span class="info-value">${app.address_owner}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-column">
                        <div class="report-section">
                            <h3>Schedule & Workforce</h3>
                            <div class="info-row">
                                <span class="info-label">Start Date</span>
                                <span class="info-value">${app.start_date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">End Date</span>
                                <span class="info-value">${app.end_date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Working Days</span>
                                <span class="info-value">${app.number_of_working_days}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Workers</span>
                                <span class="info-value">${app.number_of_workers}</span>
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
                    <p>Barangay Construction Management System</p>
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

    // Prepare list data for HTML
    const constructionAddress = app.construction_address || 'Not specified';
    const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';

    // Generate HTML for file upload link (support JSON arrays)
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

    // Generate HTML for comments
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<div class="comment-box approval"><h3>Approval Comments</h3><p>${app.approval_comments}</p></div>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<div class="comment-box disapproval"><h3>Disapproval Reason</h3><p>${app.disapproval_reason}</p></div>`;
    }

    // Generate the full HTML content with embedded CSS for styling
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Construction Application Summary Report - ${app.id}</title>
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
                <h1>Construction Permit Summary Report</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>

                <h2>Construction Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Nature of Activity:</strong> ${app.nature_of_activity}</li>
                        <li><strong>Type of Work:</strong> ${app.type_of_work}</li>
                        <li><strong>Construction Address:</strong> ${constructionAddress}</li>
                        <li><strong>Details of Work:</strong> ${app.details_of_work || 'N/A'}</li>
                        <li><strong>Start Date:</strong> ${app.start_date}</li>
                        <li><strong>End Date:</strong> ${app.end_date}</li>
                        <li><strong>Working Days:</strong> ${app.number_of_working_days}</li>
                        <li><strong>Number of Workers:</strong> ${app.number_of_workers}</li>
                    </ul>
                </div>

                <h2>Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Contact:</strong> ${app.contact_no_owner}</li>
                        <li><strong>Owner Address:</strong> ${app.address_owner}</li>
                    </ul>
                </div>

                <h2>Requirements & Documents</h2>
                <div class="card">
                    <ul class="info-list">
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
    link.download = `Construction_Application_${app.id}_Summary.doc`;
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
    Swal.fire({ ...swalTopConfig, icon: 'info', title: 'Coming Soon', text: 'Create functionality is not implemented yet.' });
}

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

function reRunOCR(appId) {
    Swal.fire({
        ...swalTopConfig,
        title: 'Re-run OCR Analysis?',
        text: 'This will re-process all uploaded documents. Continue?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Re-run',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(CONSTRUCTION_HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=re_run_ocr&id=' + encodeURIComponent(appId)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        ...swalTopConfig,
                        icon: 'success',
                        title: 'Queued!',
                        text: 'OCR re-run has been queued successfully.',
                        timer: 2500
                    });
                    viewDetails(appId);
                } else {
                    Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Failed', text: data.message || 'Failed to queue OCR re-run.' });
                }
            })
            .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error' }));
        }
    });
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
// Center SweetAlert text
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .swal2-title, .swal2-html-container { text-align: center !important; }
        .swal2-popup { text-align: center !important; }
    </style>
`);

document.addEventListener('DOMContentLoaded', function () {
    const navLogo = document.querySelector('.nav_logo');
    const sideNav = document.querySelector('.side_nav');

    navLogo.addEventListener('click', () => {
        sideNav.classList.toggle('expanded');
    });
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

// fetchAuditLogs