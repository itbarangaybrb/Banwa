<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Utilities Application Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="../../../styles/staff/map.css" />
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
                <!-- Process functionality remains in the #process tab; removed duplicate nav link -->
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

        <div class="content">
            <div id="alert-container"></div>

            <div id="dashboard" class="tab-pane active">
                <!-- Mobile Menu Button -->
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars"></i>
                </button>

                <div class="map-wrapper">
                    <div class="map-header">
                        <h2>Dashboard</h2>
                    </div>

                    <div class="map-controls">
                        <div class="search-container">
                            <div class="search-box">
                                <input type="text" id="search-input" placeholder="Search by name, address, or type...">
                                <button onclick="performSearch()">
                                    <i class="fas fa-search"></i> Search
                                </button>
                                <button onclick="clearSearch()" class="clear-btn">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </div>

                        <div id="search-results" class="search-results"></div>
                    </div>

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

                <div id="map"></div>

                <div id="detail-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-title">Marker Details</h3>
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
                <h2>Review Utilities Applications</h2>
                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search..." onkeyup="filterApplications()">
                </div>
                <div class="table-responsive">
                    <table id="applicationsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nature of Work</th>
                                <th>Applicant</th>
                                <th>Provider</th>
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
                <h2>Create New Utilities Application</h2>
                <p class="form-description">Fill in the details to create a new utilities application</p>

                <form id="createForm" onsubmit="createApplication(event)">
                    <!-- Applicant Information -->
                    <div class="section-title">Applicant Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fullname">Full Name *</label>
                            <input type="text" id="fullname" name="fullname" required>
                        </div>
                        <div class="form-group">
                            <label for="contactNo">Contact No *</label>
                            <input type="tel" id="contactNo" name="contactNo" required>
                        </div>
                    </div>

                    <!-- Application Details -->
                    <div class="section-title">Application Details</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="address">Address *</label>
                            <input type="text" id="address" name="address" required>
                        </div>
                        <div class="form-group">
                            <label for="provider">Utility Provider *</label>
                            <select id="provider" name="provider" required>
                                <option value="">Select Provider</option>
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
                        </div>
                        <div class="form-group">
                            <label for="natureOfWork">Nature of Work *</label>
                            <select id="natureOfWork" name="natureOfWork" required>
                                <option value="">Select Type</option>
                                <option value="New Installation">New Installation</option>
                                <option value="Repair/Maintenance">Repair/Maintenance</option>
                                <option value="Permanent Disconnection">Permanent Disconnection</option>
                                <option value="Reconnection">Reconnection</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="requestDate">Request Date *</label>
                            <input type="date" id="requestDate" name="requestDate" required>
                        </div>
                        <div class="form-group">
                            <label for="dateOfWork">Date of Work *</label>
                            <input type="date" id="dateOfWork" name="dateOfWork" required>
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
                <p class="form-description">Review and update application status.</p>
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
            <div id="summary" class="tab-pane">
                <h2>Generate Summary</h2>
                <div class="form-group">
                    <select id="summaryApplicationSelect" onchange="updateSummary()"></select>
                </div>
                <div id="summaryOutput"></div>
            </div>

            <!-- Modals -->
            <div id="detailsModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Application Details</h2>
                        <button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
                    </div>
                    <div id="modalBody"></div>
                </div>
            </div>

            <div id="updateModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Update Application Status</h2>
                        <button class="close-btn" onclick="closeModal('updateModal')">&times;</button>
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
                                <option value="For Payment">For Payment</option>
                                <option value="Approved">Approved (Final)</option>
                                <option value="Disapproved">Disapproved</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="updateComments">Remarks / Comments *</label>
                            <div class="prompt-container">
                                <div class="prompt-suggestions">
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Application is complete. Ready for processing.')">✅ Complete</button>
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Missing required documents. Please submit.')">📂 Missing Docs</button>
                                    <button type="button" class="prompt-tag" onclick="applyPrompt('Please coordinate with utility provider.')">⚡ Coordinate Provider</button>
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
        </div>
    </div>

    <script src="../../../scripts/staff/utilities_staff/utilities.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="../../../scripts/staff/map.js"></script>
</body>

</html>