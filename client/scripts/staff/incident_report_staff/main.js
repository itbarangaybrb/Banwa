// Configuration
const INCIDENT_API_URL = '/Banwa/server/api/incident_report_staff/ir_handler.php';
let incidents = [];

// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', function () {
    initializeSidebarNav();
    loadAnalyticsTab();

    // Only initialize form if we're on a page that has the form
    if (document.getElementById('incidentTimestamp') || document.getElementById('prevBtn')) {
        initializeIncidentForm();
    }
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

    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('User profile button clicked');
        });
    }
}

/**
 * Switches between different incident tabs and loads appropriate data
 */
function switchTab(event, tabName) {
    if (event) event.preventDefault();

    const tabs = document.querySelectorAll('.tab-pane');
    if (tabs.length === 0) return;

    tabs.forEach(p => p.classList.remove('active'));
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
        console.warn('Management table body not found');
        return;
    }

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
    tbody.innerHTML = '';

    if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">
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

        return incidentType.includes(searchTerm) ||
            victimName.includes(searchTerm) ||
            location.includes(searchTerm) ||
            reportId.includes(searchTerm);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:#999;">
                    No matching incidents found.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(incident => {
        let badgeClass = 'reported';
        if (incident.status === 'Resolved') badgeClass = 'resolved';
        if (incident.status === 'Under Investigation') badgeClass = 'investigation';
        if (incident.status === 'Closed') badgeClass = 'closed';
        if (incident.status === 'Cancelled') badgeClass = 'cancelled';

        let actionBtn = '';
        if (incident.status === 'Reported') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">⚙️ Process</button>`;
        }
        else if (incident.status === 'Under Investigation') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${incident.id})">🔍 Investigate</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${incident.id})">⚙️ Update</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>INC-${incident.id}</td>
            <td>${incident.incident_type || 'N/A'}</td>
            <td>${incident.vic_full_name || 'N/A'}</td>
            <td>${incident.incident_location || 'N/A'}</td>
            <td>${formatDateTime(incident.incident_timestamp)}</td>
            <td><span class="status-badge status-${badgeClass}">${incident.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn-info" onclick="viewDetails(${incident.id})" title="View Details">👁️ View</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Fetches incident reports from the server API
 */
function loadIncidentsFromDB() {
    return fetch(`${INCIDENT_API_URL}?action=fetch`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Try to read the response as text to see what we got
                return res.text().then(text => {
                    console.error('Non-JSON response received:', text.substring(0, 200));
                    throw new TypeError("Server returned non-JSON response");
                });
            }
            return res.json();
        })
        .then(data => {
            if (data.status === 'success') {
                incidents = data.data;
            } else {
                console.warn('API returned non-success status:', data.message);
                incidents = [];
            }
            return incidents;
        })
        .catch(error => {
            console.error('Error fetching incidents:', error);
            showAlert('Failed to load incidents. Please check your connection.', 'error');
            incidents = [];
            return incidents;
        });
}

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
            let btnText = "⚙️ Update";
            let btnClass = "secondary";

            if (incident.status === 'Reported') {
                btnText = "Begin Investigation";
                btnClass = "primary";
            }
            else if (incident.status === 'Under Investigation') {
                btnText = "Continue Investigation";
                btnClass = "primary";
            }
            else if (incident.status === 'Referred to Authorities') {
                btnText = "Follow Up";
                btnClass = "warning";
            }

            tbody.innerHTML += `
                <tr>
                    <td>INC-${incident.id}</td>
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
 * Creates three charts: timeline chart, incident type distribution, and DSS status distribution
 */
function loadAnalyticsTab() {
    fetch(`${INCIDENT_API_URL}?action=chart_incident_type`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.date_reported);
            const values1 = res.data_by_date.map(x => x.total);

            const labels2 = res.data_by_type.map(x => x.incident_type);
            const values2 = res.data_by_type.map(x => x.total);

            // Add DSS status data if available
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
 */
function openUpdateModal(incidentId) {
    const incident = incidents.find(i => i.id == incidentId);

    if (!incident) {
        alert("Incident data not found.");
        return;
    }

    const updateReportId = document.getElementById('updateReportId');
    const displayCurrentStatus = document.getElementById('displayCurrentStatus');
    const newStatus = document.getElementById('newStatus');
    const updateComments = document.getElementById('updateComments');

    if (updateReportId) updateReportId.value = incident.id;
    if (displayCurrentStatus) displayCurrentStatus.value = incident.status;
    if (newStatus) newStatus.value = "";
    if (updateComments) updateComments.value = "";

    // Add incident summary section
    addIncidentSummarySection(incident);

    const updateModal = document.getElementById('updateModal');
    if (updateModal) {
        updateModal.classList.add('active');
    }
}

/**
 * Adds incident summary section to the update modal
 */
function addIncidentSummarySection(incident) {
    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const existingSection = document.getElementById('incidentSummarySection');
    if (existingSection) {
        existingSection.remove();
    }

    const summarySection = document.createElement('div');
    summarySection.id = 'incidentSummarySection';
    summarySection.className = 'incident-summary-section';

    summarySection.innerHTML = `
        <div class="incident-summary-section">
            <div class="summary-header">
                <h3>Incident Summary</h3>
            </div>
            
            <div class="summary-grid">
                <div class="summary-column">
                    <div class="summary-item">
                        <strong>Victim:</strong> ${incident.vic_full_name || 'N/A'}
                    </div>
                    <div class="summary-item">
                        <strong>Incident Type:</strong> ${incident.incident_type || 'N/A'}
                    </div>
                    <div class="summary-item">
                        <strong>Location:</strong> ${incident.incident_location || 'N/A'}
                    </div>
                </div>
                
                <div class="summary-column">
                    <div class="summary-item">
                        <strong>Date:</strong> ${formatDate(incident.incident_timestamp)}
                    </div>
                    <div class="summary-item">
                        <strong>Time:</strong> ${formatTime(incident.incident_timestamp)}
                    </div>
                    <div class="summary-item">
                        <strong>Severity:</strong> ${getSeverityBadge(incident.severity)}
                    </div>
                </div>
            </div>
            
            <div class="summary-narrative">
                <strong>Narrative:</strong>
                <p>${incident.description || 'No description provided.'}</p>
            </div>
        </div>
    `;

    updateForm.insertBefore(summarySection, updateForm.firstChild);
}

/**
 * Gets severity badge HTML
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
 * Submits incident status update to the server via API
 */
function submitUpdate(event) {
    event.preventDefault();

    const updateForm = document.getElementById('updateForm');
    if (!updateForm) return;

    const formData = new FormData(updateForm);
    formData.append('action', 'update_status');

    fetch(INCIDENT_API_URL, {
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
                showAlert('Incident updated successfully!', 'success');
                loadManagementTable();
                loadProcessTable();
                loadAnalyticsTab();
            } else {
                showAlert('Error: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error updating incident:', error);
            showAlert('Error updating incident. Please try again.', 'error');
        });
}

/**
 * Displays detailed incident information in a modal view
 */
function viewDetails(incidentId) {
    const incident = incidents.find(i => i.id == incidentId);
    if (!incident) return;

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
                    <div class="details-id">Report ID: INC-${incident.id}</div>
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
                        <h3>📍 Incident Information</h3>
                        <div class="detail-row"><span class="detail-label">Type</span> <span class="detail-value">${incident.incident_type || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Date & Time</span> <span class="detail-value">${formatDateTime(incident.incident_timestamp)}</span></div>
                        <div class="detail-row"><span class="detail-label">Location</span> <span class="detail-value">${incident.incident_location || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Coordinates</span> <span class="detail-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Severity</span> <span class="detail-value">${getSeverityBadge(incident.severity)}</span></div>
                    </div>

                    <div class="detail-card" style="margin-top:20px;">
                        <h3>👤 Victim Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.vic_full_name || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.vic_contact || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${incident.vic_address || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Gender</span> <span class="detail-value">${incident.vic_gender || 'N/A'}</span></div>
                    </div>
                </div>

                <div class="col-right">
                    <div class="detail-card">
                        <h3>👤 Reporting Person</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.rp_full_name || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.rp_contact || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Relationship</span> <span class="detail-value">${incident.rp_relationship || 'N/A'}</span></div>
                    </div>

                    ${incident.sus_full_name ? `
                    <div class="detail-card" style="margin-top:20px; border-color: #f5c6cb;">
                        <h3>⚠️ Suspect Details</h3>
                        <div class="detail-row"><span class="detail-label">Name</span> <span class="detail-value">${incident.sus_full_name || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span> <span class="detail-value">${incident.sus_contact || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Address</span> <span class="detail-value">${incident.sus_address || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Description</span> <span class="detail-value">${incident.sus_description || 'N/A'}</span></div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-card">
                <h3>📝 Narrative Description</h3>
                <p style="margin:0; color:#555; line-height:1.6;">${incident.description || 'No description provided.'}</p>
            </div>

            ${incident.investigation_notes ? `
            <div class="detail-card" style="background:#fff8e1; border-color:#ffeeba;">
                <h3 style="color:#856404; border-color:#ffeeba;">🔍 Investigation Notes</h3>
                <p style="margin:0; color:#555;">${incident.investigation_notes}</p>
                <div style="font-size:12px; color:#666; margin-top:5px;">Updated: ${formatDateTime(incident.updated_at)}</div>
            </div>
            ` : ''}
        </div>
    `;

    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
        modalBody.innerHTML = content;
        openModal('detailsModal');
    }
}

/**
 * Loads incident options into the summary select dropdown
 */
function loadSummarySelect() {
    loadIncidentsFromDB().finally(() => {
        const select = document.getElementById('summaryIncidentSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Incident Report --</option>';
        incidents.forEach(incident => {
            select.innerHTML += `<option value="${incident.id}">INC-${incident.id} - ${incident.incident_type} (${formatDate(incident.incident_timestamp)})</option>`;
        });
    });
}

/**
 * Updates the summary display with detailed incident information
 */
function updateIncidentSummary() {
    const select = document.getElementById('summaryIncidentSelect');
    const summaryOutput = document.getElementById('summaryOutput');

    if (!select || !summaryOutput) return;

    const incidentId = select.value;

    if (!incidentId) {
        summaryOutput.innerHTML = `
            <div class="placeholder-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Select an incident report from the list above to view the full summary.</p>
            </div>`;
        return;
    }

    const incident = incidents.find(i => i.id == incidentId);
    if (!incident) return;

    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (incident.status) {
        case 'Resolved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'Under Investigation': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Closed': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Cancelled': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const reportedDate = formatDateTime(incident.reported_at);
    const incidentDate = formatDateTime(incident.incident_timestamp);

    summaryOutput.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Incident Report Summary</h1>
                <div class="report-meta">Report ID: INC-${incident.id} &bull; Reported: ${reportedDate}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${incident.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>📍 Incident Details</h3>
                    <div class="info-row"><span class="info-label">Type</span> <span class="info-value">${incident.incident_type || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Date & Time</span> <span class="info-value">${incidentDate}</span></div>
                    <div class="info-row"><span class="info-label">Location</span> <span class="info-value">${incident.incident_location || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Coordinates</span> <span class="info-value">${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Severity</span> <span class="info-value">${incident.severity || 'Not Rated'}</span></div>
                </div>

                <div class="report-section">
                    <h3>👤 Victim Information</h3>
                    <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.vic_full_name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.vic_contact || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.vic_address || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Gender</span> <span class="info-value">${incident.vic_gender || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Citizenship</span> <span class="info-value">${incident.vic_citizenship || 'N/A'}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>👤 Reporting Person</h3>
                    <div class="info-row"><span class="info-label">Full Name</span> <span class="info-value">${incident.rp_full_name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${incident.rp_contact || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value">${incident.rp_address || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Relationship</span> <span class="info-value">${incident.rp_relationship || 'N/A'}</span></div>
                </div>

                ${incident.sus_full_name ? `
                <div class="report-section">
                    <h3>⚠️ Suspect Information</h3>
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
            <h3>📝 Incident Narrative</h3>
            <div style="background:#f8f9fa; padding:15px; border-radius:5px; border-left:4px solid #6366F1;">
                ${incident.description || 'No description provided.'}
            </div>
        </div>

        ${incident.investigation_notes ? `
        <div class="report-section" style="background:#fff8e1; padding:15px; border-radius:5px;">
            <h3 style="border:none; margin-bottom:5px;">🔍 Investigation Notes</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${incident.investigation_notes}"</p>
            <div style="font-size:12px; color:#666; margin-top:5px;">Last updated: ${formatDateTime(incident.updated_at)}</div>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn-secondary" onclick="downloadIncidentSummary(${incident.id})"><i class="fas fa-download"></i> Download Report</button>
            <button class="btn-primary" onclick="printIncidentSummary()"><i class="fas fa-print"></i> Print Summary</button>
        </div>
    `;
}

/**
 * Downloads an incident summary as a Word document
 */
function downloadIncidentSummary(incidentId) {
    const incident = incidents.find(i => i.id == incidentId);
    if (!incident) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Incident Report Summary - INC-${incident.id}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                h1 { color: #5B479B; border-bottom: 3px solid #826EEA; padding-bottom: 10px; font-size: 24pt; }
                h2 { color: #826EEA; margin-top: 30px; font-size: 16pt; }
                .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
                .info-list { list-style-type: none; padding: 0; }
                .info-list li { margin-bottom: 8px; }
                .info-list strong { display: inline-block; width: 200px; font-weight: bold; }
                .status-badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 10pt;}
                .narrative-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #826EEA; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Incident Report Summary</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Report ID:</strong> INC-${incident.id}</p>
                <p><strong>Status:</strong> ${incident.status}</p>

                <h2>📍 Incident Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Incident Type:</strong> ${incident.incident_type}</li>
                        <li><strong>Date & Time:</strong> ${formatDateTime(incident.incident_timestamp)}</li>
                        <li><strong>Location:</strong> ${incident.incident_location}</li>
                        <li><strong>Coordinates:</strong> ${incident.incident_latitude || 'N/A'}, ${incident.incident_longitude || 'N/A'}</li>
                        <li><strong>Severity:</strong> ${incident.severity || 'Not Rated'}</li>
                    </ul>
                </div>

                <h2>👤 Victim Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Full Name:</strong> ${incident.vic_full_name}</li>
                        <li><strong>Contact Number:</strong> ${incident.vic_contact}</li>
                        <li><strong>Address:</strong> ${incident.vic_address}</li>
                        <li><strong>Gender:</strong> ${incident.vic_gender}</li>
                        <li><strong>Citizenship:</strong> ${incident.vic_citizenship}</li>
                    </ul>
                </div>

                <h2>👤 Reporting Person</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Full Name:</strong> ${incident.rp_full_name}</li>
                        <li><strong>Contact Number:</strong> ${incident.rp_contact}</li>
                        <li><strong>Address:</strong> ${incident.rp_address}</li>
                        <li><strong>Relationship:</strong> ${incident.rp_relationship}</li>
                    </ul>
                </div>

                ${incident.sus_full_name ? `
                <h2>⚠️ Suspect Information</h2>
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

                <h2>📝 Incident Narrative</h2>
                <div class="narrative-box">
                    ${incident.description || 'No description provided.'}
                </div>

                ${incident.investigation_notes ? `
                <h2>🔍 Investigation Notes</h2>
                <div class="card">
                    <p><strong>Notes:</strong> ${incident.investigation_notes}</p>
                    <p><strong>Last Updated:</strong> ${formatDateTime(incident.updated_at)}</p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident_Report_${incident.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Archives an incident report by sending a request to the server
 */
function archiveIncident(incidentId) {
    if (!confirm('Are you sure you want to archive this incident report?')) return;
    fetch(`${INCIDENT_API_URL}?action=archive&id=${incidentId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Incident archived successfully', 'success');
                loadManagementTable();
            }
        });
}

/**
 * Opens a modal dialog
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Closes a modal dialog
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
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        // Create alert container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'alert-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} active`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = 'padding: 15px; margin: 10px 0; border-radius: 5px; color: white; min-width: 250px;';

    if (type === 'success') {
        alertDiv.style.background = '#4CAF50';
    } else if (type === 'error') {
        alertDiv.style.background = '#f44336';
    } else if (type === 'warning') {
        alertDiv.style.background = '#ff9800';
    } else {
        alertDiv.style.background = '#2196F3';
    }

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (alertDiv.parentNode === alertContainer) {
                alertContainer.removeChild(alertDiv);
            }
        }, 300);
    }, 4000);
}

/**
 * Prints the current incident summary
 */
function printIncidentSummary() {
    const summaryToPrint = document.getElementById('summaryOutput');
    if (!summaryToPrint) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Incident Report Summary</title>');
    printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    printWindow.document.write('<link rel="stylesheet" href="../../../styles/staff/incident_report_staff/incident_report.css">');
    printWindow.document.write('</head><body>');
    printWindow.document.write(summaryToPrint.innerHTML);
    printWindow.document.write('');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
}

/**
 * Generates a summary report
 */
function generateSummaryReport() {
    const incidentId = document.getElementById('summaryIncidentSelect');
    if (!incidentId || !incidentId.value) {
        showAlert('Please select an incident report first', 'warning');
        return;
    }
    updateIncidentSummary();
}

/**
 * Exports to PDF
 */
function exportToPDF() {
    showAlert('PDF export functionality coming soon!', 'info');
}

// ==================== INCIDENT FORM HANDLING ====================

let currentStep = 1;
const totalSteps = 4;

/**
 * Initializes the incident form
 */
function initializeIncidentForm() {
    // Check if we're on a page that has the form
    const incidentTimestamp = document.getElementById('incidentTimestamp');
    const requestDate = document.getElementById('requestDate');
    const prevBtn = document.getElementById('prevBtn');

    if (!incidentTimestamp || !requestDate || !prevBtn) {
        console.warn('Incident form elements not found. Skipping form initialization.');
        return;
    }

    // Initialize date fields
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    incidentTimestamp.value = formattedDate;
    requestDate.value = now.toISOString().slice(0, 10);

    // Step navigation
    prevBtn.addEventListener('click', prevStep);

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitIncidentForm);
    }

    // Checkbox for same victim as reporting person
    const victimSameAsRP = document.getElementById('victimSameAsRP');
    if (victimSameAsRP) {
        victimSameAsRP.addEventListener('change', function () {
            if (this.checked) {
                copyReportingPersonToVictim();
            }
        });
    }

    // Incident type change handler
    const incidentType = document.getElementById('incidentType');
    if (incidentType) {
        incidentType.addEventListener('change', function () {
            const otherContainer = document.getElementById('otherSpecifyContainer');
            if (otherContainer) {
                if (this.value === 'other') {
                    otherContainer.classList.remove('hidden');
                } else {
                    otherContainer.classList.add('hidden');
                }
            }
        });
    }

    updateNavigationButtons();
}

/**
 * Navigates to the next step in the form
 */
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            const currentStepEl = document.getElementById(`step${currentStep}`);
            const nextStepEl = document.getElementById(`step${currentStep + 1}`);

            if (currentStepEl) currentStepEl.classList.remove('active');
            if (nextStepEl) nextStepEl.classList.add('active');

            currentStep++;
            updateNavigationButtons();
        }
    }
}

