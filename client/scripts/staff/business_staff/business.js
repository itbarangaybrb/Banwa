// Configuration
const API_URL = '../../../scripts/staff/business_staff/business_handler.php';
// NOTE: Adjust this path to where your 'uploads' folder is located relative to this 'business.php' file.
const UPLOADS_BASE_PATH = '../../../scripts/staff/business_staff/uploads/'; // <--- This must be correct for file links to work
let applications = [];
// Map filter visibility flag for this management page
const PAGE_CATEGORY = 'business';
let mapFilterVisible = true;

// React to global map filter changes so the management table can hide/show
window.addEventListener('staffMapFilterChanged', (e) => {
    try {
        const detail = e && e.detail && e.detail.activeFilters;
        if (!detail) return;
        if (Array.isArray(detail)) {
            mapFilterVisible = detail.includes(PAGE_CATEGORY);
        } else {
            mapFilterVisible = !!detail[PAGE_CATEGORY];
        }
        // Re-run filter to update UI
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
    const navLogo = document.querySelector('.nav_logo'); // Select the hamburger icon
    const sideNav = document.querySelector('.side_nav'); // Select the sidebar

    // --- NEW CLICK TOGGLE LOGIC ---
    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
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

// TAB SWITCHING
// function switchTab(event, tabName) {
//     event.preventDefault();
//     document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
//     document.querySelectorAll('.nav_select[data-tab]').forEach(item => item.classList.remove('active'));
//     document.getElementById(tabName).classList.add('active');
//     event.target.closest('.nav_select').classList.add('active');

//     if (tabName === 'review') loadReviewTable();
//     else if (tabName === 'process') loadProcessTable();
//     else if (tabName === 'summary') loadSummarySelect();
//     else if (tabName === 'dashboard') loadAnalyticsTab();

// }

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

    // Load Data based on Tab
    if (tabName === 'management') loadManagementTable();
    else if (tabName === 'summary') loadSummarySelect();
    else if (tabName === 'dashboard') loadAnalyticsTab();
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
    // 1. SAFELY GET ELEMENTS (Checks if they exist first)
    // We check for 'managementSearch' (from your PHP) OR 'searchInput' (fallback)
    const searchEl = document.getElementById('managementSearch') || document.getElementById('searchInput');
    const statusEl = document.getElementById('statusFilter'); // This was missing in your HTML
    const tbody = document.getElementById('managementTableBody') || document.getElementById('tableBody');

    // If the table body doesn't exist, stop immediately to prevent errors
    if (!tbody) return;

    // If the map filter currently hides this category, show a message and stop
    if (!mapFilterVisible) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color:#999;">Hidden by map filters.</td></tr>';
        return;
    }

    // 2. GET VALUES SAFELY
    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
    const statusFilter = statusEl ? statusEl.value : ''; // Defaults to empty string if dropdown is missing

    tbody.innerHTML = '';

    // 3. FILTER LOGIC
    // Check if 'applications' data exists before filtering
    if (!applications || !Array.isArray(applications)) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading data...</td></tr>';
        return;
    }

    const filtered = applications.filter(app => {
        // Safe string access (handle nulls in DB)
        const businessName = (app.business_name || '').toLowerCase();
        const fullName = ((app.first_name || '') + ' ' + (app.last_name || '')).toLowerCase();
        const id = (app.id || '').toString();

        const matchesSearch =
            businessName.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            id.includes(searchTerm);

        // Only filter by status if a specific status is selected (not empty)
        const matchesStatus = statusFilter === '' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color:#999;">No matching applications found.</td></tr>';
        return;
    }

    // 4. RENDER LOGIC
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
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">⚙️ Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${app.id})">💰 Verify Pay</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">✅ Finalize</button>`;
        }
        else if (app.status === 'Approved') {
            actionBtn = `<button class="btn-secondary" onclick="generateClearance(${app.id})">🖨️ Clearance</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">⚙️ Update</button>`;
        }

        // C. Build Row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td style="font-weight:600;">${app.business_name}</td>
            <td>${app.first_name} ${app.last_name}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'Unpaid'}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn} 
                    <button class="btn-info" onclick="viewDetails(${app.id})" title="View Details">👁️</button>
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
function loadApplicationsFromDB() {
    return fetch(`${API_URL}?action=fetch`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') applications = data.data;
            return applications;
        });
}

