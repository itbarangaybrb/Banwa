<?php
// Start output buffering to catch any unwanted output
ob_start();

include __DIR__ . '/../../../../../server/configs/database.php';

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

// Handle AJAX request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Clear any previous output
    ob_clean();
    
    header('Content-Type: application/json');
    
    if ($_POST['action'] === 'get_markers') {
        $constructions = getConstructionMarkers();
        echo json_encode([
            'success' => true,
            'constructions' => $constructions
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
    <link rel="stylesheet" href="../../styles/construction_staff/map.css" />
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
            </aside>

            <section class="map-container">
                <div class="map-header">
                    <h2>Barangay Blue Ridge B Map</h2>
                    <p>Construction Sites</p>
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
        <p>&copy; 2024 ConstructPro. All rights reserved.</p>
    </footer>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map').setView([14.6175, 121.0756], 17);
        let constructionMarkers = [];

        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        osmLayer.addTo(map);

        const constructionIcon = L.divIcon({ className: 'construction-marker', iconSize: [15, 15] });

        // Format date function
        function formatDate(dateString) {
            if (!dateString) return 'Not specified';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }

        // Format currency function
        function formatCurrency(amount) {
            if (!amount) return 'Not specified';
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        }

        async function loadAllMarkers() {
            clearAllMarkers();
            
            try {
                const formData = new FormData();
                formData.append('action', 'get_markers');
                
                const response = await fetch('map.php', {
                    method: 'POST',
                    body: formData
                });
                
                // Check if response is OK
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                console.log('Raw response:', text);
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    throw new Error('Invalid JSON response from server');
                }
                
                if (!data.success) {
                    throw new Error('Server returned error');
                }

                // Process constructions with detailed popup
                data.constructions.forEach(construction => {
                    if (construction.latitude && construction.longitude) {
                        const popupContent = `
                            <div class="popup-content">
                                <h4>CONSTRUCTION SITE</h4>
                                <div class="popup-section">
                                    <p><strong>Permit No:</strong> ${construction.permit_no || 'Pending'}</p>
                                    <p><strong>Homeowner:</strong> ${construction.homeowner_name || 'Not specified'}</p>
                                    <p><strong>Contractor:</strong> ${construction.contractor_name || 'Not specified'}</p>
                                    <p><strong>Address:</strong> ${construction.address_of_construction || 'Not specified'}</p>
                                </div>
                                
                                <div class="popup-section">
                                    <p><strong>Work Type:</strong> ${construction.type_of_work || 'Not specified'}</p>
                                    <p><strong>Nature:</strong> ${construction.nature_of_activity || 'Not specified'}</p>
                                    ${construction.details_of_work ? `<p><strong>Details:</strong> ${construction.details_of_work}</p>` : ''}
                                </div>
                                
                                <div class="popup-section">
                                    <p><strong>Start Date:</strong> ${formatDate(construction.start_date)}</p>
                                    <p><strong>End Date:</strong> ${formatDate(construction.end_date)}</p>
                                    <p><strong>Workers:</strong> ${construction.num_of_workers || '0'}</p>
                                    <p><strong>Working Days:</strong> ${construction.num_of_working_days || '0'}</p>
                                </div>
                                
                                <div class="popup-section">
                                    <p><strong>Fee Paid:</strong> ${formatCurrency(construction.fee_paid)}</p>
                                    <p><strong>Payment Type:</strong> ${construction.payment_type || 'Not specified'}</p>
                                    <p><strong>Payment Status:</strong> <span class="status-${construction.payment_status?.toLowerCase() || 'unknown'}">${construction.payment_status || 'Unknown'}</span></p>
                                </div>
                                
                                ${construction.approved_by || construction.noted_by ? `
                                <div class="popup-section">
                                    ${construction.approved_by ? `<p><strong>Approved By:</strong> ${construction.approved_by}</p>` : ''}
                                    ${construction.noted_by ? `<p><strong>Noted By:</strong> ${construction.noted_by}</p>` : ''}
                                </div>
                                ` : ''}
                                
                                ${construction.remarks ? `
                                <div class="popup-section">
                                    <p><strong>Remarks:</strong> ${construction.remarks}</p>
                                </div>
                                ` : ''}
                            </div>
                        `;

                        const marker = L.marker([parseFloat(construction.latitude), parseFloat(construction.longitude)], { icon: constructionIcon })
                            .bindPopup(popupContent)
                            .addTo(map);
                        constructionMarkers.push(marker);
                    }
                });

                console.log(`Loaded ${constructionMarkers.length} construction sites`);

            } catch (error) {
                console.error('ERROR LOADING MARKERS:', error);
                alert('Error loading markers. Check console for details.');
            }
        }

        // Debug function to see what's being returned
        async function debugLoadMarkers() {
            try {
                const formData = new FormData();
                formData.append('action', 'get_markers');
                
                const response = await fetch('map.php', {
                    method: 'POST',
                    body: formData
                });
                
                const text = await response.text();
                
                // Show debug info
                document.getElementById('debug-info').style.display = 'block';
                document.getElementById('debug-output').textContent = text;
                
                console.log('Full response:', text);
                
                // Try to parse as JSON
                try {
                    const data = JSON.parse(text);
                    console.log('Parsed JSON:', data);
                } catch(e) {
                    console.log('Response is not JSON, likely HTML error page');
                }
            } catch (error) {
                console.error('Debug error:', error);
                document.getElementById('debug-info').style.display = 'block';
                document.getElementById('debug-output').textContent = 'Error: ' + error.message;
            }
        }

        function clearAllMarkers() {
            constructionMarkers.forEach(marker => map.removeLayer(marker));
            constructionMarkers = [];
        }

        const blueRidgeGeoJSON = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Barangay Blue Ridge B"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [121.07278956348526, 14.61639406374255],
                        [121.07392145567032, 14.61595803532421],
                        [121.07419772320655, 14.616251316435923],
                        [121.07617987565104, 14.616430399403944],
                        [121.07651515177966, 14.617647640629082],
                        [121.07800914220171, 14.617803363969443],
                        [121.07872851395038, 14.617316502559932],
                        [121.07891090415784, 14.617705811277993],
                        [121.07449698388697, 14.62017411386342]
                    ]]
                }
            }]
        };

        const barangayLayer = L.geoJSON(blueRidgeGeoJSON, {
            style: { color: "#ff7800", weight: 2, fillColor: "#3388ff", fillOpacity: 0.2 },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(`<h3>${feature.properties.name}</h3>`);
            }
        }).addTo(map);

        const bounds = barangayLayer.getBounds();
        map.setMaxBounds(bounds);
        map.setMinZoom(17);
        map.setMaxZoom(18);

        L.control.scale().addTo(map);
        L.control.layers({"Street Map": osmLayer, "Satellite": satelliteLayer}).addTo(map);

        function resetView() { 
            map.setView([14.6175, 121.0756], 17); 
        }
        
        function toggleStreetMap() { 
            map.removeLayer(satelliteLayer); 
            osmLayer.addTo(map); 
        }
        
        function toggleSatellite() { 
            map.removeLayer(osmLayer); 
            satelliteLayer.addTo(map); 
        }

        // Load markers when map is ready
        map.whenReady(loadAllMarkers);
    </script>
</body>
</html>