/**
 * Navigates to the previous step in the form
 */
function prevStep() {
    if (currentStep > 1) {
        const currentStepEl = document.getElementById(`step${currentStep}`);
        const prevStepEl = document.getElementById(`step${currentStep - 1}`);

        if (currentStepEl) currentStepEl.classList.remove('active');
        if (prevStepEl) prevStepEl.classList.add('active');

        currentStep--;
        updateNavigationButtons();
    }
}

/**
 * Validates the current step
 */
function validateCurrentStep() {
    let isValid = true;
    const currentStepElement = document.getElementById(`step${currentStep}`);

    if (!currentStepElement) return false;

    const requiredFields = currentStepElement.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#dc3545';
        } else {
            field.style.borderColor = '';
        }
    });

    if (!isValid) {
        showAlert('Please fill in all required fields marked with *', 'error');
    }

    return isValid;
}

/**
 * Updates navigation buttons based on current step
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (!prevBtn || !nextBtn) return;

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }

    if (currentStep === totalSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

/**
 * Copies reporting person data to victim fields
 */
function copyReportingPersonToVictim() {
    const rpFullName = document.getElementById('rpFullName');
    const rpLotNo = document.getElementById('rpLotNo');
    const rpStreet = document.getElementById('rpStreet');
    const rpContact = document.getElementById('rpContact');

    const vicFullName = document.getElementById('vicFullName');
    const vicLotNo = document.getElementById('vicLotNo');
    const vicStreet = document.getElementById('vicStreet');
    const vicContact = document.getElementById('vicContact');

    if (rpFullName && vicFullName) vicFullName.value = rpFullName.value;
    if (rpLotNo && vicLotNo) vicLotNo.value = rpLotNo.value;
    if (rpStreet && vicStreet) vicStreet.value = rpStreet.value;
    if (rpContact && vicContact) vicContact.value = rpContact.value;
}