/**
 * Loads applications into the review table with view and archive functionality
 * Displays applications with status badges and appropriate action buttons
 */
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
                    <td>${app.business_name}</td>
                    <td>${app.first_name} ${app.last_name}</td>
                    <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
                    <td>${app.payment_status || 'N/A'}</td>
                    <td><button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                    <button class="btn-delete" onclick="archiveApplication(${app.id})">🗄️ Archive</button></td>
                </tr>
            `;
        });
    });
}

/**
 * Loads applications into the process table with actionable statuses
 * Filters out excluded statuses and shows appropriate action buttons based on current status
 */
function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        tbody.innerHTML = '';

        const excludedStatuses = ['Cancelled', 'Archived']; // Add more if needed

        const actionable = applications.filter(app => {
            // Include the application IF its status is NOT in the excludedStatuses list
            return !excludedStatuses.includes(app.status);
        });

        if (actionable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No applications to process.</td></tr>';
            return;
        }

        actionable.forEach(app => {
            let btnText = "⚙️ Update";
            let btnClass = "btn-secondary";

            // Highlight actions based on flow
            if (app.status === 'Pending') { btnText = "⚙️ Update"; btnClass = "btn-primary"; }
            else if (app.status === 'For Payment') { btnText = "Verify Payment"; btnClass = "btn-warning"; }
            else if (app.status === 'Paid') { btnText = "Finalize Approval"; btnClass = "btn-success"; }

            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.business_name}</td> 
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${app.payment_status || 'Unpaid'}</td>
                    <td>
                        <button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>
                        ${(app.status === 'Approved') // CONDITION MODIFIED: Only checks for 'Approved'
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
 * Handles chart initialization and updates when switching tabs
 */
function loadAnalyticsTab() {
    fetch('/Banwa/client/scripts/staff/business_staff/business_handler.php?action=chart_business_type')
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.type_of_business);
            const values2 = res.data_by_type.map(x => x.total);

            // Add DSS status data
            const labels3 = res.data_by_dss.map(x => x.dss_status);
            const values3 = res.data_by_dss.map(x => x.total);

            const dateColors = ['#4F46E5', '#2563EB', '#0284C7', '#0891B2', '#0D9488', '#14B8A6'];
            const typeColors = ['#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#84CC16'];
            const dssColors = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'];

            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();
            if (chart3Instance) chart3Instance.destroy(); // Add this line

            chart1Instance = new Chart(document.getElementById('chart1'), {
                type: 'line',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Business Dates',
                        data: values1,
                        backgroundColor: dateColors,
                        borderWidth: 2,
                        tension: 0.4,
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
                        label: 'Business Types',
                        data: values2,
                        backgroundColor: typeColors,
                        borderWidth: 1,
                        borderRadius: '4',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Add the third chart for DSS status
            chart3Instance = new Chart(document.getElementById('chart3'), {
                type: 'doughnut', // or 'pie' if you prefer
                data: {
                    labels: labels3,
                    datasets: [{
                        label: 'DSS Status Distribution',
                        data: values3,
                        backgroundColor: dssColors,
                        borderWidth: 1,
                        borderRadius: '4'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            align: 'left',
                            labels: {
                                textAlign: 'left',
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
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
        // Option A: Replace everything
        textarea.value = text;

        // Option B: Append instead of replace (Uncomment below if preferred)
        // textarea.value += (textarea.value ? ' ' : '') + text;

        textarea.focus();
    }
}

/**
 * Generates and opens a printable business clearance document in a new window
 * Fetches clearance HTML from server and triggers print dialog
 * 
 * @param {number} appId - The application ID to generate clearance for
 */
function generateClearance(appId) {
    fetch(`${API_URL}?action=generateclearance&id=${appId}`)
        .then(res => res.text())
        .then(html => {
            const w = window.open('', '_blank', 'height=800,width=1000');
            w.document.write(html);
            w.document.close();
            w.onload = () => {
                w.print();
                w.onafterprint = () => w.close();
            };
        })
        .catch(err => showAlert('Error generating clearance: ' + err, 'danger'));
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
        alert("Application data not found.");
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

    // Insert a basic/loading DSS section immediately so the user sees something
    addBasicDSSSection(app);

    // Fetch DSS evaluation details and replace the basic section when available
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
    console.debug('fetchDSSEvaluation ->', API_URL, appId);
    fetch(`${API_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok: ' + res.status);
            }
            return res.json();
        })
        .then(data => {
            console.debug('DSS response for', appId, data);
            const existing = document.getElementById('dssEvaluationSection');
            if (data && data.status === 'success' && data.evaluation) {
                if (existing) existing.remove();
                addDSSSectionToModal(data.evaluation, app);
            } else {
                // show server message if present
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

    let statusColor, statusBg, statusIcon;
    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            statusIcon = '✅';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            statusIcon = '⚠️';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            statusIcon = '❌';
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
    let statusColor, statusBg, statusIcon;

    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            statusIcon = '✅';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            statusIcon = '⚠️';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            statusIcon = '❌';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
            statusIcon = '⏳';
    }

    dssSection.innerHTML = `
        <div class="dss-header">
            <h3>📊 DSS Evaluation</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${statusIcon} ${dssStatus}
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

// Helper: Apply quick text prompts to the textarea
function applyPrompt(text) {
    document.getElementById('updateComments').value = text;
}

/**
 * Displays detailed application information in a modal view
 * Shows business details, owner information, documents, and assessment data
 * Handles file previews for uploaded documents
 * 
 * @param {number} appId - The application ID to view details for
 */
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // 1. Prepare Data
    const businessStatus = app.business_status || 'Not specified';

    // Parse requirements list safely
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsList = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<span class="badge-req">✓ ${r}</span>`).join(' ')
        : '<span style="color:#999;">No requirements logged</span>';

    // 2. File Viewing Logic
    let fileHtml = '<div class="file-viewer-box"><p style="color:#666;">No document uploaded.</p></div>';

    if (app.requirement_upload) {
        const filePath = `${UPLOADS_BASE_PATH}${app.requirement_upload}`;
        const fileExt = app.requirement_upload.split('.').pop().toLowerCase();

        // If image, show thumbnail + view button
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
        // If PDF or other, show generic icon + open button
        else {
            fileHtml = `
                <div class="file-viewer-box">
                    <i class="fas fa-file-pdf fa-3x" style="color:#dc3545; margin-bottom:10px;"></i>
                    <p style="margin-bottom:10px; font-weight:bold;">${app.requirement_upload}</p>
                    <a href="${filePath}" target="_blank" class="btn-view-doc"><i class="fas fa-external-link-alt"></i> Open Document</a>
                </div>`;
        }
    }

    // 3. Status Colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // 4. Build Professional HTML Structure
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
                        <h3>📍 Business Information</h3>
                        <div class="detail-row"><span class="detail-label">Type</span> <span class="detail-value">${app.type_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Nature</span> <span class="detail-value">${app.nature_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.address_of_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Premises</span> <span class="detail-value">${businessStatus}</span></div>
                        <div class="detail-row"><span class="detail-label">Phone</span> <span class="detail-value">${app.telephone_no_business}</span></div>
                        <div class="detail-row"><span class="detail-label">Email</span> <span class="detail-value" style="word-break:break-all;">${app.email_address}</span></div>
                    </div>

                    <div class="detail-card" style="margin-top:20px;">
                        <h3>👤 Owner Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${app.telephone_no_owner}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.address_owner}</span></div>
                    </div>
                </div>

                <div class="col-right">
                    <div class="detail-card">
                        <h3>📋 Documents & Files</h3>
                        <div style="margin-bottom:15px;">
                            <span class="detail-label" style="display:block; margin-bottom:5px;">Checklist:</span>
                            <div style="font-size:12px; line-height:1.6;">${requirementsList}</div>
                        </div>
                        ${fileHtml}
                    </div>

                    <div class="detail-card" style="margin-top:20px; border-color: #bee5eb;">
                        <h3>💰 Assessment</h3>
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
                <h3 style="color:#856404; border-color:#ffeeba;">📝 Official Remarks</h3>
                <p style="margin:0; color:#555;">${app.approval_comments || app.disapproval_reason}</p>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('modalBody').innerHTML = content;
    openModal('detailsModal');
}

/**
 * Submits a new business application creation form to the server
 * Handles form validation, submission, and success/error feedback
 * 
 * @param {Event} event - The form submission event
 */
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
                showAlert(`Business Application created successfully! ID: ${data.id}`, 'success');
                loadApplicationsFromDB();
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to create application', 'danger');
        });
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
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.business_name}</option>`;
        }
        );
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
                <p>Select a business from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // --- 1. Data Processing ---

    // Status Badge Color Logic
    let statusColor = '#6c757d'; // Default Grey
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Requirements Formatting
    let reqs = app.requirements;
    // Handle case where requirements might be a JSON string or already an object
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')
        : '<li style="background:#fff3cd; color:#856404;">No documents logged</li>';

    // Formatted Dates & Money
    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due
        ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : '₱0.00';

    const paymentStatus = app.payment_status || 'Unpaid';

    // --- 2. Build HTML Structure ---

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
                    <h3>📍 Business Identity</h3>
                    <div class="info-row"><span class="info-label">Business Name</span> <span class="info-value">${app.business_name}</span></div>
                    <div class="info-row"><span class="info-label">Type</span> <span class="info-value">${app.type_of_business}</span></div>
                    <div class="info-row"><span class="info-label">Nature</span> <span class="info-value">${app.nature_of_business}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.address_of_business}</span></div>
                </div>

                <div class="report-section">
                    <h3>👤 Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.telephone_no_owner}</span></div>
                    <div class="info-row"><span class="info-label">Email</span> <span class="info-value">${app.email_address || 'N/A'}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>🏢 Operations & Docs</h3>
                    <div class="info-row"><span class="info-label">Structure</span> <span class="info-value">${app.type_of_structure}</span></div>
                    <div class="info-row"><span class="info-label">Employees</span> <span class="info-value">${app.no_of_employees}</span></div>
                    <div style="margin-top:15px;">
                        <span class="info-label" style="display:block; margin-bottom:5px;">Submitted Requirements:</span>
                        <ul class="doc-list">${requirementsHtml}</ul>
                    </div>
                </div>

                <div class="financial-box">
                    <h3 style="border:none; margin:0 0 10px 0;">💰 Financial Status</h3>
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
            <h3 style="border:none; margin-bottom:5px;">📝 Official Remarks</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download Word</button>
            <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print Report</button>
        </div>
    `;
}

