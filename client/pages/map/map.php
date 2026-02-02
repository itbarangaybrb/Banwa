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

</head>

<body>
    <!-- Side Navigation -->
    <nav class="side_nav">
        <div class="nav_header">
            <div class="logo_title">
                <div class="nav_logo">B</div>
                <div class="company_name">Blue Ridge B</div>
            </div>
        </div>
        
        <ul class="nav_list">
            <div class="nav_list1">
                <li>
                    <a href="#" class="nav_select active" onclick="setActiveNav(this)">
                        <i class="nav_icon fas fa-tachometer-alt"></i>
                        <span class="nav_text">Dashboard</span>
                    </a>
                </li>
                <li>
                    <button class="nav_select_btn" onclick="setActiveNav(this); toggleStreetMap()">
                        <i class="nav_icon fas fa-map"></i>
                        <span class="nav_text">Street Map View</span>
                    </button>
                </li>
                <li>
                    <button class="nav_select_btn" onclick="setActiveNav(this); toggleSatellite()">
                        <i class="nav_icon fas fa-satellite"></i>
                        <span class="nav_text">Satellite View</span>
                    </button>
                </li>
                <li>
                    <button class="nav_select_btn" onclick="setActiveNav(this); resetView()">
                        <i class="nav_icon fas fa-sync-alt"></i>
                        <span class="nav_text">Reset View</span>
                    </button>
                </li>
            </div>
            
            <div class="nav_list2">
                <li>
                    <a href="#" class="nav_select" onclick="setActiveNav(this)">
                        <i class="nav_icon fas fa-sign-out-alt"></i>
                        <span class="nav_text">Logout</span>
                    </a>
                </li>
            </div>
        </ul>
    </nav>

    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
        <i class="fas fa-bars"></i>
    </button>

    <!-- Header -->
    <header>
        <div class="logo_container">
            <div class="head_space">
                <div class="time_date" id="currentDateTime">
                    <!-- Will be filled by JS -->
                </div>
            </div>
            <div class="user_profile">
                <div class="username">Welcome, Kagawad Francesca</div>
                <div class="user_image">
                    <i class="fas fa-user" style="font-size: 20px; color: white;"></i>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="content">
        <div class="container">
            <div class="map-container">
                <div class="map-header">
                    <h2>Barangay Blue Ridge B Map</h2>
                    <p>Interactive Map for households, businesses, construction, utilities, and hazard areas</p>
                </div>
                
                <div class="map-controls">
                    <div class="search-container">
                        <div class="search-box">
                            <input type="text" id="search-input" placeholder="Search by name, address, type, or hazard...">
                            <button onclick="performSearch()">
                                <i class="fas fa-search"></i> Search
                            </button>
                            <button onclick="clearSearch()" class="clear-btn">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>

                    <div id="search-results" class="search-results"></div>
                    
                    <!-- filter-controls section -->
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
                            
                            <!-- Sub-filters for construction types -->
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
                            
                            <!-- Hazard Layer Toggles -->
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
                        
                        <!-- Filter info removed as requested -->
                    </div>
                </div>
                
                <div id="map"></div>
                
                <div class="map-info">
                    <p><strong>Note:</strong> Use the navigation buttons to switch between map views. Select layers from the dropdown filter. Hazard layers (Flood & Fault Line) can be toggled using the buttons below the filter.</p>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <p>Barangay Blue Ridge B Map System &copy; 2024. All rights reserved.</p>
            <p>For emergency assistance, contact Barangay Hall: 8911-1111</p>
        </div>
    </footer>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="../../scripts/staff/map.js"></script>
    
    <!-- Detail Modal -->
    <div id="detail-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Marker Details</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="modal-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        </div>
    </div>

</body>

</html>