/**
 * Submits the incident form
 */
function submitIncidentForm(event) {
    if (event) event.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    const formData = new FormData();

    // Reporting Person
    const rpFullName = document.getElementById('rpFullName');
    const rpLotNo = document.getElementById('rpLotNo');
    const rpStreet = document.getElementById('rpStreet');
    const rpContact = document.getElementById('rpContact');
    const rpRelationship = document.getElementById('rpRelationship');

    if (rpFullName) formData.append('rpFullName', rpFullName.value);
    if (rpLotNo) formData.append('rpLotNo', rpLotNo.value);
    if (rpStreet) formData.append('rpStreet', rpStreet.value);
    if (rpContact) formData.append('rpContact', rpContact.value);
    if (rpRelationship) formData.append('rpRelationship', rpRelationship.value);

    // Victim Details
    const vicFullName = document.getElementById('vicFullName');
    const vicLotNo = document.getElementById('vicLotNo');
    const vicStreet = document.getElementById('vicStreet');
    const vicContact = document.getElementById('vicContact');
    const vicCitizenship = document.getElementById('vicCitizenship');
    const vicGender = document.getElementById('vicGender');
    const vicDOB = document.getElementById('vicDOB');
    const vicOccupation = document.getElementById('vicOccupation');

    if (vicFullName) formData.append('vicFullName', vicFullName.value);
    if (vicLotNo) formData.append('vicLotNo', vicLotNo.value);
    if (vicStreet) formData.append('vicStreet', vicStreet.value);
    if (vicContact) formData.append('vicContact', vicContact.value);
    if (vicCitizenship) formData.append('vicCitizenship', vicCitizenship.value);
    if (vicGender) formData.append('vicGender', vicGender.value);
    if (vicDOB) formData.append('vicDOB', vicDOB.value);
    if (vicOccupation) formData.append('vicOccupation', vicOccupation.value);

    // Suspect Details
    const susFullName = document.getElementById('susFullName');
    const susLotNo = document.getElementById('susLotNo');
    const susStreet = document.getElementById('susStreet');
    const susContact = document.getElementById('susContact');
    const susGender = document.getElementById('susGender');
    const susDescription = document.getElementById('susDescription');

    if (susFullName) formData.append('susFullName', susFullName.value);
    if (susLotNo) formData.append('susLotNo', susLotNo.value);
    if (susStreet) formData.append('susStreet', susStreet.value);
    if (susContact) formData.append('susContact', susContact.value);
    if (susGender) formData.append('susGender', susGender.value);
    if (susDescription) formData.append('susDescription', susDescription.value);

    // Incident Details
    const incidentType = document.getElementById('incidentType');
    const otherIncidentType = document.getElementById('otherIncidentType');
    const incidentTimestamp = document.getElementById('incidentTimestamp');
    const incidentLotNo = document.getElementById('incidentLotNo');
    const incidentStreet = document.getElementById('incidentStreet');
    const incidentLatitude = document.getElementById('incidentLatitude');
    const incidentLongitude = document.getElementById('incidentLongitude');
    const description = document.getElementById('description');

    if (incidentType) {
        const incidentTypeValue = incidentType.value === 'other' && otherIncidentType ? otherIncidentType.value : incidentType.value;
        formData.append('incidentType', incidentTypeValue);
    }
    if (incidentTimestamp) formData.append('incidentTimestamp', incidentTimestamp.value);
    if (incidentLotNo) formData.append('incidentLotNo', incidentLotNo.value);
    if (incidentStreet) formData.append('incidentStreet', incidentStreet.value);
    if (incidentLatitude) formData.append('incidentLatitude', incidentLatitude.value);
    if (incidentLongitude) formData.append('incidentLongitude', incidentLongitude.value);
    if (description) formData.append('description', description.value);

    formData.append('action', 'create');

    fetch(INCIDENT_API_URL, {
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
                    console.error('Non-JSON response for form submit:', text.substring(0, 200));
                    throw new TypeError("Server returned non-JSON response");
                });
            }
            return res.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showAlert('Incident report created successfully!', 'success');
                resetIncidentForm();
                switchTab(null, 'management');
            } else {
                showAlert('Error: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error creating incident:', error);
            showAlert('Error creating incident report. Please try again.', 'error');
        });
}