// FILTER APPLICATIONS
// function filterApplications() {
//     const searchInput = document.getElementById('searchInput').value.toLowerCase();
//     const tbody = document.getElementById('tableBody');

//     tbody.innerHTML = '';

//     const filtered = applications.filter(app =>
//         app.business_name.toLowerCase().includes(searchInput) ||
//         (app.first_name + ' ' + app.last_name).toLowerCase().includes(searchInput) ||
//         app.id.toString().includes(searchInput)
//     );

//     if (filtered.length === 0) {
//         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No applications found</td></tr>';
//         return;
//     }

//     filtered.forEach(app => {
//         // Status Badge Logic
//         let badgeClass = 'pending';
//         if (app.status === 'Approved') badgeClass = 'approved';
//         if (app.status === 'Disapproved') badgeClass = 'disapproved';
//         if (app.status === 'Paid') badgeClass = 'paid';
//         if (app.status === 'For Payment') badgeClass = 'for-payment';

//         const row = document.createElement('tr');
//         const ownerName = app.first_name + (app.middle_name ? ' ' + app.middle_name : '') + ' ' + app.last_name;
//         row.innerHTML = `
//                 <td>${app.id}</td>
//                 <td>${app.business_name}</td>
//                 <td>${ownerName}</td>
//                 <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
//                 <td>${app.payment_status || 'N/A'}</td>
//                 <td>
//                     <button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
//                     <button class="btn-delete" onclick="archiveApplication(${app.id})">🗄️ Archive</button>
//                 </td>
//             `;
//         tbody.appendChild(row);
//     });
// }

