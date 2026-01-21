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
                    <!-- Will be filled by JavaScript -->
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
                    <p>Interactive mapping system for households, businesses, and construction sites</p>
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
                    <div class="filter-buttons">
                        <button class="filter-btn active" onclick="toggleMarkerType('household')" data-type="household">
                            <span class="filter-icon" style="background: #28a745;"></span>
                            <span>Households</span>
                        </button>
                        <button class="filter-btn active" onclick="toggleMarkerType('business')" data-type="business">
                            <span class="filter-icon" style="background: #9C27B0;"></span>
                            <span>Businesses</span>
                        </button>
                        <button class="filter-btn active" onclick="toggleMarkerType('construction')" data-type="construction">
                            <span class="filter-icon" style="background: #ffc107;"></span>
                            <span>Construction</span>
                        </button>
                        <button class="filter-btn active" onclick="toggleMarkerType('utility')" data-type="utility">
                            <span class="filter-icon" style="background: #2196F3;"></span>
                            <span>Utilities</span>
                        </button>
                    </div>
                </div>
            </div>

            <div id="map"></div>

            <div class="map-info">
                <p><strong>Note:</strong> Use the navigation buttons to switch between map views.</p>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <p>&copy; 2024 Barangay Blue Ridge B. All rights reserved.</p>
    </footer>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="../../scripts/staff/map.js"></script>

    <!-- Detail Modal -->
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
</body>

</html>