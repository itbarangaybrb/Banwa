<?php
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Blue Ridge B - Map System</title>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="../../styles/staff/map.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">

</head>

<body>
    <!-- Side navigation bar -->
    <nav class="side_nav">
        <div class="nav_header">
            <div class="logo_title">
                <div class="nav_logo">B</div>
                <div class="company_name">Blue Ridge B</div>
            </div>
        </div>
        
        <ul class="nav_list">
            <div class="nav_list2">
                <li>
                    <!-- Logout link - setActiveNav highlights the active item -->
                    <a href="#" class="nav_select" onclick="setActiveNav(this)">
                        <i class="nav_icon fas fa-sign-out-alt"></i>
                        <span class="nav_text">Logout</span>
                    </a>
                </li>
            </div>
        </ul>
    </nav>

    <!-- Hamburger button for mobile nav -->
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

                <!-- Sub-filters shown only when Incident is selected — fully built by loadIncidentSubFilters() in map.js -->
                <div class="sub-filters" id="incidentSubFilters" style="display:none;"></div>

                <!-- Sub-filters shown only when Construction is selected -->
                <div class="sub-filters" id="constructionSubFilters" style="display:none;">
                    <h4><i class="fas fa-hard-hat"></i> Construction Types</h4>
                    <div class="sub-filter-buttons">
                        <!-- Filter construction markers by sub-type -->
                        <button class="sub-filter-btn active" data-subtype="all" onclick="filterConstructionByType('all', event)">
                            <i class="fas fa-layer-group"></i><span>All</span>
                        </button>
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
                <!-- Shows summary of houses within flood zones -->
                <button class="gm-action-btn" onclick="getFloodHousesSummary()">
                    <i class="fas fa-chart-bar"></i>
                    <span>Flood Risk</span>
                </button>
                <!-- Shows structures near fault lines -->
                <button class="gm-action-btn" onclick="showFaultLineRiskAssessment()">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Fault Line Risk</span>
                </button>
                <!-- SDSS report for all businesses -->
                <button class="gm-action-btn" onclick="showAllBusinessesSDSSReport()">
                    <i class="fas fa-building"></i>
                    <span>Business SDSS</span>
                </button>
                <!-- SDSS report for all construction sites -->
                <button class="gm-action-btn" onclick="showAllConstructionSDSSReport()">
                    <i class="fas fa-hard-hat"></i>
                    <span>Construction SDSS</span>
                </button>
                <!-- Summary report for all incident reports -->
                <button class="gm-action-btn" onclick="showIncidentSummaryReport()">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Incident Report</span>
                </button>
                <!-- Shows the decision rules used by the SDSS -->
                <button class="gm-action-btn" onclick="showSDSSRulesReport()">
                    <i class="fas fa-list-check"></i>
                    <span>SDSS Rules</span>
                </button>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="../../scripts/staff/map.js"></script>

</body>

</html>