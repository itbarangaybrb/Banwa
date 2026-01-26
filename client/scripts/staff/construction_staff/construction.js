// Configuration
const API_URL = '../../../scripts/staff/construction_staff/construction_handler.php';
const UPLOADS_BASE_PATH = '../../../scripts/staff/construction_staff/uploads/';
let applications = [];

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

    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('User profile button clicked');
        });
    }

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
    // 1. GET ELEMENTS - Fixed IDs
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody'); // Direct ID

    // If the table body doesn't exist, stop immediately
    if (!tbody) {
        console.error('Table body not found');
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
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">⚙️ Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${app.id})">💰 Verify Pay</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">✅ Finalize</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">⚙️ Update</button>`;
        }

        // C. Build Row - Match your table headers
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.first_name} ${app.last_name}</td>
            <td>${app.contractor_name || 'N/A'}</td>
            <td>${app.contractor_contact_number || 'N/A'}</td>
            <td>${app.construction_address || 'N/A'}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'Unpaid'}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn-info" onclick="viewDetails(${app.id})" title="View Details">👁️ View</button>
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
                    <td>${app.nature_of_activity}</td>
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

        const excludedStatuses = ['Cancelled', 'Archived'];

        const actionable = applications.filter(app => {
            return !excludedStatuses.includes(app.status);
        });

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
    fetch(`${API_URL}?action=chart_construction_type`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.nature_of_activity);
            const values2 = res.data_by_type.map(x => x.total);

            // Add DSS status data if available
            const labels3 = res.data_by_dss ? res.data_by_dss.map(x => x.dss_status) : [];
            const values3 = res.data_by_dss ? res.data_by_dss.map(x => x.total) : [];

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
                        borderWidth: 1,
                        borderRadius: '4',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Add the third chart for DSS status if data exists
            if (labels3.length > 0) {
                chart3Instance = new Chart(document.getElementById('chart3'), {
                    type: 'doughnut',
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
            }
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
    if (existingDSSSection) {
        existingDSSSection.remove();
    }

    // Fetch DSS evaluation details and add to modal
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
    fetch(`${API_URL}?action=get_evaluation&application_id=${appId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                addDSSSectionToModal(data.evaluation, app);
            }
        })
        .catch(error => {
            console.error('Error fetching DSS evaluation:', error);
            // Still add a basic DSS section even if fetch fails
            addBasicDSSSection(app);
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
    const probability = details.approval_probability || 0;
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
                <span>${probability}%</span>
            </div>
        </div>
        
        <div class="dss-progress-container">
            <div class="dss-progress-label">
                <span>Approval Progress</span>
                <span class="dss-progress-percentage">${probability}%</span>
            </div>
            <div class="dss-progress-bar">
                <div class="dss-progress-fill" style="width: ${probability}%"></div>
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
            <h3>📊 DSS Evaluation</h3>
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

/**
 * Displays detailed application information in a modal view
 * Shows construction details, owner information, documents, and assessment data
 * Handles file previews for uploaded documents
 * 
 * @param {number} appId - The application ID to view details for
 */
function viewDetails(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // 1. Prepare Data
    const constructionAddress = app.construction_address || 'Not specified';

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
                    <h2>${app.nature_of_activity}</h2>
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
                        <h3>📍 Construction Information</h3>
                        <div class="detail-row"><span class="detail-label">Nature</span> <span class="detail-value">${app.nature_of_activity}</span></div>
                        <div class="detail-row"><span class="detail-label">Type of Work</span> <span class="detail-value">${app.type_of_work}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${constructionAddress}</span></div>
                        <div class="detail-row"><span class="detail-label">Details</span> <span class="detail-value">${app.details_of_work || 'N/A'}</span></div>
                    </div>

                    <div class="detail-card" style="margin-top:20px;">
                        <h3>👤 Owner Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${app.contact_no_owner}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${app.address_owner}</span></div>
                    </div>
                </div>

                <div class="col-right">
                    <div class="detail-card">
                        <h3>📅 Schedule & Workforce</h3>
                        <div class="detail-row"><span class="detail-label">Start Date</span> <span class="detail-value">${app.start_date}</span></div>
                        <div class="detail-row"><span class="detail-label">End Date</span> <span class="detail-value">${app.end_date}</span></div>
                        <div class="detail-row"><span class="detail-label">Working Days</span> <span class="detail-value">${app.number_of_working_days}</span></div>
                        <div class="detail-row"><span class="detail-label">Workers</span> <span class="detail-value">${app.number_of_workers}</span></div>
                    </div>

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

    // --- 1. Data Processing ---

    // Status Badge Color Logic
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Requirements Formatting
    let reqs = app.requirements;
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
                    <h3>📍 Construction Details</h3>
                    <div class="info-row"><span class="info-label">Activity</span> <span class="info-value">${app.nature_of_activity}</span></div>
                    <div class="info-row"><span class="info-label">Type of Work</span> <span class="info-value">${app.type_of_work}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${app.construction_address}</span></div>
                    <div class="info-row"><span class="info-label">Work Details</span> <span class="info-value">${app.details_of_work || 'N/A'}</span></div>
                </div>

                <div class="report-section">
                    <h3>👤 Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.contact_no_owner}</span></div>
                    <div class="info-row"><span class="info-label">Owner Address</span> <span class="info-value">${app.address_owner}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>🏗 Schedule & Workforce</h3>
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
                showAlert('Archived successfully', 'success');
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
    const summaryToPrint = document.getElementById('summaryOutput');

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Construction Application Summary</title>');
    printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">');
    printWindow.document.write('</head><body>');
    printWindow.document.write(summaryToPrint.innerHTML);
    printWindow.document.write('');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
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

                <h2>📍 Construction Information</h2>
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

                <h2>👤 Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Contact:</strong> ${app.contact_no_owner}</li>
                        <li><strong>Owner Address:</strong> ${app.address_owner}</li>
                    </ul>
                </div>

                <h2>📋 Requirements & Documents</h2>
                <div class="card">
                    <ul class="info-list">
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

document.head.insertAdjacentHTML("beforeend", `<style>.hidden { display: none !important; }</style>`);