/**
 * Resets the incident form
 */
function resetIncidentForm() {
    const form = document.querySelector('#create form');
    if (!form) return;

    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.value = '';
    });

    currentStep = 1;
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));

    const step1 = document.getElementById('step1');
    if (step1) step1.classList.add('active');

    updateNavigationButtons();

    // Reset date fields
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    const incidentTimestamp = document.getElementById('incidentTimestamp');
    const requestDate = document.getElementById('requestDate');

    if (incidentTimestamp) incidentTimestamp.value = formattedDate;
    if (requestDate) requestDate.value = now.toISOString().slice(0, 10);
}

/**
 * Opens the map picker modal
 */
function openMapPicker() {
    // Initialize map if not already initialized
    if (!window.incidentMap) {
        initializeIncidentMap();
    }

    const mapPickerModal = document.getElementById('mapPickerModal');
    if (mapPickerModal) {
        mapPickerModal.classList.add('active');
    }
}

/**
 * Initializes the incident map for location picking
 */
function initializeIncidentMap() {
    const mapPicker = document.getElementById('mapPicker');
    if (!mapPicker) return;

    const map = L.map('mapPicker').setView([14.617500, 121.075600], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker;

    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        const selectedLatitude = document.getElementById('selectedLatitude');
        const selectedLongitude = document.getElementById('selectedLongitude');

        if (selectedLatitude) selectedLatitude.value = lat.toFixed(6);
        if (selectedLongitude) selectedLongitude.value = lng.toFixed(6);

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Selected Location')
            .openPopup();
    });

    window.incidentMap = map;
}

/**
 * Confirms the selected location
 */
function confirmLocation() {
    const selectedLatitude = document.getElementById('selectedLatitude');
    const selectedLongitude = document.getElementById('selectedLongitude');
    const incidentLatitude = document.getElementById('incidentLatitude');
    const incidentLongitude = document.getElementById('incidentLongitude');

    if (!selectedLatitude || !selectedLongitude || !incidentLatitude || !incidentLongitude) return;

    const lat = selectedLatitude.value;
    const lng = selectedLongitude.value;

    if (lat && lng) {
        incidentLatitude.value = lat;
        incidentLongitude.value = lng;
        closeModal('mapPickerModal');
        showAlert('Location selected successfully!', 'success');
    } else {
        showAlert('Please select a location on the map first', 'warning');
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Formats a date string
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

// Close modal on outside click
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    });
}

// Add CSS for hidden class if not already present
if (!document.querySelector('style[data-hidden-class]')) {
    const style = document.createElement('style');
    style.setAttribute('data-hidden-class', 'true');
    style.textContent = '.hidden { display: none !important; }';
    document.head.appendChild(style);
}