/**
 * Archives an application by sending a request to the server
 * Requires user confirmation before proceeding with archival
 * 
 * @param {number} appId - The application ID to archive
 */
function archiveApplication(appId) {
    if (!confirm('Are you sure you want to archive this application?')) return;
    fetch(`${API_URL}?action=archive&id=${appId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Archived successfully');
                loadReviewTable();
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
function printSummary() {
    // 1. Get the main content area of the entire page (e.g., body or main container)
    // You may need to replace 'document.body' with the ID of your main content wrapper
    const mainContent = document.body;

    // 2. Get the element you want to print (the summary)
    const summaryToPrint = document.getElementById('summaryOutput'); // Assuming summaryOutput is the ID of the container element

    // 3. Temporarily hide everything except the summary content
    // This uses a clever technique by moving the summary content to a new window/tab,
    // or by applying styles. The simplest approach for most web layouts is to 
    // dynamically change the print media CSS.

    // Create a new print-only window
    const printWindow = window.open('', '', 'height=600,width=800');

    // Write the content you want to print into the new window
    printWindow.document.write('<html><head><title>Application Summary</title>');

    // Copy necessary styles (optional, but highly recommended for formatting)
    // You may need to adjust this to include your specific CSS files or <style> tags
    printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">');


    printWindow.document.write('</head><body>');
    printWindow.document.write(summaryToPrint.innerHTML); // Write only the summary HTML
    printWindow.document.write('');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Initiate printing in the new window
    printWindow.focus();

    // Close the window after printing (or immediately after print is called, depending on browser)
    // printWindow.close(); // Uncomment this if you want the new window to close automatically

    // Alternatively, a simpler but less robust method:
    /*
    const originalBody = document.body.innerHTML;
    const printContent = summaryToPrint.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload(); // Might be necessary to restore full functionality
    */
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
            <title>Business Application Summary Report - ${app.id}</title>
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
                <h1>Business Application Summary Report</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>

                <h2>📍 Business Information</h2>
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

                <h2>👤 Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Telephone:</strong> ${app.telephone_no_owner}</li>
                        <li><strong>Owner Address:</strong> ${app.address_owner}</li>
                    </ul>
                </div>

                <h2>🏢 Structure & Requirements</h2>
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
    link.download = `Business_Application_${app.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

/**
 * Generates a business clearance document client-side using application data
 * Creates a professional HTML document with dynamic content and opens print dialog
 * 
 * @param {number} appId - The application ID to generate clearance for
 */
function generateClearance(appId) {
    // 1. Find the application data locally first (assuming loadApplicationsFromDB has run)
    const app = applications.find(a => a.id == appId);
    if (!app) {
        showAlert('Application data not found for ID: ' + appId, 'danger');
        return;
    }

    // 2. Prepare dynamic content variables
    const grantee_name = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`;
    const businessName = app.business_name;
    const or_number = app.or_number || 'N/A';
    // Use application date or current date if OR number is N/A
    const date_issued = app.payment_date || app.application_date || getCurrentDateString();

    // NEW: Get the nature of the application for dynamic checking
    const natureOfApplication = app.nature_of_application ? app.nature_of_application.toLowerCase() : 'new';

    const date = new Date(date_issued);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year

    // Placeholder names (NOTE: Replace bracketed names with actual values for production.)
    const CAPTAIN_NAME = "MARIA DELA CRUZ";
    const SECRETARY_NAME = "JUAN M. DELOS SANTOS";

    // Helper function to check if an option should be marked as checked
    const isChecked = (type) => natureOfApplication === type ? 'checked' : '';

    // 3. Construct the HTML String (based on clearance.html)
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Blue Ridge B - Business Clearance</title>
    <style>
        :root {
            /* Light green theme from original reference. */
            --sidebar-bg: #eef7e3; 
            --text-color: #000;
            /* NOTE: Adjust the logo path for your environment if needed */
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

        /* --- Header Section --- */
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

        /* --- Document Titles --- */
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

        /* --- Main Content Grid Layout --- */
        .content-wrapper {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 30px;
            position: relative;
            z-index: 2;
        }

        /* --- Watermark background --- */
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

        /* --- Sidebar (Officials) --- */
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

        /* --- Main Body Text --- */
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
        /* Use this class for the selected option */
        .checkbox-option.checked::before { content: "☑ "; font-weight: normal; }

        .issue-date { margin-top: 30px; text-align: right; }
        .or-details { margin-top: 30px; font-size: 14px;}
        .or-details div { margin-bottom: 5px; }

        /* --- Footer (Signatures) --- */
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

        /* --- Print Specific Styles --- */
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

    // 4. Open and print the generated HTML
    const w = window.open('', '_blank', 'height=800,width=1000');
    w.document.write(html);
    w.document.close();
    w.onload = () => {
        w.print();
        w.onafterprint = () => w.close();
    };
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
function updateWarningUI(status) {
    const warningDiv = document.getElementById('statusWarning');
    warningDiv.style.display = 'block';
    
    if (status === 'Disapproved') {
        warningDiv.style.backgroundColor = '#fff2f2';
        warningDiv.style.color = '#d93025';
        warningDiv.innerHTML = '<strong>Warning:</strong> Disapproving will stop the application process.';
    } else if (status === 'For Payment') {
        warningDiv.style.backgroundColor = '#e8f0fe';
        warningDiv.style.color = '#1967d2';
        warningDiv.innerHTML = '<strong>Action:</strong> Please ensure the Assessment Amount is correct.';
    } else {
        warningDiv.style.display = 'none';
    }
}

// 1. Define Professional Templates
const statusTemplates = {
    'For Payment': "Your application is approved. Please pay the assessment amount of ₱[amount] via the portal or at the Treasury office.",
    'Disapproved': "Your application was disapproved due to: [reason]. You may re-apply once requirements are met.",
    'Missing Docs': "Some documents are unclear or missing. Please re-upload your DTI and Barangay Clearance.",
    'Approved': "Your Business Permit is now ready for pick-up/download."
};

// 2. Logic to auto-fill the textarea
document.getElementById('newStatus').addEventListener('change', function() {
    const status = this.value;
    const commentBox = document.getElementById('updateComments');
    const amountGroup = document.getElementById('amountInputGroup'); // Your div containing the amount input

    // Show/Hide amount field
    if(status === 'For Payment') {
        amountGroup.style.display = 'block';
    } else {
        amountGroup.style.display = 'none';
    }

    // Auto-fill template if it exists
    if(statusTemplates[status]) {
        commentBox.value = statusTemplates[status];
    }
});

// INITIALIZE ON LOAD
// window.addEventListener('load', function () {
//     loadAnalyticsTab();
// });

document.head.insertAdjacentHTML("beforeend", `<style>.hidden { display: none !important; }</style>`);