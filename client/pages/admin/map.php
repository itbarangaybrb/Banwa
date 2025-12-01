<?php
// Start output buffering to catch any unwanted output
ob_start();

include __DIR__ . '../../../../server/configs/database.php';

// Function definitions
function getConstructionMarkers() {
    global $conn;
    try {
        $sql = "SELECT 
                    construction_id, 
                    permit_no, 
                    homeowner_name, 
                    contractor_name,
                    address_of_construction,
                    nature_of_activity,
                    type_of_work,
                    details_of_work,
                    start_date,
                    end_date,
                    num_of_workers,
                    num_of_working_days,
                    fee_paid,
                    payment_type,
                    payment_status,
                    approved_by,
                    noted_by,
                    remarks,
                    latitude, 
                    longitude 
                FROM construction_doc 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getConstructionMarkers: " . $e->getMessage());
        return [];
    }
}

// NEW FUNCTION: Get business markers
function getBusinessMarkers() {
    global $conn;
    try {
        $sql = "SELECT 
                    id,
                    business_name,
                    type_of_business,
                    nature_of_business,
                    nature_of_business_specify,
                    address_of_business,
                    telephone_no_business,
                    email_address,
                    first_name,
                    middle_name,
                    last_name,
                    telephone_no_owner,
                    address_owner,
                    type_of_structure,
                    type_of_structure_specify,
                    no_of_employees,
                    requirements,
                    requirement_upload,
                    application_date,
                    status,
                    approval_comments,
                    disapproval_reason,
                    latitude, 
                    longitude 
                FROM business_applications 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getBusinessMarkers: " . $e->getMessage());
        return [];
    }
}

// Handle AJAX request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Clear any previous output
    ob_clean();
    
    header('Content-Type: application/json');
    
    if ($_POST['action'] === 'get_markers') {
        $constructions = getConstructionMarkers();
        $businesses = getBusinessMarkers();
        echo json_encode([
            'success' => true,
            'constructions' => $constructions,
            'businesses' => $businesses
        ]);
        exit;
    }
}

// Clear the output buffer for the HTML content
ob_end_clean();
?>

<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="map.css" />
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <div class="logo">Blue Ridge B</div>
            <ul class="nav-links">
                <li><a href="#">Mefferson Juring</a></li>
            </ul>
        </nav>
    </header>

    <main class="main-container">
        <div class="content-wrapper">
            <aside class="sidebar">
                <h3>Navigation</h3>
                <ul class="sidebar-menu">
                    <li><a href="#">Dashboard</a></li>
                </ul>
                <h3 style="margin-top: 2rem;">Map Controls</h3>
                <ul class="sidebar-menu">
                    <li><a href="#" onclick="resetView(); return false;">Reset View</a></li>
                    <li><a href="#" onclick="toggleStreetMap(); return false;">Street Map</a></li>
                    <li><a href="#" onclick="toggleSatellite(); return false;">Satellite View</a></li>
                    <li><a href="#" onclick="loadAllMarkers(); return false;">Reload Markers</a></li>
                    <li><a href="#" onclick="debugLoadMarkers(); return false;">Debug Markers</a></li>
                </ul>
                
                <h3 style="margin-top: 2rem;">Marker Filters</h3>
                <div class="marker-toggle">
                    <button class="toggle-btn active" onclick="toggleMarkerType('all')">All Markers</button>
                    <button class="toggle-btn active" onclick="toggleMarkerType('business')">Business Only</button>
                    <button class="toggle-btn active" onclick="toggleMarkerType('construction')">Construction Only</button>
                </div>
            </aside>

            <section class="map-container">
                <div class="map-header">
                    <h2>Barangay Blue Ridge B Map</h2>
                    <p>Business & Construction Sites</p>
                </div>
                
                <div class="marker-controls">
                    <h4>Marker Legend</h4>
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div class="business-marker"></div>
                            <span>Business Locations</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div class="construction-marker"></div>
                            <span>Construction Sites</span>
                        </div>
                    </div>
                </div>
                
                <div id="map"></div>
                <div id="debug-info" class="debug-info">
                    <h4>Debug Information</h4>
                    <pre id="debug-output"></pre>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
    </footer>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="map.js"></script>
</body>
</html>