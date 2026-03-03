// Configuration
const UTILITY_HANDLER_URL = '/Banwa/server/handlers/staff/utility/utility_handler.php';
const UPLOADS_BASE_PATH = '/Banwa/server/handlers/staff/utility/uploads/';
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
const PAGE_CATEGORY = 'utility';
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
        console.warn('Error handling staffMapFilterChanged in utilities:', err);
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
    // 1. GET ELEMENTS
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody');

    // If the table body doesn't exist, stop immediately
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    // If map filter hides this category, show message and do not render
    if (!mapFilterVisible) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">Hidden by map filters.</td>
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
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">
                    <div class="spinner"></div>Loading applications...
                </td>
            </tr>`;
        return;
    }

    // 4. FILTER LOGIC
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

    // 5. RENDER LOGIC
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
        // A. Determine Status Color
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Complied') badgeClass = 'complied';

        // B. Determine "Smart Action" Button
        let actionBtn = '';

        if (app.status === 'Pending') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'Complied') {
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
            <td>${app.owner_contact_no || 'N/A'}</td>
            <td>${app.provider || 'N/A'}</td>
            <td>${app.nature_of_work || 'N/A'}</td>
            <td>${app.address_of_utility || 'N/A'}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
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
 * Fetches utility applications from the server API
 * Updates the global applications array with retrieved data
 * 
 * @returns {Promise} Promise resolving to the applications array
 */
function loadApplicationsFromDB() {
    return fetch(`${UTILITY_HANDLER_URL}?action=fetch`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') applications = data.data;
            return applications;
        })
        .catch(error => {
            console.error('Error fetching applications:', error);
            applications = [];
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
            else if (app.status === 'Complied') { btnText = "Finalize Approval"; btnClass = "success"; }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.nature_of_work || 'N/A'}</td>
                    <td>${app.first_name} ${app.middle_name} ${app.last_name} ${app.suffix}</td>
                    <td>${app.provider}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
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
 * Loads analytics data and renders charts for utility application statistics
 * Creates three charts: timeline chart, provider distribution, and DSS status distribution
 */
function loadAnalyticsTab() {
    fetch(`${UTILITY_HANDLER_URL}?action=chart_utilities_type`)
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
    console.debug('fetchDSSEvaluation ->', UTILITY_HANDLER_URL, appId);
    fetch(`${UTILITY_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
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
    const maxScore = details.max_score || 5;
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

    // 1. Prepare Data
    const utilityAddress = app.address_of_utility || 'Not specified';

    // 2. Status Colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // 3. Build Professional HTML Structure
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
                        <div class="detail-row"><span class="detail-label">DSS Status</span> <span class="detail-value" style="color:#0c5460; font-weight:bold;">${app.dss_status || 'Pending Evaluation'}</span></div>
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
 * Populates the dropdown with application IDs and utility work types
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
 * Generates a professional report view with formatted data
 */
// function updateSummary() {
//     const appId = document.getElementById('summaryApplicationSelect').value;
//     const summaryOutput = document.getElementById('summaryOutput');

//     if (!appId) {
//         summaryOutput.innerHTML = `
//             <div class="placeholder-state">
//                 <i class="fas fa-file-invoice fa-3x"></i>
//                 <p>Select a utility application from the list above to view the full report.</p>
//             </div>`;
//         return;
//     }

//     const app = applications.find(a => a.id == appId);
//     if (!app) return;

//     // --- 1. Data Processing ---

//     // Status Badge Color Logic
//     let statusColor = '#6c757d';
//     let statusBg = '#e2e3e5';

//     switch (app.status) {
//         case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
//         case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
//         case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
//     }

//     // Formatted Dates
//     const dateApplied = new Date(app.request_date || app.created_at).toLocaleDateString('en-US', {
//         year: 'numeric', month: 'long', day: 'numeric'
//     });

//     // --- 2. Build HTML Structure ---

//     summaryOutput.innerHTML = `
//         <div class="report-header">
//             <div class="report-title">
//                 <h1>Utility Permit Profile</h1>
//                 <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
//             </div>
//             <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
//                 ${app.status}
//             </div>
//         </div>

//         <div class="report-grid">
//             <div class="report-column">
//                 <div class="report-section">
//                     <h3>Utility Details</h3>
//                     <div class="info-row"><span class="info-label">Nature of Work</span> <span class="info-value">${app.nature_of_work || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Provider</span> <span class="info-value">${app.provider || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.address_of_utility || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Coordinates</span> <span class="info-value">${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</span></div>
//                 </div>

//                 <div class="report-section">
//                     <h3>Ownership</h3>
//                     <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
//                     <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.owner_contact_no || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Owner Address</span> <span class="info-value">${app.owner_address || 'N/A'}</span></div>
//                 </div>
//             </div>

//             <div class="report-column">
//                 <div class="report-section">
//                     <h3>Schedule & Agreement</h3>
//                     <div class="info-row"><span class="info-label">Request Date</span> <span class="info-value">${app.request_date || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Date of Work</span> <span class="info-value">${app.date_of_work || 'N/A'}</span></div>
//                     <div class="info-row"><span class="info-label">Agreement</span> <span class="info-value">${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</span></div>
//                 </div>

//                 <div class="financial-box">
//                     <h3 style="border:none; margin:0 0 10px 0;">DSS Evaluation</h3>
//                     <div class="info-row"><span class="info-label">DSS Status</span> <span class="info-value">${app.dss_status || 'Pending Evaluation'}</span></div>
//                 </div>
//             </div>
//         </div>

//         ${app.approval_comments ? `
//         <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
//             <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
//             <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
//         </div>` : ''}

//         <div class="report-actions">
//             <button class="btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download Word</button>
//             <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print Report</button>
//         </div>
//     `;
// }
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
                <p>Select a utility application from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // --- 1. Data Processing ---

    // Status Badge Color Logic
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Formatted Dates
    const dateApplied = new Date(app.request_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // --- 2. Build HTML Structure ---

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
            fetch(`${UTILITY_HANDLER_URL}?action=archive&id=${appId}`)
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
//     printWindow.document.write('<html><head><title>Utility Application Summary</title>');
//     printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
//     printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/utilities_staff/utilities.css">');
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

    // --- 1. Data Processing ---

    // Status Badge Color Logic
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Complied': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Formatted Dates
    const dateApplied = new Date(app.request_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // --- 2. Build Print HTML Structure ---

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
                            <div class="info-row">
                                <span class="info-label">Nature of Work</span>
                                <span class="info-value">${app.nature_of_work || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Provider</span>
                                <span class="info-value">${app.provider || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${app.address_of_utility || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Coordinates</span>
                                <span class="info-value">${app.latitude || 'N/A'}, ${app.longitude || 'N/A'}</span>
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
                                <span class="info-value">${app.owner_contact_no || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Owner Address</span>
                                <span class="info-value">${app.owner_address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-column">
                        <div class="report-section">
                            <h3>Schedule & Agreement</h3>
                            <div class="info-row">
                                <span class="info-label">Request Date</span>
                                <span class="info-value">${app.request_date || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date of Work</span>
                                <span class="info-value">${app.date_of_work || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Agreement</span>
                                <span class="info-value">${app.agreed == 1 ? 'Agreed' : 'Not Agreed'}</span>
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
                    <p>Barangay Utility Management System</p>
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

    // Prepare data for HTML
    const utilityAddress = app.address_of_utility || 'Not specified';

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