// Configuration
import { initSocket, sockets } from '../../utils/socket.js';
import { archiveRecord } from '../../utils/archives.js';
import { createPaginator } from '../../utils/pagination.js';

const IR_HANDLER_URL = '/server/handlers/staff/incident_report/ir_handler.php';

let incidents = [];
let auditsPaginator;
let applicationsPaginator;

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    /* Universal Popup Spacing */
    .swal2-popup {
        padding: 2rem 1.5rem !important; 
        border-radius: 15px !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Consistent Icon Margins for Success/Error/Warning */
    .swal2-icon {
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        border-width: 4px !important;
    }

    /* Standardized Titles */
    .swal2-title {
        color: #00247C !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        margin: 0.5rem 0 !important;
        padding: 0 !important;
    }

    /* Standardized Text Content */
    .swal2-html-container {
        margin: 1rem 0 !important;
        font-size: 1.05rem !important;
        color: #555 !important;
        text-align: center !important;
    }

    /* Button Spacing */
    .swal2-actions {
        margin-top: 1.5rem !important;
        margin-bottom: 0.5rem !important;
    }
`;
document.head.appendChild(swalStyle);

// Global SweetAlert Configuration for Incident Alerts
const incidentAlertConfig = Swal.mixin({
    padding: '2em',
    customClass: {
        title: 'swal-title-center',
        htmlContainer: 'swal-text-center',
        actions: 'swal-actions-spacing'
    },
    didOpen: (popup) => {
        popup.style.textAlign = 'center';
        const content = popup.querySelector('.swal2-html-container');
        if (content) {
            content.style.textAlign = 'center';
            content.style.lineHeight = '1.6';
            content.style.marginTop = '1em';
        }
    }
});

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
        fetchAuditLogs();
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

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
    // tbody.innerHTML = '';

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

    // filtered.forEach(incident => {
    //     let badgeClass = 'reported';
    //     if (incident.status === 'Pending') badgeClass = 'pending';
    //     if (incident.status === 'Resolved') badgeClass = 'resolved';
    //     if (incident.status === 'Under Investigation') badgeClass = 'investigation';
    //     if (incident.status === 'Closed') badgeClass = 'closed';
    //     if (incident.status === 'Cancelled') badgeClass = 'cancelled';

    //     let actionBtn = '';

    //     if (incident.status === 'Pending') {
    //         actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Process</button>`;
    //     }
    //     else if (incident.status === 'Reported') {
    //         actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Review</button>`;
    //     }
    //     else if (incident.status === 'Under Investigation') {
    //         actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">Investigate</button>`;
    //     }
    //     else if (incident.status === 'Referred to Authorities') {
    //         actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${incident.id})">Follow Up</button>`;
    //     }
    //     else if (incident.status === 'Resolved') {
    //         actionBtn = `<button class="btn-success" onclick="openUpdateModal(${incident.id})">Finalize</button>`;
    //     }
    //     else {
    //         actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${incident.id})">Update</button>`;
    //     }

    //     const row = document.createElement('tr');
    //     row.innerHTML = `
    //     <td>${incident.id}</td>
    //     <td>${incident.rp_full_name || 'N/A'}</td>
    //     <td>${incident.vic_full_name || 'N/A'}</td>
    //     <td>${incident.sus_full_name || 'N/A'}</td>
    //     <td>${incident.incident_type || 'N/A'}</td>
    //     <td>${incident.rp_address || 'N/A'}</td>
    //     <td>${formatDateTime(incident.incident_timestamp)}</td>
    //     <td><span class="status-badge status-${badgeClass}">${incident.status}</span></td>
    //     <td>
    //         <div class="action-buttons">
    //             ${actionBtn}
    //             <button class="btn-info" onclick="viewDetails(${incident.id})" title="View Details">View</button>
    //             <button class="btn-secondary archive-btn" data-id="${incident.id}" data-table="incident_reports">Archive</button>
    //         </div>
    //     </td>
    // `;
    //     tbody.appendChild(row);
    // });

    applicationsPaginator.load(filtered);

}

function renderTableRows(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(incident => {
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
                <button class="btn-secondary archive-btn" data-id="${incident.id}" data-table="incident_reports">Archive</button>
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
    return fetch(`${IR_HANDLER_URL}?action=fetch`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                incidents = (data.data || []).filter(inc => !inc.is_archived);
            } else {
                incidents = [];
            }
            return incidents;
        })
        .catch(error => {
            console.error('Error fetching incidents:', error);
            incidents = [];
            return incidents;
        });
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
        loadIncidentsFromDB().finally(() => { filterIncidents(); finish(); });
    } else if (activeTabId === 'process') {
        loadIncidentsFromDB().finally(() => { loadProcessTable(); finish(); });
    } else if (activeTabId === 'summary') {
        loadIncidentsFromDB().finally(() => { loadSummarySelect(); finish(); });
    } else if (activeTabId === 'dashboard') {
        loadIncidentsFromDB().finally(() => {
            loadAnalyticsTab();
            fetchAuditLogs();
            finish();
        });
    } else {
        finish();
    }
};

