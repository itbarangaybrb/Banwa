// Configuration
const IR_HANDLER_URL = '/Banwa/server/handlers/staff/incident_report/ir_handler.php';
let incidents = [];

// Map filter visibility flag for this management page
const PAGE_CATEGORY = 'household';
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
        filterIncidents();
    } catch (err) {
        console.warn('Error handling staffMapFilterChanged in incident_report_staff:', err);
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
 * Switches between different incident tabs and loads appropriate data
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
    } else if (tabName === 'create') {
        resetIncidentForm();
    }
}

/**
 * Loads the management table with incidents from database
 */
function loadManagementTable() {
    loadIncidentsFromDB().finally(() => {
        filterIncidents();
    });
}

/**
 * Filters and renders incidents in the management table based on search criteria
 */
function filterIncidents() {
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody');

    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    if (!mapFilterVisible) {
        tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center; padding: 40px; color:#999;">Hidden by map filters.</td>
        </tr>`;
        return;
    }

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
    tbody.innerHTML = '';

    if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center; padding: 40px; color:#999;">
                <div class="spinner"></div>Loading incidents...
            </td>
        </tr>`;
        return;
    }

    const filtered = incidents.filter(incident => {
        const incidentType = (incident.incident_type || '').toLowerCase();
        const victimName = (incident.vic_full_name || '').toLowerCase();
        const location = (incident.incident_location || '').toLowerCase();
        const reportId = (incident.id || '').toString();
        const reporterName = (incident.rp_full_name || '').toLowerCase();
        const suspectName = (incident.sus_full_name || '').toLowerCase();

        return incidentType.includes(searchTerm) ||
            victimName.includes(searchTerm) ||
            location.includes(searchTerm) ||
            reportId.includes(searchTerm) ||
            reporterName.includes(searchTerm) ||
            suspectName.includes(searchTerm);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center; padding: 40px; color:#999;">
                No matching incidents found.
            </td>
        </tr>`;
        return;
    }

    filtered.forEach(incident => {
        let badgeClass = 'reported';
        if (incident.status === 'Pending') badgeClass = 'pending';
        if (incident.status === 'Resolved') badgeClass = 'resolved';
        if (incident.status === 'Under Investigation') badgeClass = 'investigation';
        if (incident.status === 'Closed') badgeClass = 'closed';
        if (incident.status === 'Cancelled') badgeClass = 'cancelled';

        let actionBtn = '';

        if (incident.status === 'Pending') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Process</button>`;
        }
        else if (incident.status === 'Reported') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Review</button>`;
        }
        else if (incident.status === 'Under Investigation') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Investigate</button>`;
        }
        else if (incident.status === 'Referred to Authorities') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${incident.id})">Follow Up</button>`;
        }
        else if (incident.status === 'Resolved') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${incident.id})">Finalize</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${incident.id})">Update</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${incident.id}</td>
        <td>${incident.rp_full_name || 'N/A'}</td>
        <td>${incident.vic_full_name || 'N/A'}</td>
        <td>${incident.sus_full_name || 'N/A'}</td>
        <td>${incident.incident_type || 'N/A'}</td>
        <td>${incident.rp_address || 'N/A'}</td>
        <td>${formatDateTime(incident.incident_timestamp)}</td>
        <td><span class="status-badge status-${badgeClass}">${incident.status}</span></td>
        <td>
            <div class="action-buttons">
                ${actionBtn}
                <button class="btn-info" onclick="viewDetails(${incident.id})" title="View Details">View</button>
            </div>
        </td>
    `;
        tbody.appendChild(row);
    });
}

/**
 * Fetches incident reports from the server API
 * 
 * @returns {Promise} Promise resolving to the incidents array
 */
function loadIncidentsFromDB() {
    return fetch(`${IR_HANDLER_URL}?action=fetch`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') incidents = data.data;
            return incidents;
        })
        .catch(error => {
            console.error('Error fetching incidents:', error);
            incidents = [];
            return incidents;
        });
}

/**
 * Automatically refreshes the active tab every 30 seconds.
 */
let isRefreshing = false;
setInterval(() => {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || isRefreshing) return;

    const activeTabId = activeTab.id;
    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    if (activeTabId === 'management') {
        loadIncidentsFromDB().finally(() => { filterIncidents(); finish(); });
    } else if (activeTabId === 'process') {
        loadIncidentsFromDB().finally(() => { loadProcessTable(); finish(); });
    } else if (activeTabId === 'summary') {
        loadIncidentsFromDB().finally(() => { loadSummarySelect(); finish(); });
    } else if (activeTabId === 'dashboard') {
        loadIncidentsFromDB().finally(() => { loadAnalyticsTab(); finish(); });
    } else {
        finish();
    }
}, 30000);

/**
 * Loads incidents into the process table with actionable statuses
 */
function loadProcessTable() {
    loadIncidentsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const excludedStatuses = ['Closed', 'Cancelled', 'Resolved'];
        const actionable = incidents.filter(incident => {
            return !excludedStatuses.includes(incident.status);
        });

        if (actionable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No incidents to process.</td></tr>';
            return;
        }

        actionable.forEach(incident => {
            let btnText = "Update";
            let btnClass = "secondary";

            if (incident.status === 'Pending') { btnClass = "primary"; btnText = "Process"; }
            else if (incident.status === 'Reported') { btnClass = "primary"; btnText = "Begin Investigation"; }
            else if (incident.status === 'Under Investigation') { btnClass = "primary"; btnText = "Continue Investigation"; }
            else if (incident.status === 'Referred to Authorities') { btnClass = "warning"; btnText = "Follow Up"; }
            else if (incident.status === 'Resolved') { btnText = "Finalize"; btnClass = "success"; }

            tbody.innerHTML += `
            <tr>
                <td>${incident.id}</td>
                <td>${incident.incident_type || 'N/A'}</td>
                <td>${incident.vic_full_name || 'N/A'}</td>
                <td>${formatDate(incident.reported_at)}</td>
                <td><span class="status-badge status-${incident.status.toLowerCase().replace(/ /g, '-')}">${incident.status}</span></td>
                <td>
                    <button class="btn-${btnClass}" onclick="openUpdateModal(${incident.id})">${btnText}</button>
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
 * Loads analytics data and renders charts for incident statistics
 */
