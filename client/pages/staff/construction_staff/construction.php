<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../../server/api/shared/get_fullname.php';

if ($_SESSION['role_id'] != 5) {
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
    <title>Construction Application Management System</title>

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
                            <input type="text" id="search-input" placeholder="Search by name, address, type, or hazard...">
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

            <div id="dashboard" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Construction Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h1>Construction Dashboard</h1>
                    <p class="page-description">Overview of construction applications and analytics</p>
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

                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Activity</th>
                                <th>Rec. ID</th>
                                <th>Name</th>
                                <th>Created At</th>
                            </tr>
                        </thead>

                        <tbody id="auditTableBody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Review Tab -->
            <div id="management" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Construction Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>

                <div class="page-header">
                    <h1>Review Construction Applications</h1>
                    <p class="page-description">Manage and review construction applications</p>
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
                                <th>N. of Act.</th>
                                <th>Con. name</th>
                                <th>Con. no.</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Payment</th>
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
                        <h1>Construction Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="page-header">
                    <h2>Create New Construction Application</h2>
                    <p class="form-description">Fill in the details to create a new construction application</p>
                </div>
                <form id="createForm" onsubmit="createApplication(event)">
                    <!-- Owner Information -->
                    <div class="section-title">Owner Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name <span style="color: #BB1B1B;">*</span></label>
                            <input type="text" id="firstName" name="firstName" required>
                            <div class="error-msg"></div>
                        </div>
                        <div class="form-group">
                            <label for="middleName">Middle Name <i>(Optional)</i></label>
                            <input type="text" id="middleName" name="middleName">
                            <div class="error-msg"></div>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name <span style="color: #BB1B1B;">*</span></label>
                            <input type="text" id="lastName" name="lastName" required>
                            <div class="error-msg"></div>
                        </div>
                        <div class="form-group">
                            <label for="suffix">Suffix <i>(Optional)</i></label>
                            <input type="text" id="suffix" name="suffix">
                            <div class="error-msg"></div>
                        </div>
                        <div class="form-group">
                            <label for="contactNoOwner">Mobile Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
                            <input type="tel" id="contactNoOwner" name="contactNoOwner" maxlength="11" pattern="[0-9]{1,11}" required>
                            <div class="error-msg"></div>
                        </div>
                        <div class="form-group">
                            <label for="addressOwner">Full Address <span style="color: #BB1B1B;">*</span></label>
                            <input type="text" id="addressOwner" name="addressOwner" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <!-- Construction Details -->
                    <div class="section-title">Construction Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="natureOfActivity">What kind of work will be done? <span style="color: #BB1B1B;">*</span></label>
                            <select name="natureOfActivity" id="natureOfActivity" required>
                                <option value="" disabled selected>Select</option>
                                <option value="Demolition">Demolition</option>
                                <option value="Major Construction">Major Construction</option>
                                <option value="Minor Construction">Minor Construction</option>
                                <option value="Repairs">Repairs</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="typeOfWork">Type of Construction Work <span style="color: #BB1B1B;">*</span></label>
                            <select id="typeOfWork" name="typeOfWork" required>
                                <option value="" disabled selected>Select Type of Work</option>
                                <option value="residential">Residential (House)</option>
                                <option value="commercial">Commercial (Business)</option>
                                <option value="renovation">Renovation / Remodeling</option>
                                <option value="demolition">Demolition</option>
                                <option value="addition">Extension / Additional Structure</option>
                                <option value="repair">Repair</option>
                                <option value="Other">Other</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="detailsOfWork">Please describe the work to be done <span style="color: #BB1B1B;">*</span></label>
                            <textarea id="detailsOfWork" name="detailsOfWork" rows="3" required></textarea>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="startDate">Expected Start Date <span style="color: #BB1B1B;">*</span></label>
                            <input type="date" id="startDate" name="startDate" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="endDate">Expected Completion Date <span style="color: #BB1B1B;">*</span></label>
                            <input type="date" id="endDate" name="endDate" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="numberOfWorkingDays">Estimated Number of Working Days <i>(Read only)</i></label>
                            <input type="tel" id="numberOfWorkingDays" name="numberOfWorkingDays" maxlength="2" pattern="[0-9]{1,2}" readonly>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="numberOfWorkers">How Many Workers Will Be Involved? <span style="color: #BB1B1B;">*</span></label>
                            <input type="tel" id="numberOfWorkers" name="numberOfWorkers" maxlength="2" pattern="[0-9]{1,2}" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="contractorName">Name of Contractor <span style="color: #BB1B1B;">*</span></label>
                            <input type="text" id="contractorName" name="contractorName" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="contractorContactNumber">Contractor's Mobile Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
                            <input type="tel" id="contractorContactNumber" name="contractorContactNumber" maxlength="11" pattern="[0-9]{1,11}" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="constructionLotNo">House no. <span style="color: #BB1B1B;">*</span></label>
                            <input type="tel" name="constructionLotNo" id="constructionLotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="constructionStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                            <select name="constructionStreet" id="constructionStreet" required>
                                <option value="" disabled selected>Select</option>
                                <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City</option>
                                <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City</option>
                                <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City</option>
                                <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City</option>
                                <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City</option>
                                <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City</option>
                                <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City</option>
                                <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                                <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City</option>
                                <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City</option>
                                <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City</option>
                                <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City</option>
                                <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City</option>
                                <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <input type="hidden" id="latitude2" name="latitude2" pattern="-?\d{1,2}\.\d{6,8}"
                            title="Enter latitude in decimal format (e.g., 14.617500)"
                            placeholder="e.g., 14.617500">
                        <input type="hidden" id="longitude2" name="longitude2" pattern="-?\d{1,3}\.\d{6,8}"
                            title="Enter longitude in decimal format (e.g., 121.075600)"
                            placeholder="e.g., 121.075600">

                        <div class="form-group" style="grid-column: 1 / -1; margin-top: 8px;">
                            <label>Selected Location</label>
                            <input type="text" id="constructionLocationDisplay" readonly placeholder="No location selected yet" style="background:#f8f9fa;cursor:default;">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <button type="button" class="btn-secondary" onclick="openMapPicker('construction')" style="width:max-content;">
                                <i class="fas fa-map-marker-alt"></i> Pick Location on Map
                            </button>
                        </div>

                        <div class="form-group">
                            <label for="applicationMethod">How will you submit the building plan or blueprint? <span style="color: #BB1B1B;">*</span></label>
                            <select name="applicationMethod" id="applicationMethod" required>
                                <option value="" disabled selected>Select</option>
                                <option value="Online">Online</option>
                                <option value="In Person">In Person</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="requirementUpload">Building Plan or Blueprint <span style="color: #BB1B1B;">*</span></label>
                            <input type="file" id="requirementUpload" name="requirementUpload[]" accept="image/*,.pdf" multiple required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="additionalFiles">Additional Images/Documents</label>
                            <input type="file" id="additionalFiles" name="additionalFiles[]" accept="image/*,.pdf,.doc,.docx" multiple>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-primary">Create Application</button>
                        <button type="reset" class="btn-secondary">Clear Form</button>
                    </div>
                </form>
            </div>

            <!-- Process Tab -->
            <div id="process" class="tab-pane">
                <h2>Process Applications</h2>
                <p class="form-description">Assess fees, send for payment, or issue final approval.</p>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nature of Activity</th>
                                <th>Owner</th>
                                <th>Current Status</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="processTableBody">
                            <tr>
                                <td colspan="5" class="loading">
                                    <div class="spinner"></div>Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Summary Tab -->
            <!-- <div id="summary" class="tab-pane">
                <div class="summary-controls">
                    <h2>Generate Business Summary</h2>
                    <div class="control-row">
                        <select id="summaryApplicationSelect" onchange="updateSummary()" class="form-control">
                            <option value="">-- Select Business Application --</option>
                        </select>
                        <button onclick="loadSummarySelect()" class="btn-secondary" title="Refresh List">Refresh</button>
                    </div>
                </div>

                <div id="summaryOutput" class="summary-report-container">
                    <div class="placeholder-state">
                        <i class="fas fa-file-invoice fa-3x"></i>
                        <p>Select a business from the list above to view the full report.</p>
                    </div>
                </div>
            </div> -->
            <div id="summary" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Construction Application Management</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-greeting">
                            <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                        </div>
                    </div>
                </header>
                <div class="summary-controls">
                    <h2>Generate Construction Summary</h2>
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
                        <p id="summaryPlaceholder">Select a construction application from the list above to view the full report.</p>
                    </div>
                </div>
            </div>

            <div id="archives" class="tab-pane">
                <header class="top-header">
                    <div class="header-left">
                        <h1>Construction Application Management</h1>
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
                        <select id="newStatus" name="newStatus" required onchange="toggleAmountField()">
                            <option value="" disabled selected>Select Action...</option>
                            <option value="Additional Requirements">Additional Requirements</option>
                            <option value="For Payment">For Payment (Assessment)</option>
                            <option value="Approved">Approved (Final)</option>
                            <option value="Disapproved">Disapproved</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div class="form-group hidden" id="amountFieldGroup">
                        <label for="assessmentAmount">Assessment Amount (PHP) *</label>
                        <input type="number" step="0.01" id="assessmentAmount" name="assessmentAmount" placeholder="0.00">
                    </div>

                    <div class="form-group">
                        <label for="updateComments">Remarks / Comments *</label>
                        <div class="prompt-container">
                            <div class="prompt-suggestions">
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Application is complete. Proceed to payment.')">Complete</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Missing valid ID or DTI. Please re-upload.')">Missing Docs</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Please visit the Barangay Hall for physical verification.')">Visit Hall</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Please provide clear copies of your Engineering Plans and Bill of Materials.')">Missing Plans</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Required signatures from the Professional Engineer or Architect are missing.')">Missing Signatures</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Your construction plans do not comply with barangay building setbacks/regulations. Please revise.')">Compliance Issue</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('The construction lot number provided does not match our records. Please verify.')">Incorrect Lot #</button>
                                <button type="button" class="prompt-tag" onclick="applyPrompt('Please include the valid ID and PRC license of the supervising engineer.')">Missing PRC ID</button>
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
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script type="module" src="../../../scripts/staff/map.js"></script>

    <script type="module" src="../../../scripts/staff/construction_staff/construction.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>
    <script type="module" src="../../../scripts/utils/archives.js"></script>

</body>

</html>