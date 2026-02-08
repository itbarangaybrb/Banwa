const MAP_HANDLER_URL = '/Banwa/server/handlers/map/map_handler.php';

// Map variables
const map = L.map('map').setView([14.6175, 121.0756], 17);
let constructionMarkers = [];
let businessMarkers = [];
let householdMarkers = [];
let utilityMarkers = [];
let housePolygonsLayer = null;
let housePolygonsData = [];
let faultLine = null;
let warningMarker = null;

// Hazard layer states
let floodLayerActive = false;
let faultLineActive = false;
let floodLayer = null;
let floodLegend = null;

// Filter state
let activeFilter = 'household';
let constructionSubFilter = 'all';

// Search variables
let allMarkersData = [];
let searchResults = [];
let activeSearchMarker = null;
let searchTimeout = null;

// Modal state
let currentMarkerData = null;

// Flood display variables
let tempHouseMarker = null;
let floodHighlightLayer = null;

// Barangay boundary
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
                [121.07627821129921, 14.619295958728992],
                [121.07449698388697, 14.62017411386342]
            ]]
        }
    }]
};

// Tile layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 22         
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    maxNativeZoom: 19,
    maxZoom: 22         
});

osmLayer.addTo(map);

// Icons
const constructionIcon = L.divIcon({ 
    className: 'construction-marker', 
    iconSize: [15, 15] 
});

const businessIcon = L.divIcon({ 
    className: 'business-marker', 
    iconSize: [15, 15] 
});

const householdIcon = L.divIcon({ 
    className: 'household-marker', 
    iconSize: [12, 12] 
});

const utilityIcon = L.divIcon({ 
    className: 'utility-marker', 
    iconSize: [12, 12] 
});

const incidentIcon = L.divIcon({ 
    className: 'incident-marker', 
    iconSize: [15, 15] 
});

// ==================== MODAL FUNCTIONS ====================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId = 'detail-modal') {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ==================== FLOOD AFFECTED HOUSES FUNCTIONS ====================

/**
 * Get houses that are within flood areas
 * @param {string} riskLevel - Optional filter by risk level ('Low', 'Medium', 'High')
 * @returns {Promise} Promise with houses data
 */
