<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Application Management System</title>

    <link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/map.css" />
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
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
                    <a href="#" class="nav_select active" data-tab="dashboard">
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

    <div class="main-wrapper">

        <header class="top-header">
            <div class="header-left">
                <h1>Business Application Management</h1>
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
                            <h3 id="modal-title">Marker Details</h3>
                            <button class="close-modal" onclick="closeModal('detail-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="modal-content">
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

            <div id="management" class="tab-pane">
                <h2>Review Business Applications</h2>

                <div class="search-box">
                    <input type="text" id="managementSearch" placeholder="Search..." onkeyup="filterApplications()">
                </div>

                <div class="table-responsive">
                    <table id="applicationsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Business Name</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <tr>
                                <td colspan="6" class="loading">
                                    <div class="spinner"></div>Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="create" class="tab-pane">
                <h2>Create New Business Application</h2>
                <p class="form-description">Fill in the details to create a new business application</p>

                <form id="createForm" onsubmit="createApplication(event)">

                    <div class="section-title">Business Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="businessName">Business Name*</label>
                            <input type="text" id="businessName" name="businessName" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Type of Business *</label>
                        <div class="radio-group">
                            <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship" required> Single Proprietorship</label>
                            <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                            <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="natureOfBusinessSelect">Nature of Business *</label>
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
                            <label for="natureOfBusinessSpecify">Specify Details</label>
                            <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify">
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressOfBusiness">Address of Business *</label>
                            <input type="text" name="addressOfBusiness" id="addressOfBusiness" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Status of Business Address *</label>
                        <div class="radio-group">
                            <label><input type="radio" name="businessStatus" value="Owned"> Owned</label>
                            <label><input type="radio" name="businessStatus" value="Leased"> Leased</label>
                            <label><input type="radio" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                            <label><input type="radio" name="businessStatus" value="Others"> Others</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telephoneNoBusiness">Business Telephone *</label>
                            <input type="tel" id="telephoneNoBusiness" name="telephoneNoBusiness" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="emailAddress">Email Address *</label>
                            <input type="email" id="emailAddress" name="emailAddress" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">Owner Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">Owner First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="middleName">Owner Middle Name</label>
                            <input type="text" id="middleName" name="middleName">
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="lastName">Owner Last Name *</label>
                            <input type="text" id="lastName" name="lastName" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telephoneNoOwner">Owner Telephone *</label>
                            <input type="tel" id="telephoneNoOwner" name="telephoneNoOwner" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressOwner">Owner Address *</label>
                            <input type="text" id="addressOwner" name="addressOwner" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">Business Structure</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="typeOfStructureSelect">Structure Type *</label>
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
                            <label for="typeOfStructureSpecify">Specify Details</label>
                            <input type="text" name="typeOfStructureSpecify" id="typeOfStructureSpecify">
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="noOfEmployees">Number of Employees *</label>
                            <input type="number" id="noOfEmployees" name="noOfEmployees" min="0" max="99" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">Requirements (Photocopy Only)</div>
                    <div class="form-group">
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="requirements" value="SEC"> SEC</label>
                            <label><input type="checkbox" name="requirements" value="DTI"> DTI</label>
                            <label><input type="checkbox" name="requirements" value="TCT"> TCT</label>
                            <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                            <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="requirementUpload">Attachment/s *</label>
                        <input type="file" id="requirementUpload" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png">
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <input type="date" id="applicationDate" name="applicationDate" hidden readonly>
                        <div class="error-msg"></div>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-primary">Create Application</button>
                        <button type="reset" class="btn-secondary">Clear Form</button>
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

            <div id="summary" class="tab-pane">
                <div class="summary-controls">
                    <h2>📄 Generate Business Summary</h2>
                    <div class="control-row">
                        <select id="summaryApplicationSelect" onchange="updateSummary()" class="form-control">
                            <option value="">-- Select Business Application --</option>
                        </select>
                        <button onclick="loadSummarySelect()" class="btn-secondary" title="Refresh List">🔄</button>
                    </div>
                </div>

                <div id="summaryOutput" class="summary-report-container">
                    <div class="placeholder-state">
                        <i class="fas fa-file-invoice fa-3x"></i>
                        <p>Select a business from the list above to view the full report.</p>
                    </div>
                </div>
            </div>

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
                            <button type="button" class="prompt-tag" onclick="applyPrompt('Application is complete. Proceed to payment.')">✅ Complete</button>
                            <button type="button" class="prompt-tag" onclick="applyPrompt('Missing valid Government ID or DTI Certificate. Please re-upload.')">📂 Missing Docs</button>
                        </div>
                        <textarea id="updateComments" name="updateComments" required placeholder="Enter instructions..."></textarea>
                        <div class="button-group">
                            <button type="submit" class="btn-primary">💾 Update Status</button>
                            <button type="button" class="btn-secondary" onclick="closeModal('updateModal')">Cancel</button>
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
    <script src="../../../scripts/staff/filter_dropdown.js"></script>
</body>

</html>