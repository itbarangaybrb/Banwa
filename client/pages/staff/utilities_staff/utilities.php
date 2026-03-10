<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Utilities Application Management System</title>

    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
    <link rel="stylesheet" href="../../../styles/staff/map_staff.css" />
    <!-- <link rel="stylesheet" href="../../../styles/staff/utilities.css"> -->
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
                        <span class="nav_text">Manage Applications</span>
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
            </div>
        </ul>
    </aside>

    <!-- Main Content -->
    <main class="main-wrapper">
        <div class="staff-content">
            <div id="alert-container"></div>

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
                            <input type="text" id="search-input" placeholder="Search by name, address, type, or hazard...">
                            <button class="gm-clear-btn" onclick="clearSearch()" title="Clear">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="gm-search-btn" onclick="performSearch()">Search</button>
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
                                        <span id="currentFilterText">Households</span>
                                        <i class="fas fa-chevron-down dropdown-arrow"></i>
                                    </button>
                                    <div class="dropdown-content" id="filterDropdown">
                                        <!-- Each option filters the map to show that marker type -->
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
                                <span class="gm-user-name">Kagawad Francesca</span>
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

                    <!-- Action buttons for SDSS reports and risk assessments (bottom) -->
                    <div class="map-overlay map-overlay--actions">
                        <div class="gm-actions-bar">
                            <button class="gm-action-btn" onclick="getFloodHousesSummary()">
                                <i class="fas fa-chart-bar"></i>
                                <span>Flood Risk</span>
                            </button>
                            <button class="gm-action-btn" onclick="showFaultLineRiskAssessment()">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Fault Line Risk</span>
                            </button>
                            <button class="gm-action-btn" onclick="showAllBusinessesSDSSReport()">
                                <i class="fas fa-building"></i>
                                <span>Business Report</span>
                            </button>
                            <button class="gm-action-btn" onclick="showAllConstructionSDSSReport()">
                                <i class="fas fa-hard-hat"></i>
                                <span>Construction Report</span>
                            </button>
                            <button class="gm-action-btn" onclick="showIncidentSummaryReport()">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Incident Report</span>
                            </button>
                            <button class="gm-action-btn gm-action-btn--separator" onclick="showSDSSRulesReport()">
                                <i class="fas fa-list-check"></i>
                                <span>Barangay Rules</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Utilities Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username">Admin</p>
                            <div class="user_image">
                                <span class="user_avatar_header">A</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Dashboard</h2>
                    <p>Overview of utilities applications and activities</p>
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

                <!-- <div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Activity</th>
                                <th>Created At</th>
                            </tr>
                        </thead>

                        <tbody id="auditTableBody"></tbody>
                    </table>
                </div> -->
            </div>

            <!-- Review Tab -->
            <div id="management" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Utilities Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username">Admin</p>
                            <div class="user_image">
                                <span class="user_avatar_header">A</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h1>Review Utilities Applications</h1>
                    <p class="form-description">Search, filter, and manage all utilities applications</p>
                </div>

                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search..." onkeyup="filterApplications()">
                    <select id="statusApplications" style="width: max-content;">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Pre-approved">Pre-approved</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button class="buttons" type="button" data-modal="exportApplicationsTable">Export As PDF</button>
                </div>

                <div class="table-responsive">
                    <table id="applicationsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Applicant</th>
                                <th>Contact No.</th>
                                <th>Provider</th>
                                <th>N. of Work</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <tr>
                                <td colspan="7" class="loading">
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
                        <h1>Utilities Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username">Admin</p>
                            <div class="user_image"><span class="user_avatar_header">A</span></div>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h1>Create New Utilities Application (Staff)</h1>
                    <p class="form-description">Fill in the details to register a new utilities application</p>
                </div>

                <div id="createStaffForm">
                    <form class="form" id="staffCreateForm">

                        <!-- ==================== Owner Information ==================== -->
                        <div class="section-title">Owner Information</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">First Name <span style="color:#BB1B1B;">*</span></label>
                                <input type="text" id="firstName">
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="middleName">Middle Name <i>(Optional)</i></label>
                                <input type="text" id="middleName">
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name <span style="color:#BB1B1B;">*</span></label>
                                <input type="text" id="lastName">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="suffix">Suffix <i>(Optional)</i></label>
                                <input type="text" id="suffix">
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="contactNoOwner">Mobile or Landline No. <span style="color:#BB1B1B;">*</span></label>
                                <input type="tel" id="contactNoOwner" maxlength="11">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <!-- ==================== Owner Address ==================== -->
                        <div class="section-title">Owner Address</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="addressOwner">Full Address <span style="color:#BB1B1B;">*</span></label>
                                <input type="text" id="addressOwner">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <!-- ==================== Utility Location ==================== -->
                        <div class="section-title">Utility Location</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="utilityLotNo">House No. <span style="color:#BB1B1B;">*</span></label>
                                <input type="tel" id="utilityLotNo" maxlength="2">
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="utilityStreet">Street Name <span style="color:#BB1B1B;">*</span></label>
                                <select id="utilityStreet">
                                    <option value="">Select</option>
                                    <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City </option>
                                    <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City </option>
                                    <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City </option>
                                    <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City </option>
                                    <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City </option>
                                    <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City </option>
                                    <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City </option>
                                    <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                                    <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City </option>
                                    <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City </option>
                                    <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City </option>
                                    <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City </option>
                                    <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City </option>
                                    <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City </option>
                                </select>
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <input type="hidden" id="latitude2">
                        <input type="hidden" id="longitude2">

                        <!-- ==================== Utilities Information ==================== -->
                        <div class="section-title">Utilities Information</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="requestDate">Request Date <span style="color:#BB1B1B;">*</span></label>
                                <input type="date" id="requestDate">
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="dateOfWork">Date of Work <span style="color:#BB1B1B;">*</span></label>
                                <input type="date" id="dateOfWork">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="natureOfWork">Nature of Work <span style="color:#BB1B1B;">*</span></label>
                                <select id="natureOfWork">
                                    <option value="select">Select</option>
                                    <option value="New Installation">New Installation</option>
                                    <option value="Repair/Maintenance">Repair/Maintenance</option>
                                    <option value="Permanent Disconnection">Permanent Disconnection</option>
                                    <option value="Reconnection">Reconnection</option>
                                </select>
                                <div class="error-msg"></div>
                            </div>
                            <div class="form-group">
                                <label for="provider">Provider <span style="color:#BB1B1B;">*</span></label>
                                <select id="provider">
                                    <option value="select">Select</option>
                                    <option value="Meralco">Meralco</option>
                                    <option value="Manila Water">Manila Water</option>
                                    <option value="Globe">Globe</option>
                                    <option value="Smart">Smart</option>
                                    <option value="PLDT">PLDT</option>
                                    <option value="Bayantel">Bayantel</option>
                                    <option value="Sky Cable">Sky Cable</option>
                                    <option value="Destiny">Destiny</option>
                                    <option value="Cignal">Cignal</option>
                                </select>
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <div class="button-group" style="margin-top:40px; justify-content:flex-end; gap:12px;">
                            <button type="button" id="staffClearBtn" class="btn-secondary">Clear Form</button>
                            <button type="submit" id="staffSubmitBtn" class="btn-primary">Submit Application</button>
                        </div>

                    </form>
                </div>
            </div>

            <!-- Process Tab -->
            <div id="process" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Utilities Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username">Admin</p>
                            <div class="user_image">
                                <span class="user_avatar_header">A</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Process Applications</h2>
                    <p class="form-description">Review and update application status.</p>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nature of Work</th>
                                <th>Applicant</th>
                                <th>Provider</th>
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
            <!-- <div id="summary" class="tab-pane">
                <h2>Generate Summary</h2>
                <div class="form-group">
                    <select id="summaryApplicationSelect" onchange="updateSummary()"></select>
                </div>
                <div id="summaryOutput"></div>
            </div> -->
            <div id="summary" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Utilities Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username">Admin</p>
                            <div class="user_image">
                                <span class="user_avatar_header">A</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="summary-controls">
                    <h2>Generate Utility Summary</h2>
                    <div class="control-row">
                        <select id="summaryApplicationSelect" onchange="updateSummary()" class="form-control">
                            <option value="">-- Select Application --</option>
                        </select>
                        <button onclick="loadSummarySelect()" class="btn-secondary" title="Refresh List">Refresh</button>
                    </div>
                </div>

                <div id="summaryOutput" class="summary-report-container">
                    <div class="placeholder-state">
                        <i class="fas fa-file-invoice fa-3x"></i>
                        <p>Select a utility from the list above to view the full report.</p>
                    </div>
                </div>
            </div>

            <!-- Modals -->
            <div id="detailsModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Application Details</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div id="modalBody"></div>
                </div>
            </div>

            <div id="updateModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Update Application Status</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    <form id="updateForm" onsubmit="submitUpdate(event)">
                        <input type="hidden" id="updateAppId" name="id">
                        <div class="form-group">
                            <label>Current Status:</label>
                            <input type="text" id="displayCurrentStatus" readonly style="background:#eee; color:#555;">
                        </div>

                        <div class="form-group">
                            <label for="newStatus">New Status *</label>
                            <select id="newStatus" name="newStatus" required>
                                <option value="" disabled selected>Select Action...</option>
                                <option value="Pre-Approved">Pre-Approved</option>
                                <option value="Additional Requirements">Additional Requirements</option>
                                <option value="Approved">Approved (Final)</option>
                                <option value="Disapproved">Disapproved</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="updateComments">Remarks / Comments *</label>
                            <div class="prompt-container">
                                <div class="prompt-suggestions">
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Application is complete. Ready for processing.')">Complete</button>
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Missing required documents. Please submit.')">Missing Docs</button>
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Please coordinate with utility provider.')">Coordinate Provider</button>
                                </div>
                                <textarea id="updateComments" name="updateComments" required placeholder="Enter instructions..."></textarea>
                            </div>
                        </div>

                        <div class="button-group">
                            <button type="submit" class="btn-primary">Update Status</button>
                            <button type="button" class="btn-secondary cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <script src="../../../scripts/staff/utilities_staff/utilities.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script src="../../../scripts/staff/map.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>

    <!-- <script type="module" src="../../../scripts/utils/archives.js"></script> -->

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</body>

</html>