async function getHousesInFlood(riskLevel = null) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses_in_flood');
        if (riskLevel) {
            formData.append('risk_level', riskLevel);
        }
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Found ${data.count} houses in flood areas`);
            return data.houses;
        } else {
            console.error('Error getting houses in flood:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching houses in flood:', error);
        return [];
    }
}

/**
 * Get summary of flood-affected houses grouped by risk level
 * @returns {Promise} Promise with summary data
 */
async function getFloodHousesSummary() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_houses_summary');
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.summary;
        } else {
            console.error('Error getting flood summary:', data.message);
            return { 
                total: 0, 
                fully_affected: 0,
                partially_affected: 0,
                minimally_affected: 0,
                by_risk_level: [] 
            };
        }
    } catch (error) {
        console.error('Error fetching flood summary:', error);
        return { 
            total: 0, 
            fully_affected: 0,
            partially_affected: 0,
            minimally_affected: 0,
            by_risk_level: [] 
        };
    }
}

/**
 * Get flood warning information for a specific risk level and impact level
 * @param {string} riskLevel - Risk level ('Low', 'Medium', 'High', 'Very-Low')
 * @param {string} impactLevel - Impact level ('Fully Affected', 'Partially Affected', 'Minimally Affected')
 * @returns {Promise} Promise with warning data
 */
async function getFloodWarning(riskLevel, impactLevel = 'Fully Affected') {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_warning');
        formData.append('risk_level', riskLevel);
        formData.append('impact_level', impactLevel);
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.warning;
        } else {
            console.error('Error getting flood warning:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching flood warning:', error);
        return null;
    }
}

/**
 * Show improved flood summary with coverage percentages
 */
async function showImprovedFloodSummary() {
    // Show loading state
    Swal.fire({
        title: 'Analyzing Flood Risk...',
        html: 'Checking houses in flood areas and calculating coverage...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        // Get summary data
        const summary = await getFloodHousesSummary();
        
        if (summary.total === 0) {
            Swal.fire({
                icon: 'success',
                title: 'No Houses in Flood Areas',
                html: `
                    <div style="text-align: left; padding: 20px;">
                        <p style="color: #28a745; font-size: 16px; margin-bottom: 15px;">
                            ✓ Great news! No houses are currently located within identified flood hazard areas.
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <strong>Stay Prepared:</strong>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                                <li>Continue monitoring weather updates</li>
                                <li>Maintain clear drainage systems</li>
                                <li>Keep emergency contact numbers ready</li>
                            </ul>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            });
            return;
        }
        
        // Build summary HTML
        let summaryHTML = `
            <div style="max-width: 750px; text-align: left;">
                <!-- Header with Statistics -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 25px; border-radius: 12px; 
                            margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🏘️ Flood Risk Assessment
                    </h3>
                    <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                        ${summary.total}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                        ${summary.total === 1 ? 'House' : 'Houses'} Affected by Flooding
                    </div>
                    
                    <!-- Impact Level Breakdown -->
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; flex: 1;">
                            <div style="font-size: 24px; font-weight: bold;">${summary.fully_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Fully Affected<br>(≥75%)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; flex: 1;">
                            <div style="font-size: 24px; font-weight: bold;">${summary.partially_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Partially<br>(25-74%)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; flex: 1;">
                            <div style="font-size: 24px; font-weight: bold;">${summary.minimally_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Minimally<br>(<25%)</div>
                        </div>
                    </div>
                </div>
                
                <!-- Risk Level Breakdown -->
                <div style="margin-bottom: 20px;">
        `;
        
        // Process each risk level
        for (const levelData of summary.by_risk_level) {
            const riskLevel = levelData.risk_level;
            const count = levelData.house_count;
            const houses = JSON.parse(levelData.houses);
            
            // Get warning info (using first house's impact level as example)
            const warning = await getFloodWarning(riskLevel, 'Fully Affected');
            
            // Set colors based on risk level
            let colorScheme = {};
            switch(riskLevel.toLowerCase()) {
                case 'high':
                    colorScheme = { bg: '#fee', border: '#dc3545', text: '#dc3545', icon: '🚨' };
                    break;
                case 'medium':
                    colorScheme = { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' };
                    break;
                case 'low':
                    colorScheme = { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ️' };
                    break;
                default:
                    colorScheme = { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '✓' };
            }
            
            summaryHTML += `
                <div style="background: ${colorScheme.bg}; 
                            border: 2px solid ${colorScheme.border}; 
                            border-radius: 10px; 
                            padding: 20px; 
                            margin-bottom: 15px;">
                    
                    <!-- Risk Level Header -->
                    <div style="display: flex; justify-content: space-between; 
                                align-items: center; margin-bottom: 15px; 
                                padding-bottom: 10px; border-bottom: 2px solid ${colorScheme.border};">
                        <h4 style="margin: 0; color: ${colorScheme.text}; font-size: 18px;">
                            ${colorScheme.icon} ${riskLevel.toUpperCase()} Risk
                        </h4>
                        <span style="background: ${colorScheme.border}; 
                                     color: white; 
                                     padding: 5px 15px; 
                                     border-radius: 20px; 
                                     font-weight: bold;">
                            ${count} ${count === 1 ? 'House' : 'Houses'}
                        </span>
                    </div>
                    
                    <!-- Warning Message -->
                    <div style="background: white; 
                                padding: 15px; 
                                border-radius: 8px; 
                                margin-bottom: 15px;
                                border-left: 4px solid ${colorScheme.border};">
                        <p style="margin: 0 0 10px 0; color: ${colorScheme.text}; font-weight: 600;">
                            ${warning.message}
                        </p>
                        
                        <!-- Impact Statistics -->
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin: 10px 0;">
                            <strong style="display: block; margin-bottom: 5px; font-size: 13px;">
                                Impact Breakdown:
                            </strong>
                            <div style="display: flex; gap: 10px; font-size: 12px;">
                                <span>🔴 Fully: ${levelData.fully_affected || 0}</span>
                                <span>🟡 Partially: ${levelData.partially_affected || 0}</span>
                                <span>🟢 Minimally: ${levelData.minimally_affected || 0}</span>
                            </div>
                        </div>
                        
                        <!-- Recommendations -->
                        <div style="margin-top: 15px;">
                            <strong style="color: ${colorScheme.text}; display: block; margin-bottom: 8px;">
                                Safety Recommendations:
                            </strong>
                            <ul style="margin: 0; padding-left: 20px; color: #555;">
                                ${warning.recommendations.slice(0, 4).map(rec => 
                                    `<li style="margin-bottom: 5px;">${rec}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <!-- House List with Coverage -->
                    <div style="background: white; 
                                padding: 15px; 
                                border-radius: 8px;">
                        <strong style="display: block; margin-bottom: 10px; color: #333;">
                            📍 Affected Houses (sorted by coverage):
                        </strong>
                        <div style="max-height: 200px; 
                                    overflow-y: auto; 
                                    padding-right: 10px;">
                            ${houses.map((house, index) => {
                                const coverage = house.flood_coverage || 0;
                                let coverageColor = '#28a745'; // green
                                let coverageIcon = '🟢';
                                let impactText = 'Minimally';
                                
                                if (coverage >= 75) {
                                    coverageColor = '#dc3545'; // red
                                    coverageIcon = '🔴';
                                    impactText = 'Fully';
                                } else if (coverage >= 25) {
                                    coverageColor = '#ffc107'; // yellow
                                    coverageIcon = '🟡';
                                    impactText = 'Partially';
                                }
                                
                                // Escape single quotes in address
                                const safeAddress = house.address ? house.address.replace(/'/g, "\\'") : '';
                                
                                return `
                                <div style="padding: 10px 12px; 
                                            margin-bottom: 8px; 
                                            background: #f8f9fa; 
                                            border-radius: 6px; 
                                            border-left: 4px solid ${coverageColor};
                                            cursor: pointer;
                                            transition: all 0.2s;"
                                     onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(5px)'"
                                     onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)'"
                                     onclick="zoomToHouse(${house.center_lat}, ${house.center_lng}, '${safeAddress}', ${coverage})">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #333; margin-bottom: 3px;">
                                                ${house.address || `House #${house.house_id}`}
                                            </div>
                                            <div style="font-size: 11px; color: #666;">
                                                ${coverageIcon} ${impactText} Affected • Click to view on map
                                            </div>
                                        </div>
                                        <div style="background: ${coverageColor}; 
                                                    color: white; 
                                                    padding: 5px 12px; 
                                                    border-radius: 15px; 
                                                    font-weight: bold;
                                                    font-size: 13px;
                                                    margin-left: 10px;">
                                            ${coverage}%
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        summaryHTML += `
                </div>
                
                <!-- Footer Actions -->
                <div style="background: #f8f9fa; 
                            padding: 15px; 
                            border-radius: 10px; 
                            text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        For emergency assistance, contact:
                    </p>
                    <div style="font-weight: bold; color: #333; font-size: 16px;">
                        Barangay Blue Ridge B Emergency Hotline
                    </div>
                </div>
            </div>
        `;
        
        // Show the summary
        Swal.fire({
            title: '',
            html: summaryHTML,
            width: 850,
            confirmButtonText: 'Close',
            confirmButtonColor: '#667eea',
            showCloseButton: true,
            customClass: {
                container: 'flood-summary-modal',
                popup: 'flood-summary-popup'
            }
        });
        
    } catch (error) {
        console.error('Error showing flood summary:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load flood summary. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

/**
 * Zoom to a specific house on the map with coverage info
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} address - House address
 * @param {number} coverage - Flood coverage percentage
 */
function zoomToHouse(lat, lng, address, coverage = 0) {
    // Close the SweetAlert
    Swal.close();
    
    // Zoom to location
    map.setView([lat, lng], 19, {
        animate: true,
        duration: 1.5
    });
    
    // Add a temporary marker to highlight the location
    if (window.tempHouseMarker) {
        map.removeLayer(window.tempHouseMarker);
    }
    
    // Determine color based on coverage
    let markerColor = '#28a745'; // green
    let impactText = 'Minimally Affected';
    
    if (coverage >= 75) {
        markerColor = '#dc3545'; // red
        impactText = 'Fully Affected';
    } else if (coverage >= 25) {
        markerColor = '#ffc107'; // yellow
        impactText = 'Partially Affected';
    }
    
    window.tempHouseMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'pulse-marker',
            html: `<div class="pulse" style="background: ${markerColor};"></div>`,
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    // Show detailed popup
    window.tempHouseMarker.bindPopup(`
        <div style="padding: 12px; min-width: 200px;">
            <strong style="font-size: 15px; display: block; margin-bottom: 8px;">
                ${address}
            </strong>
            <div style="background: #f8f9fa; padding: 8px; border-radius: 5px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #666; font-size: 13px;">Flood Coverage:</span>
                    <strong style="color: ${markerColor}; font-size: 16px;">${coverage}%</strong>
                </div>
            </div>
            <div style="color: ${markerColor}; font-weight: 600; font-size: 13px;">
                ⚠️ ${impactText}
            </div>
            ${coverage >= 50 ? 
                `<div style="margin-top: 8px; padding: 6px; background: #fff3cd; border-radius: 4px; font-size: 11px; color: #856404;">
                    ⚠ More than half of this house is in the flood zone
                </div>` 
                : ''}
        </div>
    `).openPopup();
    
    // Remove marker after 15 seconds
    setTimeout(() => {
        if (window.tempHouseMarker) {
            map.removeLayer(window.tempHouseMarker);
            window.tempHouseMarker = null;
        }
    }, 15000);
}

/**
 * Highlight houses on map with color coding by coverage
 * @param {string} riskLevel - Optional filter by risk level
 */
async function highlightFloodAffectedHouses(riskLevel = null) {
    try {
        // Clear existing highlights
        if (window.floodHighlightLayer) {
            map.removeLayer(window.floodHighlightLayer);
        }
        
        // Get houses in flood
        const houses = await getHousesInFlood(riskLevel);
        
        if (houses.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Houses Found',
                text: riskLevel 
                    ? `No houses found in ${riskLevel} risk flood areas.`
                    : 'No houses found in flood areas.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }
        
        // Create a layer group for highlights
        window.floodHighlightLayer = L.layerGroup().addTo(map);
        
        // Add highlights for each house
        houses.forEach(house => {
            if (house.coordinates) {
                const coords = JSON.parse(house.coordinates);
                const latlngs = coords.map(coord => [coord[1], coord[0]]);
                const coverage = house.flood_coverage_percent || 0;
                
                // Determine color based on coverage percentage
                let fillColor = '#28a745'; // green (minimal)
                let weight = 2;
                
                if (coverage >= 75) {
                    fillColor = '#dc3545'; // red (fully affected)
                    weight = 4;
                } else if (coverage >= 25) {
                    fillColor = '#ffc107'; // yellow (partially affected)
                    weight = 3;
                }
                
                const polygon = L.polygon(latlngs, {
                    color: fillColor,
                    weight: weight,
                    fillColor: fillColor,
                    fillOpacity: 0.4,
                    className: 'flood-affected-house-highlight'
                }).addTo(window.floodHighlightLayer);
                
                polygon.bindPopup(`
                    <div style="padding: 10px;">
                        <strong>${house.address || `House #${house.house_id}`}</strong>
                        <br>
                        <span style="color: ${fillColor}; font-weight: 600;">
                            ${house.impact_level || 'Affected'}
                        </span>
                        <br>
                        <div style="margin-top: 5px; padding: 5px; background: #f8f9fa; border-radius: 4px;">
                            <strong>${coverage}%</strong> of house in flood zone
                        </div>
                        <small style="color: #666;">${house.hazard_name}</small>
                    </div>
                `);
            }
        });
        
        // Show detailed notification
        const fullyAffected = houses.filter(h => (h.flood_coverage_percent || 0) >= 75).length;
        const partiallyAffected = houses.filter(h => {
            const cov = h.flood_coverage_percent || 0;
            return cov >= 25 && cov < 75;
        }).length;
        const minimallyAffected = houses.filter(h => (h.flood_coverage_percent || 0) < 25).length;
        
        Swal.fire({
            icon: 'success',
            title: 'Houses Highlighted',
            html: `
                <div style="text-align: left;">
                    <p><strong>${houses.length}</strong> houses highlighted on map:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin: 5px 0;">🔴 Fully Affected (≥75%): ${fullyAffected}</li>
                        <li style="margin: 5px 0;">🟡 Partially Affected (25-74%): ${partiallyAffected}</li>
                        <li style="margin: 5px 0;">🟢 Minimally Affected (<25%): ${minimallyAffected}</li>
                    </ul>
                </div>
            `,
            timer: 3000,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('Error highlighting houses:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to highlight houses. Please try again.'
        });
    }
}

// ==================== ADVANCED FLOOD DETECTION SYSTEM ====================

// Improved point-in-polygon with logging
function isPointInPolygon(point, polygon) {
    const x = point[0], y = point[1];
    let inside = false;
    
    console.log(`Checking point [${x}, ${y}] against polygon with ${polygon.length} vertices`);
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Check if point is inside any flood area
function checkIfInFloodArea(lat, lng) {
    if (!floodLayer || !floodLayer.getLayers) return null;
    
    const point = [lng, lat]; // [lng, lat] format for polygon checking
    const layers = floodLayer.getLayers();
    
    console.log(`Checking point: lat=${lat}, lng=${lng} (as [${lng}, ${lat}])`);
    
    for (let layer of layers) {
        try {
            if (layer.feature && layer.feature.geometry) {
                const geometry = layer.feature.geometry;
                
                if (geometry.type === 'Polygon' && geometry.coordinates) {
                    const polygon = geometry.coordinates[0];
                    console.log(`Polygon has ${polygon.length} vertices`);
                    console.log(`First vertex: ${polygon[0][0]}, ${polygon[0][1]}`);
                    
                    if (isPointInPolygon(point, polygon)) {
                        console.log(`✅ Point IS IN flood area: ${layer.hazardData?.hazard_name || 'Unknown'}`);
                        return layer.hazardData || {
                            hazard_name: 'Flood Hazard Area',
                            risk_level: 'unknown'
                        };
                    }
                } else if (geometry.type === 'MultiPolygon') {
                    for (let polygonGroup of geometry.coordinates) {
                        const polygon = polygonGroup[0];
                        if (isPointInPolygon(point, polygon)) {
                            return layer.hazardData || {
                                hazard_name: 'Flood Hazard Area',
                                risk_level: 'unknown'
                            };
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking flood layer:', error);
        }
    }
    
    console.log(`❌ Point is NOT in flood area`);
    return null;
}

// ADVANCED: Check polygon intersection (house vs flood)
function isPolygonIntersectingFlood(houseCoords) {
    if (!floodLayer || !floodLayer.getLayers) return null;
    
    const floodLayers = floodLayer.getLayers();
    const housePoints = houseCoords.map(coord => [coord[0], coord[1]]); // Ensure [lng, lat]
    
    for (let floodLayerObj of floodLayers) {
        if (floodLayerObj.feature && floodLayerObj.feature.geometry) {
            const floodGeometry = floodLayerObj.feature.geometry;
            
            if (floodGeometry.type === 'Polygon' && floodGeometry.coordinates) {
                const floodPolygon = floodGeometry.coordinates[0];
                
                // Strategy 1: Check if any house vertex is inside flood
                for (let vertex of housePoints) {
                    if (isPointInPolygon(vertex, floodPolygon)) {
                        console.log(`✅ House vertex in flood: ${vertex[1]}, ${vertex[0]}`);
                        return floodLayerObj.hazardData;
                    }
                }
                
                // Strategy 2: Check if any flood vertex is inside house (simplified bounds check)
                // This is computationally expensive, so we do a simpler check
                // Strategy 3: Check house bounding box center
                if (housePoints.length > 0) {
                    let centerLng = 0, centerLat = 0;
                    for (let vertex of housePoints) {
                        centerLng += vertex[0];
                        centerLat += vertex[1];
                    }
                    centerLng /= housePoints.length;
                    centerLat /= housePoints.length;
                    
                    if (isPointInPolygon([centerLng, centerLat], floodPolygon)) {
                        console.log(`✅ House center in flood: ${centerLat}, ${centerLng}`);
                        return floodLayerObj.hazardData;
                    }
                }
            }
        }
    }
    
    return null;
}

// Get house coordinates array
function getHouseCoordinates(house) {
    try {
        if (house.coordinates) {
            const coords = JSON.parse(house.coordinates);
            if (Array.isArray(coords) && coords.length >= 3) {
                return coords;
            }
        }
    } catch (e) {
        console.error('Error parsing house coordinates:', e);
    }
    return null;
}

// Get house center point
function getHouseCenter(house) {
    // Try explicit center coordinates first
    if (house.center_lat && house.center_lng) {
        return {
            lat: parseFloat(house.center_lat),
            lng: parseFloat(house.center_lng)
        };
    }
    
    // Calculate from polygon coordinates
    const coords = getHouseCoordinates(house);
    if (coords && coords.length > 0) {
        let sumLat = 0, sumLng = 0;
        let validCoords = 0;
        
        coords.forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
                sumLng += parseFloat(coord[0]); // longitude
                sumLat += parseFloat(coord[1]); // latitude
                validCoords++;
            }
        });
        
        if (validCoords > 0) {
            return {
                lat: sumLat / validCoords,
                lng: sumLng / validCoords
            };
        }
    }
    
    // Fallback to any lat/lng fields
    if (house.latitude && house.longitude) {
        return {
            lat: parseFloat(house.latitude),
            lng: parseFloat(house.longitude)
        };
    }
    
    return null;
}

// OPTIMIZED: Check if house is in flood area using multiple strategies
function isHouseInFloodArea(house) {
    console.log(`Checking house: ${house.address || 'Unnamed'}`);
    
    if (!floodLayer) {
        console.log('No flood layer available');
        return null;
    }
    
    // Strategy 1: Check house center (fastest)
    const center = getHouseCenter(house);
    if (center) {
        const centerResult = checkIfInFloodArea(center.lat, center.lng);
        if (centerResult) {
            console.log(`✅ House center in flood: ${center.lat}, ${center.lng}`);
            return centerResult;
        }
    }
    
    // Strategy 2: Check polygon intersection (more accurate)
    const houseCoords = getHouseCoordinates(house);
    if (houseCoords && houseCoords.length >= 3) {
        const polygonResult = isPolygonIntersectingFlood(houseCoords);
        if (polygonResult) {
            return polygonResult;
        }
    }
    
    // Strategy 3: Check multiple interior points
    if (houseCoords && houseCoords.length >= 3) {
        // Get bounds of house
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        
        houseCoords.forEach(coord => {
            const lat = parseFloat(coord[1]);
            const lng = parseFloat(coord[0]);
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        });
        
        // Check 9 interior grid points
        const gridSize = 3;
        for (let i = 1; i < gridSize; i++) {
            for (let j = 1; j < gridSize; j++) {
                const testLat = minLat + (maxLat - minLat) * (i / gridSize);
                const testLng = minLng + (maxLng - minLng) * (j / gridSize);
                const testPoint = [testLng, testLat];
                
                // Quick point-in-polygon for house
                let insideHouse = false;
                for (let k = 0, l = houseCoords.length - 1; k < houseCoords.length; l = k++) {
                    const xi = houseCoords[k][0], yi = houseCoords[k][1];
                    const xj = houseCoords[l][0], yj = houseCoords[l][1];
                    
                    const intersect = ((yi > testLat) !== (yj > testLat)) &&
                        (testLng < (xj - xi) * (testLat - yi) / (yj - yi) + xi);
                    
                    if (intersect) insideHouse = !insideHouse;
                }
                
                if (insideHouse) {
                    const gridResult = checkIfInFloodArea(testLat, testLng);
                    if (gridResult) {
                        console.log(`✅ House interior point in flood: ${testLat}, ${testLng}`);
                        return gridResult;
                    }
                }
            }
        }
    }
    
    console.log(`❌ House NOT in flood area`);
    return null;
}

// ==================== DEBUG FUNCTIONS ====================

// Debug function to log flood polygon coordinates
function debugFloodPolygon() {
    if (!floodLayer) {
        console.log('No flood layer loaded');
        alert('Please turn on flood layer first');
        return;
    }
    
    const layers = floodLayer.getLayers();
    if (layers.length === 0) {
        console.log('No flood layers found');
        alert('No flood layers found in floodLayer');
        return;
    }
    
    console.log('=== FLOOD POLYGON DEBUG ===');
    layers.forEach((layer, index) => {
        if (layer.feature && layer.feature.geometry) {
            const geometry = layer.feature.geometry;
            console.log(`Layer ${index}: ${geometry.type}`);
            
            if (geometry.type === 'Polygon' && geometry.coordinates) {
                const polygon = geometry.coordinates[0];
                console.log(`Number of vertices: ${polygon.length}`);
                
                // Log first 3 and last 3 vertices
                console.log('First 3 vertices:');
                for (let i = 0; i < Math.min(3, polygon.length); i++) {
                    console.log(`  [${polygon[i][0]}, ${polygon[i][1]}]`);
                }
                
                console.log('Last 3 vertices:');
                for (let i = Math.max(0, polygon.length - 3); i < polygon.length; i++) {
                    console.log(`  [${polygon[i][0]}, ${polygon[i][1]}]`);
                }
                
                // Calculate bounds
                let minLng = Infinity, maxLng = -Infinity;
                let minLat = Infinity, maxLat = -Infinity;
                
                polygon.forEach(coord => {
                    const lng = coord[0];
                    const lat = coord[1];
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                });
                
                console.log(`Bounds: Lng [${minLng.toFixed(6)}, ${maxLng.toFixed(6)}], Lat [${minLat.toFixed(6)}, ${maxLat.toFixed(6)}]`);
                
                // Show bounds on map
                const bounds = L.latLngBounds(
                    [minLat, minLng],
                    [maxLat, maxLng]
                );
                map.fitBounds(bounds);
                
                // Add a marker at the center
                const centerLat = (minLat + maxLat) / 2;
                const centerLng = (minLng + maxLng) / 2;
                L.marker([centerLat, centerLng]).addTo(map)
                    .bindPopup(`Flood Polygon Center<br>Lat: ${centerLat.toFixed(6)}<br>Lng: ${centerLng.toFixed(6)}`)
                    .openPopup();
            }
            
            if (layer.hazardData) {
                console.log(`Hazard Data: ${layer.hazardData.hazard_name} (${layer.hazardData.risk_level})`);
            }
        }
    });
    
    alert('Check browser console for flood polygon details. Map zoomed to flood bounds.');
}

// Test specific points against flood polygon
function testSpecificPoints() {
    if (!floodLayer) {
        alert('Please load flood layer first');
        return;
    }
    
    // Test points based on your flood polygon coordinates from the database dump
    const testPoints = [
        { lat: 14.61639406374255, lng: 121.07278956348526, name: 'First vertex' },
        { lat: 14.616, lng: 121.073, name: 'Inside test point' },
        { lat: 14.6175, lng: 121.0756, name: 'Map center' },
        { lat: 14.618, lng: 121.076, name: 'North-east test' }
    ];
    
    console.log('=== TESTING SPECIFIC POINTS ===');
    let results = [];
    testPoints.forEach(point => {
        const result = checkIfInFloodArea(point.lat, point.lng);
        const status = result ? 'IN FLOOD' : 'NOT IN FLOOD';
        console.log(`${point.name} (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}): ${status}`);
        results.push(`${point.name}: ${status}`);
    });
    
    // Also test the map center
    const center = map.getCenter();
    const centerResult = checkIfInFloodArea(center.lat, center.lng);
    console.log(`Map center (${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}): ${centerResult ? 'IN FLOOD' : 'NOT IN FLOOD'}`);
    results.push(`Map center: ${centerResult ? 'IN FLOOD' : 'NOT IN FLOOD'}`);
    
    alert('Test Results:\n' + results.join('\n') + '\n\nCheck browser console for details.');
}

// Helper functions for flood warnings
function getFloodRiskColor(riskLevel) {
    const colors = {
        'high': '#ff0000',
        'medium': '#ff9900',
        'low': '#ffff00',
        'very-low': '#0066cc'
    };
    return colors[riskLevel] || '#666666';
}

function getFloodSafetyAdvice(riskLevel) {
    const advice = {
        'high': 'High flood risk. Consider elevation, flood barriers, and evacuation plan.',
        'medium': 'Moderate flood risk. Install check valves and keep drains clear.',
        'low': 'Low flood risk. Monitor weather alerts and prepare emergency kit.',
        'very-low': 'Minimal flood risk. Stay informed during heavy rainfall.'
    };
    return advice[riskLevel] || 'Take necessary precautions during heavy rainfall.';
}

function createFloodWarningSection(floodInfo) {
    const riskColor = getFloodRiskColor(floodInfo.risk_level);
    const riskText = floodInfo.risk_level ? floodInfo.risk_level.toUpperCase() : 'UNKNOWN';
    
    return `
        <div class="flood-warning-section" style="
            background: linear-gradient(135deg, ${riskColor}20, ${riskColor}10);
            border-left: 4px solid ${riskColor};
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <i class="fas fa-exclamation-triangle" style="color: ${riskColor}; font-size: 1.2em;"></i>
                <strong style="color: ${riskColor};">⚠️ FLOOD HAZARD WARNING</strong>
            </div>
            <p style="margin: 0; font-size: 0.9em; color: #333;">
                This location is inside a <strong style="color: ${riskColor};">${riskText} RISK</strong> flood area.
                ${floodInfo.hazard_name ? `<br><em>Area: ${floodInfo.hazard_name}</em>` : ''}
            </p>
            <div style="margin-top: 8px; font-size: 0.85em; color: #666;">
                ${getFloodSafetyAdvice(floodInfo.risk_level)}
            </div>
        </div>
    `;
}

function createFloodWarningTableRow(floodInfo) {
    const riskColor = getFloodRiskColor(floodInfo.risk_level);
    const riskText = floodInfo.risk_level ? floodInfo.risk_level.toUpperCase() : 'UNKNOWN';
    
    return `
        <tr style="background: ${riskColor}15;">
            <td style="color: ${riskColor}; font-weight: bold;">
                <i class="fas fa-exclamation-triangle"></i> Flood Hazard
            </td>
            <td style="color: ${riskColor};">
                <strong>${riskText} RISK AREA</strong><br>
                ${floodInfo.hazard_name ? `Area: ${floodInfo.hazard_name}<br>` : ''}
                ${getFloodSafetyAdvice(floodInfo.risk_level)}
            </td>
        </tr>
    `;
}

function createWarningIcon(type, riskLevel) {
    const riskColors = {
        'high': '#ff0000',
        'medium': '#ff9900',
        'low': '#ffff00',
        'very-low': '#0066cc'
    };
    
    const typeColors = {
        'construction': '#ffc107',
        'business': '#9C27B0',
        'household': '#28a745',
        'utility': '#2196F3'
    };
    
    const baseColor = typeColors[type] || '#666666';
    const riskColor = riskColors[riskLevel] || '#666666';
    
    return L.divIcon({
        className: `${type}-marker flood-warning`,
        html: `
            <div style="position: relative; width: 20px; height: 20px;">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: ${riskColor};
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 10px ${riskColor};
                    animation: pulse 2s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: 12px;
                    height: 12px;
                    background: ${baseColor};
                    border-radius: 50%;
                    border: 1px solid white;
                "></div>
                <div style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 10px;
                    height: 10px;
                    background: ${riskColor};
                    border-radius: 50%;
                    border: 1px solid white;
                    font-size: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                ">!</div>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Update all markers with flood warnings
function updateMarkerFloodWarnings() {
    if (!floodLayer) return;
    
    constructionMarkers.forEach(marker => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        marker.setIcon(floodInfo ? createWarningIcon('construction', floodInfo.risk_level) : constructionIcon);
    });
    
    businessMarkers.forEach(marker => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        marker.setIcon(floodInfo ? createWarningIcon('business', floodInfo.risk_level) : businessIcon);
    });
    
    householdMarkers.forEach(marker => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        marker.setIcon(floodInfo ? createWarningIcon('household', floodInfo.risk_level) : householdIcon);
    });
    
    utilityMarkers.forEach(marker => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        marker.setIcon(floodInfo ? createWarningIcon('utility', floodInfo.risk_level) : utilityIcon);
    });
}

// ==================== FLOOD SUMMARY & ANALYSIS ====================

// Get comprehensive flood-affected summary
function getFloodAffectedSummary() {
    const summary = {
        construction: 0,
        business: 0,
        household: 0,
        utility: 0,
        houses: 0,
        total: 0,
        checked: {
            construction: 0,
            business: 0,
            household: 0,
            utility: 0,
            houses: 0
        },
        details: {
            construction: [],
            business: [],
            household: [],
            utility: [],
            houses: []
        },
        floodDataAvailable: false,
        message: ''
    };
    
    console.log('=== ADVANCED FLOOD ANALYSIS START ===');
    
    if (!floodLayer) {
        summary.message = 'Flood layer not loaded. Turn on flood layer first.';
        return summary;
    }
    
    const layers = floodLayer.getLayers ? floodLayer.getLayers() : [];
    if (layers.length === 0) {
        summary.message = 'No flood hazard data available.';
        return summary;
    }
    
    summary.floodDataAvailable = true;
    
    // Check construction sites
    summary.checked.construction = constructionMarkers.length;
    constructionMarkers.forEach((marker, index) => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        if (floodInfo) {
            summary.construction++;
            summary.total++;
            summary.details.construction.push({
                id: marker.id || index,
                location: latlng,
                floodInfo: floodInfo
            });
            console.log(`✅ Construction ${index} in flood:`, floodInfo.hazard_name);
        }
    });
    
    // Check businesses
    summary.checked.business = businessMarkers.length;
    businessMarkers.forEach((marker, index) => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        if (floodInfo) {
            summary.business++;
            summary.total++;
            summary.details.business.push({
                id: marker.id || index,
                location: latlng,
                floodInfo: floodInfo
            });
            console.log(`✅ Business ${index} in flood:`, floodInfo.hazard_name);
        }
    });
    
    // Check households
    summary.checked.household = householdMarkers.length;
    householdMarkers.forEach((marker, index) => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        if (floodInfo) {
            summary.household++;
            summary.total++;
            summary.details.household.push({
                id: marker.id || index,
                location: latlng,
                floodInfo: floodInfo
            });
            console.log(`✅ Household ${index} in flood:`, floodInfo.hazard_name);
        }
    });
    
    // Check utilities
    summary.checked.utility = utilityMarkers.length;
    utilityMarkers.forEach((marker, index) => {
        const latlng = marker.getLatLng();
        const floodInfo = checkIfInFloodArea(latlng.lat, latlng.lng);
        if (floodInfo) {
            summary.utility++;
            summary.total++;
            summary.details.utility.push({
                id: marker.id || index,
                location: latlng,
                floodInfo: floodInfo
            });
            console.log(`✅ Utility ${index} in flood:`, floodInfo.hazard_name);
        }
    });
    
    // Check house polygons (ADVANCED DETECTION)
    summary.checked.houses = housePolygonsData.length;
    console.log(`Checking ${housePolygonsData.length} houses with advanced detection...`);
    
    housePolygonsData.forEach((house, index) => {
        const floodInfo = isHouseInFloodArea(house);
        if (floodInfo) {
            summary.houses++;
            summary.total++;
            summary.details.houses.push({
                id: house.house_id || index,
                address: house.address,
                center: getHouseCenter(house),
                floodInfo: floodInfo
            });
            console.log(`✅ House ${index} (${house.address || 'unnamed'}) in flood:`, floodInfo.hazard_name);
        }
    });
    
    console.log('=== ANALYSIS RESULTS ===');
    console.log('Total affected:', summary.total);
    console.log('Houses in flood:', summary.houses, '/', summary.checked.houses);
    console.log('Construction in flood:', summary.construction, '/', summary.checked.construction);
    console.log('Businesses in flood:', summary.business, '/', summary.checked.business);
    console.log('Details:', summary.details);
    
    return summary;
}

// Show comprehensive flood summary with visualization
function showFloodSummary() {
    const summary = getFloodAffectedSummary();
    
    if (!summary.floodDataAvailable) {
        // Show error state
        const errorContent = `
            <div style="max-width: 500px;">
                <h3 style="color: #dc3545; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i> Flood Analysis Unavailable
                </h3>
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 0;">${summary.message}</p>
                </div>
                <button onclick="toggleFloodLayer()" style="
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    width: 100%;
                ">
                    <i class="fas fa-water"></i> Turn On Flood Layer
                </button>
            </div>
        `;
        
        L.popup()
            .setLatLng(map.getCenter())
            .setContent(errorContent)
            .openOn(map);
        return;
    }
    
    // Calculate percentages
    const housePercent = summary.checked.houses > 0 ? Math.round((summary.houses / summary.checked.houses) * 100) : 0;
    const constructionPercent = summary.checked.construction > 0 ? Math.round((summary.construction / summary.checked.construction) * 100) : 0;
    const businessPercent = summary.checked.business > 0 ? Math.round((summary.business / summary.checked.business) * 100) : 0;
    const totalChecked = summary.checked.construction + summary.checked.business + 
                        summary.checked.household + summary.checked.utility + summary.checked.houses;
    
    // Create detailed summary content
    const summaryContent = `
        <div style="max-width: 600px;">
            <h3 style="color: #0066cc; margin-bottom: 15px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                <i class="fas fa-water"></i> Comprehensive Flood Hazard Analysis
            </h3>
            
            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;">
                    <div style="font-size: 24px; font-weight: bold; color: #0066cc;">${summary.total}</div>
                    <div style="font-size: 12px; color: #666;">Total Affected Locations</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">${totalChecked}</div>
                    <div style="font-size: 12px; color: #666;">Total Locations Checked</div>
                </div>
            </div>
            
            <!-- Detailed Breakdown -->
            <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #0066cc; margin-top: 0; margin-bottom: 10px;">
                    <i class="fas fa-chart-pie"></i> Affected Locations Breakdown
                </h4>
                
                <!-- Houses -->
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><i class="fas fa-home" style="color: #795548;"></i> Houses</span>
                        <span><strong>${summary.houses}</strong> / ${summary.checked.houses} (${housePercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${housePercent}%; background: #795548;"></div>
                    </div>
                </div>
                
                <!-- Construction -->
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><i class="fas fa-hard-hat" style="color: #ff9900;"></i> Construction Sites</span>
                        <span><strong>${summary.construction}</strong> / ${summary.checked.construction} (${constructionPercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${constructionPercent}%; background: #ff9900;"></div>
                    </div>
                </div>
                
                <!-- Businesses -->
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><i class="fas fa-store" style="color: #9C27B0;"></i> Businesses</span>
                        <span><strong>${summary.business}</strong> / ${summary.checked.business} (${businessPercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${businessPercent}%; background: #9C27B0;"></div>
                    </div>
                </div>
                
                <!-- Households & Utilities -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <div style="font-size: 18px; font-weight: bold; color: #28a745;">${summary.household}</div>
                        <div style="font-size: 11px; color: #666;">Households</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <div style="font-size: 18px; font-weight: bold; color: #2196F3;">${summary.utility}</div>
                        <div style="font-size: 11px; color: #666;">Utilities</div>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                <button onclick="visualizeAffectedLocations()" style="
                    padding: 10px;
                    background: #17a2b8;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9em;
                ">
                    <i class="fas fa-eye"></i> Visualize Affected
                </button>
                <button onclick="generateFloodReport()" style="
                    padding: 10px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9em;
                ">
                    <i class="fas fa-file-download"></i> Generate Report
                </button>
            </div>
            
            <!-- Debug Info (collapsible) -->
            <details style="margin-top: 15px; font-size: 0.8em; color: #666;">
                <summary>Debug Information</summary>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px; max-height: 150px; overflow-y: auto;">
Flood Layers: ${floodLayer.getLayers().length}
Detection Method: Advanced (Center + Polygon + Grid)
House Detection: ${summary.details.houses.length} houses found
Marker Detection: ${summary.details.construction.length + summary.details.business.length} markers found
                </pre>
            </details>
        </div>
    `;
    
    L.popup()
        .setLatLng(map.getCenter())
        .setContent(summaryContent)
        .openOn(map);
}

// Visualize affected locations on map
function visualizeAffectedLocations() {
    const summary = getFloodAffectedSummary();
    
    // Clear previous visualization
    if (window.visualizationLayer) {
        map.removeLayer(window.visualizationLayer);
    }
    
    window.visualizationLayer = L.layerGroup().addTo(map);
    
    // Visualize affected houses
    summary.details.houses.forEach(house => {
        if (house.center) {
            L.circleMarker([house.center.lat, house.center.lng], {
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.7,
                radius: 8
            }).bindPopup(`<b>Affected House</b><br>${house.address || 'No address'}<br>Risk: ${house.floodInfo.risk_level}`)
              .addTo(window.visualizationLayer);
        }
    });
    
    // Visualize affected construction sites
    summary.details.construction.forEach(construction => {
        L.circleMarker([construction.location.lat, construction.location.lng], {
            color: '#ff9900',
            fillColor: '#ff9900',
            fillOpacity: 0.7,
            radius: 6
        }).bindPopup(`<b>Affected Construction Site</b><br>Risk: ${construction.floodInfo.risk_level}`)
          .addTo(window.visualizationLayer);
    });
    
    // Visualize affected businesses
    summary.details.business.forEach(business => {
        L.circleMarker([business.location.lat, business.location.lng], {
            color: '#9C27B0',
            fillColor: '#9C27B0',
            fillOpacity: 0.7,
            radius: 6
        }).bindPopup(`<b>Affected Business</b><br>Risk: ${business.floodInfo.risk_level}`)
          .addTo(window.visualizationLayer);
    });
    
    alert(`Visualization added! Showing ${summary.total} affected locations:
• RED circles: Affected houses (${summary.houses})
• ORANGE circles: Affected construction (${summary.construction})
• PURPLE circles: Affected businesses (${summary.business})`);
}

// Generate flood report
function generateFloodReport() {
    const summary = getFloodAffectedSummary();
    const now = new Date();
    
    const report = `
FLOOD HAZARD ANALYSIS REPORT
Generated: ${now.toLocaleString()}
========================================

SUMMARY:
• Total Affected Locations: ${summary.total}
• Houses in Flood Areas: ${summary.houses} of ${summary.checked.houses}
• Construction Sites Affected: ${summary.construction} of ${summary.checked.construction}
• Businesses Affected: ${summary.business} of ${summary.checked.business}
• Households Affected: ${summary.household}
• Utilities Affected: ${summary.utility}

DETAILED BREAKDOWN:
${summary.details.houses.map((h, i) => `${i+1}. House: ${h.address || 'No address'} - Risk: ${h.floodInfo.risk_level}`).join('\n')}

${summary.details.construction.map((c, i) => `${i+1}. Construction Site ${c.id} - Risk: ${c.floodInfo.risk_level}`).join('\n')}

${summary.details.business.map((b, i) => `${i+1}. Business ${b.id} - Risk: ${b.floodInfo.risk_level}`).join('\n')}

RECOMMENDATIONS:
1. ${summary.houses > 0 ? `Evacuate ${summary.houses} houses in flood zones` : 'No houses in immediate danger'}
2. ${summary.construction > 0 ? `Halt ${summary.construction} construction projects in flood areas` : 'Construction sites safe'}
3. ${summary.business > 0 ? `Alert ${summary.business} businesses to prepare for flooding` : 'Business areas safe'}

========================================
END OF REPORT
    `;
    
    // Create downloadable file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flood-report-${now.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Flood report generated and downloaded!');
}

// Debug flood detection
function debugFloodDetection() {
    console.log('=== ADVANCED FLOOD DETECTION DEBUG ===');
    
    const center = map.getCenter();
    console.log('Map center:', center.lat, center.lng);
    console.log('Center in flood?', checkIfInFloodArea(center.lat, center.lng));
    
    if (housePolygonsData.length > 0) {
        console.log('Testing first house with all methods:');
        const house = housePolygonsData[0];
        
        // Method 1: Center point
        const center = getHouseCenter(house);
        if (center) {
            console.log('House center:', center.lat, center.lng);
            console.log('Center in flood?', checkIfInFloodArea(center.lat, center.lng));
        }
        
        // Method 2: Polygon intersection
        const coords = getHouseCoordinates(house);
        if (coords) {
            console.log('House has', coords.length, 'vertices');
            console.log('Polygon intersection?', isPolygonIntersectingFlood(coords));
        }
        
        // Method 3: Advanced detection
        console.log('Advanced detection result:', isHouseInFloodArea(house));
    }
    
    const summary = getFloodAffectedSummary();
    console.log('Complete analysis:', summary);
    
    alert(`Flood Detection Debug Complete!
Check browser console for detailed results.

Summary:
• Houses checked: ${summary.checked.houses}
• Houses in flood: ${summary.houses}
• Construction in flood: ${summary.construction}
• Businesses in flood: ${summary.business}`);
}

// Refresh flood warnings
function refreshFloodWarnings() {
    if (!floodLayer) {
        loadFloodData();
        return;
    }
    
    updateMarkerFloodWarnings();
    const summary = getFloodAffectedSummary();
    
    alert(`✅ Flood warnings updated!
    
Affected Locations:
• Houses: ${summary.houses}
• Construction: ${summary.construction}
• Businesses: ${summary.business}
• Total: ${summary.total}

Markers with flood warnings have been updated.`);
}

// Test function to debug flood detection
function testFloodDetection(lat, lng) {
    console.log('=== TESTING FLOOD DETECTION ===');
    console.log('Test point:', lat, lng);
    
    if (!floodLayer) {
        console.log('ERROR: No flood layer loaded');
        return;
    }
    
    const layers = floodLayer.getLayers ? floodLayer.getLayers() : [];
    console.log('Number of flood layers:', layers.length);
    
    if (layers.length === 0) {
        console.log('ERROR: No layers found in floodLayer');
        return;
    }
    
    layers.forEach((layer, index) => {
        if (layer.hazardData) {
            console.log(`Layer ${index}:`, layer.hazardData.hazard_name, 'Risk:', layer.hazardData.risk_level);
            if (layer.feature && layer.feature.geometry) {
                console.log('Geometry type:', layer.feature.geometry.type);
            }
        }
    });
    
    const floodInfo = checkIfInFloodArea(lat, lng);
    console.log('Flood detection result:', floodInfo);
    
    if (floodInfo) {
        console.log('✅ Point is IN flood area:', floodInfo.hazard_name);
    } else {
        console.log('❌ Point is NOT in flood area');
    }
    
    return floodInfo;
}

// Test with map center
function testMapCenter() {
    const center = map.getCenter();
    testFloodDetection(center.lat, center.lng);
}

// Test flood polygon location
function testFloodPolygonLocation() {
    if (!floodLayer) {
        console.log('No flood layer');
        alert('Please turn on flood layer first');
        return;
    }
    
    const layers = floodLayer.getLayers();
    if (layers.length === 0) {
        console.log('No layers in flood layer');
        alert('No flood data loaded');
        return;
    }
    
    const layer = layers[0];
    if (layer.getBounds) {
        const bounds = layer.getBounds();
        console.log('Flood polygon bounds:', {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        });
        
        map.flyToBounds(bounds, { padding: [50, 50] });
        
        alert(`Flood Area Location:
North: ${bounds.getNorth().toFixed(6)}
South: ${bounds.getSouth().toFixed(6)}
East: ${bounds.getEast().toFixed(6)}
West: ${bounds.getWest().toFixed(6)}`);
    }
}

// ==================== DEBUG FUNCTIONS ====================

// Debug flood state
function debugFloodState() {
    console.log('=== FLOOD DEBUG ===');
    console.log('floodLayerActive:', floodLayerActive);
    console.log('floodLayer exists:', !!floodLayer);
    console.log('floodLayer on map:', floodLayer ? map.hasLayer(floodLayer) : false);
    console.log('floodLegend exists:', !!floodLegend);
    
    const formData = new FormData();
    formData.append('action', 'get_flood_hazards');
    fetch(MAP_HANDLER_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(d => console.log('API response hazards count:', d.hazards ? d.hazards.length : 0));
}

// ==================== HAZARD LAYER TOGGLES ====================

// Toggle flood layer
function toggleFloodLayer() {
    console.log('toggleFloodLayer called, current state:', floodLayerActive);
    floodLayerActive = !floodLayerActive;
    
    const floodToggleBtn = document.getElementById('floodToggleBtn');
    if (floodToggleBtn) {
        if (floodLayerActive) {
            floodToggleBtn.classList.add('active');
            floodToggleBtn.classList.add('flood-active');
        } else {
            floodToggleBtn.classList.remove('active');
            floodToggleBtn.classList.remove('flood-active');
        }
    }
    
    if (floodLayerActive) {
        console.log('Activating flood layer');
        if (!floodLayer) {
            loadFloodData();
        } else {
            if (!map.hasLayer(floodLayer)) {
                console.log('Adding existing flood layer to map');
                floodLayer.addTo(map);
            }
        }
        
        if (floodLegend) {
            if (!floodLegend._map) {
                console.log('Adding flood legend to map');
                floodLegend.addTo(map);
            }
        } else if (floodLayer) {
            addFloodLegend();
        }
    } else {
        console.log('Deactivating flood layer');
        if (floodLayer && map.hasLayer(floodLayer)) {
            map.removeLayer(floodLayer);
        }
        
        removeFloodLegend();
    }
}

// Improved function to remove flood legend
function removeFloodLegend() {
    if (floodLegend) {
        try {
            if (floodLegend._map) {
                map.removeControl(floodLegend);
            }
        } catch (e) {
            console.log('Error removing flood legend:', e);
            const legendElement = document.querySelector('.flood-legend');
            if (legendElement && legendElement.parentNode) {
                legendElement.parentNode.removeChild(legendElement);
            }
        }
    }
}

// Toggle fault line
function toggleFaultLine() {
    faultLineActive = !faultLineActive;
    
    const faultToggleBtn = document.getElementById('faultToggleBtn');
    if (faultToggleBtn) {
        if (faultLineActive) {
            faultToggleBtn.classList.add('active');
            faultToggleBtn.classList.add('fault-active');
        } else {
            faultToggleBtn.classList.remove('active');
            faultToggleBtn.classList.remove('fault-active');
        }
    }
    
    if (faultLineActive) {
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    } else {
        if (faultLine && map.hasLayer(faultLine)) {
            map.removeLayer(faultLine);
        }
        if (warningMarker && map.hasLayer(warningMarker)) {
            map.removeLayer(warningMarker);
        }
    }
}

// ==================== REGULAR FILTER DROPDOWN FUNCTIONS ====================

function toggleFilterDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdownBtn.classList.remove('active');
    } else {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        dropdown.classList.add('show');
        dropdownBtn.classList.add('active');
    }
}

function selectFilterType(type, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');
    dropdown.classList.remove('show');
    dropdownBtn.classList.remove('active');
    
    const filterTextMap = {
        'household': 'Households',
        'business': 'Businesses',
        'construction': 'Construction',
        'utility': 'Utilities'
    };
    
    document.getElementById('currentFilterText').textContent = filterTextMap[type] || 'Filter';
    
    const subFilters = document.getElementById('constructionSubFilters');
    if (subFilters) {
        if (type === 'construction') {
            subFilters.style.display = 'block';
        } else {
            subFilters.style.display = 'none';
        }
    }
    
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.type === type) {
            link.classList.add('active');
        }
    });
    
    activateFilter(type);
}

function activateFilter(type) {
    activeFilter = type;
    updateAllVisibility();
    try {
        const activeFilters = {
            construction: activeFilter === 'construction',
            business: activeFilter === 'business',
            utilities: activeFilter === 'utility',
            household: activeFilter === 'household'
        };
        window.dispatchEvent(new CustomEvent('staffMapFilterChanged', { detail: { activeFilters } }));
    } catch (e) {
        console.warn('Failed to dispatch staffMapFilterChanged', e);
    }
}

function updateAllVisibility() {
    updateMarkerVisibility();
    updateHousePolygonVisibility();
}

function updateMarkerVisibility() {
    householdMarkers.forEach(marker => {
        if (activeFilter === 'household') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    constructionMarkers.forEach(marker => {
        if (activeFilter === 'construction') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    businessMarkers.forEach(marker => {
        if (activeFilter === 'business') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    utilityMarkers.forEach(marker => {
        if (activeFilter === 'utility') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
}

function updateHousePolygonVisibility() {
    if (housePolygonsLayer) {
        if (activeFilter === 'household') {
            housePolygonsLayer.addTo(map);
        } else {
            map.removeLayer(housePolygonsLayer);
        }
    }
}

// ==================== CONSTRUCTION SUB-FILTER ====================

function filterConstructionByType(subtype, event) {
    if (event) {
        event.stopPropagation();
    }
    
    constructionSubFilter = subtype;
    
    document.querySelectorAll('.sub-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const clickedBtn = event ? event.currentTarget : 
        document.querySelector(`.sub-filter-btn[data-subtype="${subtype}"]`);
    
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    if (activeFilter === 'construction') {
        updateMarkerVisibility();
    }
}

// ==================== NAVIGATION ACTIVE STATE ====================

function setActiveNav(element) {
    document.querySelectorAll('.nav_select, .nav_select_btn').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// ==================== MAP VIEW FUNCTIONS ====================

function toggleStreetMap() {
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

function toggleSatellite() {
    map.removeLayer(osmLayer);
    satelliteLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

function resetView() {
    map.setView([14.6175, 121.0756], 17);
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

// ==================== SEARCH FUNCTIONS ====================

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchTerm) {
        if (resultsContainer) resultsContainer.style.display = 'none';
        return;
    }
    
    searchResults = [];
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    allMarkersData.forEach(marker => {
        const searchFields = [
            marker.title || '',
            marker.description || '',
            marker.location || '',
            marker.marker_type || '',
            marker.business_name || '',
            marker.homeowner_name || '',
            marker.contractor_name || '',
            marker.address_of_construction || '',
            marker.address_of_business || '',
            marker.applicant_name || '',
            marker.applicant_address || '',
            marker.hazard_name || '',
            marker.risk_level || ''
        ];
        
        let matchScore = 0;
        
        searchFields.forEach(field => {
            const fieldLower = field.toLowerCase();
            if (fieldLower === searchTerm) {
                matchScore += 100; 
            } else if (fieldLower.startsWith(searchTerm)) {
                matchScore += 50;
            } else if (fieldLower.includes(searchTerm)) {
                matchScore += 20;
            } else if (searchTerm.length >= 3) {
                const words = searchTerm.split(' ');
                words.forEach(word => {
                    if (fieldLower.includes(word)) {
                        matchScore += 5;
                    }
                });
            }
        });
        
        if (matchScore > 0) {
            searchResults.push({
                marker: marker,
                score: matchScore
            });
        }
    });
    
    searchResults.sort((a, b) => b.score - a.score);
    
    if (resultsContainer) {
        if (searchResults.length > 0) {
            const topResults = searchResults.slice(0, 10);
            
            topResults.forEach((result, index) => {
                const marker = result.marker;
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.index = index;
                
                const type = marker.marker_type || 
                            (marker.construction_id ? 'construction' : 
                             marker.id ? 'business' : 
                             marker.utility_id ? 'utility' : 
                             marker.hazard_id ? 'flood' : 'household');
                
                const title = marker.title || 
                             marker.business_name || 
                             marker.homeowner_name || 
                             marker.applicant_name ||
                             marker.hazard_name ||
                             'Unnamed Marker';
                
                const subtitle = marker.description || 
                               marker.address_of_construction || 
                               marker.address_of_business || 
                               marker.applicant_address ||
                               marker.location || 
                               (marker.risk_level ? `${marker.risk_level.toUpperCase()} Risk` : '') ||
                               '';
                
                const highlightedTitle = highlightText(title, searchTerm);
                const highlightedSubtitle = highlightText(subtitle.substring(0, 60), searchTerm);
                
                item.innerHTML = `
                    <div class="result-icon ${type === 'flood' ? 'flood-area' : type + '-marker'}"></div>
                    <div class="result-details">
                        <div class="result-title">${highlightedTitle}</div>
                        <div class="result-subtitle">${highlightedSubtitle}${subtitle.length > 60 ? '...' : ''}</div>
                    </div>
                    <span class="result-type ${type}">${type}</span>
                `;
                
                item.addEventListener('click', () => {
                    highlightSearchResult(marker);
                });
                
                resultsContainer.appendChild(item);
            });
            
            const countElement = document.createElement('div');
            countElement.className = 'search-count';
            countElement.textContent = `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`;
            resultsContainer.appendChild(countElement);
            
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item">No results found</div>';
            resultsContainer.style.display = 'block';
        }
    }
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    return text.replace(searchRegex, '<span class="highlight">$1</span>');
}

function handleSearchInput() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        performSearch();
    }, 300);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
    
    if (activeSearchMarker) {
        map.removeLayer(activeSearchMarker);
        activeSearchMarker = null;
    }
    
    updateAllVisibility();
    
    if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
        floodLayer.addTo(map);
        if (floodLegend && !floodLegend._map) {
            floodLegend.addTo(map);
        }
    }
    
    if (faultLineActive) {
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    }
    
    if (activeFilter === 'household' && housePolygonsLayer) {
        if (!map.hasLayer(housePolygonsLayer)) {
            housePolygonsLayer.addTo(map);
        }
    }
    
    map.closePopup();
}

function highlightSearchResult(markerData) {
    hideAllMarkers();
    showOnlySearchedMarker(markerData);
}

function hideAllMarkers() {
    constructionMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    businessMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    householdMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    utilityMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    if (floodLayer && map.hasLayer(floodLayer)) {
        map.removeLayer(floodLayer);
    }
    
    removeFloodLegend();
    
    if (faultLine && map.hasLayer(faultLine)) {
        map.removeLayer(faultLine);
    }
    if (warningMarker && map.hasLayer(warningMarker)) {
        map.removeLayer(warningMarker);
    }
    
    if (housePolygonsLayer && map.hasLayer(housePolygonsLayer)) {
        map.removeLayer(housePolygonsLayer);
    }
}

function showOnlySearchedMarker(markerData) {
    if (activeSearchMarker) {
        map.removeLayer(activeSearchMarker);
    }
    
    const type = markerData.marker_type || 
                (markerData.construction_id ? 'construction' : 
                 markerData.id ? 'business' : 
                 markerData.utility_id ? 'utility' : 
                 markerData.hazard_id ? 'flood' : 'household');
    
    if (type === 'flood') {
        showFloodAreaHighlight(markerData);
        return;
    }
    
    const lat = parseFloat(markerData.latitude);
    const lng = parseFloat(markerData.longitude);
    
    const highlightIcon = L.divIcon({
        className: 'highlighted-marker',
        html: `
            <div style="
                position: relative;
                width: 30px;
                height: 30px;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #ffeb3b;
                    border-radius: 50%;
                    box-shadow: 0 0 15px rgba(255, 235, 59, 0.8);
                    animation: pulse 2s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    width: 20px;
                    height: 20px;
                    ${type === 'construction' ? 'background: #ffc107;' : ''}
                    ${type === 'business' ? 'background: #9C27B0;' : ''}
                    ${type === 'household' || !type ? 'background: #28a745;' : ''}
                    ${type === 'utility' ? 'background: #2196F3;' : ''}
                    ${type === 'incident' ? 'background: #f44336;' : ''}
                    border: 2px solid white;
                    border-radius: 50%;
                "></div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    activeSearchMarker = L.marker([lat, lng], { icon: highlightIcon }).addTo(map);
    
    map.flyTo([lat, lng], 18, {
        duration: 1
    });
    
    let popupContent = '';
    
    if (type === 'construction') {
        popupContent = createConstructionPopup(markerData);
    } else if (type === 'business') {
        popupContent = createBusinessPopup(markerData);
    } else if (type === 'utility') {
        popupContent = createUtilityPopup(markerData);
    } else {
        popupContent = createHouseholdPopup(markerData);
    }
    
    setTimeout(() => {
        activeSearchMarker.bindPopup(popupContent).openPopup();
    }, 500);
    
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('active');
        const resultIndex = searchResults.findIndex(result => result.marker === markerData);
        if (parseInt(item.dataset.index) === resultIndex) {
            item.classList.add('active');
        }
    });
    
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function showFloodAreaHighlight(hazardData) {
    try {
        loadFullFloodDetailsForHighlight(hazardData.hazard_id);
    } catch (e) {
        console.error('Error highlighting flood area:', e);
        alert('Error displaying flood hazard area');
    }
}

async function loadFullFloodDetailsForHighlight(hazardId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_details');
        formData.append('id', hazardId);
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const hazard = data.data;
            
            if (hazard.geojson) {
                const geoJson = JSON.parse(hazard.geojson);
                
                const highlightStyle = getFloodAreaStyle(hazard.risk_level);
                highlightStyle.fillOpacity += 0.2;
                highlightStyle.weight += 3;
                highlightStyle.color = '#000000';
                
                activeSearchMarker = L.geoJSON(geoJson, {
                    style: highlightStyle
                }).addTo(map);
                
                const bounds = activeSearchMarker.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 18
                    });
                }
                
                const popupContent = createFloodPopup(hazard);
                activeSearchMarker.bindPopup(popupContent).openPopup();
                
                document.querySelectorAll('.search-result-item').forEach(item => {
                    item.classList.remove('active');
                    const resultIndex = searchResults.findIndex(result => result.marker.hazard_id == hazardId);
                    if (parseInt(item.dataset.index) === resultIndex) {
                        item.classList.add('active');
                    }
                });
                
                const resultsContainer = document.getElementById('search-results');
                if (resultsContainer) {
                    resultsContainer.style.display = 'none';
                }
            }
        }
    } catch (e) {
        console.error('Error loading flood details:', e);
    }
}

// ==================== POPUP CREATION FUNCTIONS ====================

function createConstructionPopup(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarning = floodInfo ? createFloodWarningSection(floodInfo) : '';
    
    return `
        <div class="popup-content">
            <h4>
                <span>Construction Site</span>
                <span class="construction-badge">Construction</span>
            </h4>
            ${floodWarning}
            <div class="popup-section">
                <p><strong>Homeowner:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
                <p><strong>Address:</strong> ${data.construction_address || 'Not specified'}</p>
                <p><strong>Contractor:</strong> ${data.contractor_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Work Type:</strong> ${data.type_of_work || 'Not specified'}</p>
                <p><strong>Nature:</strong> ${data.nature_of_work || 'Not specified'}</p>
                <p><strong>Dates:</strong> ${formatDate(data.start_date)} - ${formatDate(data.end_date)}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'construction')">
                View Full Details
            </button>
        </div>
    `;
}

function createBusinessPopup(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarning = floodInfo ? createFloodWarningSection(floodInfo) : '';
    
    return `
        <div class="popup-content">
            <h4>
                <span>${data.business_name || 'Business'}</span>
                <span class="business-badge">Business</span>
            </h4>
            ${floodWarning}
            <div class="popup-section">
                <p><strong>Address:</strong> ${data.address_of_business || 'Not specified'}</p>
                <p><strong>Type:</strong> ${data.type_of_business || 'Not specified'}</p>
                <p><strong>Owner:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
            </div>
            <div class="popup-section">
                <p><strong>Status:</strong> <span class="status-${data.status || 'pending'}">${data.status || 'Pending'}</span></p>
                <p><strong>Employees:</strong> ${data.no_of_employees || '0'}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'business')">
                View Full Details
            </button>
        </div>
    `;
}

function createUtilityPopup(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarning = floodInfo ? createFloodWarningSection(floodInfo) : '';
    
    return `
        <div class="popup-content">
            <h4>
                <span>Utility Work</span>
                <span class="utility-badge">Utility</span>
            </h4>
            ${floodWarning}
            <div class="popup-section">
                <p><strong>Applicant:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
                <p><strong>Address:</strong> ${data.address_of_utility || 'Not specified'}</p>
                <p><strong>Provider:</strong> ${data.provider || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Nature of Work:</strong> ${data.nature_of_work || 'Not specified'}</p>
                <p><strong>Work Date:</strong> ${formatDate(data.date_of_work)}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'utility')">
                View Full Details
            </button>
        </div>
    `;
}

function createHouseholdPopup(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarning = floodInfo ? createFloodWarningSection(floodInfo) : '';
    
    return `
        <div class="popup-content">
            <h4>
                <span>${data.title || 'Household'}</span>
                <span class="household-badge">Household</span>
            </h4>
            ${floodWarning}
            <div class="popup-section">
                <p><strong>Description:</strong> ${data.description || 'Not specified'}</p>
                <p><strong>Location:</strong> ${data.location || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Type:</strong> ${data.marker_type || 'household'}</p>
                <p><strong>Created:</strong> ${formatDate(data.created_at)}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.marker_id}, 'household')">
                View Full Details
            </button>
        </div>
    `;
}

function createFloodPopup(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    const riskClass = `flood-risk-${data.risk_level || 'medium'}`;
    
    const properties = data.properties || {};
    const lastFloodDate = properties.last_flood_date || properties.created_at || 'Not recorded';
    const reportedBy = properties.source || properties.reported_by || properties.updated_by || 'Barangay Office';
    const dateIdentified = properties.created_at || data.created_at || 'Not specified';
    const safetyAdvice = properties.safety_advice || getFloodSafetyAdvice(data.risk_level);
    
    return `
        <div class="popup-content">
            <h4>
                <span>${data.hazard_name || 'Flood Hazard Area'}</span>
                <span class="flood-risk-badge" style="background: ${riskColor}; color: white;">${(data.risk_level || 'medium').toUpperCase()} RISK</span>
            </h4>
            <div class="popup-section flood-popup-section">
                <p><strong>Risk Level:</strong> <span class="${riskClass}">${(data.risk_level || 'medium').toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${data.description || 'Flood-prone area'}</p>
                <p><strong>Last Updated:</strong> ${formatDate(data.updated_at) || 'Not recorded'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Safety Advice:</strong> ${safetyAdvice}</p>
                <p><strong>Reported By:</strong> ${reportedBy}</p>
                <p><strong>Identified:</strong> ${formatDate(dateIdentified)}</p>
            </div>
            <button class="view-details-btn" onclick="viewFloodDetails(${data.hazard_id})">
                View Flood Details
            </button>
        </div>
    `;
}

function createHousePopup(data) {
    const centerLat = parseFloat(data.center_lat) || parseFloat(data.latitude);
    const centerLng = parseFloat(data.center_lng) || parseFloat(data.longitude);
    const floodInfo = checkIfInFloodArea(centerLat, centerLng);
    const floodWarning = floodInfo ? createFloodWarningSection(floodInfo) : '';
    
    return `
        <div class="popup-content">
            <h4>
                <span>House ${data.house_number || ''}</span>
                <span class="household-badge">House</span>
            </h4>
            ${floodWarning}
            <div class="popup-section">
                <p><strong>Address:</strong> ${data.address || 'Not specified'}</p>
                <p><strong>Street:</strong> ${data.street_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Area:</strong> ${data.area_sqm || '0'} sqm</p>
                <p><strong>Last Updated:</strong> ${formatDate(data.updated_at)}</p>
            </div>
            <button class="view-details-btn" onclick="viewHouseDetails(${data.house_id})">
                View House Details
            </button>
        </div>
    `;
}

// View details functions
async function viewMapDetails(id, type) {
    try {
        const formData = new FormData();
        formData.append('action', `get_${type}_details`);
        formData.append('id', id);
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayDetailsInModal(data.data, type);
        }
    } catch (error) {
        console.error('Error loading details:', error);
    }
}

async function viewFloodDetails(id) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_details');
        formData.append('id', id);
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayFloodDetailsInModal(data.data);
        }
    } catch (error) {
        console.error('Error loading flood details:', error);
    }
}

async function viewHouseDetails(id) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_house_details');
        formData.append('id', id);
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayHouseDetailsInModal(data.data);
        }
    } catch (error) {
        console.error('Error loading house details:', error);
    }
}

function displayDetailsInModal(data, type) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    let title = '';
    let content = '';
    
    switch(type) {
        case 'construction':
            title = `Construction Site - ${data.first_name || ''} ${data.last_name || ''}`;
            content = createConstructionModalContent(data);
            break;
        case 'business':
            title = `Business - ${data.business_name || 'Unnamed'}`;
            content = createBusinessModalContent(data);
            break;
        case 'utility':
            title = `Utility Work - ${data.first_name || ''} ${data.last_name || ''}`;
            content = createUtilityModalContent(data);
            break;
        case 'household':
            title = `Household - ${data.title || 'Marker'}`;
            content = createHouseholdModalContent(data);
            break;
    }
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    showModal('detail-modal');
}

function displayFloodDetailsInModal(data) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = `Flood Hazard - ${data.hazard_name || 'Unnamed'}`;
    modalContent.innerHTML = createFloodModalContent(data);
    showModal('detail-modal');
}

function displayHouseDetailsInModal(data) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = `House ${data.house_number || ''} - ${data.address || ''}`;
    modalContent.innerHTML = createHouseModalContent(data);
    showModal('detail-modal');
}

// Create modal content functions
function createConstructionModalContent(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarningRow = floodInfo ? createFloodWarningTableRow(floodInfo) : '';
    
    return `
        <table class="detail-table">
            ${floodWarningRow}
            <tr>
                <td>Homeowner Name</td>
                <td>${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}</td>
            </tr>
            <tr>
                <td>Contact Number</td>
                <td>${data.contact_no_owner || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Construction Address</td>
                <td>${data.construction_address || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Type of Work</td>
                <td>${data.type_of_work || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Contractor</td>
                <td>${data.contractor_name || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Work Period</td>
                <td>${formatDate(data.start_date)} to ${formatDate(data.end_date)} (${data.number_of_working_days || 0} days)</td>
            </tr>
            <tr>
                <td>Status</td>
                <td><span class="status-${data.agreed === '1' ? 'approved' : 'pending'}">${data.agreed === '1' ? 'Approved' : 'Pending'}</span></td>
            </tr>
        </table>
    `;
}

function createBusinessModalContent(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarningRow = floodInfo ? createFloodWarningTableRow(floodInfo) : '';
    
    return `
        <table class="detail-table">
            ${floodWarningRow}
            <tr>
                <td>Business Name</td>
                <td>${data.business_name || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Business Address</td>
                <td>${data.address_of_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Business Type</td>
                <td>${data.type_of_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Owner Name</td>
                <td>${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}</td>
            </tr>
            <tr>
                <td>Contact Number</td>
                <td>${data.telephone_no_business || data.telephone_no_owner || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Number of Employees</td>
                <td>${data.no_of_employees || '0'}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td><span class="status-${data.status || 'pending'}">${data.status || 'Pending'}</span></td>
            </tr>
        </table>
    `;
}

function createUtilityModalContent(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarningRow = floodInfo ? createFloodWarningTableRow(floodInfo) : '';
    
    return `
        <table class="detail-table">
            ${floodWarningRow}
            <tr>
                <td>Applicant Name</td>
                <td>${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}</td>
            </tr>
            <tr>
                <td>Contact Number</td>
                <td>${data.owner_contact_no || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Utility Address</td>
                <td>${data.address_of_utility || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Provider</td>
                <td>${data.provider || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Nature of Work</td>
                <td>${data.nature_of_work || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Work Date</td>
                <td>${formatDate(data.date_of_work)}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td><span class="status-${data.agreed === '1' ? 'approved' : 'pending'}">${data.agreed === '1' ? 'Approved' : 'Pending'}</span></td>
            </tr>
        </table>
    `;
}

function createHouseholdModalContent(data) {
    const floodInfo = checkIfInFloodArea(parseFloat(data.latitude), parseFloat(data.longitude));
    const floodWarningRow = floodInfo ? createFloodWarningTableRow(floodInfo) : '';
    
    return `
        <table class="detail-table">
            ${floodWarningRow}
            <tr>
                <td>Title</td>
                <td>${data.title || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Description</td>
                <td>${data.description || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Location</td>
                <td>${data.location || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Marker Type</td>
                <td>${data.marker_type || 'household'}</td>
            </tr>
            <tr>
                <td>Created By</td>
                <td>${data.created_by || 'Unknown'}</td>
            </tr>
            <tr>
                <td>Created Date</td>
                <td>${formatDate(data.created_at)}</td>
            </tr>
            <tr>
                <td>Coordinates</td>
                <td>${data.latitude || ''}, ${data.longitude || ''}</td>
            </tr>
        </table>
    `;
}

function createFloodModalContent(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    const properties = data.properties || {};
    
    const lastFloodDate = properties.last_flood_date || properties.created_at;
    const reportedBy = properties.source || properties.reported_by || properties.updated_by;
    const dateIdentified = properties.created_at || data.created_at;
    const safetyAdvice = properties.safety_advice || getFloodSafetyAdvice(data.risk_level);
    
    return `
        <table class="detail-table">
            <tr>
                <td>Hazard Name</td>
                <td>${data.hazard_name || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Risk Level</td>
                <td><span style="color: ${riskColor}; font-weight: bold;">${(data.risk_level || 'medium').toUpperCase()}</span></td>
            </tr>
            <tr>
                <td>Description</td>
                <td>${data.description || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Last Flood Date</td>
                <td>${formatDate(lastFloodDate) || 'Not recorded'}</td>
            </tr>
            <tr>
                <td>Reported By</td>
                <td>${reportedBy || 'Barangay Office'}</td>
            </tr>
            <tr>
                <td>Date Identified</td>
                <td>${formatDate(dateIdentified)}</td>
            </tr>
            <tr>
                <td>Safety Advice</td>
                <td>${safetyAdvice}</td>
            </tr>
            <tr>
                <td>Last Updated</td>
                <td>${formatDate(data.updated_at)}</td>
            </tr>
            <tr>
                <td>Properties</td>
                <td><pre style="font-size: 0.8em; white-space: pre-wrap; max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 5px;">${JSON.stringify(properties, null, 2)}</pre></td>
            </tr>
        </table>
    `;
}

function createHouseModalContent(data) {
    const centerLat = parseFloat(data.center_lat) || parseFloat(data.latitude);
    const centerLng = parseFloat(data.center_lng) || parseFloat(data.longitude);
    const floodInfo = checkIfInFloodArea(centerLat, centerLng);
    const floodWarningRow = floodInfo ? createFloodWarningTableRow(floodInfo) : '';
    
    return `
        <table class="detail-table">
            ${floodWarningRow}
            <tr>
                <td>Address</td>
                <td>${data.address || 'Not specified'}</td>
            </tr>
            <tr>
                <td>House Number</td>
                <td>${data.house_number || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Street Name</td>
                <td>${data.street_name || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Area</td>
                <td>${data.area_sqm || '0'} square meters</td>
            </tr>
            <tr>
                <td>Center Coordinates</td>
                <td>${data.center_lat || ''}, ${data.center_lng || ''}</td>
            </tr>
            <tr>
                <td>Created</td>
                <td>${formatDate(data.created_at)}</td>
            </tr>
            <tr>
                <td>Last Updated</td>
                <td>${formatDate(data.updated_at)}</td>
            </tr>
        </table>
    `;
}

// ==================== HELPER FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ==================== DATA LOADING FUNCTIONS ====================

async function loadAllMarkers() {
    clearAllMarkers();
    
    try {
        // Load each marker type separately using the new API endpoints
        const [constructions, businesses, households, utilities, floodData] = await Promise.all([
            fetchMarkers('get_construction_markers'),
            fetchMarkers('get_business_markers'),
            fetchMarkers('get_generic_markers'),  // Note: Changed from 'households' to 'generic_markers'
            fetchMarkers('get_utilities_markers'),
            fetchMarkers('get_flood_hazards')
        ]);

        // Combine all markers for search
        allMarkersData = [
            ...(constructions || []).map(c => ({ ...c, type: 'construction' })),
            ...(businesses || []).map(b => ({ ...b, type: 'business' })),
            ...(households || []).map(h => ({ ...h, type: 'household' })),  // Still works with generic markers
            ...(utilities || []).map(u => ({ ...u, type: 'utility' })),
            ...(floodData || []).map(f => ({ ...f, type: 'flood' }))
        ];

        // Process construction markers
        if (constructions && Array.isArray(constructions)) {
            constructions.forEach(construction => {
                if (construction.latitude && construction.longitude) {
                    try {
                        const lat = parseFloat(construction.latitude);
                        const lng = parseFloat(construction.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createConstructionPopup(construction);
                            const marker = L.marker([lat, lng], {
                                icon: constructionIcon,
                                title: construction.first_name || 'Construction Site'
                            }).bindPopup(popupContent);
                            
                            constructionMarkers.push(marker);
                            if (activeFilter === 'construction') {
                                marker.addTo(map);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing construction marker:', error);
                    }
                }
            });
        }

        // Process business markers
        if (businesses && Array.isArray(businesses)) {
            businesses.forEach(business => {
                if (business.latitude && business.longitude) {
                    try {
                        const lat = parseFloat(business.latitude);
                        const lng = parseFloat(business.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createBusinessPopup(business);
                            const marker = L.marker([lat, lng], {
                                icon: businessIcon,
                                title: business.business_name || 'Business'
                            }).bindPopup(popupContent);
                            
                            businessMarkers.push(marker);
                            if (activeFilter === 'business') {
                                marker.addTo(map);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing business marker:', error);
                    }
                }
            });
        }

        // Process household (generic) markers
        if (households && Array.isArray(households)) {
            households.forEach(household => {
                if (household.latitude && household.longitude) {
                    try {
                        const lat = parseFloat(household.latitude);
                        const lng = parseFloat(household.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createHouseholdPopup(household);
                            const marker = L.marker([lat, lng], {
                                icon: householdIcon,
                                title: household.title || 'Household'
                            }).bindPopup(popupContent);
                            
                            householdMarkers.push(marker);
                            if (activeFilter === 'household') {
                                marker.addTo(map);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing household marker:', error);
                    }
                }
            });
        }

        // Process utility markers
        if (utilities && Array.isArray(utilities)) {
            utilities.forEach(utility => {
                if (utility.latitude && utility.longitude) {
                    try {
                        const lat = parseFloat(utility.latitude);
                        const lng = parseFloat(utility.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createUtilityPopup(utility);
                            const marker = L.marker([lat, lng], {
                                icon: utilityIcon,
                                title: utility.first_name || 'Utility Work'
                            }).bindPopup(popupContent);
                            
                            utilityMarkers.push(marker);
                            if (activeFilter === 'utility') {
                                marker.addTo(map);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing utility marker:', error);
                    }
                }
            });
        }

        if (floodLayerActive) {
            loadFloodData();
        }

        loadHousePolygons();
    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Please check browser console for details.');
    }
}

// Helper function to fetch markers
async function fetchMarkers(action) {
    try {
        const formData = new FormData();
        formData.append('action', action);
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(`Server error: ${data.message || 'Unknown error'}`);
        }
        
        return data.markers || data.hazards || [];
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        return [];
    }
}

async function loadFloodData() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_hazards');
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Flood data loaded:', data.hazards ? data.hazards.length : 0, 'hazards');
        
        if (data.success && data.hazards) {
            if (data.hazards.length > 0) {
                processAndRenderFloodAreas(data.hazards);
                addFloodLegend();
                
                setTimeout(() => {
                    updateMarkerFloodWarnings();
                }, 500);
                
                if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
                    floodLayer.addTo(map);
                }
                
                if (floodLayerActive && floodLegend) {
                    if (!floodLegend._map) {
                        floodLegend.addTo(map);
                    }
                }
            } else {
                console.log('No flood hazards found in response');
                floodLayer = L.layerGroup();
                floodLegend = null;
            }
        } else {
            console.log('Flood data request was not successful:', data.message);
            floodLayer = L.layerGroup();
            floodLegend = null;
        }
    } catch (error) {
        console.error('ERROR LOADING FLOOD DATA:', error);
        floodLayer = L.layerGroup();
        floodLegend = null;
    }
}

function processAndRenderFloodAreas(hazards) {
    if (floodLayer) {
        map.removeLayer(floodLayer);
    }
    
    floodLayer = L.layerGroup();
    
    console.log(`Processing ${hazards.length} flood hazards`);
    
    hazards.forEach(hazard => {
        try {
            console.log(`Processing hazard: ${hazard.hazard_name} (${hazard.hazard_type})`);
            
            if (!hazard.geojson && hazard.geom) {
                console.log('Warning: No geojson, only geom');
                return;
            }
            
            if (!hazard.geojson) {
                console.log('Warning: No geojson data');
                return;
            }
            
            const geoJson = typeof hazard.geojson === 'string' 
                ? JSON.parse(hazard.geojson) 
                : hazard.geojson;
            
            console.log(`GeoJSON type: ${geoJson.type}, coordinates length: ${geoJson.coordinates ? geoJson.coordinates[0].length : 'none'}`);
                
            const style = getFloodAreaStyle(hazard.risk_level);
            
            const layer = L.geoJSON(geoJson, {
                style: style,
                onEachFeature: function(feature, layer) {
                    layer.hazardData = {
                        hazard_id: hazard.hazard_id,
                        hazard_name: hazard.hazard_name,
                        hazard_type: hazard.hazard_type,
                        risk_level: hazard.risk_level,
                        description: hazard.description
                    };
                    
                    const popupContent = createFloodPopup(layer.hazardData);
                    layer.bindPopup(popupContent);
                    
                    layer.on('mouseover', function() {
                        this.setStyle({
                            fillOpacity: style.fillOpacity + 0.2,
                            weight: style.weight + 2
                        });
                        this.bringToFront();
                    });
                    
                    layer.on('mouseout', function() {
                        this.setStyle(style);
                    });
                }
            });
            
            layer.addTo(floodLayer);
            console.log(`✅ Added layer for ${hazard.hazard_name} to floodLayer`);
            
        } catch (e) {
            console.error('Error rendering flood hazard:', e, hazard);
        }
    });
    
    // Check how many layers were actually added
    const layerCount = floodLayer.getLayers().length;
    console.log(`Total layers in floodLayer: ${layerCount}`);
    
    if (layerCount === 0) {
        console.error('No flood layers were added! Check GeoJSON data.');
    }
}

function addFloodLegend() {
    removeFloodLegend();
    
    floodLegend = L.control({ position: 'bottomright' });
    
    floodLegend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend flood-legend');
        div.innerHTML = `
            <h4>Flood Risk Levels</h4>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #ff0000; opacity: 0.3;"></div>
                <span class="flood-legend-text">High Risk</span>
            </div>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #ff9900; opacity: 0.25;"></div>
                <span class="flood-legend-text">Medium Risk</span>
            </div>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #ffff00; opacity: 0.2;"></div>
                <span class="flood-legend-text">Low Risk</span>
            </div>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #cce6ff; opacity: 0.15;"></div>
                <span class="flood-legend-text">Very Low Risk</span>
            </div>
        `;
        return div;
    };
    
    if (floodLayerActive) {
        floodLegend.addTo(map);
    }
}

function getFloodAreaStyle(riskLevel) {
    const styles = {
        'high': {
            fillColor: '#ff0000',
            color: '#cc0000',
            fillOpacity: 0.3,
            weight: 2,
            opacity: 0.8,
            dashArray: null
        },
        'medium': {
            fillColor: '#ff9900',
            color: '#cc6600',
            fillOpacity: 0.25,
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 3'
        },
        'low': {
            fillColor: '#ffff00',
            color: '#cccc00',
            fillOpacity: 0.2,
            weight: 1,
            opacity: 0.6,
            dashArray: '3, 3'
        },
        'very-low': {
            fillColor: '#cce6ff',
            color: '#99ccff',
            fillOpacity: 0.15,
            weight: 1,
            opacity: 0.5,
            dashArray: '2, 2'
        }
    };
    
    return styles[riskLevel] || styles.medium;
}

async function loadHousePolygons() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses');
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && data.houses) {
            housePolygonsData = data.houses;
            renderHousePolygons();
        }
    } catch (error) {
        console.error('ERROR LOADING HOUSE POLYGONS:', error);
    }
}

function renderHousePolygons() {
    if (housePolygonsLayer) {
        map.removeLayer(housePolygonsLayer);
    }
    
    housePolygonsLayer = L.layerGroup();
    
    housePolygonsData.forEach(house => {
        if (house.coordinates) {
            try {
                const coords = JSON.parse(house.coordinates);
                const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
                latLngCoords.push(latLngCoords[0]);
                
                const polygon = L.polygon(latLngCoords, {
                    color: '#3388ff',
                    weight: 2,
                    fillColor: '#3388ff',
                    fillOpacity: 0.3,
                    interactive: true
                });
                
                polygon.addTo(housePolygonsLayer);
                const popupContent = createHousePopup(house);
                polygon.bindPopup(popupContent);
                polygon.houseData = house;
                
            } catch (e) {
                console.error('Error parsing house coordinates:', e);
            }
        }
    });
    
    if (activeFilter === 'household') {
        housePolygonsLayer.addTo(map);
    }
}

function clearAllMarkers() {
    constructionMarkers.forEach(marker => map.removeLayer(marker));
    businessMarkers.forEach(marker => map.removeLayer(marker));
    householdMarkers.forEach(marker => map.removeLayer(marker));
    utilityMarkers.forEach(marker => map.removeLayer(marker));
    
    if (floodLayer) {
        map.removeLayer(floodLayer);
    }
    
    removeFloodLegend();
    
    if (faultLine && map.hasLayer(faultLine)) {
        map.removeLayer(faultLine);
    }
    if (warningMarker && map.hasLayer(warningMarker)) {
        map.removeLayer(warningMarker);
    }
    
    constructionMarkers = [];
    businessMarkers = [];
    householdMarkers = [];
    utilityMarkers = [];
    floodLayer = null;
    floodLegend = null;
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced flood styles
    const enhancedFloodStyles = `
    <style>
        /* Pulse marker with dynamic colors */
        .pulse-marker {
            position: relative;
        }
        
        .pulse {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            animation: pulse-animation 2s infinite;
            opacity: 0.7;
        }
        
        @keyframes pulse-animation {
            0% {
                transform: scale(0.8);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.4;
            }
            100% {
                transform: scale(0.8);
                opacity: 0.8;
            }
        }
        
        /* Enhanced scrollbar */
        .flood-summary-popup ::-webkit-scrollbar {
            width: 8px;
        }
        
        .flood-summary-popup ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        .flood-summary-popup ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        
        .flood-summary-popup ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        
        /* Flood affected house highlight animation */
        .flood-affected-house-highlight {
            animation: flood-highlight-pulse 3s infinite;
        }
        
        @keyframes flood-highlight-pulse {
            0%, 100% {
                opacity: 0.4;
            }
            50% {
                opacity: 0.7;
            }
        }
    </style>
    `;
    
    // Inject styles
    document.head.insertAdjacentHTML('beforeend', enhancedFloodStyles);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        document.addEventListener('click', function(e) {
            const resultsContainer = document.getElementById('search-results');
            const searchBox = document.querySelector('.search-box');
            
            if (resultsContainer && 
                !resultsContainer.contains(e.target) && 
                e.target !== searchInput &&
                !searchBox.contains(e.target)) {
                
                resultsContainer.style.display = 'none';
            }
        });
        
        searchInput.addEventListener('focus', function() {
            if (this.value.trim() !== '') {
                performSearch();
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('filterDropdown');
        const dropdownBtn = document.getElementById('filterDropdownBtn');
        
        if (dropdown && dropdownBtn && 
            !dropdown.contains(e.target) && 
            !dropdownBtn.contains(e.target)) {
            dropdown.classList.remove('show');
            dropdownBtn.classList.remove('active');
        }
    });
    
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('detail-modal');
        if (e.target === modal) {
            closeModal('detail-modal');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal('detail-modal');
        }
    });
    
    const householdLink = document.querySelector('.dropdown-content a[data-type="household"]');
    if (householdLink) {
        householdLink.classList.add('active');
    }
});

// ==================== MAP INITIALIZATION ====================

map.whenReady(function() {
    const barangayBoundary = L.geoJSON(blueRidgeGeoJSON, {
        style: {
            color: '#00247C',
            weight: 3,
            fillColor: '#667eea',
            fillOpacity: 0.1,
            dashArray: '5, 5'
        }
    }).addTo(map);
    
    const faultLineGeoJSON = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Fault Line",
                    "description": "Potential seismic fault line"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [121.0765328982805, 14.617540821420917],
                        [121.07653620957734, 14.617799286676458],
                        [121.07655166229381, 14.618043150864395],
                        [121.0765671150105, 14.618248213765824],
                        [121.07659139785397, 14.618508814258277],
                        [121.07665541626238, 14.618812135753643],
                        [121.07674482127817, 14.619077007702046]
                    ]
                }
            }
        ]
    };
    
    faultLine = L.geoJSON(faultLineGeoJSON, {
        style: {
            color: '#ff0000',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10',
            lineCap: 'round',
            lineJoin: 'round'
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(`
                <div style="max-width: 300px;">
                    <h4 style="color: #ff0000; margin-bottom: 10px;">
                        <i class="fas fa-exclamation-triangle"></i> FAULT LINE
                    </h4>
                    <p><strong>⚠️ Seismic Hazard Zone</strong></p>
                    <p>This area has been identified as having potential seismic activity.</p>
                    <p style="font-size: 0.9em; color: #666;">
                        <i class="fas fa-info-circle"></i> 
                        Construction and development in this area should follow earthquake-resistant guidelines.
                    </p>
                </div>
            `);
            
            layer.on('mouseover', function() {
                this.setStyle({
                    weight: 6,
                    opacity: 1,
                    color: '#ff4444'
                });
            });
            
            layer.on('mouseout', function() {
                this.setStyle({
                    weight: 4,
                    opacity: 0.8,
                    color: '#ff0000'
                });
            });
        }
    });
    
    const faultCoords = faultLineGeoJSON.features[0].geometry.coordinates;
    const midIndex = Math.floor(faultCoords.length / 2);
    const warningPoint = faultCoords[midIndex];
    
    const warningIcon = L.divIcon({
        className: 'incident-marker',
        html: `<div style="
            position: relative;
            width: 25px;
            height: 25px;
            background: rgba(255, 0, 0, 0.7);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
        ">
            <i class="fas fa-exclamation" style="color: white; font-size: 12px;"></i>
        </div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
    });
    
    warningMarker = L.marker([warningPoint[1], warningPoint[0]], {
        icon: warningIcon,
        title: 'Fault Line Warning'
    });
    
    warningMarker.bindPopup(`
        <div style="max-width: 250px;">
            <h4 style="color: #ff0000; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle"></i> EARTHQUAKE RISK AREA
            </h4>
            <p><strong>Fault Line Detected</strong></p>
            <p>Special precautions required for construction and development.</p>
            <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
                <i class="fas fa-shield-alt"></i> 
                Ensure structures meet seismic design standards.
            </p>
        </div>
    `);
    
    setupSoftBoundary();
    
    loadAllMarkers();
    initDateTime();
    setupMobileMenuClose();
});

// ==================== BOUNDARY FUNCTIONS ====================

function setupSoftBoundary() {
    const bounds = L.geoJSON(blueRidgeGeoJSON).getBounds();
    const softBounds = bounds.pad(0.15);
    const warningBounds = bounds.pad(0.05);
    const maxBounds = bounds.pad(0.25);
    
    map.setMaxBounds(maxBounds);
    
    let boundaryTimeout;
    
    map.on('move', function() {
        clearTimeout(boundaryTimeout);
        
        const currentCenter = map.getCenter();
        
        if (!warningBounds.contains(currentCenter)) {
            showBoundaryMessage("You're leaving Barangay Blue Ridge B");
            
            if (!softBounds.contains(currentCenter)) {
                boundaryTimeout = setTimeout(function() {
                    let snappedLat = currentCenter.lat;
                    let snappedLng = currentCenter.lng;
                    
                    if (snappedLat > warningBounds.getNorth()) snappedLat = warningBounds.getNorth();
                    if (snappedLat < warningBounds.getSouth()) snappedLat = warningBounds.getSouth();
                    if (snappedLng > warningBounds.getEast()) snappedLng = warningBounds.getEast();
                    if (snappedLng < warningBounds.getWest()) snappedLng = warningBounds.getWest();
                    
                    const snappedCenter = L.latLng(snappedLat, snappedLng);
                    
                    map.flyTo(snappedCenter, map.getZoom(), {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                }, 1000);
            }
        }
    });
    
    map.on('moveend', function() {
        const currentCenter = map.getCenter();
        
        if (!softBounds.contains(currentCenter)) {
            let snappedLat = currentCenter.lat;
            let snappedLng = currentCenter.lng;
            
            if (snappedLat > softBounds.getNorth()) snappedLat = softBounds.getNorth();
            if (snappedLat < softBounds.getSouth()) snappedLat = softBounds.getSouth();
            if (snappedLng > softBounds.getEast()) snappedLng = softBounds.getEast();
            if (snappedLng < softBounds.getWest()) snappedLng = softBounds.getWest();
            
            const snappedCenter = L.latLng(snappedLat, snappedLng);
            
            if (!bounds.contains(currentCenter)) {
                map.panTo(snappedCenter, {
                    animate: true,
                    duration: 0.5
                });
            }
        }
    });
    
    L.geoJSON(blueRidgeGeoJSON, {
        style: {
            color: '#00247C',
            weight: 3,
            fillColor: '#667eea',
            fillOpacity: 0.1,
            dashArray: '5, 5'
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Barangay Boundary`);
        }
    }).addTo(map);
    
    map.setMinZoom(15);
    map.setMaxZoom(20);
    
    addBoundaryNotification();
}

function showBoundaryMessage(message = "Returning to Barangay Blue Ridge B") {
    const notification = document.getElementById('boundary-notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('visible');
        
        setTimeout(() => {
            notification.classList.remove('visible');
        }, 3000);
    }
}

function addBoundaryNotification() {
    const existing = document.getElementById('boundary-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'boundary-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 193, 7, 0.95);
        color: #333;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: "Inter", sans-serif;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 300px;
        text-align: center;
        border-left: 4px solid #ffc107;
        pointer-events: none;
    `;
    
    document.body.appendChild(notification);
    
    const style = document.createElement('style');
    style.textContent = `
        #boundary-notification.visible {
            transform: translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// ==================== MOBILE MENU FUNCTIONS ====================

function toggleMobileMenu() {
    const sideNav = document.querySelector('.side_nav');
    sideNav.classList.toggle('active');
    
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (!dateTimeElement) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
}

function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupMobileMenuClose() {
    document.addEventListener('click', function(e) {
        const sideNav = document.querySelector('.side_nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
        if (window.getComputedStyle(mobileMenuBtn).display !== 'none') {
            if (sideNav.classList.contains('active') && 
                !sideNav.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sideNav.classList.remove('active');
            }
        }
    });
}

// ==================== SPATIAL DECISION SUPPORT SYSTEM (SDSS) ====================

/**
 * Run SDSS check for a business application
 */
async function runBusinessSDSS(businessId) {
    try {
        const formData = new FormData();
        formData.append('action', 'sdss_evaluate_business');
        formData.append('business_id', businessId);
        
        Swal.fire({
            title: 'Running Spatial Analysis...',
            html: 'Checking school proximity, business density, and residential protection...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Evaluation failed');
        }
        
        const evaluation = data.evaluation;
        
        // Build HTML content
        let htmlContent = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🎯 Spatial Decision Support System
                    </h3>
                    <h4 style="margin: 0; font-size: 18px; opacity: 0.9;">
                        ${evaluation.business_name}
                    </h4>
                    <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
                        Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
                    </div>
                </div>
                
                <!-- Summary Card -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                        📊 Evaluation Summary
                    </h5>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #28a745;">${evaluation.summary.total_rules_checked}</div>
                            <div style="font-size: 12px; color: #666;">Rules Checked</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: ${evaluation.summary.critical_issues > 0 ? '#dc3545' : '#17a2b8'}">${evaluation.summary.rules_triggered}</div>
                            <div style="font-size: 12px; color: #666;">Rules Triggered</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${evaluation.summary.critical_issues}</div>
                            <div style="font-size: 12px; color: #666;">Critical Issues</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #ffc107;">${evaluation.summary.warnings}</div>
                            <div style="font-size: 12px; color: #666;">Warnings</div>
                        </div>
                    </div>
                    
                    <!-- Overall Status -->
                    <div style="text-align: center; padding: 15px; border-radius: 8px; margin-top: 15px; 
                                background: ${getStatusColor(evaluation.summary.overall_status, true)};
                                border: 2px solid ${getStatusColor(evaluation.summary.overall_status)};">
                        <h4 style="margin: 0; color: ${getStatusColor(evaluation.summary.overall_status)};">
                            ${getStatusIcon(evaluation.summary.overall_status)} 
                            ${evaluation.summary.overall_status.replace(/_/g, ' ')}
                        </h4>
                    </div>
                </div>
                
                <!-- Rules Results -->
        `;
        
        if (evaluation.rules.length === 0) {
            htmlContent += `
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h5 style="margin: 0; color: #155724;">
                        ✅ All Clear!
                    </h5>
                    <p style="margin: 10px 0 0 0; color: #155724;">
                        No spatial issues detected. This application meets all spatial planning requirements.
                    </p>
                </div>
            `;
        } else {
            htmlContent += `
                <div style="margin-bottom: 20px;">
                    <h5 style="color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                        📋 Detailed Findings
                    </h5>
            `;
            
            evaluation.rules.forEach(rule => {
                const severityColor = getSeverityColor(rule.severity);
                const severityBg = getSeverityColor(rule.severity, true);
                
                htmlContent += `
                    <div style="background: ${severityBg}; padding: 15px; border-radius: 8px; 
                                border-left: 4px solid ${severityColor}; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <h6 style="margin: 0 0 8px 0; color: ${severityColor};">
                                    ${getSeverityIcon(rule.severity)} ${rule.rule}
                                </h6>
                                <p style="margin: 0 0 8px 0; font-weight: 600; color: #333;">
                                    ${rule.message}
                                </p>
                                <p style="margin: 0 0 10px 0; color: #666;">
                                    <strong>Recommendation:</strong> ${rule.recommendation}
                                </p>
                                <p style="margin: 0; color: #666;">
                                    <strong>Action:</strong> <span style="color: ${severityColor}; font-weight: 600;">${rule.action.replace(/_/g, ' ')}</span>
                                </p>
                            </div>
                            <div style="margin-left: 15px; padding: 5px 10px; background: ${severityColor}; 
                                        color: white; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                ${rule.severity}
                            </div>
                        </div>
                        
                        <!-- Show details if available -->
                        ${rule.details || rule.flood_info ? `
                            <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px;">
                                <strong style="color: #666; font-size: 13px;">Details:</strong>
                                <div style="margin-top: 5px; font-size: 13px; color: #666;">
                                    ${rule.details ? 
                                        rule.details.map(item => `
                                            <div style="padding: 3px 0;">
                                                • ${item.name} (${item.distance}m)
                                            </div>
                                        `).join('') 
                                        : ''}
                                    ${rule.flood_info ? 
                                        `<div style="padding: 3px 0;">
                                            • ${rule.flood_info.hazard_name} - ${rule.flood_info.risk_level} risk
                                        </div>` 
                                        : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            htmlContent += `</div>`;
        }
        
        htmlContent += `
                <!-- Actions -->
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h6 style="margin: 0 0 10px 0; color: #333;">Next Steps:</h6>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="Swal.close();" 
                                style="flex: 1; padding: 10px; background: #6c757d; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            Close
                        </button>
                        <button onclick="downloadSDSSReport(${businessId}, 'business')" 
                                style="flex: 1; padding: 10px; background: #17a2b8; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            📄 Download Report
                        </button>
                        <button onclick="showOnMap(${businessId}, 'business')" 
                                style="flex: 1; padding: 10px; background: #28a745; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            🗺️ Show on Map
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: htmlContent,
            width: 850,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'sdss-modal'
            }
        });
        
    } catch (error) {
        console.error('SDSS Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'SDSS Evaluation Failed',
            text: error.message || 'An error occurred during spatial analysis.',
            confirmButtonText: 'OK'
        });
    }
}

/**
 * Run SDSS check for a construction application
 */
async function runConstructionSDSS(constructionId) {
    try {
        const formData = new FormData();
        formData.append('action', 'sdss_evaluate_construction');
        formData.append('construction_id', constructionId);
        
        Swal.fire({
            title: 'Checking Flood Risk...',
            html: 'Analyzing construction location against flood hazard areas...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Evaluation failed');
        }
        
        const evaluation = data.evaluation;
        
        let htmlContent = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #17a2b8 0%, #28a745 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🏗️ Construction Flood Risk Assessment
                    </h3>
                    <h4 style="margin: 0; font-size: 18px; opacity: 0.9;">
                        ${evaluation.address || 'Construction Site'}
                    </h4>
                    <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
                        Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
                    </div>
                </div>
        `;
        
        if (evaluation.rules.length === 0) {
            htmlContent += `
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h5 style="margin: 0; color: #155724;">
                        ✅ No Flood Risk Detected
                    </h5>
                    <p style="margin: 10px 0 0 0; color: #155724;">
                        This construction site is not located in any identified flood hazard areas.
                    </p>
                </div>
            `;
        } else {
            evaluation.rules.forEach(rule => {
                const severityColor = getSeverityColor(rule.severity);
                const severityBg = getSeverityColor(rule.severity, true);
                
                htmlContent += `
                    <div style="background: ${severityBg}; padding: 20px; border-radius: 8px; 
                                border-left: 4px solid ${severityColor}; margin-bottom: 20px;">
                        <h5 style="margin: 0 0 15px 0; color: ${severityColor};">
                            ${getSeverityIcon(rule.severity)} ${rule.rule}
                        </h5>
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">
                            ${rule.message}
                        </p>
                        <div style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                            <p style="margin: 0 0 8px 0; color: #666;">
                                <strong>Recommendation:</strong> ${rule.recommendation}
                            </p>
                            <p style="margin: 0; color: #666;">
                                <strong>Action Required:</strong> <span style="color: ${severityColor}; font-weight: 600;">${rule.action.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                        
                        ${rule.flood_info ? `
                            <div style="padding: 10px; background: #f8f9fa; border-radius: 5px; margin-top: 10px;">
                                <h6 style="margin: 0 0 8px 0; color: #666;">Flood Hazard Details:</h6>
                                <div style="font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span style="color: #666;">Name:</span>
                                        <span style="font-weight: 600;">${rule.flood_info.hazard_name}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span style="color: #666;">Risk Level:</span>
                                        <span style="color: ${severityColor}; font-weight: 600;">${rule.flood_info.risk_level.toUpperCase()}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">Description:</span>
                                        <span style="text-align: right;">${rule.flood_info.description || 'No description'}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        htmlContent += `
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h6 style="margin: 0 0 10px 0; color: #333;">Assessment Result:</h6>
                    <div style="padding: 12px; background: white; border-radius: 6px; border-left: 4px solid ${getStatusColor(evaluation.summary.overall_status)};">
                        <h5 style="margin: 0; color: ${getStatusColor(evaluation.summary.overall_status)};">
                            ${getStatusIcon(evaluation.summary.overall_status)} 
                            ${evaluation.summary.overall_status.replace(/_/g, ' ')}
                        </h5>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="Swal.close();" 
                                style="flex: 1; padding: 10px; background: #6c757d; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            Close
                        </button>
                        <button onclick="downloadSDSSReport(${constructionId}, 'construction')" 
                                style="flex: 1; padding: 10px; background: #17a2b8; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            📄 Download Report
                        </button>
                        <button onclick="showOnMap(${constructionId}, 'construction')" 
                                style="flex: 1; padding: 10px; background: #28a745; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            🗺️ Show on Map
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: htmlContent,
            width: 850,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'sdss-modal'
            }
        });
        
    } catch (error) {
        console.error('SDSS Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'SDSS Evaluation Failed',
            text: error.message || 'An error occurred during flood risk analysis.',
            confirmButtonText: 'OK'
        });
    }
}

/**
 * Helper: Get status color
 */
function getStatusColor(status, light = false) {
    const colors = {
        'APPROVE': light ? '#d4edda' : '#28a745',
        'APPROVE_WITH_CONDITIONS': light ? '#fff3cd' : '#ffc107',
        'DENY_OR_RELOCATE': light ? '#f8d7da' : '#dc3545',
        'REQUIRE_MITIGATION': light ? '#f8d7da' : '#dc3545'
    };
    return colors[status] || (light ? '#e9ecef' : '#6c757d');
}

/**
 * Helper: Get status icon
 */
function getStatusIcon(status) {
    const icons = {
        'APPROVE': '✅',
        'APPROVE_WITH_CONDITIONS': '⚠️',
        'DENY_OR_RELOCATE': '🚫',
        'REQUIRE_MITIGATION': '⚠️'
    };
    return icons[status] || '📋';
}

/**
 * Helper: Get severity color
 */
function getSeverityColor(severity, light = false) {
    const colors = {
        'CRITICAL': light ? '#f8d7da' : '#dc3545',
        'WARNING': light ? '#fff3cd' : '#ffc107',
        'INFO': light ? '#d1ecf1' : '#17a2b8'
    };
    return colors[severity] || (light ? '#e9ecef' : '#6c757d');
}

/**
 * Helper: Get severity icon
 */
function getSeverityIcon(severity) {
    const icons = {
        'CRITICAL': '🚫',
        'WARNING': '⚠️',
        'INFO': 'ℹ️'
    };
    return icons[severity] || '📋';
}

/**
 * Download SDSS report as PDF
 */
function downloadSDSSReport(id, type) {
    Swal.fire({
        icon: 'info',
        title: 'Report Generation',
        text: 'PDF report feature coming soon!',
        confirmButtonText: 'OK'
    });
}

/**
 * Show location on map
 */
function showOnMap(id, type) {
    Swal.close();
    
    // Get location from appropriate table
    const formData = new FormData();
    formData.append('action', type === 'business' ? 'get_business_details' : 'get_construction_details');
    formData.append('id', id);
    
    fetch(MAP_HANDLER_URL, {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const item = data.data;
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            
            // Fly to location
            map.flyTo([lat, lng], 18, { duration: 1.5 });
            
            // Show marker
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'sdss-marker',
                    html: `<div style="
                        width: 30px; height: 30px; background: #ffc107; 
                        border-radius: 50%; border: 3px solid white; 
                        box-shadow: 0 0 20px rgba(255, 193, 7, 0.8);
                        animation: pulse 2s infinite;
                    "></div>`,
                    iconSize: [30, 30]
                })
            }).addTo(map);
            
            marker.bindPopup(`
                <div style="padding: 10px;">
                    <strong>${type === 'business' ? item.business_name : item.construction_address}</strong><br>
                    <small>${type === 'business' ? 'Business' : 'Construction'}</small><br>
                    <small>Click to close</small>
                </div>
            `).openPopup();
            
            // Remove after 15 seconds
            setTimeout(() => {
                if (map.hasLayer(marker)) {
                    map.removeLayer(marker);
                }
            }, 15000);
        }
    });
}

/**
 * Test SDSS functions
 */
function testSDSS() {
    Swal.fire({
        title: 'Test SDSS Functions',
        html: `
            <div style="text-align: left;">
                <p>Select a test to run:</p>
                <select id="testType" class="swal2-input" style="margin-bottom: 10px;">
                    <option value="business">Business Application</option>
                    <option value="construction">Construction Permit</option>
                </select>
                <input id="testId" class="swal2-input" placeholder="Enter ID to test">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Run Test',
        preConfirm: () => {
            const type = document.getElementById('testType').value;
            const id = document.getElementById('testId').value;
            
            if (!id) {
                Swal.showValidationMessage('Please enter an ID');
                return false;
            }
            
            if (type === 'business') {
                runBusinessSDSS(parseInt(id));
            } else {
                runConstructionSDSS(parseInt(id));
            }
        }
    });
}

// ==================== UPDATED FUNCTIONS FOR NEW API STRUCTURE ====================

// Update the viewMapDetails function to use new API structure
async function viewMapDetails(id, type) {
    try {
        const formData = new FormData();
        
        // Map type to new action names
        const actionMap = {
            'construction': 'get_construction_details',
            'business': 'get_business_details',
            'utility': 'get_utilities_details',
            'household': 'get_household_details'
        };
        
        formData.append('action', actionMap[type]);
        formData.append('id', id);

        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayDetailsInModal(data.data, type);
        }
    } catch (error) {
        console.error('Error loading details:', error);
    }
}

// Add a test function to verify the new flood detection works
async function testFixedFloodDetection() {
    console.log("=== TESTING FIXED FLOOD DETECTION ===");
    
    try {
        // Test 1: Get houses in flood with coverage percentages
        const housesResponse = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_houses_in_flood'
        });
        
        const housesData = await housesResponse.json();
        
        if (housesData.success && housesData.houses.length > 0) {
            console.log(`✅ Found ${housesData.houses.length} houses in flood areas`);
            
            // Check if we have different coverage percentages (not all 100%)
            const differentCoverages = housesData.houses.some(house => {
                const coverage = house.flood_coverage_percent;
                return coverage !== 100 && coverage !== null && coverage !== undefined;
            });
            
            if (differentCoverages) {
                console.log("✅ SUCCESS: Flood detection is working with precise coverage percentages!");
                console.log("Coverage percentages found:", housesData.houses.map(h => h.flood_coverage_percent));
            } else {
                console.log("⚠️ WARNING: All houses show 100% coverage. The fix may not be working.");
            }
            
            // Test 2: Get flood summary
            const summaryResponse = await fetch(MAP_HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=get_flood_houses_summary'
            });
            
            const summaryData = await summaryResponse.json();
            
            if (summaryData.success) {
                console.log("✅ Flood summary loaded successfully");
                console.log("Summary:", summaryData.summary);
            }
        } else {
            console.log("ℹ️ No houses found in flood areas (this might be expected)");
        }
        
    } catch (error) {
        console.error("❌ Error testing flood detection:", error);
    }
}

// Add this function to your debug buttons section
function testFixedFloodDetectionButton() {
    Swal.fire({
        title: 'Testing Fixed Flood Detection',
        html: 'Running the improved flood detection system...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    testFixedFloodDetection().then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Test Complete',
            html: 'Check browser console for results.<br><br>The fixed system should show:<br>• Different coverage percentages (not all 100%)<br>• Houses classified as Fully/Partially/Minimally Affected<br>• Accurate counts in summary',
            confirmButtonText: 'OK'
        });
    });
}