function loadAnalyticsTab() {
    fetch(`${IR_HANDLER_URL}?action=chart_incident_type`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.date_reported);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.incident_type);
            const values2 = res.data_by_type.map(x => x.total);

            const labels3 = res.data_by_dss ? res.data_by_dss.map(x => x.dss_status) : [];
            const values3 = res.data_by_dss ? res.data_by_dss.map(x => x.total) : [];

            const dateColors = ['#6366F1'];
            const typeColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
            const dssColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#E17055', '#00CEC9'];

            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();
            if (chart3Instance) chart3Instance.destroy();

            chart1Instance = new Chart(document.getElementById('chart1'), {
                type: 'line',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Incidents Timeline',
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
                        label: 'Incidents by Type',
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
 * Opens the update modal for a specific incident and loads current data
 * Includes DSS evaluation results display and status tracking
 * 
 * @param {number} appId - The incident ID to open in the update modal
 */
function openUpdateModal(appId) {
    const incident = incidents.find(i => i.id == appId);

    if (!incident) {
        alert("Incident data not found.");
        return;
    }

    document.getElementById('updateReportId').value = incident.id;
    document.getElementById('displayCurrentStatus').value = incident.status;

    document.getElementById('newStatus').value = "";
    document.getElementById('updateComments').value = "";

    const existingDSSSection = document.getElementById('dssEvaluationSection');
    if (existingDSSSection) existingDSSSection.remove();

    addBasicDSSSection(incident);

    fetchDSSEvaluation(appId, incident);

    document.getElementById('updateModal').classList.add('active');
}

/**
 * Fetches DSS evaluation details from the server for a specific incident report
 * 
 * @param {number} appId - The incident report ID to fetch evaluation for
 * @param {Object} incident - The incident object containing basic incident data
 */
function fetchDSSEvaluation(appId, incident) {
    console.debug('fetchDSSEvaluation ->', IR_HANDLER_URL, appId);
    // Use 'application_id' parameter to match the PHP backend expectation
    fetch(`${IR_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            console.debug('DSS response for', appId, data);
            const existing = document.getElementById('dssEvaluationSection');
            if (data && data.status === 'success' && data.evaluation) {
                if (existing) existing.remove();
                addDSSSectionToModal(data.evaluation, incident);
            } else {
                if (existing) existing.querySelector('.dss-loading')?.remove();
                const msg = (data && data.message) ? data.message : 'Detailed evaluation not available.';
                if (existing) {
                    const note = document.createElement('div');
                    note.className = 'dss-error-msg';
                    note.textContent = msg;
                    existing.appendChild(note);
                } else {
                    addBasicDSSSection(incident);
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
                addBasicDSSSection(incident);
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
 * @param {Object} incident - The incident object for context
 */
function addDSSSectionToModal(evaluation, incident) {
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
    const probability = typeof details.resolution_probability === 'number' ? details.resolution_probability : (parseFloat(details.resolution_probability) || 0);

    const passedRules = details.passed_rules || [];
    const failedRules = details.failed_rules || [];
    const recommendations = details.recommendations || [];

    let statusColor, statusBg;
    switch (dssStatus) {
        case 'Pre-Approved':
        case 'High Priority':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
        case 'Medium Priority':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
        case 'Low Priority':
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
 * 
 * @param {Object} incident - The incident object containing basic DSS status
 */
function addBasicDSSSection(incident) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingDSS = document.getElementById('dssEvaluationSection');
    if (existingDSS) {
        existingDSS.remove();
    }

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const dssStatus = incident.dss_status || 'Pending Evaluation';
    let statusColor, statusBg;

    switch (dssStatus) {
        case 'Pre-Approved':
        case 'High Priority':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
        case 'Medium Priority':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
        case 'Low Priority':
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
 * Submits incident status update to the server via API
 * 
 * @param {Event} event - The form submission event
 */
function submitUpdate(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('updateForm'));
    formData.append('action', 'update_status');

    fetch(`${IR_HANDLER_URL}`, {
        method: 'POST',
        body: formData
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return res.text().then(text => {
                    console.error('Non-JSON response for update:', text.substring(0, 200));
                    throw new TypeError("Server returned non-JSON response");
                });
            }
            return res.json();
        })
        .then(data => {
            if (data.status === 'success') {
                closeModal('updateModal');
                alert('Incident updated successfully!');
                loadManagementTable();
                loadProcessTable();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating incident:', error);
            alert('Error updating incident. Please try again.');
        });
}

/**
 * Displays detailed incident information in a modal view
 * 
 * @param {number} appId - The incident ID to view details for
 */
function viewDetails(appId) {
    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    const incidentLocation = incident.incident_location || 'Not specified';

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (incident.status) {
        case 'Resolved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Under Investigation': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Closed': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Cancelled': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const content = `
    <div class="details-container">
        <div class="details-header-card">
            <div class="details-title">
                <h2>${incident.incident_type || 'Incident Report'}</h2>
                <div class="details-id">Report ID: ${incident.id}</div>
            </div>
            <div style="text-align:right;">
                <span style="background:${statusBg}; color:${statusColor}; padding:6px 12px; border-radius:20px; font-weight:bold; text-transform:uppercase; font-size:12px;">
                    ${incident.status}
                </span>
                <div style="font-size:12px; color:#666; margin-top:5px;">Reported: ${formatDateTime(incident.reported_at)}</div>
            </div>
        </div>

        <div class="details-grid">
            <div class="col-left">
                <div class="detail-card">
                    <h3>Incident Information</h3>
                    <div class="detail-row"><span class="detail-label">Type</span> <span class="detail-value">${incident.incident_type || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Date & Time</span> <span class="detail-value">${formatDateTime(incident.incident_timestamp)}</span></div>
                    <div class="detail-row"><span class="detail-label">Location</span> <span class="detail-value">${incidentLocation}</span></div>
                    <div class="detail-row"><span class="detail-label">Coordinates</span> <span class="detail-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Severity</span> <span class="detail-value">${getSeverityBadge(incident.severity)}</span></div>
                </div>

                <div class="detail-card" style="margin-top:20px;">
                    <h3>Victim Details</h3>
                    <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.vic_full_name || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.vic_contact || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${incident.vic_address || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Gender</span> <span class="detail-value">${incident.vic_gender || 'N/A'}</span></div>
                </div>
            </div>

            <div class="col-right">
                <div class="detail-card">
                    <h3>Reporting Person</h3>
                    <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.rp_full_name || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.rp_contact || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Relationship</span> <span class="detail-value">${incident.rp_relationship || 'N/A'}</span></div>
                </div>

                ${incident.sus_full_name ? `
                <div class="detail-card" style="margin-top:20px; border-color: #f5c6cb;">
                    <h3>Suspect Details</h3>
                    <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.sus_full_name || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.sus_contact || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${incident.sus_address || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Description</span> <span class="detail-value">${incident.sus_description || 'N/A'}</span></div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="detail-card">
            <h3>Narrative Description</h3>
            <p style="margin:0; color:#555; line-height:1.6;">${incident.description || 'No description provided.'}</p>
        </div>

        ${incident.investigation_notes ? `
        <div class="detail-card" style="background:#fff8e1; border-color:#ffeeba;">
            <h3 style="color:#856404; border-color:#ffeeba;">Investigation Notes</h3>
            <p style="margin:0; color:#555;">${incident.investigation_notes}</p>
            <div style="font-size:12px; color:#666; margin-top:5px;">Updated: ${formatDateTime(incident.updated_at)}</div>
        </div>
        ` : ''}

        ${incident.dss_status ? `
        <div class="detail-card" style="margin-top:20px; border-color: #bee5eb;">
            <h3>DSS Evaluation Status</h3>
            <div class="detail-row"><span class="detail-label">DSS Status</span> <span class="detail-value" style="color:#0c5460; font-weight:bold;">${incident.dss_status || 'Pending Evaluation'}</span></div>
        </div>
        ` : ''}
    </div>
`;

    document.getElementById('modalBody').innerHTML = content;
    openModal('detailsModal');
}

/**
 * Loads incident options into the summary select dropdown
 */
function loadSummarySelect() {
    loadIncidentsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        select.innerHTML = '<option value="">-- Select Incident Report --</option>';
        incidents.forEach(incident => {
            select.innerHTML += `<option value="${incident.id}">ID: ${incident.id} - ${incident.incident_type || 'Incident Report'}</option>`;
        });
    });
}

/**
 * Updates the summary display with detailed incident information
 */
// function updateIncidentSummary() {
//     const appId = document.getElementById('summaryIncidentSelect').value;
//     const summaryOutput = document.getElementById('summaryOutput');

//     if (!appId) {
//         summaryOutput.innerHTML = `
//         <div class="placeholder-state">
//             <i class="fas fa-file-invoice fa-3x"></i>
//             <p>Select an incident report from the list above to view the full report.</p>
//         </div>`;
//         return;
//     }

//     const incident = incidents.find(i => i.id == appId);
//     if (!incident) return;

//     let statusColor = '#6c757d';
//     let statusBg = '#e2e3e5';

//     switch (incident.status) {
//         case 'Resolved': statusColor = '#155724'; statusBg = '#d4edda'; break;
//         case 'Under Investigation': statusColor = '#856404'; statusBg = '#fff3cd'; break;
//         case 'Closed': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
//         case 'Cancelled': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
//     }

//     const dateReported = new Date(incident.reported_at || incident.created_at).toLocaleDateString('en-US', {
//         year: 'numeric', month: 'long', day: 'numeric'
//     });

//     summaryOutput.innerHTML = `
//     <div class="report-header">
//         <div class="report-title">
//             <h1>Incident Report Profile</h1>
//             <div class="report-meta">Report ID: ${incident.id} &bull; Date: ${dateReported}</div>
//         </div>
//         <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
//             ${incident.status}
//         </div>
//     </div>

//     <div class="report-grid">
//         <div class="report-column">
//             <div class="report-section">
//                 <h3>Incident Details</h3>
//                 <div class="info-row"><span class="info-label">Incident Type</span> <span class="info-value">${incident.incident_type || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Date & Time</span> <span class="info-value">${formatDateTime(incident.incident_timestamp)}</span></div>
//                 <div class="info-row"><span class="info-label">Location</span> <span class="info-value" style="max-width: 200px; text-align:right;">${incident.incident_location || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Coordinates</span> <span class="info-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Severity</span> <span class="info-value">${incident.severity || 'Not Rated'}</span></div>
//             </div>

//             <div class="report-section">
//                 <h3>Victim Information</h3>
//                 <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.vic_full_name || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.vic_contact || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.vic_address || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Gender</span> <span class="info-value">${incident.vic_gender || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Citizenship</span> <span class="info-value">${incident.vic_citizenship || 'N/A'}</span></div>
//             </div>
//         </div>

//         <div class="report-column">
//             <div class="report-section">
//                 <h3>Reporting Person</h3>
//                 <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.rp_full_name || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.rp_contact || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.rp_address || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Relationship</span> <span class="info-value">${incident.rp_relationship || 'N/A'}</span></div>
//             </div>

//             ${incident.sus_full_name ? `
//             <div class="financial-box">
//                 <h3 style="border:none; margin:0 0 10px 0;">Suspect Information</h3>
//                 <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.sus_full_name || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.sus_contact || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.sus_address || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Gender</span> <span class="info-value">${incident.sus_gender || 'N/A'}</span></div>
//                 <div class="info-row"><span class="info-label">Description</span> <span class="info-value">${incident.sus_description || 'N/A'}</span></div>
//             </div>
//             ` : ''}
//         </div>
//     </div>

//     <div class="report-section">
//         <h3>Incident Narrative</h3>
//         <div style="background:#f8f9fa; padding:15px; border-radius:5px; border-left:4px solid #6366F1;">
//             ${incident.description || 'No description provided.'}
//         </div>
//     </div>

//     ${incident.investigation_notes ? `
//     <div class="report-section" style="background:#fff8e1; padding:15px; border-radius:5px;">
//         <h3 style="border:none; margin-bottom:5px;">Investigation Notes</h3>
//         <p style="margin:0; font-style:italic; color:#555;">"${incident.investigation_notes}"</p>
//         <div style="font-size:12px; color:#666; margin-top:5px;">Last updated: ${formatDateTime(incident.updated_at)}</div>
//     </div>` : ''}

//     ${incident.dss_status ? `
//     <div class="report-section" style="background:#d1ecf1; padding:15px; border-radius:5px; border-color:#bee5eb;">
//         <h3 style="border:none; margin-bottom:5px; color:#0c5460;">DSS Evaluation</h3>
//         <div class="info-row"><span class="info-label">DSS Status</span> <span class="info-value" style="color:#0c5460; font-weight:bold;">${incident.dss_status}</span></div>
//     </div>` : ''}

//     <div class="report-actions">
//         <button class="btn-secondary" onclick="downloadSummary(${incident.id})"><i class="fas fa-download"></i> Download Word</button>
//         <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print Report</button>
//     </div>
// `;
// }

/**
 * Updates the summary display with detailed incident information
 * Generates a professional report view with formatted data
 */
function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const summaryOutput = document.getElementById('summaryOutput');

    if (!appId) {
        summaryOutput.innerHTML = `
            <div class="placeholder-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Select an incident report from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    // --- 1. Data Processing ---

    // Status Badge Color Logic
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';

    switch (incident.status) {
        case 'Resolved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Under Investigation': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Closed': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Cancelled': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Formatted Dates
    const dateReported = new Date(incident.reported_at || incident.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // --- 2. Build HTML Structure ---

    summaryOutput.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Incident Report Profile</h1>
                <div class="report-meta">Report ID: ${incident.id} &bull; Date: ${dateReported}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${incident.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>Incident Details</h3>
                    <div class="info-row"><span class="info-label">Incident Type</span> <span class="info-value">${incident.incident_type || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Date & Time</span> <span class="info-value">${formatDateTime(incident.incident_timestamp)}</span></div>
                    <div class="info-row"><span class="info-label">Location</span> <span class="info-value" style="max-width: 200px; text-align:right;">${incident.incident_location || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Coordinates</span> <span class="info-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Severity</span> <span class="info-value">${incident.severity || 'Not Rated'}</span></div>
                </div>

                <div class="report-section">
                    <h3>Victim Information</h3>
                    <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.vic_full_name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.vic_contact || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.vic_address || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Gender</span> <span class="info-value">${incident.vic_gender || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Citizenship</span> <span class="info-value">${incident.vic_citizenship || 'N/A'}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>Reporting Person</h3>
                    <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.rp_full_name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.rp_contact || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.rp_address || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Relationship</span> <span class="info-value">${incident.rp_relationship || 'N/A'}</span></div>
                </div>

                ${incident.sus_full_name ? `
                <div class="financial-box">
                    <h3 style="border:none; margin:0 0 10px 0;">Suspect Information</h3>
                    <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.sus_full_name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.sus_contact || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.sus_address || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Gender</span> <span class="info-value">${incident.sus_gender || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Description</span> <span class="info-value">${incident.sus_description || 'N/A'}</span></div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="report-section">
            <h3>Incident Narrative</h3>
            <div style="background:#f8f9fa; padding:15px; border-radius:5px;">
                ${incident.description || 'No description provided.'}
            </div>
        </div>

        ${incident.investigation_notes ? `
        <div class="report-section" style="background:#fff8e1; padding:15px; border-radius:5px;">
            <h3 style="border:none; margin-bottom:5px;">Investigation Notes</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${incident.investigation_notes}"</p>
            <div style="font-size:12px; color:#666; margin-top:5px;">Last updated: ${formatDateTime(incident.updated_at)}</div>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn-secondary" onclick="downloadSummary(${incident.id})"><i class="fas fa-download"></i> Download</button>
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
 * Prints the current summary report to a new window
 */
// function printSummary() {
//     const summaryToPrint = document.getElementById('summaryOutput');

//     const printWindow = window.open('', '', 'height=600,width=800');
//     printWindow.document.write('<html><head><title>Incident Report Summary</title>');
//     printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
//     printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/incident_report_staff/incident_report.css">');
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
        alert('Please select an incident report to print.');
        return;
    }

    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    // Get status colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (incident.status) {
        case 'Resolved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Under Investigation': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Closed': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Cancelled': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Format dates
    const dateReported = new Date(incident.reported_at || incident.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Create print-specific HTML with the same structure as updateIncidentSummary()
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Incident Report Summary - #${incident.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="../../../styles/staff/incident_report_staff/incident_report.css">
        </head>
        <body>
            <div class="print-container">
                <div class="report-header">
                    <div class="report-title">
                        <h1>Incident Report Profile</h1>
                        <div class="report-meta">Report ID: ${incident.id} &bull; Date: ${dateReported}</div>
                    </div>
                    <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                        ${incident.status}
                    </div>
                </div>

                <div class="report-grid">
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Incident Details</h3>
                            <div class="info-row">
                                <span class="info-label">Incident Type</span>
                                <span class="info-value">${incident.incident_type || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date & Time</span>
                                <span class="info-value">${formatDateTime(incident.incident_timestamp)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Location</span>
                                <span class="info-value">${incident.incident_location || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Coordinates</span>
                                <span class="info-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Severity</span>
                                <span class="info-value">${incident.severity || 'Not Rated'}</span>
                            </div>
                        </div>

                        <div class="report-section">
                            <h3>Victim Information</h3>
                            <div class="info-row">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${incident.vic_full_name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Contact</span>
                                <span class="info-value">${incident.vic_contact || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${incident.vic_address || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Gender</span>
                                <span class="info-value">${incident.vic_gender || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Citizenship</span>
                                <span class="info-value">${incident.vic_citizenship || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-column">
                        <div class="report-section">
                            <h3>Reporting Person</h3>
                            <div class="info-row">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${incident.rp_full_name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Contact</span>
                                <span class="info-value">${incident.rp_contact || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${incident.rp_address || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Relationship</span>
                                <span class="info-value">${incident.rp_relationship || 'N/A'}</span>
                            </div>
                        </div>

                        ${incident.sus_full_name ? `
                        <div class="financial-box">
                            <h3 style="border:none; margin:0 0 10px 0;">Suspect Information</h3>
                            <div class="info-row">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${incident.sus_full_name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Contact</span>
                                <span class="info-value">${incident.sus_contact || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${incident.sus_address || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Gender</span>
                                <span class="info-value">${incident.sus_gender || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Description</span>
                                <span class="info-value">${incident.sus_description || 'N/A'}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="report-section">
                    <h3>Incident Narrative</h3>
                    <div style="background:#f8f9fa; padding:15px; border-radius:5px;">
                        ${incident.description || 'No description provided.'}
                    </div>
                </div>

                ${incident.investigation_notes ? `
                <div class="report-section" style="background:#fff8e1; padding:15px; border-radius:5px;">
                    <h3 style="border:none; margin-top:5px;">Investigation Notes</h3>
                    <p style="margin:0; font-style:italic; color:#555;">"${incident.investigation_notes}"</p>
                    <div style="font-size:12px; color:#666; margin-top:5px;">Last updated: ${formatDateTime(incident.updated_at)}</div>
                </div>` : ''}

                <div class="footer-note">
                    <p>Document generated on ${new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    <p>Barangay Incident Report Management System</p>
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
 * 
 * @param {number} appId - The incident ID to download summary for
 */
function downloadSummary(appId) {

    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    const incidentLocation = incident.incident_location || 'Not specified';

    let notesHtml = '';
    if (incident.investigation_notes) {
        notesHtml = `<div class="comment-box investigation"><h3>Investigation Notes</h3><p>${incident.investigation_notes}</p></div>`;
    }

    let dssHtml = '';
    if (incident.dss_status) {
        dssHtml = `<div class="comment-box dss"><h3>DSS Evaluation</h3><p><strong>Status:</strong> ${incident.dss_status}</p></div>`;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Incident Report Summary - ${incident.id}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h1 { color: #5B479B; border-bottom: 3px solid #826EEA; padding-bottom: 10px; font-size: 24pt; }
            h2 { color: #826EEA; margin-top: 30px; font-size: 16pt; }
            .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
            .info-list { list-style-type: none; padding: 0; }
            .info-list li { margin-bottom: 8px; }
            .info-list strong { display: inline-block; width: 180px; font-weight: bold; } 
            .status-badge { background-color: ${incident.status === 'Resolved' ? '#d4edda' : incident.status === 'Cancelled' ? '#f8d7da' : '#fff3cd'}; color: ${incident.status === 'Resolved' ? '#155724' : incident.status === 'Cancelled' ? '#721c24' : '#856404'}; padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 10pt;}
            .comment-box { margin-top: 20px; padding: 15px; border-radius: 5px; }
            .comment-box h3 { font-size: 12pt; }
            .comment-box.investigation { border: 1px solid #ffeeba; background-color: #fff3cd; }
            .comment-box.dss { border: 1px solid #bee5eb; background-color: #d1ecf1; }
            .narrative-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #826EEA; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Incident Report Summary</h1>
            <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Report ID:</strong> ${incident.id}</p>
            <p><strong>Status:</strong> <span class="status-badge">${incident.status}</span></p>

            <h2>Incident Information</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Incident Type:</strong> ${incident.incident_type}</li>
                    <li><strong>Date & Time:</strong> ${formatDateTime(incident.incident_timestamp)}</li>
                    <li><strong>Location:</strong> ${incidentLocation}</li>
                    <li><strong>Coordinates:</strong> ${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</li>
                    <li><strong>Severity:</strong> ${incident.severity || 'Not Rated'}</li>
                </ul>
            </div>

            <h2>Victim Information</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Full Name:</strong> ${incident.vic_full_name}</li>
                    <li><strong>Contact Number:</strong> ${incident.vic_contact}</li>
                    <li><strong>Address:</strong> ${incident.vic_address}</li>
                    <li><strong>Gender:</strong> ${incident.vic_gender}</li>
                    <li><strong>Citizenship:</strong> ${incident.vic_citizenship}</li>
                </ul>
            </div>

            <h2>Reporting Person</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Full Name:</strong> ${incident.rp_full_name}</li>
                    <li><strong>Contact Number:</strong> ${incident.rp_contact}</li>
                    <li><strong>Address:</strong> ${incident.rp_address}</li>
                    <li><strong>Relationship:</strong> ${incident.rp_relationship}</li>
                </ul>
            </div>

            ${incident.sus_full_name ? `
            <h2>Suspect Information</h2>
            <div class="card">
                <ul class="info-list">
                    <li><strong>Full Name:</strong> ${incident.sus_full_name}</li>
                    <li><strong>Contact Number:</strong> ${incident.sus_contact}</li>
                    <li><strong>Address:</strong> ${incident.sus_address}</li>
                    <li><strong>Gender:</strong> ${incident.sus_gender}</li>
                    <li><strong>Description:</strong> ${incident.sus_description}</li>
                </ul>
            </div>
            ` : ''}

            <h2>Incident Narrative</h2>
            <div class="narrative-box">
                ${incident.description || 'No description provided.'}
            </div>

            ${notesHtml}
            ${dssHtml}
        </div>
    </body>
    </html>
`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident_Report_${incident.id}_Summary.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Helper function for formatting dates
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


/**
 * Creates a new incident report
 */
function createApplication(event) {
    event.preventDefault();
    alert('Create functionality not implemented yet');
}

/**
 * Filters incidents in review table
 */
function filterReviewIncidents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Resets the incident form
 */
function resetIncidentForm() {
    const form = document.getElementById('incidentForm');
    if (form) form.reset();
    updateApplicationDate();
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
 * Updates the incident date input field with the current date
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Gets severity badge HTML
 * 
 * @param {string} severity - The severity level (High/Medium/Low)
 * @returns {string} HTML for the severity badge
 */
function getSeverityBadge(severity) {
    let color, bg, text;
    switch (severity) {
        case 'High': color = '#721c24'; bg = '#f8d7da'; text = 'High'; break;
        case 'Medium': color = '#856404'; bg = '#fff3cd'; text = 'Medium'; break;
        case 'Low': color = '#155724'; bg = '#d4edda'; text = 'Low'; break;
        default: color = '#6c757d'; bg = '#e2e3e5'; text = 'Not Rated';
    }
    return `<span style="color:${color}; background:${bg}; padding:2px 8px; border-radius:12px; font-size:12px;">${text}</span>`;
}

/**
 * Formats a date string
 * 
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.warn('Error formatting date:', dateString, e);
        return 'Invalid Date';
    }
}

/**
 * Formats a date and time string
 * 
 * @param {string} dateTimeString - The date/time string to format
 * @returns {string} Formatted date/time string
 */
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.warn('Error formatting date/time:', dateTimeString, e);
        return 'Invalid Date/Time';
    }
}

/**
 * Formats a time string
 * 
 * @param {string} dateTimeString - The date/time string to extract time from
 * @returns {string} Formatted time string
 */
function formatTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.warn('Error formatting time:', dateTimeString, e);
        return 'Invalid Time';
    }
}