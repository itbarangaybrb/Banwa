<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../../server/api/shared/get_fullname.php';

if ($_SESSION['role_id'] != 8) {
    header("Location: /client/index.php");
    exit;
}

$full_name = getCurrentUserName();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Report Management System</title>

    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
    <link rel="stylesheet" href="../../../styles/staff/map_staff.css" />
</head>

<body>
    <!-- Sidebar -->
    <aside class="side_nav">
        <div class="nav_header">
            <div class="nav_logo">☰</div>
            <div class="logo_title">
                <img class="logo" src="../../../img/banwalogo.png" alt="BANWA Logo">
                <span class="company_name">BANWA</span>
            </div>
        </div>
        <ul class="nav_list">
            <div>
                <li>
                    <a href="#" class="nav_select active" data-tab="mapping">
                        <i class="fa-regular fa-map nav_icon"></i>
                        <span class="nav_text">Mapping</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="nav_select" data-tab="dashboard">
                        <i class="fas fa-chart-line nav_icon"></i>
                        <span class="nav_text">Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="nav_select" data-tab="management">
                        <i class="fas fa-tasks nav_icon"></i>
                        <span class="nav_text">Manage Reports</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="nav_select" data-tab="create">
                        <i class="fas fa-plus-circle nav_icon"></i>
                        <span class="nav_text">Create New</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="nav_select" data-tab="summary">
                        <i class="fas fa-file-alt nav_icon"></i>
                        <span class="nav_text">Generate Summary</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="nav_select" data-tab="archives">
                        <i class="fas fa-archive nav_icon"></i>
                        <span class="nav_text">Archives</span>
                    </a>
                </li>
                <li>
                    <a class="nav_select" id="signoutBtn" href="#">
                        <i class="fa-solid fa-arrow-right-from-bracket fa-lg" style="color: rgb(255, 255, 255);"></i>
                        <span class="nav_text">Logout</span>
                    </a>
                </li>
            </div>
        </ul>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
        <div class="staff-content">
            <div id="mapping" class="tab-pane active">
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars"></i>
                </button>

                <!-- Main map container -->
                <div class="map-wrapper">
                    <!-- Leaflet renders the map inside this div -->
                    <div id="map"></div>

                    <!-- Search bar overlay -->
                    <div class="map-overlay map-overlay--search">
                        <div class="gm-search-box">
                            <i class="fas fa-search gm-search-icon"></i>
                            <input type="text" id="search-input" placeholder="Search by incident type, location, or victim...">
                            <button class="gm-clear-btn" onclick="clearSearch()" title="Clear">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <!-- Search results appear here dynamically -->
                        <div id="search-results" class="search-results"></div>
                    </div>

                    <!-- Filter panel overlay -->
                    <div class="map-overlay map-overlay--filter">
                        <div class="gm-panel">
                            <div class="gm-panel-row">

                                <!-- Dropdown to switch marker layer type -->
                                <div class="dropdown">
                                    <button class="gm-chip dropdown-btn" id="filterDropdownBtn" onclick="toggleFilterDropdown(event)">
                                        <i class="fas fa-layer-group"></i>
                                        <span id="currentFilterText">Incidents</span>
                                        <i class="fas fa-chevron-down dropdown-arrow"></i>
                                    </button>
                                    <div class="dropdown-content" id="filterDropdown">
                                        <a href="#" data-type="household" onclick="selectFilterType('household', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background:#1565c0;"></span>
                                                <span>Households</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="business" onclick="selectFilterType('business', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background:#2e7d32;"></span>
                                                <span>Businesses</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="construction" onclick="selectFilterType('construction', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background:#ffc107;"></span>
                                                <span>Construction</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="utility" onclick="selectFilterType('utility', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background:#2196F3;"></span>
                                                <span>Utilities</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="incident" onclick="selectFilterType('incident', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background:#cc0000;"></span>
                                                <span>Incidents</span>
                                            </span>
                                        </a>
                                    </div>
                                </div>

                                <!-- Toggle flood hazard layer on/off -->
                                <button class="gm-chip gm-chip--toggle" id="floodToggleBtn" onclick="toggleFloodLayer()">
                                    <i class="fas fa-water"></i>
                                    <span>Flood</span>
                                    <span class="toggle-indicator"></span>
                                </button>

                                <!-- Toggle fault line hazard layer on/off -->
                                <button class="gm-chip gm-chip--toggle" id="faultToggleBtn" onclick="toggleFaultLine()">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Fault Line</span>
                                    <span class="toggle-indicator"></span>
                                </button>
                            </div>

                            <!-- Sub-filters shown only when Incident is selected — built by loadIncidentSubFilters() in map.js -->
                            <div class="sub-filters" id="incidentSubFilters" style="display:none;"></div>

                            <!-- Sub-filters shown only when Construction is selected -->
                            <div class="sub-filters" id="constructionSubFilters" style="display:none;">
                                <div class="sub-filters-bar">
                                    <button class="sub-filter-btn active" data-subtype="all" onclick="filterConstructionByType('all', event)">
                                        <i class="fas fa-layer-group"></i><span>All</span>
                                    </button>
                                    <span class="sub-filter-active-label" id="constructionActiveLabel">Showing all types</span>
                                    <button class="sub-filter-toggle-btn" id="constructionToggleBtn"
                                        onclick="toggleConstructionFilters()" title="Show / hide construction types">
                                        <i class="fas fa-filter"></i> Types
                                        <span class="toggle-arrow">&#9662;</span>
                                    </button>
                                </div>
                                <div class="sub-filter-expanded" id="constructionTypeList">
                                    <button class="sub-filter-btn" data-subtype="major" onclick="filterConstructionByType('major', event)">
                                        <i class="fas fa-building"></i><span>Major</span>
                                    </button>
                                    <button class="sub-filter-btn" data-subtype="minor" onclick="filterConstructionByType('minor', event)">
                                        <i class="fas fa-home"></i><span>Minor</span>
                                    </button>
                                    <button class="sub-filter-btn" data-subtype="repair" onclick="filterConstructionByType('repair', event)">
                                        <i class="fas fa-tools"></i><span>Repair</span>
                                    </button>
                                    <button class="sub-filter-btn" data-subtype="demolition" onclick="filterConstructionByType('demolition', event)">
                                        <i class="fas fa-trash-alt"></i><span>Demolition</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User info + map view controls (top-right) -->
                    <div class="map-overlay map-overlay--topright">
                        <div class="gm-topright-row">
                            <!-- Shows current logged-in user and live date/time -->
                            <div class="gm-user-pill">
                                <div class="time_date" id="currentDateTime"></div>
                                <div class="gm-user-divider"></div>
                                <span class="gm-user-name"><?php echo htmlspecialchars($full_name); ?></span>
                                <div class="user_image" style="width:32px;height:32px;">
                                    <i class="fas fa-user" style="font-size:16px;color:white;"></i>
                                </div>
                            </div>
                            <!-- Map tile switcher buttons -->
                            <div class="gm-icon-group">
                                <button class="gm-icon-btn" onclick="toggleStreetMap()" title="Street Map View">
                                    <i class="fas fa-map"></i>
                                </button>
                                <button class="gm-icon-btn" onclick="toggleSatellite()" title="Satellite View">
                                    <i class="fas fa-satellite"></i>
                                </button>
                                <!-- Resets map to default center and zoom -->
                                <button class="gm-icon-btn" onclick="resetView()" title="Reset View">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Action buttons for incident reports and assessments (bottom) -->
                    <div class="map-overlay map-overlay--actions">
                        <div class="gm-actions-bar">
                            <button class="gm-action-btn" onclick="getFloodIncidentsSummary()">
                                <i class="fas fa-chart-bar"></i>
                                <span>Flood Risk</span>
                            </button>
                            <button class="gm-action-btn" onclick="showFaultLineRiskAssessment()">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Fault Line Risk</span>
                            </button>
                            <button class="gm-action-btn" onclick="showIncidentStatistics()">
                                <i class="fas fa-chart-pie"></i>
                                <span>Incident Stats</span>
                            </button>
                            <button class="gm-action-btn" onclick="showIncidentHeatmap()">
                                <i class="fas fa-fire"></i>
                                <span>Heatmap</span>
                            </button>
                            <button class="gm-action-btn" onclick="showIncidentSummaryReport()">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Incident Report</span>
                            </button>
                            <button class="gm-action-btn gm-action-btn--separator" onclick="showResponseRulesReport()">
                                <i class="fas fa-list-check"></i>
                                <span>Response Rules</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="dashboard" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h1>Incident Dashboard</h1>
                    <p class="page-description">Overview of incident reports and analytics</p>
                </div>
                <div class="analytics-container">
                    <div class="charts">
                        <canvas id="chart1"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart2"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart3"></canvas>
                    </div>
                </div>
            </div>

            <!-- Management Tab -->
            <div id="management" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>

                <div class="page-header">
                    <h1>Review Incident Reports</h1>
                    <p class="page-description">Manage and review incident reports</p>
                </div>

                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search by victim, incident type, or location..." onkeyup="filterIncidents()">
                    <select id="statusApplications" style="width: max-content;">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Under Investigation">Under Investigation</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button class="buttons" type="button" data-modal="exportApplicationsTable">Export As PDF</button>
                </div>

                <div class="table-responsive">
                    <table id="incidentsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Reporter</th>
                                <th>Victim</th>
                                <th>Suspect</th>
                                <th>Incident Type</th>
                                <th>Location</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <tr>
                                <td colspan="8" class="loading">
                                    <div class="spinner"></div>Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Create Tab -->
            <div id="create" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Create New Incident Report</h2>
                    <p class="form-description">Fill in the details to create a new incident report</p>
                </div>
                <form id="createForm" onsubmit="createIncident(event)">
                    <!-- Reporting Person Information -->
                    <div class="section-title">Reporting Person Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="rpFullName">Full Name *</label>
                            <input type="text" name="rpFullName" required>
                        </div>
                        <div class="form-group">
                            <label for="rpContact">Contact Number *</label>
                            <input type="tel" name="rpContact" required>
                        </div>
                        <div class="form-group">
                            <label for="rpAddress">Address *</label>
                            <input type="text" name="rpAddress" required>
                        </div>
                        <div class="form-group">
                            <label for="rpRelationship">Relationship to Victim</label>
                            <input type="text" name="rpRelationship">
                        </div>
                    </div>

                    <!-- Victim Details -->
                    <div class="section-title">Victim / Complainant Details</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vicFullName">Full Name *</label>
                            <input type="text" name="vicFullName" required>
                        </div>
                        <div class="form-group">
                            <label for="vicAddress">Address *</label>
                            <input type="text" name="vicAddress" required>
                        </div>
                        <div class="form-group">
                            <label for="vicContact">Contact Number *</label>
                            <input type="tel" name="vicContact" required>
                        </div>
                        <div class="form-group">
                            <label for="vicGender">Gender *</label>
                            <select name="vicGender" required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="vicDOB">Date of Birth *</label>
                            <input type="date" name="vicDOB" required>
                        </div>
                        <div class="form-group">
                            <label for="vicOccupation">Occupation *</label>
                            <input type="text" name="vicOccupation" required>
                        </div>
                    </div>

                    <!-- Suspect Details -->
                    <div class="section-title">Suspect / Respondent Details</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="susFullName">Full Name (if known)</label>
                            <input type="text" name="susFullName">
                        </div>
                        <div class="form-group">
                            <label for="susAddress">Address (if known)</label>
                            <input type="text" name="susAddress">
                        </div>
                        <div class="form-group">
                            <label for="susContact">Contact Number (if known)</label>
                            <input type="tel" name="susContact">
                        </div>
                        <div class="form-group">
                            <label for="susDescription">Physical Description *</label>
                            <textarea name="susDescription" rows="3" required></textarea>
                        </div>
                    </div>

                    <!-- Incident Details -->
                    <div class="section-title">Incident Details</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="incidentType">Incident Type *</label>
                            <select name="incidentType" required>
                                <option value="">Select Type</option>
                                <option value="Property/Civil Disputes">Property/Civil Disputes</option>
                                <option value="Minor Offenses Against Persons">Minor Offenses Against Persons</option>
                                <option value="VAWC">Violence Against Women and Children</option>
                                <option value="Serious Crime">Serious Crime</option>
                                <option value="Public Safety">Public Safety and Emergencies</option>
                                <option value="Ordinance Violations">Ordinance Violations</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="incidentTimestamp">Date and Time of Incident *</label>
                            <input type="datetime-local" name="incidentTimestamp" required>
                        </div>
                        <div class="form-group">
                            <label for="incidentLocation">Location *</label>
                            <input type="text" name="incidentLocation" required>
                        </div>
                        <div class="form-group">
                            <label for="incidentLatitude">Latitude</label>
                            <input type="text" name="incidentLatitude" placeholder="e.g., 14.617500">
                        </div>
                        <div class="form-group">
                            <label for="incidentLongitude">Longitude</label>
                            <input type="text" name="incidentLongitude" placeholder="e.g., 121.075600">
                        </div>
                        <div class="form-group">
                            <label for="description">Narrative/Description *</label>
                            <textarea name="description" rows="4" required></textarea>
                        </div>
                    </div>

                    <!-- Requirements -->
                    <div class="section-title">Supporting Documents</div>
                    <div class="form-group">
                        <input type="file" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png" multiple>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-primary">Create Report</button>
                        <button type="reset" class="btn-secondary">Clear Form</button>
                    </div>
                </form>
            </div>

            <!-- Process Tab -->
            <div id="process" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Process Incident Reports</h2>
                    <p class="form-description">Review and update incident report status</p>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Incident Type</th>
                                <th>Victim</th>
                                <th>Date Reported</th>
                                <th>Current Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="processTableBody">
                            <tr>
                                <td colspan="6" class="loading">
                                    <div class="spinner"></div>Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Summary Tab -->
            <div id="summary" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="summary-controls">
                    <h2>Generate Incident Summary</h2>
                    <div class="control-row">
                        <select id="summaryApplicationSelect" onchange="updateSummary()" class="form-control">
                            <option value="">-- Select Incident Report --</option>
                        </select>
                        <button onclick="loadSummarySelect()" class="btn-secondary" title="Refresh List">Refresh</button>
                    </div>
                </div>

                <div id="summaryOutput" class="summary-report-container">
                    <div class="placeholder-state">
                        <i class="fas fa-file-invoice fa-3x"></i>
                        <p>Select an incident report from the list above to view the full report.</p>
                    </div>
                </div>
            </div>

            <div id="archives" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Incident Report Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Archives</h2>
                    <p class="form-description">View and restore your archived records.</p>
                </div>

                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Archive ID</th>
                                <th>Table</th>
                                <th>Record ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Archived At</th>
                                <th>Restored At</th>
                                <th>Role ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="archiveTableBody">
                            <tr>
                                <td colspan="8" class="loading">
                                    <div class="spinner"></div>Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <div id="detailsModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Incident Report Details</h2>
                    <button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
                </div>
                <div id="modalBody"></div>
            </div>
        </div>

        <div id="updateModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Update Incident Status</h2>
                    <button class="close-btn" onclick="closeModal('openUpdateModal')">&times;</button>
                </div>
                <form id="updateForm" onsubmit="submitUpdate(event)">
                    <input type="hidden" id="updateReportId" name="id">
                    <div class="form-group">
                        <label>Current Status:</label>
                        <input type="text" id="displayCurrentStatus" readonly style="background:#eee; color:#555;">
                    </div>

                    <div class="form-group">
                        <label for="newStatus">New Status *</label>
                        <select id="newStatus" name="newStatus" required>
                            <option value="" disabled selected>Select Action...</option>
                            <option value="Under Investigation">Under Investigation</option>
                            <option value="Referred to Authorities">Referred to Authorities</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="updateComments">Remarks / Comments *</label>
                        <div class="prompt-container">
                            <div class="prompt-suggestions">
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Report is complete. Ready for processing.')">Complete</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Requires further investigation.')">Needs Investigation</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Forwarded to appropriate authorities.')">Forwarded</button>
                            </div>
                            <textarea id="updateComments" name="updateComments" required placeholder="Enter remarks..."></textarea>
                        </div>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-primary">Update Status</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('updateModal')">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Map Picker Modal -->
        <div id="mapPickerModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Select Incident Location</h2>
                    <button class="close-btn" onclick="closeModal('mapPickerModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="mapPicker" style="height: 400px; width: 100%;"></div>
                    <div class="map-coordinates">
                        <div class="form-group">
                            <label>Latitude:</label>
                            <input type="text" id="selectedLatitude" readonly>
                        </div>
                        <div class="form-group">
                            <label>Longitude:</label>
                            <input type="text" id="selectedLongitude" readonly>
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn-primary" onclick="confirmLocation()">Confirm Location</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('mapPickerModal')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script src="../../../scripts/staff/map.js"></script>

    <script type="module" src="../../../scripts/staff/incident_report_staff/incident_report.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>
    <script type="module" src="../../../scripts/utils/archives.js"></script>

</body>

</html>