/**
 * Loads incidents into the process table with actionable statuses
 */
function loadProcessTable() {
    loadIncidentsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const excludedStatuses = ['Closed', 'Cancelled', 'Resolved', 'Archived'];
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
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_type.map(x => x.incident_type);
            const values2 = res.data_by_type.map(x => x.total);
            const totals2 = values2.slice();
            const percentages2 = res.data_by_type.map(x => x.percentage);

            const labels3 = res.data_by_dss.map(x => x.dss_status);
            const totals3 = res.data_by_dss.map(x => x.total);
            const percentages3 = res.data_by_dss.map(x => x.percentage);

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
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false },
                        y: { beginAtZero: true }
                    },
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
                        label: 'Incidents by Type',
                        data: values2,
                        backgroundColor: typeColors,
                        borderWidth: 1,
                        borderRadius: '4',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false },
                        y: { beginAtZero: true }
                    },
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
 * Opens the update modal for a specific incident and loads current data
 * Includes Evaluation Results display and status tracking
 * 
 * @param {number} appId - The incident ID to open in the update modal
 */
function openUpdateModal(appId) {
    const incident = incidents.find(i => i.id == appId);

    if (!incident) {
        // REPLACED WITH SWEETALERT2
        incidentAlertConfig.fire({
            icon: 'error',
            title: 'Not Found',
            text: 'Incident data not found.',
            confirmButtonText: 'Understood',
            confirmButtonColor: '#d33'
        });
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
    // console.debug('fetchDSSEvaluation ->', IR_HANDLER_URL, appId);
    // Use 'application_id' parameter to match the PHP backend expectation
    fetch(`${IR_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            // console.debug('DSS response for', appId, data);
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
 * Displays evaluation scores, priority level, rule results, and recommendations
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
    const maxScore = details.max_score || 6;
    const urgencyScore = details.urgency_score || 0;
    const priorityLevel = details.priority_level || 'Low';

    const passedRules = details.passed_rules || [];
    const failedRules = details.failed_rules || [];
    const recommendations = details.recommendations || [];

    // Get rule results for more detailed display
    const ruleResults = details.rule_results || {};

    let statusColor, statusBg, statusText;
    switch (dssStatus) {
        case 'High Priority':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            statusText = 'High Priority';
            break;
        case 'Medium Priority':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            statusText = 'Medium Priority';
            break;
        case 'Low Priority':
            statusColor = '#155724';
            statusBg = '#d4edda';
            statusText = 'Low Priority';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
            statusText = dssStatus;
    }

    dssSection.innerHTML = `
    <div class="dss-evaluation-section">
        <div class="dss-header">
            <h3>DST Evaluation Result</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg}; padding: 8px 12px;">
                ${statusText}
            </span>
        </div>
        
        <div class="dss-score-summary">
            <div class="dss-score">
                <strong>Rules Passed</strong>
                <span>${score}/${maxScore}</span>
            </div>
            <div class="dss-probability">
                <strong>Priority Level</strong>
                <span>${priorityLevel}</span>
            </div>
        </div>
        
        <div class="dss-progress-container">
            <div class="dss-progress-label">
                <span>Urgency Score</span>
                <span class="dss-progress-percentage">${urgencyScore}%</span>
            </div>
            <div class="dss-progress-bar">
                <div class="dss-progress-fill" style="width: ${Math.max(0, Math.min(100, urgencyScore))}%"></div>
            </div>
        </div>
        
        <div class="dss-rules-summary">
            <div class="dss-rules-column">
                <h4>Passed Rules (${passedRules.length})</h4>
                ${passedRules.length > 0 ?
            `<ul class="dss-rules-list passed">${passedRules.map(rule => {
                // Get the rule result if available
                const ruleId = Object.keys(ruleResults).find(key =>
                    evaluation.rules?.find(r => r.name === rule)?.id === key
                );
                const result = ruleId ? ruleResults[ruleId] : '';
                return `<li>${rule} ${result ? `<span style="color:#666; font-size:11px;">(${result})</span>` : ''}</li>`;
            }).join('')}</ul>` :
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
        case 'High Priority':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            break;
        case 'Medium Priority':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Low Priority':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
    }

    dssSection.innerHTML = `
        <div class="dss-header">
            <h3>DST Evaluation</h3>
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
                const socket = sockets["main"];
                if (socket) {
                    socket.emit('incident_report_applications_update', { action: 'status_update' });
                }

                closeModal('updateModal');

                // REPLACED WITH SWEETALERT2
                incidentAlertConfig.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Incident updated successfully!',
                    confirmButtonText: 'Great',
                    confirmButtonColor: '#28a745'
                });


                loadManagementTable();
                loadProcessTable();
                try { new BroadcastChannel('barangay_status_update').postMessage('status_update'); } catch (e) { }
            } else {
                // REPLACED WITH SWEETALERT2
                incidentAlertConfig.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Error: ' + data.message,
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#d33'
                });
            }
        })
        .catch(error => {
            console.error('Error updating incident:', error);

            // REPLACED WITH SWEETALERT2
            incidentAlertConfig.fire({
                icon: 'error',
                title: 'Update Error',
                text: 'Error updating incident. Please try again.',
                confirmButtonText: 'Understood',
                confirmButtonColor: '#d33'
            });
        });
};

/**
 * Generates a downloadable incident report document in HTML format
 * Creates a formatted report with all incident details for printing/saving
 */
// function generateReportDocument() {
//     const downloadBtn = document.getElementById('downloadBtn');

//     if (downloadBtn) {

//         downloadBtn.addEventListener('click', () => {
//             // Create a simple HTML document for the report
//             const reportHTML = `
//                 <!DOCTYPE html>
//                 <html>
//                 <head>
//                     <meta charset="UTF-8">
//                     <title>Incident Report - ${new Date().toLocaleDateString()}</title>
//                     <style>
//                         body { font-family: Arial, sans-serif; margin: 40px; }
//                         h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
//                         .section { margin: 20px 0; }
//                         .section h2 { color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
//                         .field { margin: 5px 0; }
//                         .label { font-weight: bold; }
//                     </style>
//                 </head>
//                 <body>
//                     <h1>Incident Report</h1>
//                     <div class="section">
//                         <h2>Reporting Person</h2>
//                         <div class="field"><span class="label">Name:</span> ${rpFullName.value}</div>
//                         <div class="field"><span class="label">Address:</span> ${rpAddress.value}</div>
//                         <div class="field"><span class="label">Contact:</span> ${rpContact.value}</div>
//                         <div class="field"><span class="label">Relationship to Victim:</span> ${rpRelationship.value || 'Not specified'}</div>
//                     </div>
//                     <div class="section">
//                         <h2>Victim Details</h2>
//                         ${victimSameAsRP.checked ?
//                     '<div class="field">Same as Reporting Person</div>' :
//                     `
//                             <div class="field"><span class="label">Name:</span> ${vicFullName.value}</div>
//                             <div class="field"><span class="label">Address:</span> ${vicAddress.value}</div>
//                             <div class="field"><span class="label">Contact:</span> ${vicContact.value}</div>
//                             <div class="field"><span class="label">Citizenship:</span> ${vicCitizenship.value}</div>
//                             <div class="field"><span class="label">Gender:</span> ${vicGender.value}</div>
//                             <div class="field"><span class="label">Date of Birth:</span> ${vicDOB.value}</div>
//                             <div class="field"><span class="label">Occupation:</span> ${vicOccupation.value}</div>
//                             `
//                 }
//                     </div>
//                     <div class="section">
//                         <h2>Suspect Details</h2>
//                         <div class="field"><span class="label">Name:</span> ${susFullName.value || 'Not specified'}</div>
//                         <div class="field"><span class="label">Address:</span> ${susAddress.value || 'Not specified'}</div>
//                         <div class="field"><span class="label">Contact:</span> ${susContact.value || 'Not specified'}</div>
//                         <div class="field"><span class="label">Gender:</span> ${susGender.value || 'Not specified'}</div>
//                         <div class="field"><span class="label">Description:</span> ${susDescription.value}</div>
//                     </div>
//                     <div class="section">
//                         <h2>Incident Details</h2>
//                         <div class="field"><span class="label">Type:</span> ${incidentType.value === 'other' ? otherIncidentType.value : incidentType.value}</div>
//                         <div class="field"><span class="label">Date & Time:</span> ${incidentTimestamp.value}</div>
//                         <div class="field"><span class="label">Location:</span> ${incidentAddress.value}</div>
//                         <div class="field"><span class="label">Coordinates:</span> ${incidentLatitude.value && incidentLongitude.value ? `Lat: ${incidentLatitude.value}, Lng: ${incidentLongitude.value}` : 'No coordinates'}</div>
//                         <div class="field"><span class="label">Description:</span> ${description.value}</div>
//                     </div>
//                     <div class="section">
//                         <h2>Report Information</h2>
//                         <div class="field"><span class="label">Date Reported:</span> ${new Date().toLocaleString()}</div>
//                     </div>
//                 </body>
//                 </html>
//             `;

//             // Create and download the file as a Word document
//             const blob = new Blob([reportHTML], { type: 'application/msword' });
//             const url = URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `Incident_Report_${new Date().toISOString().split('T')[0]}.doc`;
//             document.body.appendChild(a);
//             a.click();
//             document.body.removeChild(a);
//             URL.revokeObjectURL(url);
//         });
//     }
// }


/**
 * Displays detailed incident information in a modal view
 * * @param {number} appId - The incident ID to view details for
 */
function viewDetails(appId) {
    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    // REMOVED: generateReportDocument(); (No longer needed)

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

                <div class="detail-card" style="margin-top:20px; border-color: #c3e6cb;">
                    <section id="reportOutput">
                        <p style="margin-bottom: 10px; color: #555;">Click the button below to download the report file.</p>
                        <button class="btn-primary" onclick="downloadSummary(${incident.id})">
                            <i class="fas fa-download"></i> Download Report (.doc)
                        </button>
                    </section>
                </div>
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
            <h3>Evaluation Status</h3>
            <div class="detail-row"><span class="detail-label">DST Status</span> <span class="detail-value" style="color:#0c5460; font-weight:bold;">${incident.dss_status || 'Pending Evaluation'}</span></div>
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
            <div id="incident-narrative" style="background:#f8f9fa; padding:15px; border-radius:5px; margin-left: 40px; margin-right: 40px;">
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

    // Create print-specific HTML
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
                // Auto-print when page loads - tab stays open
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    // CHANGED: Removed window features to force a New Tab behavior
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
        // This triggers the print dialog as soon as the content is loaded
    w.focus(); // Necessary for some browsers to focus the print dialog

    // Use a slight timeout to ensure styles and images (like your logo) are rendered
    setTimeout(() => {
        w.print();

        // Optional: Uncomment the line below if you want the window to close 
        // automatically after the user clicks 'Print' or 'Cancel'
        // w.close(); 
    }, 500);
}

/**
 * Downloads a summary report as a Word document
 * * @param {number} appId - The incident ID to download summary for
 */
function downloadSummary(appId) {
    const incident = incidents.find(i => i.id == appId);
    if (!incident) return;

    // Determine if victim is same as RP based on matching names or missing victim name
    const isVictimSameAsRP = incident.vic_full_name === incident.rp_full_name || !incident.vic_full_name;
    const incidentLocation = incident.incident_location || incident.incident_address || 'Not specified';

    // Safely get coordinates (handling potential property name variations)
    const lat = incident.incident_latitude || incident.latitude || 'N/A';
    const lng = incident.incident_longitude || incident.longitude || 'N/A';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Incident Report Summary - ${incident.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.5; }
                h1 { color: #00247C; border-bottom: 2px solid #00247C; padding-bottom: 10px; }
                .section { margin: 20px 0; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .section h2 { color: #555; font-size: 14pt; margin-bottom: 10px; }
                .field { margin: 5px 0; }
                .label { font-weight: bold; display: inline-block; width: 160px; color: #444; }
                .status-badge { font-weight: bold; padding: 3px 8px; border: 1px solid #333; background: #f0f0f0; text-transform: uppercase;}
            </style>
        </head>
        <body>
            <h1>Incident Report (Ref ID: ${incident.id})</h1>
            
            <div class="section">
                <h2>Reporting Person</h2>
                <div class="field"><span class="label">Name:</span> ${incident.rp_full_name || 'N/A'}</div>
                <div class="field"><span class="label">Address:</span> ${incident.rp_address || 'N/A'}</div>
                <div class="field"><span class="label">Contact:</span> ${incident.rp_contact || 'N/A'}</div>
                <div class="field"><span class="label">Relationship to Victim:</span> ${incident.rp_relationship || 'Not specified'}</div>
            </div>

            <div class="section">
                <h2>Victim Details</h2>
                ${isVictimSameAsRP ?
            '<div class="field" style="font-style: italic;">Same as Reporting Person</div>' :
            `
                    <div class="field"><span class="label">Name:</span> ${incident.vic_full_name || 'N/A'}</div>
                    <div class="field"><span class="label">Address:</span> ${incident.vic_address || 'N/A'}</div>
                    <div class="field"><span class="label">Contact:</span> ${incident.vic_contact || 'N/A'}</div>
                    <div class="field"><span class="label">Citizenship:</span> ${incident.vic_citizenship || 'N/A'}</div>
                    <div class="field"><span class="label">Gender:</span> ${incident.vic_gender || 'N/A'}</div>
                    <div class="field"><span class="label">Date of Birth:</span> ${incident.vic_dob || 'N/A'}</div>
                    <div class="field"><span class="label">Occupation:</span> ${incident.vic_occupation || 'N/A'}</div>
                    `
        }
            </div>

            <div class="section">
                <h2>Suspect Details</h2>
                <div class="field"><span class="label">Name:</span> ${incident.sus_full_name || 'Not specified'}</div>
                <div class="field"><span class="label">Address:</span> ${incident.sus_address || 'Not specified'}</div>
                <div class="field"><span class="label">Contact:</span> ${incident.sus_contact || 'Not specified'}</div>
                <div class="field"><span class="label">Gender:</span> ${incident.sus_gender || 'Not specified'}</div>
                <div class="field"><span class="label">Description:</span> ${incident.sus_description || 'N/A'}</div>
            </div>

            <div class="section">
                <h2>Incident Details</h2>
                <div class="field"><span class="label">Type:</span> ${incident.incident_type || 'N/A'}</div>
                <div class="field"><span class="label">Date & Time:</span> ${formatDateTime(incident.incident_timestamp)}</div>
                <div class="field"><span class="label">Location:</span> ${incidentLocation}</div>
                <div class="field"><span class="label">Coordinates:</span> ${lat}, ${lng}</div>
                <div class="field"><span class="label">Narrative Description:</span> 
                    <p style="margin-top: 5px; padding: 10px; background: #f9f9f9; border-left: 3px solid #00247C;">
                        ${incident.description || 'N/A'}
                    </p>
                </div>
            </div>

            <div class="section" style="border-bottom: none;">
                <h2>Report Information</h2>
                <div class="field"><span class="label">Date Reported:</span> ${formatDateTime(incident.reported_at || incident.created_at)}</div>
                <div class="field"><span class="label">Current Status:</span> <span class="status-badge">${incident.status || 'N/A'}</span></div>
                ${incident.dss_status ? `<div class="field"><span class="label">DST Evaluation:</span> ${incident.dss_status}</div>` : ''}
                ${incident.investigation_notes ? `
                    <div class="field"><span class="label">Investigation Notes:</span> 
                        <p style="margin-top: 5px; font-style: italic;">${incident.investigation_notes}</p>
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;

    // Create and download the file as a Word document (.doc)
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Formats filename to something like: Incident_Report_12_2026-03-18.doc
    link.download = `Incident_Report_${incident.id}_${new Date().toISOString().split('T')[0]}.doc`;

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
 * DOM event listeners for the "Create New" Incident form toggles and inputs
 */
let witnessCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Victim same as RP toggle logic
    const victimSameAsRP = document.getElementById('victimSameAsRP');
    if (victimSameAsRP) {
        victimSameAsRP.addEventListener('change', function () {
            // The specific fields we want to hide/show
            const fieldsToToggle = ['vicFullName', 'vicContact', 'vicAddress'];

            fieldsToToggle.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    // Find the parent .form-group wrapper
                    const wrapper = input.closest('.form-group');

                    if (this.checked) {
                        if (wrapper) wrapper.style.display = 'none';
                        input.removeAttribute('required');
                    } else {
                        if (wrapper) wrapper.style.display = ''; // Reverts to CSS default
                        input.setAttribute('required', 'required');
                    }
                }
            });
        });
    }

    if (witnessCount === 0) {
        addWitness();// Add witnesss Function
    }

    // 3. Incident Type "Other" logic
    const incidentType = document.getElementById('incidentType');
    if (incidentType) {
        incidentType.addEventListener('change', function () {
            const otherContainer = document.getElementById('otherSpecifyContainer');
            const otherInput = document.getElementById('otherIncidentType');
            if (this.value === 'other') {
                otherContainer.classList.remove('hidden');
                otherInput.setAttribute('required', 'required');
            } else {
                otherContainer.classList.add('hidden');
                otherInput.removeAttribute('required');
                otherInput.value = '';
            }
        });
    }

    // 4. Sanitizer for built-in phone fields
    ['rpContact', 'vicContact', 'susContact'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '');
            });
        }
    });
});

function addWitness(addWitnessBtn) {
    witnessCount++;
    const container = document.getElementById('witnessesContainer');
    const witnessDiv = document.createElement('div');
    witnessDiv.className = 'witness-group';
    witnessDiv.style = 'border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px; position: relative;';
    witnessDiv.innerHTML = `
        <h3><strong>Witness ${witnessCount}</strong></h3>
        <div class="label-and-input">
            <label class="label" for="witnessName${witnessCount}">Full Name</label>
            <input type="text" class="witness-name" id="witnessName${witnessCount}" placeholder="Full Name">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessAddress${witnessCount}">Complete Address</label>
            <input type="text" class="witness-address" id="witnessAddress${witnessCount}" placeholder="Address">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessContact${witnessCount}">Contact Number</label>
            <input type="text" class="witness-contact" id="witnessContact${witnessCount}" maxlength="11" pattern="[0-9]{1,11}" placeholder="e.g., 09XXXXXXXXX">
        </div>
        <button type="button" class="remove-witness-btn" style="margin-top: 10px; ">Remove Witness</button>
    `;

    witnessesContainer.appendChild(witnessDiv);

    // Add remove functionality for witness entry
    witnessDiv.querySelector('.remove-witness-btn').addEventListener('click', () => {
        witnessDiv.remove();
        witnessCount--;
    });
}

// Set up witness addition button when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addWitnessBtn').addEventListener('click', addWitness);
});

/**
 * Main form submission handler for creating reports internally
 */
function createApplication(event) {
    event.preventDefault();

    incidentAlertConfig.fire({
        title: 'Create Incident Report?',
        text: 'Are you sure you want to submit this new report?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00247C',
        cancelButtonColor: '#ad2c2c',
        confirmButtonText: 'Yes, submit',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const form = document.getElementById('createIncidentForm');
            const formData = new FormData(form);

            formData.append('action', 'create');
            formData.append('supabase_user_id', 'staff_internal_' + Date.now()); // Internal placeholder
            formData.append('dateReported', new Date().toISOString());

            // Handle Victim Same As RP
            const isSame = document.getElementById('victimSameAsRP').checked;
            if (isSame) {
                formData.set('vicFullName', formData.get('rpFullName'));
                formData.set('vicAddress', formData.get('rpAddress'));
                formData.set('vicContact', formData.get('rpContact'));
            }

            // Correctly format witnesses array for PHP processing: `witnesses[0][name]`
            let witnessIdx = 0;
            document.querySelectorAll('.witness-group').forEach((group) => {
                const name = group.querySelector('.witness-name').value;
                const address = group.querySelector('.witness-address').value;
                const contact = group.querySelector('.witness-contact').value;

                if (name || address || contact) {
                    formData.append(`witnesses[${witnessIdx}][name]`, name);
                    formData.append(`witnesses[${witnessIdx}][address]`, address);
                    formData.append(`witnesses[${witnessIdx}][contact]`, contact);
                    witnessIdx++;
                }
            });

            // Handle "Other" incident type
            const incidentTypeVal = document.getElementById('incidentType').value;
            if (incidentTypeVal === 'other') {
                formData.set('incidentType', document.getElementById('otherIncidentType').value);
            }

            Swal.showLoading();

            fetch(IR_HANDLER_URL, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        incidentAlertConfig.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Incident Report Created! ID: ' + data.id
                        }).then(() => {
                            // Reset form state
                            form.reset();
                            document.getElementById('witnessesContainer').innerHTML = '';
                            document.getElementById('victimDetailsContainer').style.display = 'grid';
                            document.getElementById('otherSpecifyContainer').classList.add('hidden');

                            const socket = sockets["main"];
                            if (socket?.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({ type: "incident_report_applications_update", action: "new" }));
                            }

                            loadManagementTable();
                            switchTab(null, 'management');
                        });
                    } else {
                        incidentAlertConfig.fire({ icon: 'error', title: 'Error!', text: data.message });
                    }
                })
                .catch(err => {
                    console.error('Submit error:', err);
                    incidentAlertConfig.fire({ icon: 'error', title: 'Error!', text: 'Network error occurred.' });
                });
        }
    });
}

/**
 * Creates and opens a dynamic map picker specifically for the "Create" form
 * (Updated to include Street/Satellite toggle buttons in the header)
 */
function openMapPicker(target) {
    // Destroy any existing instance so re-opening always starts fresh
    const old = document.querySelector('.dynamic-map-modal');
    if (old) old.remove();

    // Title label per form type
    const titleMap = {
        incident: 'Select Incident Location',
        utility: 'Select Utility Work Location',
        business: 'Select Business Location',
        construction: 'Select Construction Site Location'
    };

    const modal = document.createElement('div');
    modal.className = 'modal dynamic-map-modal';
    // Use flex centering so the content box is always centred and height works correctly
    modal.style.cssText = 'display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
    modal.innerHTML = `
        <div class="modal-content" style="
            max-width: 900px; width: 100%; height: 80vh;
            display: flex; flex-direction: column;
            padding: 0; overflow: hidden; border-radius: 10px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.35);
        ">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; flex-shrink:0;">
                <h2 style="margin:0; font-size:17px;">${titleMap[target] || 'Select Location'}</h2>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button id="picker-street-btn" type="button" style="background:#00247c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;">Street</button>
                    <button id="picker-satellite-btn" type="button" style="background:white;color:#555;border:1px solid #ccc;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;">Satellite</button>
                    <button type="button" class="close-btn" onclick="this.closest('.dynamic-map-modal').remove()" style="margin-left:8px;">&times;</button>
                </div>
            </div>
            <div id="dynamic-map-container" style="flex:1; width:100%; min-height:0;"></div>
        </div>
    `;
    document.body.appendChild(modal);
    // modal starts visible because of the inline flex display above — no class toggle needed
    initializeMapPicker('dynamic-map-container', target);
}

/**
 * Initializes the map, dynamically fetches barangay boundary & clickable house polygons,
 * and includes a street/satellite toggle.
 */
async function initializeMapPicker(containerId, target) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    // 1. Clean up existing Leaflet instance if reopening modal
    const container = document.getElementById(containerId);
    if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
    }

    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });
    const satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri World Imagery'
    });

    const map = L.map(containerId).setView([defaultLat, defaultLng], 17);
    osmTile.addTo(map);

    // Match main map color system
    const POLY_COLORS = {
        street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.12, weight: 2 },
        satellite: { color: '#FFFFFF', fillColor: '#FFFFFF', fillOpacity: 0.15, weight: 2 }
    };
    const BOUND_COLORS = {
        street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.08, dashArray: '8,6', weight: 2 },
        satellite: { color: '#FFFFFF', fillColor: '#000000', fillOpacity: 0, dashArray: '8,6', weight: 2 }
    };

    let currentMode = 'street';
    let housePolygons = [];
    let boundaryLayers = [];
    let selectedMarker = null;

    function applyColors(mode) {
        housePolygons.forEach(p => p.setStyle(POLY_COLORS[mode]));
        boundaryLayers.forEach(b => b.setStyle(BOUND_COLORS[mode]));
    }

    // Street / Satellite toggle listeners
    const streetBtn = document.getElementById('picker-street-btn');
    const satBtn = document.getElementById('picker-satellite-btn');
    if (streetBtn && satBtn) {
        streetBtn.addEventListener('click', () => {
            map.removeLayer(satTile); osmTile.addTo(map);
            currentMode = 'street'; applyColors('street');
            streetBtn.style.background = '#00247c'; streetBtn.style.color = 'white'; streetBtn.style.border = 'none';
            satBtn.style.background = 'white'; satBtn.style.color = '#555'; satBtn.style.border = '1px solid #ccc';
        });
        satBtn.addEventListener('click', () => {
            map.removeLayer(osmTile); satTile.addTo(map);
            currentMode = 'satellite'; applyColors('satellite');
            satBtn.style.background = '#00247c'; satBtn.style.color = 'white'; satBtn.style.border = 'none';
            streetBtn.style.background = 'white'; streetBtn.style.color = '#555'; streetBtn.style.border = '1px solid #ccc';
        });
    }

    // ── Target-specific field helpers ─────────────────────────────────────
    // Maps each target type to its lat/lng hidden inputs and optional display field
    const fieldMap = {
        incident: { lat: 'incidentLatitude', lng: 'incidentLongitude', display: null },
        utility: { lat: 'latitude2', lng: 'longitude2', display: 'utilityLocationDisplay' },
        business: { lat: 'latitude2', lng: 'longitude2', display: 'businessLocationDisplay' },
        construction: { lat: 'latitude2', lng: 'longitude2', display: 'constructionLocationDisplay' }
    };
    const fields = fieldMap[target] || fieldMap.incident;

    function setLocation(lat, lng, label) {
        const latEl = document.getElementById(fields.lat);
        const lngEl = document.getElementById(fields.lng);
        if (latEl) latEl.value = lat;
        if (lngEl) lngEl.value = lng;
        if (fields.display) {
            const dispEl = document.getElementById(fields.display);
            if (dispEl) dispEl.value = label || `${lat}, ${lng}`;
        }
        // For incident form: also fill incidentAddress when set via click
        if (target === 'incident' && label) {
            const addrEl = document.getElementById('incidentAddress');
            if (addrEl && !addrEl.value) addrEl.value = label;
        }
        // Close the modal after selecting
        const modal = document.querySelector('.dynamic-map-modal');
        if (modal) modal.remove();
    }

    // Manual click fallback for areas without polygons
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (selectedMarker) map.removeLayer(selectedMarker);

        selectedMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;">Selected Location<br><small style="color:#888;">Click ✓ Confirm in the popup to use this location</small></div>')
            .openPopup();

        // Show a confirm button inside the popup
        selectedMarker.getPopup().setContent(
            `<div style="font-family:Inter,sans-serif;text-align:center;">
                <div style="font-weight:600;margin-bottom:8px;">Selected Location</div>
                <div style="font-size:12px;color:#555;margin-bottom:10px;">${lat}, ${lng}</div>
                <button onclick="
                    (function(){
                        var m=document.querySelector('.dynamic-map-modal');
                        var latEl=document.getElementById('${fields.lat}');
                        var lngEl=document.getElementById('${fields.lng}');
                        if(latEl) latEl.value='${lat}';
                        if(lngEl) lngEl.value='${lng}';
                        var disp=document.getElementById('${fields.display || ''}');
                        if(disp) disp.value='${lat}, ${lng}';
                        if(m) m.remove();
                    })()
                " style="background:#00247c;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-weight:600;font-size:13px;">
                    ✓ Confirm
                </button>
            </div>`
        );
    });

    // Fetch and draw Barangay Boundaries from DB
    try {
        const bRes = await fetch('/server/handlers/map/map_handler.php', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_boundaries'
        });
        const bData = await bRes.json();

        if (bData.success && bData.boundaries && bData.boundaries.length > 0) {
            bData.boundaries.forEach(b => {
                try {
                    const coords = JSON.parse(b.coordinates);
                    const latLngs = coords.map(c => Array.isArray(c) ? [c[1], c[0]] : [c.lat, c.lng]);
                    const layer = L.polygon(latLngs, BOUND_COLORS.street).addTo(map);
                    boundaryLayers.push(layer);
                } catch (err) { console.error('Boundary parse error:', err); }
            });
        }
    } catch (err) { console.error('Failed to load boundaries:', err); }

    // Fetch and draw House Polygons from DB
    try {
        const hRes = await fetch('/server/handlers/map/map_handler.php', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_houses'
        });
        const hData = await hRes.json();

        if (hData.success && hData.houses) {
            const houseLayer = L.layerGroup();

            hData.houses.forEach(house => {
                if (!house.coordinates) return;

                try {
                    const coords = JSON.parse(house.coordinates);
                    // Normalize: unwrap GeoJSON array-of-rings
                    const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) ? coords[0] : coords;
                    const latLngs = ring.map(c => [c[1], c[0]]);

                    const polygon = L.polygon(latLngs, { ...POLY_COLORS.street, interactive: true });
                    housePolygons.push(polygon);

                    const isLandmark = house.address && !/^\d/.test(house.address.trim());
                    const titleText = isLandmark ? (house.address || 'Landmark') : ('House #' + (house.house_number || '—'));
                    const subtitleHtml = house.street_name
                        ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>' : '';
                    const addrHtml = (!isLandmark && house.address)
                        ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>' : '';
                    const streetHtml = house.street_name
                        ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>' : '';

                    const popupHtml =
                        '<div style="font-family:Inter,sans-serif;min-width:190px;">' +
                        '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                        '<div style="font-weight:700;font-size:13px;">' + titleText + '</div>' + subtitleHtml +
                        '</div>' + addrHtml + streetHtml +
                        '<div style="margin-top:6px;font-size:11px;color:#999;font-style:italic;">Click to select this location</div>' +
                        '</div>';

                    polygon.bindPopup('', { maxWidth: 260 });

                    polygon.on('click', function (e) {
                        L.DomEvent.stopPropagation(e);

                        const lat = house.center_lat ? parseFloat(house.center_lat).toFixed(6) : e.latlng.lat.toFixed(6);
                        const lng = house.center_lng ? parseFloat(house.center_lng).toFixed(6) : e.latlng.lng.toFixed(6);

                        // Build the human-readable address label
                        let formattedAddress = house.address;
                        if (!formattedAddress) {
                            const lot = house.house_number ? `House/Unit ${house.house_number}, ` : '';
                            const street = house.street_name ? `${house.street_name}, ` : '';
                            formattedAddress = `${lot}${street}Brgy. Blue Ridge B, Quezon City`.trim();
                        }

                        // Store on window so the inline onclick can reach it
                        window._pickerSelectFn = function () { setLocation(lat, lng, formattedAddress); };

                        const confirmPopup =
                            '<div style="font-family:Inter,sans-serif;min-width:210px;">' +
                            '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                            '<div style="font-weight:700;font-size:13px;">' + titleText + '</div>' +
                            (house.street_name ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>' : '') +
                            '</div>' +
                            (house.address ? '<p style="margin:0 0 5px;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>' : '') +
                            (house.street_name ? '<p style="margin:0 0 5px;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>' : '') +
                            '<p style="margin:0 0 10px;font-size:11px;color:#888;">' + lat + ', ' + lng + '</p>' +
                            '<button onclick="window._pickerSelectFn()" style="width:100%;background:#00247c;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:13px;">&#10003; Select This Location</button>' +
                            '</div>';

                        polygon.setPopupContent(confirmPopup);
                        polygon.openPopup();
                    });

                    polygon.addTo(houseLayer);
                } catch (err) { console.error('House parse error:', err); }
            });

            houseLayer.addTo(map);
        }
    } catch (err) { console.error('Failed to load houses:', err); }

    // Let the browser finish painting the flex layout before Leaflet measures the container
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);
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

        if (logs.length === 0) {
            const tbody = document.getElementById('auditTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No audit logs found.</td></tr>';
            return;
        }

        auditsPaginator.load(logs);

    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
    }
}

function renderRowsAudit(logs) {
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

// Wait for the DOM content to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    auditsPaginator = createPaginator({
        containerId: 'auditsPagination',
        pageSize: 10,
        windowSize: 5
    }).onPage((pageItems) => {
        renderRowsAudit(pageItems);
    });

    applicationsPaginator = createPaginator({
        containerId: 'incidentReportApplicationsPagination',
        pageSize: 10,
        windowSize: 5
    }).onPage((pageItems) => {
        renderTableRows(pageItems);
    });

    fetchAuditLogs();

    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);

    initSocket("main", "http://localhost:8081", (data) => {
        switch (data.type) {
            case "incident_report_applications_update":
                refreshActiveTab();
                break;
            case "new_audit_log":
                if (data.payload) appendAuditRow(data.payload);
                else fetchAuditLogs();
                refreshActiveTab();
                break;
        }
    });
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
        // console.warn('Error formatting date:', dateString, e);
        return 'Invalid Date';
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
        // console.warn('Error formatting time:', dateTimeString, e);
        return 'Invalid Time';
    }
}

// Add archive handler for incident reports
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('archive-btn')) return;

    const tableName = e.target.dataset.table;
    if (tableName !== 'incident_reports') return;

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
            await archiveRecord('incident_reports', appId);

            // Remove the row immediately from the UI
            const row = e.target.closest('tr');
            if (row) row.remove();

            // Refresh both tables to ensure consistency
            loadManagementTable();
            loadProcessTable();
        }
    });
});

// ===============================================
// EXPOSE ALL FUNCTIONS TO GLOBAL SCOPE
// ===============================================
window.createApplication = createApplication;
window.openMapPicker = openMapPicker;
window.loadIncidentsFromDB = loadIncidentsFromDB;
window.filterIncidents = filterIncidents;
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
window.switchTab = switchTab;
window.initializeSidebarNav = initializeSidebarNav;
window.getCurrentDateString = getCurrentDateString;
window.updateApplicationDate = updateApplicationDate;
window.filterReviewIncidents = filterReviewIncidents;
window.resetIncidentForm = resetIncidentForm;
window.openModal = openModal;
window.closeModal = closeModal;
window.getSeverityBadge = getSeverityBadge;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatTime = formatTime;
