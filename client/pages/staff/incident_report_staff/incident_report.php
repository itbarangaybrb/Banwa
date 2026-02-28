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

    <link rel="stylesheet" href="../../../styles/staff/incident_report_staff/incident_report.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
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
                    <a href="#" class="nav_select active" data-tab="dashboard">
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
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
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="nav_text">Create New</span>
                    </a>
                </li>
                <!-- Process & Assess left available in the #process tab; removed separate nav link to combine under Manage Applications -->
                <li>
                    <a href="#" class="nav_select" data-tab="summary">
                        <svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <polyline points="13 2 13 9 20 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="nav_text">Generate Summary</span>
                    </a>
                </li>
            </div>
            <div>
                <li>
                    <button class="nav_select_btn" id="userProfileBtn">
                        <div class="user_image_container">
                            <span class="user_avatar_sidebar">A</span>
                        </div>
                        <span class="nav_text">Profile</span>
                    </button>
                </li>
            </div>
        </ul>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
        <header class="top-header">
            <div class="header-left">
                <h1>Incident Report Management</h1>
            </div>
            <div class="header-right">
                <div class="user-greeting">
                    <p class="username"><?php echo htmlspecialchars($_SESSION['username'] ?? 'Admin'); ?></p>
                    <div class="user_image">
                        <span class="user_avatar_header"><?php echo strtoupper(substr($_SESSION['username'] ?? 'A', 0, 1)); ?></span>
                    </div>
                </div>
            </div>
        </header>

        <div class="staff-content">
            <div id="alert-container"></div>

            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-pane active">
                <!-- Mobile Menu Button -->
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars"></i>
                </button>

                <div class="map-wrapper">
                    <div class="map-header">
                        <h2>Incident Dashboard</h2>
                    </div>

                    <div class="map-controls">
                        <div class="search-container">
                            <div class="search-box">
                                <input type="text" id="search-input" placeholder="Search by incident type, location, or victim...">
                                <button onclick="performSearch()">
                                    <i class="fas fa-search"></i> Search
                                </button>
                                <button onclick="clearSearch()" class="clear-btn">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </div>

                        <div id="search-results" class="search-results"></div>

                        <div class="filter-controls">
                            <div class="filter-dropdown-container">
                                <div class="dropdown">
                                    <button class="dropdown-btn" id="filterDropdownBtn" onclick="toggleFilterDropdown(event)">
                                        <i class="fas fa-filter"></i>
                                        <span id="currentFilterText">Households</span>
                                        <i class="fas fa-chevron-down dropdown-arrow"></i>
                                    </button>
                                    <div class="dropdown-content" id="filterDropdown">
                                        <a href="#" data-type="household" onclick="selectFilterType('household', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background: #28a745;"></span>
                                                <span>Households</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="business" onclick="selectFilterType('business', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background: #9C27B0;"></span>
                                                <span>Businesses</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="construction" onclick="selectFilterType('construction', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background: #ffc107;"></span>
                                                <span>Construction</span>
                                            </span>
                                        </a>
                                        <a href="#" data-type="utility" onclick="selectFilterType('utility', event)">
                                            <span class="filter-option">
                                                <span class="filter-icon" style="background: #2196F3;"></span>
                                                <span>Utilities</span>
                                            </span>
                                        </a>
                                    </div>
                                </div>

                                <div class="sub-filters" id="constructionSubFilters" style="display: none;">
                                    <h4><i class="fas fa-hard-hat"></i> Construction Types</h4>
                                    <div class="sub-filter-buttons">
                                        <button class="sub-filter-btn active" data-subtype="all" onclick="filterConstructionByType('all', event)">
                                            <i class="fas fa-layer-group"></i>
                                            <span>All</span>
                                        </button>
                                        <button class="sub-filter-btn" data-subtype="major" onclick="filterConstructionByType('major', event)">
                                            <i class="fas fa-building"></i>
                                            <span>Major</span>
                                        </button>
                                        <button class="sub-filter-btn" data-subtype="minor" onclick="filterConstructionByType('minor', event)">
                                            <i class="fas fa-home"></i>
                                            <span>Minor</span>
                                        </button>
                                        <button class="sub-filter-btn" data-subtype="repair" onclick="filterConstructionByType('repair', event)">
                                            <i class="fas fa-tools"></i>
                                            <span>Repair</span>
                                        </button>
                                        <button class="sub-filter-btn" data-subtype="demolition" onclick="filterConstructionByType('demolition', event)">
                                            <i class="fas fa-trash-alt"></i>
                                            <span>Demolition</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="hazard-toggles">
                                    <div class="hazard-toggle-container">
                                        <button class="hazard-toggle-btn" id="floodToggleBtn" onclick="toggleFloodLayer()">
                                            <i class="fas fa-water"></i>
                                            <span>Flood Hazards</span>
                                            <span class="toggle-indicator"></span>
                                        </button>
                                        <button class="hazard-toggle-btn" id="faultToggleBtn" onclick="toggleFaultLine()">
                                            <i class="fas fa-exclamation-triangle"></i>
                                            <span>Fault Line</span>
                                            <span class="toggle-indicator"></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="map"></div>

                <div id="detail-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-title">Incident Details</h3>
                            <button class="close-modal" onclick="closeModal('detail-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="modal-content">
                                <!-- Content will be loaded here -->
                            </div>
                        </div>
                    </div>
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

            <!-- Review Tab -->
            <div id="management" class="tab-pane">
                <h2>Review Incident Reports</h2>

                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search by victim name, incident type, or location..." onkeyup="filterIncidents()">
                    <select id="statusApplications" style="width: max-content;">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Pre-approved">Pre-approved</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button class="buttons" type="button" data-modal="exportApplicationsTable" style="margin-left: auto;">Export As PDF</button>
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
                <h2>Create New Incident Report</h2>
                <p class="form-description">Fill in the details to create a new incident report</p>

                <!-- Multi-step form container -->
                <div class="form-container">
                    <!-- Step 1: Reporting Person -->
                    <div class="form-step active" id="step1">
                        <div class="section-title">1. Reporting Person</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="rpFullName">Full Name *</label>
                                <input type="text" id="rpFullName" name="rpFullName" placeholder="Last, First, Middle Name" required>
                            </div>
                            <div class="form-group">
                                <label for="rpLotNo">Lot No. *</label>
                                <input type="tel" id="rpLotNo" name="rpLotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                            </div>
                            <div class="form-group">
                                <label for="rpStreet">Street Name *</label>
                                <select id="rpStreet" name="rpStreet" required>
                                    <option value="" disabled selected>Select</option>
                                    <option value="Comets Loop">Comets Loop</option>
                                    <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave.</option>
                                    <option value="Crest line St">Crest Line Street</option>
                                    <!-- Add other street options -->
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="rpContact">Contact Number *</label>
                                <input type="text" id="rpContact" name="rpContact" maxlength="11" pattern="[0-9]{1,11}" placeholder="09XXXXXXXXX" required>
                            </div>
                            <div class="form-group">
                                <label for="rpRelationship">Relationship to Victim</label>
                                <input type="text" id="rpRelationship" name="rpRelationship" placeholder="Self, Neighbor, Friend, etc.">
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Victim Details -->
                    <div class="form-step" id="step2">
                        <div class="section-title">2. Victim / Complainant Details</div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <label for="victimSameAsRP">
                                    <input type="checkbox" id="victimSameAsRP">
                                    Victim is the same as the Reporting Person
                                </label>
                            </div>
                            <div class="form-group">
                                <label for="vicFullName">Full Name *</label>
                                <input type="text" id="vicFullName" name="vicFullName" required>
                            </div>
                            <div class="form-group">
                                <label for="vicLotNo">Lot No. *</label>
                                <input type="tel" id="vicLotNo" name="vicLotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                            </div>
                            <div class="form-group">
                                <label for="vicStreet">Street Name *</label>
                                <select id="vicStreet" name="vicStreet" required>
                                    <option value="" disabled selected>Select</option>
                                    <option value="Comets Loop">Comets Loop</option>
                                    <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave.</option>
                                    <option value="Crest line St">Crest Line Street</option>
                                    <!-- Add other street options -->
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vicContact">Contact Number *</label>
                                <input type="text" id="vicContact" name="vicContact" maxlength="11" pattern="[0-9]{1,11}" required>
                            </div>
                            <div class="form-group">
                                <label for="vicCitizenship">Citizenship *</label>
                                <input type="text" id="vicCitizenship" name="vicCitizenship" placeholder="e.g., Filipino" required>
                            </div>
                            <div class="form-group">
                                <label for="vicGender">Gender *</label>
                                <select id="vicGender" name="vicGender" required>
                                    <option value="" disabled selected>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vicDOB">Date of Birth *</label>
                                <input type="date" id="vicDOB" name="vicDOB" required>
                            </div>
                            <div class="form-group">
                                <label for="vicOccupation">Occupation *</label>
                                <input type="text" id="vicOccupation" name="vicOccupation" required>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Suspect Details -->
                    <div class="form-step" id="step3">
                        <div class="section-title">3. Suspect / Respondent Details</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="susFullName">Full Name (if known)</label>
                                <input type="text" id="susFullName" name="susFullName">
                            </div>
                            <div class="form-group">
                                <label for="susLotNo">Lot No. (if known)</label>
                                <input type="tel" id="susLotNo" name="susLotNo" maxlength="2" pattern="[0-9]{1,2}">
                            </div>
                            <div class="form-group">
                                <label for="susStreet">Street Name (if known)</label>
                                <select id="susStreet" name="susStreet">
                                    <option value="" disabled selected>Select</option>
                                    <option value="Comets Loop">Comets Loop</option>
                                    <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave.</option>
                                    <option value="Crest line St">Crest Line Street</option>
                                    <!-- Add other street options -->
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="susContact">Contact Number (if known)</label>
                                <input type="text" id="susContact" name="susContact" maxlength="11" pattern="[0-9]{1,11}">
                            </div>
                            <div class="form-group">
                                <label for="susGender">Gender</label>
                                <select id="susGender" name="susGender">
                                    <option value="" disabled selected>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label for="susDescription">Physical Description and Affiliations *</label>
                                <textarea id="susDescription" name="susDescription" rows="3" placeholder="Describe clothing, height, distinguishing features, etc." required></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Step 4: Incident Details -->
                    <div class="form-step" id="step4">
                        <div class="section-title">4. Incident Details</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="incidentType">Incident Type *</label>
                                <select id="incidentType" name="incidentType" required>
                                    <option value="" disabled selected>Select Type</option>
                                    <option value="Property/Civil Disputes">Property/Civil Disputes</option>
                                    <option value="Minor Offenses Against Persons/Safety">Minor Offenses Against Persons/Safety</option>
                                    <option value="Minor Offenses Against Honor/Property">Minor Offenses Against Honor/Property</option>
                                    <option value="Violence Against Woman and their Children">Violence Against Woman and their Children</option>
                                    <option value="Serious Crime">Serious Crime</option>
                                    <option value="Public Safety and Emergencies">Public Safety and Emergencies</option>
                                    <option value="Ordinance Violations">Ordinance Violations</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="form-group hidden" id="otherSpecifyContainer">
                                <label for="otherIncidentType">Please specify other incident type *</label>
                                <input type="text" id="otherIncidentType" name="otherIncidentType">
                            </div>
                            <div class="form-group">
                                <label for="incidentTimestamp">Date and Time of Incident *</label>
                                <input type="datetime-local" id="incidentTimestamp" name="incidentTimestamp" required>
                            </div>
                            <div class="form-group">
                                <label for="incidentLotNo">Incident Location - Lot No. *</label>
                                <input type="tel" id="incidentLotNo" name="incidentLotNo" maxlength="2" pattern="[0-9]{1,2}" required>
                            </div>
                            <div class="form-group">
                                <label for="incidentStreet">Incident Location - Street Name *</label>
                                <select id="incidentStreet" name="incidentStreet" required>
                                    <option value="" disabled selected>Select</option>
                                    <option value="Comets Loop">Comets Loop</option>
                                    <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave.</option>
                                    <option value="Crest line St">Crest Line Street</option>
                                    <!-- Add other street options -->
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="incidentLatitude">Latitude</label>
                                <input type="text" id="incidentLatitude" name="incidentLatitude" pattern="-?\d{1,2}\.\d{6,8}" placeholder="e.g., 14.617500">
                            </div>
                            <div class="form-group">
                                <label for="incidentLongitude">Longitude</label>
                                <input type="text" id="incidentLongitude" name="incidentLongitude" pattern="-?\d{1,3}\.\d{6,8}" placeholder="e.g., 121.075600">
                            </div>
                            <div class="form-group full-width">
                                <button type="button" class="btn-secondary" onclick="openMapPicker()">
                                    <i class="fas fa-map-marker-alt"></i> Pick Location on Map
                                </button>
                            </div>
                            <div class="form-group full-width">
                                <label for="description">Narrative/Description *</label>
                                <textarea id="description" name="description" rows="4" required></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation buttons -->
                    <div class="form-navigation">
                        <button type="button" class="btn-secondary" id="prevBtn" onclick="prevStep()">Previous</button>
                        <button type="button" class="btn-secondary" id="nextBtn" onclick="nextStep()">Next</button>
                        <button type="submit" class="btn-primary" id="submitBtn" style="display: none;">Submit Report</button>
                    </div>
                </div>
            </div>

            <!-- Process Tab -->
            <div id="process" class="tab-pane">
                <h2>Process Incident Reports</h2>
                <p class="form-description">Review and update incident report status.</p>
                <div class="table-responsive">
                    <table id="processTable">
                        <thead>
                            <tr>
                                <th>Report ID</th>
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
            <!-- <div id="summary" class="tab-pane">
                <h2>Generate Summary</h2>
                <div class="form-group">
                    <select id="summaryIncidentSelect" onchange="updateIncidentSummary()">
                        <option value="">Select Incident Report</option>
                    </select>
                </div>
                <div class="form-group">
                    <button class="btn-primary" onclick="generateSummaryReport()">Generate Summary Report</button>
                    <button class="btn-secondary" onclick="exportToPDF()">Export to PDF</button>
                </div>
                <div id="summaryOutput"></div>
            </div> -->

            <div id="summary" class="tab-pane">
                <div class="summary-controls">
                    <h2>Generate Incident Report Summary</h2>
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
                        <p>Select a incident report from the list above to view the full report.</p>
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
                        <button class="close-btn" onclick="closeModal('updateModal')">&times;</button>
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
                                <option value="Reported">Reported</option>
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
                                <textarea id="updateComments" name="updateComments" required placeholder="Enter instructions..."></textarea>
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
                <div class="modal-content large-modal">
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
    </div>

    <script src="../../../scripts/staff/incident_report_staff/incident_report.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script src="../../../scripts/staff/map.js"></script>
    <script type="module" src="../../../scripts/staff/export.js"></script>
    <script type="module" src="../../../scripts/staff/filter.js"></script>

    <script type="module" src="../../../scripts/utils/archives.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</body>

</html>