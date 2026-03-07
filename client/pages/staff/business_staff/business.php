<?php
require_once __DIR__ . '/../../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../../server/api/shared/get_fullname.php';

if ($_SESSION['role_id'] != 4) {
    header("Location: /client/pages/auth/signin.php");
    exit;
}

$full_name = getCurrentUserName();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Application Management System</title>

    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
    <link rel="stylesheet" href="../../../styles/staff/map_staff.css" />
</head>

<body>

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
                    <a class="nav_select" id="signoutBtn" href="#">
                        <i class="fa-solid fa-arrow-right-from-bracket fa-lg" style="color: rgb(255, 255, 255);"></i>
                        <span class="nav_text">Logout</span>
                    </a>
                </li>
            </div>
        </ul>
    </aside>

    <div class="main-wrapper">
        <div id="alert-container"></div>
        <!-- <div class="staff-content">
            <div id="alert-container"></div>
                 <div>
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
                </div>
        </div> -->

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
                                            <span class="filter-icon" style="background:#28a745;"></span>
                                            <span>Households</span>
                                        </span>
                                    </a>
                                    <a href="#" data-type="business" onclick="selectFilterType('business', event)">
                                        <span class="filter-option">
                                            <span class="filter-icon" style="background:#9C27B0;"></span>
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

                        <!-- Sub-filters shown only when Construction is selected -->
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
                            <span class="gm-page-title">Business Application Management</span>
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
                            <span>Rules Summary</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard tab with analytics charts -->
        <div id="dashboard" class="tab-pane">
            <header class="top-header">
                <div class="header-left">
                    <h1>Business Application Management</h1>
                </div>
                <div class="header-right">
                    <div class="user-greeting">
                        <?php echo htmlspecialchars($full_name); ?>
                    </div>
                </div>
            </header>

            <div class="page-header">
                <h1>Dashboard</h1>
                <p class="page-description">Overview of business applications and analytics</p>
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
        <!-- Management tab with application table and search -->
        <div id="management" class="tab-pane">
            <header class="top-header">
                <div class="header-left">
                    <h1>Business Application Management</h1>
                </div>
                <div class="header-right">
                    <div class="user-greeting">
                        <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                    </div>
                </div>
            </header>
            <div class="page-header">
                <h1>Review Business Applications</h1>
                <p class="page-description">Manage and process all submitted applications</p>
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
                <button class="btn buttons" type="button" data-modal="exportApplicationsTable" style="margin-left: auto;">Export As PDF</button>
            </div>

            <div class="table-responsive">
                <table id="applicationsTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Bus. Name</th>
                            <th>Applicant</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
        </div>
        <!-- Create New Application form with validation and OCR verification -->
        <div id="create" class="tab-pane">
            <header class="top-header">
                <div class="header-left">
                    <h1>Business Application Management</h1>
                </div>
                <div class="header-right">
                    <div class="user-greeting">
                        <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                    </div>
                </div>
            </header>
            <div class="page-header">
                <h1>Create New Business Application</h1>
                <p class="page-description">Fill in the details to register a new business</p>
            </div>

            <form id="createStaffForm" onsubmit="createApplication(event)">

                <div class="section-title"><strong>Owner Information</strong></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name <span style="color:#BB1B1B;">*</span></label>
                        <input type="text" id="firstName" name="firstName" required>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="middleName">Middle Name <i>(Optional)</i></label>
                        <input type="text" id="middleName" name="middleName">
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="lastName">Last Name <span style="color:#BB1B1B;">*</span></label>
                        <input type="text" id="lastName" name="lastName" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="suffix">Suffix <i>(Optional)</i></label>
                        <input type="text" id="suffix" name="suffix">
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="contactNoOwner">Landline/Phone No. <span style="color:#BB1B1B;">*</span></label>
                        <input type="tel" id="contactNoOwner" name="contactNoOwner" maxlength="11" pattern="[0-9]{1,11}" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="section-title"><strong>Owner Address</strong></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="lotNo">Lot no. <span style="color:#BB1B1B;">*</span></label>
                        <input type="tel" id="lotNo" name="lotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="street">Street Name <span style="color:#BB1B1B;">*</span></label>
                        <select name="street" id="street" required>
                            <option value="" disabled selected>Select</option>
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

                <!-- Hidden fields from your original owner code -->
                <input type="hidden" id="latitude1" name="latitude"
                    pattern="-?\d{1,2}\.\d{6,8}"
                    title="Enter latitude in decimal format (e.g., 14.617500)"
                    value="<?php echo isset($_POST['latitude1']) ? htmlspecialchars($_POST['latitude']) : ''; ?>">

                <input type="hidden" id="longitude1" name="longitude"
                    pattern="-?\d{1,3}\.\d{6,8}"
                    title="Enter longitude in decimal format (e.g., 121.075600)"
                    value="<?php echo isset($_POST['longitude1']) ? htmlspecialchars($_POST['longitude']) : ''; ?>">

                <input type="date" id="applicationDate" name="applicationDate" hidden readonly>

                <div class="section-title"><strong>Business Information</strong></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="businessName">Business Name <span style="color:#BB1B1B;">*</span></label>
                        <input type="text" id="businessName" name="businessName" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label>What type of business? <span style="color:#BB1B1B;">*</span></label>
                    <div class="radio-group">
                        <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship" required> Single Proprietorship</label>
                        <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                        <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                    </div>
                    <div class="error-msg"></div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="natureOfBusinessSelect">Nature of Business <span style="color:#BB1B1B;">*</span></label>
                        <select name="natureOfBusiness" id="natureOfBusinessSelect" required>
                            <option value="" disabled selected>Select</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retailing">Retailing</option>
                            <option value="Services">Services</option>
                            <option value="Rentals">Rentals</option>
                            <option value="Wholesale/Repacking">Wholesale/Repacking</option>
                            <option value="Others">Others</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="natureOfBusinessSpecify">Specify Details <span style="color:#BB1B1B;">*</span></label>
                        <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label>What is the status of the business address? <span style="color:#BB1B1B;">*</span></label>
                    <div class="radio-group">
                        <label><input type="radio" name="businessStatus" value="Owned" required> Owned</label>
                        <label><input type="radio" name="businessStatus" value="Leased"> Leased</label>
                        <label><input type="radio" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                        <label><input type="radio" name="businessStatus" value="Others"> Others</label>
                    </div>
                    <div class="error-msg"></div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contactNoBusiness">Landline/Phone No. <span style="color:#BB1B1B;">*</span></label>
                        <input type="tel" id="contactNoBusiness" name="contactNoBusiness" maxlength="11" pattern="[0-9]{1,11}" required>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="emailAddress">Email Address <span style="color:#BB1B1B;">*</span></label>
                        <input type="email" id="emailAddress" name="emailAddress" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="noOfEmployees">How many employees does the business have? <span style="color:#BB1B1B;">*</span></label>
                        <input type="tel" id="noOfEmployees" name="noOfEmployees" maxlength="2" pattern="[0-9]{1,2}" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="section-title"><strong>Business Address</strong></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="businessLotNo">Lot no. <span style="color:#BB1B1B;">*</span></label>
                        <input type="tel" id="businessLotNo" name="businessLotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="businessStreet">Street Name <span style="color:#BB1B1B;">*</span></label>
                        <select name="businessStreet" id="businessStreet" required>
                            <option value="" disabled selected>Select</option>
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

                <input type="hidden" id="latitude2" name="latitude2" value="">
                <input type="hidden" id="longitude2" name="longitude2" value="">

                <!-- <div class="form-group">
                    <button type="button" class="btn map-btn" data-target="2" style="width:100%;">Pick Location on Map</button>
                    <div class="map-preview" id="map-preview-2" style="margin-top:10px;display:none;height:200px;"></div>
                </div> -->

                <div class="section-title"><strong>Business Structure</strong></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="typeOfStructureSelect">Structure Type <span style="color:#BB1B1B;">*</span></label>
                        <select id="typeOfStructureSelect" name="typeOfStructureSelect" required>
                            <option value="" disabled selected>Select Structure Type</option>
                            <option value="Residence">Residence</option>
                            <option value="Store">Store</option>
                            <option value="Office">Office</option>
                            <option value="Warehouse">Warehouse</option>
                            <option value="Factory">Factory</option>
                            <option value="Others">Others</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="typeOfStructureSpecify">Specify Details <span style="color:#BB1B1B;">*</span></label>
                        <input type="text" id="typeOfStructureSpecify" name="typeOfStructureSpecify" required>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="natureOfApplication">Nature of application <span style="color:#BB1B1B;">*</span></label>
                        <select name="natureOfApplication" id="natureOfApplication" required>
                            <option value="" disabled selected>Select</option>
                            <option value="New">New</option>
                            <option value="Renew">Renew</option>
                            <option value="Closure">Closure</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="section-title"><strong>Requirements (Photocopy Only)</strong></div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="requirements" value="SEC"> SEC (Securities and Exchange Commission) Registration</label>
                        <label><input type="checkbox" name="requirements" value="DTI"> DTI (Department of Trade and Industry) Registration</label>
                        <label><input type="checkbox" name="requirements" value="TCT"> TCT (Transfer Certificate of Title)</label>
                        <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                        <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                    </div>
                    <div class="error-msg"></div>
                </div>

                <div class="form-group">
                    <label for="requirementUpload">Attachment/s <span style="color:#BB1B1B;">*</span></label>
                    <input type="file" id="requirementUpload" name="requirementUpload[]" multiple accept=".pdf,.jpg,.jpeg,.png">
                    <div class="error-msg"></div>
                </div>

                <!-- OCR Verification Section (kept exactly as you had) -->
                <div class="verification-container" id="verificationSection" style="display:none; margin:25px 0; padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                    <label class="label" style="margin-bottom:12px; display:block;">📋 OCR Document Verification</label>
                    <div id="verificationResults" style="margin-bottom:15px; line-height:1.6;"></div>
                    <button type="button" id="verifyDocumentsBtn" class="btn btn-secondary" style="width:100%; padding:12px;">Re-Verify Documents with OCR</button>
                    <small style="color:#64748b; font-size:0.85em; margin-top:10px; display:block;">Auto-checks 1 second after upload. Business name is also cross-checked.</small>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn btn-primary">Submit Application</button>
                    <button type="reset" class="btn btn-secondary">Clear Form</button>
                </div>
            </form>
        </div>

        <div id="process" class="tab-pane">
            <h2>Process Applications</h2>
            <p class="form-description">Assess fees, send for payment, or issue final approval.</p>

            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Business Name</th>
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
        <!-- Generate Business Summary with export options -->
        <div id="summary" class="tab-pane">
            <header class="top-header">
                <div class="header-left">
                    <h1>Business Application Management</h1>
                </div>
                <div class="header-right">
                    <div class="user-greeting">
                        <p class="username"><?php echo htmlspecialchars($full_name); ?></p>
                    </div>
                </div>
            </header>

            <div class="page-header" id="summaryHeader">
                <h1>Generate Business Summary</h1>
                <p class="page-description">View or export complete business profiles</p>
            </div>

            <div class="summary-controls">
                <div class="control-row">
                    <select id="summaryApplicationSelect" onchange="updateSummary()" class="form-control">
                        <option value="">-- Select Business Application --</option>
                    </select>
                    <button onclick="loadSummarySelect()" class="btn btn-secondary" title="Refresh List">Refresh</button>
                </div>
            </div>

            <div id="summaryOutput" class="summary-report-container">
                <div class="placeholder-state">
                    <i class="fas fa-file-invoice fa-3x"></i>
                    <p>Select a business from the list above to view the full report.</p>
                </div>
            </div>
        </div>

        <div id="detailsModal" class="staff-modal">
            <div class="staff-modal-content">
                <div class="staff-modal-header">
                    <h2>Application Details</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div id="modalBody"></div>
            </div>
        </div>

        <div id="updateModal" class="staff-modal">
            <div class="staff-modal-content">
                <div class="staff-modal-header">
                    <h2>Update Application Status</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <form id="updateForm" onsubmit="submitUpdate(event)">
                    <input type="hidden" id="updateAppId" name="id">

                    <div class="form-group">
                        <label>Current Status:</label>
                        <input type="text" id="displayCurrentStatus" readonly style="background:#eee; color:#555;">
                    </div>

                    <div class="info-banner" style="background: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 13px;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Guidance:</strong> Choose <em>"Complete"</em> only if all documents are verified.
                        Use <em>"Missing Docs"</em> to trigger a notification to the applicant.
                    </div>

                    <div class="form-group">
                        <label for="newStatus">New Status *</label>
                        <div id="statusWarning" style="padding: 10px; margin-bottom: 10px; border-radius: 4px; display: none; font-size: 13px;"></div>
                        <select id="newStatus" name="newStatus" required onchange="toggleAmountField()" required onchange="updateWarningUI(this.value)">
                            <option value="" disabled selected>Select Action...</option>
                            <option value="Pre-Approved">Pre-Approved</option>
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
                        <small style="color: #666;">Enter the total amount the applicant needs to pay.</small>
                    </div>

                    <label for="updateComments">Remarks / Comments *</label>
                    <label>Quick Responses:</label>
                    <div class="prompt-suggestions">
                        <button type="button" class="prompt-tag" onclick="applyPrompt('Application is complete. Proceed to payment.')">Complete</button>
                        <button type="button" class="prompt-tag" onclick="applyPrompt('Missing valid Government ID or DTI Certificate. Please re-upload.')">Missing Docs</button>
                    </div>
                    <textarea id="updateComments" name="updateComments" required placeholder="Enter instructions..."></textarea>
                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">Update Status</button>
                        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </div>
    <script src="../../../scripts/staff/business_staff/business.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script src="../../../scripts/staff/map.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>
    <script type="module" src="../../../scripts/auth/signout.js"></script>

    <!-- <script type="module" src="../../../scripts/utils/archives.js"></script> -->

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

</body>

</html>