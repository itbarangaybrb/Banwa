const MAP_HANDLER_URL = '/Banwa/server/handlers/map/map_handler.php';

// Map variables
const map = L.map('map').setView([14.6175, 121.0756], 17);
let constructionMarkers = [];
let businessMarkers = [];
let householdMarkers = []; // Will not be used anymore - keeping for compatibility
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

// Helper function to check if control is on map (Leaflet doesn't have hasControl)
function hasControl(control) {
    if (!control || !control._map) return false;
    return control._map === map;
}

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

// ==================== HAZARD LAYER TOGGLES ====================

// Toggle flood layer
function toggleFloodLayer() {
    floodLayerActive = !floodLayerActive;
    
    // Update button style
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
        // Show flood layer
        if (!floodLayer) {
            loadFloodData();
        } else {
            // Check if already on map
            if (!map.hasLayer(floodLayer)) {
                floodLayer.addTo(map);
            }
        }
        
        // Show flood legend
        if (floodLegend && !hasControl(floodLegend)) {
            floodLegend.addTo(map);
        }
    } else {
        // Hide flood layer
        if (floodLayer && map.hasLayer(floodLayer)) {
            map.removeLayer(floodLayer);
        }
        
        // Hide flood legend
        removeFloodLegend();
    }
}

// Improved function to remove flood legend
function removeFloodLegend() {
    if (floodLegend) {
        try {
            // Try to remove the control from map
            if (hasControl(floodLegend)) {
                map.removeControl(floodLegend);
            }
        } catch (e) {
            console.log('Error removing flood legend via map.removeControl:', e);
            // Alternative method: remove by DOM element
            const legendElement = document.querySelector('.flood-legend');
            if (legendElement && legendElement.parentNode) {
                legendElement.parentNode.removeChild(legendElement);
            }
        }
        // Don't set floodLegend to null here - keep the object for reuse
    }
}

// Toggle fault line
function toggleFaultLine() {
    faultLineActive = !faultLineActive;
    
    // Update button style
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
        // Show fault line
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    } else {
        // Hide fault line
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
    // Broadcast filter state for application management pages
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
    // Note: householdMarkers array is kept empty - only house polygons are used
    
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
            marker.risk_level || '',
            marker.address || '',
            marker.house_number || '',
            marker.street_name || ''
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
                
                const type = marker.marker_type || marker.type ||
                            (marker.construction_id ? 'construction' : 
                             marker.id ? 'business' : 
                             marker.utility_id ? 'utility' : 
                             marker.hazard_id ? 'flood' :
                             marker.house_id ? 'household' : 'household');
                
                const title = marker.title || 
                             marker.business_name || 
                             marker.homeowner_name || 
                             marker.applicant_name ||
                             marker.hazard_name ||
                             marker.address ||
                             (marker.house_number ? `House #${marker.house_number}` : 'Unnamed Marker');
                
                const subtitle = marker.description || 
                               marker.address_of_construction || 
                               marker.address_of_business || 
                               marker.applicant_address ||
                               marker.location || 
                               marker.street_name ||
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
    
    const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
    
    // Restore visibility based on current states
    updateAllVisibility();
    
    // Restore flood layer if active
    if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
        floodLayer.addTo(map);
        // Also add legend
        if (floodLegend && !hasControl(floodLegend)) {
            floodLegend.addTo(map);
        }
    }
    
    // Restore fault line if active
    if (faultLineActive) {
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    }
    
    // Restore house polygons if needed
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
    
    utilityMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    if (floodLayer && map.hasLayer(floodLayer)) {
        map.removeLayer(floodLayer);
    }
    
    // Remove flood legend if it exists
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
    
    const type = markerData.marker_type || markerData.type ||
                (markerData.construction_id ? 'construction' : 
                 markerData.id ? 'business' : 
                 markerData.utility_id ? 'utility' : 
                 markerData.hazard_id ? 'flood' :
                 markerData.house_id ? 'household' : 'household');
    
    if (type === 'flood') {
        showFloodAreaHighlight(markerData);
        return;
    }
    
    // For house polygons, show the polygon instead of a marker
    if (type === 'household' && markerData.coordinates) {
        showHousePolygonHighlight(markerData);
        return;
    }
    
    const lat = parseFloat(markerData.latitude || markerData.center_lat);
    const lng = parseFloat(markerData.longitude || markerData.center_lng);
    
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
        popupContent = createHousePopup(markerData);
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

function showHousePolygonHighlight(houseData) {
    try {
        const coords = JSON.parse(houseData.coordinates);
        const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
        latLngCoords.push(latLngCoords[0]);
        
        activeSearchMarker = L.polygon(latLngCoords, {
            color: '#ffeb3b',
            weight: 4,
            fillColor: '#ffeb3b',
            fillOpacity: 0.3,
            interactive: true
        }).addTo(map);
        
        const bounds = activeSearchMarker.getBounds();
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 18
        });
        
        const popupContent = createHousePopup(houseData);
        activeSearchMarker.bindPopup(popupContent).openPopup();
        
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.remove('active');
            const resultIndex = searchResults.findIndex(result => result.marker.house_id == houseData.house_id);
            if (parseInt(item.dataset.index) === resultIndex) {
                item.classList.add('active');
            }
        });
        
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    } catch (e) {
        console.error('Error highlighting house polygon:', e);
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
            
            if (hazard.geometry) {
                const geoJson = JSON.parse(hazard.geometry);
                
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
    return `
        <div class="popup-content">
            <h4>
                <span>Construction Site</span>
                <span class="construction-badge">Construction</span>
            </h4>
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
    return `
        <div class="popup-content">
            <h4>
                <span>${data.business_name || 'Business'}</span>
                <span class="business-badge">Business</span>
            </h4>
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
    return `
        <div class="popup-content">
            <h4>
                <span>Utility Work</span>
                <span class="utility-badge">Utility</span>
            </h4>
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

function createFloodPopup(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    const riskClass = `flood-risk-${data.risk_level || 'medium'}`;
    
    // Parse properties JSON if it exists
    let properties = {};
    try {
        properties = data.properties ? JSON.parse(data.properties) : {};
    } catch (e) {
        console.warn('Could not parse flood properties:', e);
    }
    
    return `
        <div class="popup-content">
            <h4>
                <span>${data.hazard_name || 'Flood Hazard Area'}</span>
                <span class="flood-risk-badge" style="background: ${riskColor}; color: white;">${(data.risk_level || 'medium').toUpperCase()} RISK</span>
            </h4>
            <div class="popup-section flood-popup-section">
                <p><strong>Risk Level:</strong> <span class="${riskClass}">${(data.risk_level || 'medium').toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${data.description || 'Flood-prone area'}</p>
                <p><strong>Last Flood:</strong> ${formatDate(properties.last_flood_date) || 'Not recorded'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Safety Advice:</strong> ${getFloodSafetyAdvice(data.risk_level)}</p>
                <p><strong>Reported By:</strong> ${properties.reported_by || 'Barangay Office'}</p>
                <p><strong>Identified:</strong> ${formatDate(properties.date_identified)}</p>
            </div>
            <button class="view-details-btn" onclick="viewFloodDetails(${data.hazard_id})">
                View Flood Details
            </button>
        </div>
    `;
}

function createHousePopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>${data.house_number ? 'House #' + data.house_number : 'House'}</span>
                <span class="household-badge">Household</span>
            </h4>
            <div class="popup-section">
                <p><strong>Address:</strong> ${data.address || 'Not specified'}</p>
                <p><strong>Street:</strong> ${data.street_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Area:</strong> ${data.area_sqm || '0'} sqm</p>
                <p><strong>Last Updated:</strong> ${formatDate(data.updated_at)}</p>
            </div>
            <button class="view-details-btn" onclick="viewHouseDetails(${data.house_id})">
                View Full Details
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
    return `
        <table class="detail-table">
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
    return `
        <table class="detail-table">
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
    return `
        <table class="detail-table">
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
    return `
        <table class="detail-table">
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
    
    // Parse properties JSON if it exists
    let properties = {};
    try {
        properties = data.properties ? JSON.parse(data.properties) : {};
    } catch (e) {
        console.warn('Could not parse flood properties:', e);
    }
    
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
                <td>${formatDate(properties.last_flood_date) || 'Not recorded'}</td>
            </tr>
            <tr>
                <td>Reported By</td>
                <td>${properties.reported_by || 'Barangay Office'}</td>
            </tr>
            <tr>
                <td>Date Identified</td>
                <td>${formatDate(properties.date_identified)}</td>
            </tr>
            <tr>
                <td>Safety Advice</td>
                <td>${getFloodSafetyAdvice(data.risk_level)}</td>
            </tr>
            <tr>
                <td>Last Updated</td>
                <td>${formatDate(data.updated_at)}</td>
            </tr>
        </table>
    `;
}

function createHouseModalContent(data) {
    // Parse coordinates to display polygon info
    let coordinateInfo = 'Not available';
    if (data.coordinates) {
        try {
            const coords = JSON.parse(data.coordinates);
            coordinateInfo = `${coords.length} vertices`;
        } catch (e) {
            coordinateInfo = 'Invalid coordinate data';
        }
    }
    
    return `
        <table class="detail-table">
            <tr>
                <td>House Number</td>
                <td>${data.house_number || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Address</td>
                <td>${data.address || 'Not specified'}</td>
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
                <td>Latitude: ${data.center_lat || 'N/A'}, Longitude: ${data.center_lng || 'N/A'}</td>
            </tr>
            <tr>
                <td>Polygon Data</td>
                <td>${coordinateInfo}</td>
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

function getFloodSafetyAdvice(riskLevel) {
    const advice = {
        'high': 'High flood risk. Consider elevation, flood barriers, and evacuation plan.',
        'medium': 'Moderate flood risk. Install check valves and keep drains clear.',
        'low': 'Low flood risk. Monitor weather alerts and prepare emergency kit.',
        'very-low': 'Minimal flood risk. Stay informed during heavy rainfall.'
    };
    
    return advice[riskLevel] || 'Take necessary precautions during heavy rainfall.';
}

function getFloodRiskColor(riskLevel) {
    const colors = {
        'high': '#ff0000',
        'medium': '#ff9900',
        'low': '#ffff00',
        'very-low': '#0066cc'
    };
    return colors[riskLevel] || '#666666';
}

// ==================== DATA LOADING FUNCTIONS ====================

async function loadAllMarkers() {
    clearAllMarkers();
    
    try {
        const formData = new FormData();
        formData.append('action', 'get_all_markers');
        
        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Server returned error: ' + (data.message || 'Unknown error'));
        }

        // Get flood data for search
        const floodFormData = new FormData();
        floodFormData.append('action', 'get_flood_hazards');
        
        const floodResponse = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: floodFormData
        });
        
        const floodData = await floodResponse.json();
        
        // Build allMarkersData for search - include houses from house polygons
        allMarkersData = [
            ...(data.markers || []).filter(m => m.type === 'construction'),
            ...(data.markers || []).filter(m => m.type === 'business'),
            ...(data.markers || []).filter(m => m.type === 'utility'),
            ...(floodData.success ? (floodData.hazards || []).map(f => ({...f, type: 'flood'})) : [])
        ];

        // Process markers by type
        const constructionMarkersList = (data.markers || []).filter(m => m.type === 'construction');
        const businessMarkersList = (data.markers || []).filter(m => m.type === 'business');
        const utilityMarkersList = (data.markers || []).filter(m => m.type === 'utility');

        // Load construction markers
        constructionMarkersList.forEach(construction => {
            if (construction.latitude && construction.longitude) {
                try {
                    const lat = parseFloat(construction.latitude);
                    const lng = parseFloat(construction.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createConstructionPopup(construction);
                        const marker = L.marker([lat, lng], { 
                            icon: constructionIcon,
                            title: construction.name || 'Construction Site'
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

        // Load business markers
        businessMarkersList.forEach(business => {
            if (business.latitude && business.longitude) {
                try {
                    const lat = parseFloat(business.latitude);
                    const lng = parseFloat(business.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createBusinessPopup(business);
                        const marker = L.marker([lat, lng], { 
                            icon: businessIcon,
                            title: business.name || 'Business'
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

        // Load utility markers
        utilityMarkersList.forEach(utility => {
            if (utility.latitude && utility.longitude) {
                try {
                    const lat = parseFloat(utility.latitude);
                    const lng = parseFloat(utility.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createUtilityPopup(utility);
                        const marker = L.marker([lat, lng], { 
                            icon: utilityIcon,
                            title: utility.name || 'Utility Work'
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

        // Load flood layer if active
        if (floodLayerActive) {
            loadFloodData();
        }

        // Load house polygons (not markers)
        loadHousePolygons();

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Please check browser console for details.');
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
        
        if (data.success && data.hazards) {
            renderFloodAreas(data.hazards);
            addFloodLegend();
            
            // Add to map if flood layer is active
            if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
                floodLayer.addTo(map);
            }
            
            // Ensure legend is also added if active
            if (floodLayerActive && floodLegend && !hasControl(floodLegend)) {
                floodLegend.addTo(map);
            }
        } else {
            console.warn('No flood data found:', data.message);
            floodLayer = L.layerGroup();
            floodLegend = null;
        }
    } catch (error) {
        console.error('ERROR LOADING FLOOD DATA:', error);
        floodLayer = L.layerGroup();
        floodLegend = null;
    }
}

function renderFloodAreas(hazards) {
    // Clear existing flood layer
    if (floodLayer) {
        map.removeLayer(floodLayer);
    }
    
    // Create new layer group
    floodLayer = L.layerGroup();
    
    hazards.forEach(hazard => {
        try {
            if (!hazard.geometry) {
                console.warn('Flood hazard missing geometry:', hazard.hazard_id);
                return;
            }
            
            const geoJson = JSON.parse(hazard.geometry);
            const style = getFloodAreaStyle(hazard.risk_level);
            
            const layer = L.geoJSON(geoJson, {
                style: style,
                onEachFeature: function(feature, layer) {
                    const popupContent = createFloodPopup(hazard);
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
                    
                    layer.hazardData = hazard;
                }
            });
            
            layer.addTo(floodLayer);
            
        } catch (e) {
            console.error('Error rendering flood hazard:', e, hazard);
        }
    });
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

function addFloodLegend() {
    // Remove existing legend if any
    if (floodLegend) {
        removeFloodLegend();
    }
    
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
    
    // Only add to map if flood layer is active
    if (floodLayerActive) {
        floodLegend.addTo(map);
    }
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
            
            // Add houses to allMarkersData for search
            const housesForSearch = data.houses.map(house => ({
                ...house,
                type: 'household'
            }));
            allMarkersData = [...allMarkersData, ...housesForSearch];
            
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
    utilityMarkers.forEach(marker => map.removeLayer(marker));
    
    if (floodLayer) {
        map.removeLayer(floodLayer);
    }
    
    // Remove flood legend if it exists
    removeFloodLegend();
    
    if (faultLine && map.hasLayer(faultLine)) {
        map.removeLayer(faultLine);
    }
    if (warningMarker && map.hasLayer(warningMarker)) {
        map.removeLayer(warningMarker);
    }
    
    constructionMarkers = [];
    businessMarkers = [];
    utilityMarkers = [];
    floodLayer = null;
    floodLegend = null;
}

// ==================== FLOOD ASSESSMENT FUNCTION ====================

/**
 * Get summary of flood-affected houses
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
        
        if (data.success && data.summary) {
            return data.summary;
        } else {
            console.error('Error getting flood summary:', data.message);
            return { 
                total: 0,
                affected_houses: [],
                by_risk: {}
            };
        }
    } catch (error) {
        console.error('Error fetching flood summary:', error);
        return { 
            total: 0,
            affected_houses: [],
            by_risk: {}
        };
    }
}

// ==================== FAULT LINE RISK ASSESSMENT FUNCTION ====================

// ==================== FAULT LINE RISK ASSESSMENT FUNCTION ====================

async function showFaultLineRiskAssessment() {
    Swal.fire({
        title: 'Analyzing Fault Line Risk...',
        html: 'Checking houses near fault line...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        // Check if fault line is loaded
        if (!faultLine) {
            Swal.fire({
                icon: 'warning',
                title: 'Fault Line Not Found',
                text: 'Please enable the fault line layer first.',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Get all houses
        if (housePolygonsData.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Houses Found',
                text: 'No house data available for analysis.',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Calculate distance from fault line for each house
        const housesNearFaultLine = [];
        const criticalDistance = 50; // meters
        const highRiskDistance = 100; // meters
        const mediumRiskDistance = 200; // meters
        
        housePolygonsData.forEach(house => {
            if (house.coordinates) {
                try {
                    let coords;
                    if (typeof house.coordinates === 'string') {
                        coords = JSON.parse(house.coordinates);
                    } else {
                        coords = house.coordinates;
                    }
                    
                    // Get center point of house polygon
                    const polygon = L.polygon(coords);
                    const center = polygon.getBounds().getCenter();
                    
                    // Calculate minimum distance to fault line
                    let minDistance = Infinity;
                    const faultCoords = faultLine.getLatLngs();
                    
                    faultCoords.forEach(faultPoint => {
                        const distance = map.distance(center, faultPoint);
                        if (distance < minDistance) {
                            minDistance = distance;
                        }
                    });
                    
                    // Determine risk level
                    let riskLevel = 'safe';
                    let riskLabel = 'Safe';
                    let riskColor = '#28a745';
                    
                    if (minDistance < criticalDistance) {
                        riskLevel = 'critical';
                        riskLabel = 'CRITICAL';
                        riskColor = '#8B0000';
                    } else if (minDistance < highRiskDistance) {
                        riskLevel = 'high';
                        riskLabel = 'HIGH RISK';
                        riskColor = '#dc3545';
                    } else if (minDistance < mediumRiskDistance) {
                        riskLevel = 'medium';
                        riskLabel = 'MEDIUM RISK';
                        riskColor = '#ffc107';
                    }
                    
                    if (riskLevel !== 'safe') {
                        housesNearFaultLine.push({
                            ...house,
                            distance: Math.round(minDistance),
                            riskLevel: riskLevel,
                            riskLabel: riskLabel,
                            riskColor: riskColor
                        });
                    }
                } catch (e) {
                    console.error('Error calculating fault line distance for house:', house.house_id, e);
                }
            }
        });
        
        // Sort by distance (closest first)
        housesNearFaultLine.sort((a, b) => a.distance - b.distance);
        
        // Build report HTML
        const critical = housesNearFaultLine.filter(h => h.riskLevel === 'critical');
        const high = housesNearFaultLine.filter(h => h.riskLevel === 'high');
        const medium = housesNearFaultLine.filter(h => h.riskLevel === 'medium');
        
        if (housesNearFaultLine.length === 0) {
            Swal.fire({
                icon: 'success',
                title: 'All Houses Safe',
                html: `
                    <div style="text-align: left; padding: 20px;">
                        <p style="color: #28a745; font-size: 16px; margin-bottom: 15px;">
                            ✓ Great news! No houses are located near the fault line.
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <strong>All houses are at safe distances from seismic hazard zones.</strong>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            });
            return;
        }
        
        let reportHTML = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #dc3545 0%, #8B0000 100%); 
                            color: white; padding: 25px; border-radius: 12px; 
                            margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🌍 Fault Line Risk Assessment
                    </h3>
                    <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                        ${housesNearFaultLine.length}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                        ${housesNearFaultLine.length === 1 ? 'House' : 'Houses'} Near Fault Line
                    </div>
                    
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${critical.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Critical<br/>(<50m)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${high.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">High Risk<br/>(50-100m)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${medium.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Medium Risk<br/>(100-200m)</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
        `;
        
        // Critical risk houses
        if (critical.length > 0) {
            reportHTML += `
                <div style="margin-bottom: 25px;">
                    <h4 style="background: #8B0000; color: white; padding: 12px; border-radius: 6px; margin: 0 0 15px 0;">
                        🚨 CRITICAL - Within 50 meters (${critical.length} ${critical.length === 1 ? 'house' : 'houses'})
                    </h4>
            `;
            
            critical.forEach(house => {
                reportHTML += `
                    <div style="border-left: 4px solid #8B0000; background: #ffebee; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 16px;">${house.address || 'House #' + house.house_number}</strong>
                            <span style="background: #8B0000; color: white; padding: 4px 12px; border-radius: 3px; font-size: 12px; font-weight: bold;">
                                ${house.distance}m away
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                            <div>📍 <strong>Street:</strong> ${house.street_name || 'Not specified'}</div>
                            <div>📏 <strong>Area:</strong> ${house.area_sqm || 'N/A'} sqm</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 4px; margin-top: 10px;">
                            <div style="color: #8B0000; font-weight: bold; margin-bottom: 8px;">⚠️ IMMEDIATE ACTIONS REQUIRED:</div>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #333;">
                                <li>Structural assessment by licensed engineer REQUIRED</li>
                                <li>Seismic retrofitting may be necessary</li>
                                <li>Prepare earthquake emergency plan</li>
                                <li>Keep emergency supplies ready</li>
                                <li>Know evacuation routes</li>
                            </ul>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `</div>`;
        }
        
        // High risk houses
        if (high.length > 0) {
            reportHTML += `
                <div style="margin-bottom: 25px;">
                    <h4 style="background: #dc3545; color: white; padding: 12px; border-radius: 6px; margin: 0 0 15px 0;">
                        ⚠️ HIGH RISK - 50-100 meters (${high.length} ${high.length === 1 ? 'house' : 'houses'})
                    </h4>
            `;
            
            high.forEach(house => {
                reportHTML += `
                    <div style="border-left: 4px solid #dc3545; background: #fff5f5; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 16px;">${house.address || 'House #' + house.house_number}</strong>
                            <span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 3px; font-size: 12px; font-weight: bold;">
                                ${house.distance}m away
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                            <div>📍 <strong>Street:</strong> ${house.street_name || 'Not specified'}</div>
                            <div>📏 <strong>Area:</strong> ${house.area_sqm || 'N/A'} sqm</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 4px; margin-top: 10px;">
                            <div style="color: #dc3545; font-weight: bold; margin-bottom: 8px;">⚠️ RECOMMENDED ACTIONS:</div>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #333;">
                                <li>Consider seismic assessment for peace of mind</li>
                                <li>Ensure foundation is earthquake-resistant</li>
                                <li>Secure heavy furniture and appliances</li>
                                <li>Develop family earthquake response plan</li>
                                <li>Maintain emergency kit</li>
                            </ul>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `</div>`;
        }
        
        // Medium risk houses
        if (medium.length > 0) {
            reportHTML += `
                <div style="margin-bottom: 25px;">
                    <h4 style="background: #ffc107; color: #333; padding: 12px; border-radius: 6px; margin: 0 0 15px 0;">
                        ⚡ MEDIUM RISK - 100-200 meters (${medium.length} ${medium.length === 1 ? 'house' : 'houses'})
                    </h4>
            `;
            
            medium.forEach(house => {
                reportHTML += `
                    <div style="border-left: 4px solid #ffc107; background: #fffbeb; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 16px;">${house.address || 'House #' + house.house_number}</strong>
                            <span style="background: #ffc107; color: #333; padding: 4px 12px; border-radius: 3px; font-size: 12px; font-weight: bold;">
                                ${house.distance}m away
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                            <div>📍 <strong>Street:</strong> ${house.street_name || 'Not specified'}</div>
                            <div>📏 <strong>Area:</strong> ${house.area_sqm || 'N/A'} sqm</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 4px; margin-top: 10px;">
                            <div style="color: #f57f17; font-weight: bold; margin-bottom: 8px;">💡 PRECAUTIONARY MEASURES:</div>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #333;">
                                <li>Stay informed about earthquake safety</li>
                                <li>Practice earthquake drills with family</li>
                                <li>Know where to take cover during shaking</li>
                                <li>Keep basic emergency supplies</li>
                            </ul>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `</div>`;
        }
        
        reportHTML += `
                </div>
                
                <div style="background: #f8f9fa; 
                            padding: 20px; 
                            border-radius: 10px; 
                            text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        For structural assessment and emergency preparedness:
                    </p>
                    <div style="font-weight: bold; color: #333; font-size: 16px;">
                        Barangay Blue Ridge B Engineering Office
                    </div>
                    <div style="margin-top: 15px;">
                        <button onclick="Swal.close();" 
                                style="padding: 10px 30px; background: #667eea; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: reportHTML,
            width: 900,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('Error in showFaultLineRiskAssessment:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Fault Line Assessment',
            html: `
                <p>Failed to load fault line risk data.</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    ${error.message || 'Please try again later.'}
                </p>
            `,
            confirmButtonText: 'OK'
        });
    }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
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
    // Add barangay boundary polygon
    const barangayBoundary = L.geoJSON(blueRidgeGeoJSON, {
        style: {
            color: '#00247C',
            weight: 3,
            fillColor: '#667eea',
            fillOpacity: 0.1,
            dashArray: '5, 5'
        }
    }).addTo(map);
    
    // ============= ADD FAULT LINE (CORRECTED COORDINATES) =============
    const faultLineCoordinates = [
        [14.6175408, 121.0765329],
        [14.6177993, 121.0765362],
        [14.6180432, 121.0765517],
        [14.6182482, 121.0765671],
        [14.6185088, 121.0765914],
        [14.6188121, 121.0766554],
        [14.6190770, 121.0767448]
    ];
    
    // Create fault line with correct coordinates
    faultLine = L.polyline(faultLineCoordinates, {
        color: '#ff0000',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
    });
    
    faultLine.bindPopup(`
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
    
    faultLine.on('mouseover', function() {
        this.setStyle({
            weight: 6,
            opacity: 1,
            color: '#ff4444'
        });
    });
    
    faultLine.on('mouseout', function() {
        this.setStyle({
            weight: 4,
            opacity: 0.8,
            color: '#ff0000'
        });
    });
    
    // Create warning marker at the midpoint of the fault line
    const midIndex = Math.floor(faultLineCoordinates.length / 2);
    const warningPoint = faultLineCoordinates[midIndex];
    
    const warningIcon = L.divIcon({
        className: 'fault-warning-marker',
        html: `<div style="
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
                background: rgba(255, 0, 0, 0.3);
                border-radius: 50%;
                animation: pulse-fault 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 5px;
                left: 5px;
                width: 20px;
                height: 20px;
                background: rgba(255, 0, 0, 0.9);
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-exclamation" style="color: white; font-size: 10px;"></i>
            </div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    // Add CSS animation for fault line warning marker
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-fault {
            0% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.4;
            }
            100% {
                transform: scale(1);
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(style);
    
    warningMarker = L.marker(warningPoint, {
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
    
    // Set up soft boundary
    setupSoftBoundary();
    
    // Load all data
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

// ==================== DEBUG FUNCTION ====================

function debugFloodState() {
    console.log('Flood Layer Active:', floodLayerActive);
    console.log('Flood Layer exists:', !!floodLayer);
    console.log('Flood Layer on map:', floodLayer ? map.hasLayer(floodLayer) : false);
    console.log('Flood Legend exists:', !!floodLegend);
    console.log('Flood Legend on map:', floodLegend ? hasControl(floodLegend) : false);
    
    // Check DOM for legend
    const legendElement = document.querySelector('.flood-legend');
    console.log('Flood Legend in DOM:', !!legendElement);
}

// ==================== SDSS (Spatial Decision Support System) FUNCTIONS ====================

/**
 * Test SDSS functionality
 */
async function testSDSS() {
    console.log('Testing SDSS...');
    
    const businessCount = allMarkersData.filter(m => m.type === 'business').length;
    const constructionCount = allMarkersData.filter(m => m.type === 'construction').length;
    const utilityCount = allMarkersData.filter(m => m.type === 'utility').length;
    const houseCount = housePolygonsData.length;
    
    Swal.fire({
        title: 'SDSS System Test',
        html: `
            <div style="text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">Spatial Decision Support System</h4>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">Rule-Based Compliance Monitoring</p>
                </div>
                
                <h4 style="color: #333; margin-top: 20px;">📊 System Status</h4>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;">✅ Map initialized successfully</p>
                    <p style="margin: 5px 0;">✅ Spatial layers loaded: ${floodLayer ? 'Flood zones' : 'No flood data'}, ${faultLine ? 'Fault line' : 'No fault line'}</p>
                    <p style="margin: 5px 0;">✅ Data loaded: ${businessCount} businesses, ${constructionCount} construction sites, ${utilityCount} utilities, ${houseCount} houses</p>
                </div>
                
                <h4 style="color: #333; margin-top: 20px;">⚖️ Active SDSS Rules</h4>
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #856404;">
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #856404;">Flood Risk Rules (1.x)</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.9em;">
                            <li><strong>Rule 1.2:</strong> Businesses in flood zones require mitigation</li>
                            <li><strong>Rule 1.3:</strong> High flood zone construction requires special design</li>
                            <li><strong>Rule 1.4:</strong> Flood mitigation recommended for medium/low zones</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #856404;">Fault Line Rules (2.x)</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.9em;">
                            <li><strong>Rule 2.1:</strong> Seismic certification required within 100m</li>
                            <li><strong>Rule 2.2:</strong> Construction prohibited within 50m (Critical)</li>
                            <li><strong>Rule 2.3:</strong> Seismic design mandatory within 100m</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #856404;">Occupancy Rules (3.x)</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.9em;">
                            <li><strong>Rule 3.1:</strong> High-density establishments need enhanced safety</li>
                        </ul>
                    </div>
                    
                    <div>
                        <strong style="color: #856404;">Construction Safety Rules (4.x)</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.9em;">
                            <li><strong>Rule 4.1:</strong> Minimum worker requirements by project type</li>
                            <li><strong>Rule 4.2:</strong> Construction timeline reasonableness standards</li>
                        </ul>
                    </div>
                </div>
                
                <h4 style="color: #333; margin-top: 20px;">🔍 How to Use SDSS</h4>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 5px; border-left: 4px solid #1976d2;">
                    <ol style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                        <li>Click <strong>"Business SDSS Report"</strong> to check all businesses for violations</li>
                        <li>Click <strong>"Construction SDSS Report"</strong> to check construction compliance</li>
                        <li>Reports show: Critical violations, Violations, Warnings, and Compliant items</li>
                        <li>Each violation shows the specific rule broken and required action</li>
                    </ol>
                </div>
                
                <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #2e7d32;">
                    <p style="margin: 0; font-size: 0.9em;"><strong>✅ SDSS Ready</strong> - All rules loaded and operational</p>
                </div>
            </div>
        `,
        width: '800px',
        icon: 'success',
        confirmButtonText: 'Close',
        confirmButtonColor: '#667eea'
    });
}

/**
 * Show comprehensive SDSS report for all businesses with spatial analysis
 */
async function showAllBusinessesSDSSReport() {
    if (!allMarkersData || allMarkersData.length === 0) {
        Swal.fire({
            title: 'No Data',
            text: 'No businesses found on the map',
            icon: 'info'
        });
        return;
    }
    
    const businessData = allMarkersData.filter(m => m.type === 'business');
    
    if (businessData.length === 0) {
        Swal.fire({
            title: 'No Businesses',
            text: 'No business data available for analysis',
            icon: 'info'
        });
        return;
    }
    
    Swal.fire({
        title: 'Analyzing Businesses...',
        html: 'Checking business compliance with safety rules...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const warnings = [];
        
        for (const business of businessData) {
            const lat = parseFloat(business.latitude);
            const lng = parseFloat(business.longitude);
            
            if (isNaN(lat) || isNaN(lng)) continue;
            
            const point = L.latLng(lat, lng);
            const businessWarnings = [];
            
            // SDSS RULE 1: Check if in flood zone
            let inFloodZone = false;
            let floodRiskLevel = 'none';
            
            if (floodLayer) {
                floodLayer.eachLayer(layer => {
                    if (layer.getBounds && layer.getBounds().contains(point)) {
                        inFloodZone = true;
                        if (layer.hazardData) {
                            floodRiskLevel = layer.hazardData.risk_level || 'unknown';
                        }
                    }
                });
            }
            
            if (inFloodZone) {
                businessWarnings.push({
                    type: 'Flood Risk',
                    severity: floodRiskLevel === 'low' ? 'MEDIUM' : 'HIGH',
                    description: `Business is located in a ${floodRiskLevel.toUpperCase()} flood risk zone`,
                    actions: [
                        'Elevate valuable equipment and inventory',
                        'Install flood barriers at entrances',
                        'Keep sandbags ready during rainy season',
                        'Develop flood emergency evacuation plan',
                        'Consider flood insurance'
                    ]
                });
            }
            
            // SDSS RULE 2: Check proximity to fault line
            if (faultLine) {
                let minDistance = Infinity;
                const faultCoords = faultLine.getLatLngs();
                
                faultCoords.forEach(faultPoint => {
                    const distance = map.distance(point, faultPoint);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                });
                
                if (minDistance < 100) {
                    businessWarnings.push({
                        type: 'Seismic Risk',
                        severity: minDistance < 50 ? 'CRITICAL' : 'HIGH',
                        description: `Business is ${Math.round(minDistance)}m from fault line`,
                        actions: [
                            'Obtain seismic safety assessment',
                            'Ensure building meets earthquake-resistant standards',
                            'Secure shelving and heavy equipment',
                            'Train staff on earthquake safety procedures',
                            'Post emergency evacuation routes'
                        ]
                    });
                }
            }
            
            // SDSS RULE 3: High occupancy check
            if (business.no_of_employees && business.no_of_employees > 50) {
                businessWarnings.push({
                    type: 'High Occupancy',
                    severity: 'MEDIUM',
                    description: `High employee count (${business.no_of_employees} employees)`,
                    actions: [
                        'Ensure adequate emergency exits',
                        'Conduct regular fire drills',
                        'Maintain fire extinguishers',
                        'Post evacuation maps',
                        'Train emergency response team'
                    ]
                });
            }
            
            if (businessWarnings.length > 0) {
                warnings.push({
                    business: business,
                    warnings: businessWarnings
                });
            }
        }
        
        // Build report
        if (warnings.length === 0) {
            Swal.fire({
                icon: 'success',
                title: 'All Businesses Compliant',
                html: `
                    <div style="padding: 20px; text-align: left;">
                        <p style="color: #28a745; font-size: 16px;">
                            ✓ All ${businessData.length} businesses meet basic safety requirements!
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <strong>No critical warnings detected</strong>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                Continue regular safety inspections and emergency preparedness.
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            });
            return;
        }
        
        let reportHTML = `
            <div style="max-width: 900px; text-align: left;">
                <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                        🏢 Business Safety Compliance Report
                    </h3>
                    <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                        ${warnings.length}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${warnings.length === 1 ? 'Business' : 'Businesses'} with Safety Warnings
                    </div>
                    <div style="margin-top: 15px; font-size: 13px; opacity: 0.8;">
                        Out of ${businessData.length} total businesses analyzed
                    </div>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">📋 SDSS Rules Applied:</h4>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
                        <li><strong>Rule 1:</strong> Flood zone safety requirements</li>
                        <li><strong>Rule 2:</strong> Seismic hazard proximity standards</li>
                        <li><strong>Rule 3:</strong> High-occupancy safety measures</li>
                    </ul>
                </div>
        `;
        
        warnings.forEach(item => {
            const biz = item.business;
            const critical = item.warnings.some(w => w.severity === 'CRITICAL');
            const borderColor = critical ? '#8B0000' : '#ffc107';
            const bgColor = critical ? '#ffebee' : '#fffbeb';
            
            reportHTML += `
                <div style="border-left: 4px solid ${borderColor}; background: ${bgColor}; 
                            padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <strong style="font-size: 18px; color: #333;">
                            ${biz.business_name || 'Unnamed Business'}
                        </strong>
                        <span style="background: ${borderColor}; color: white; padding: 4px 12px; 
                                     border-radius: 3px; font-size: 12px; font-weight: bold;">
                            ${item.warnings.length} WARNING${item.warnings.length > 1 ? 'S' : ''}
                        </span>
                    </div>
                    
                    <div style="font-size: 14px; color: #555; margin-bottom: 15px;">
                        <div>📍 <strong>Address:</strong> ${biz.address_of_business || 'Not specified'}</div>
                        <div>🏢 <strong>Type:</strong> ${biz.type_of_business || 'N/A'}</div>
                        <div>👥 <strong>Employees:</strong> ${biz.no_of_employees || 'N/A'}</div>
                    </div>
            `;
            
            item.warnings.forEach(warning => {
                const severityColor = warning.severity === 'CRITICAL' ? '#8B0000' : 
                                     warning.severity === 'HIGH' ? '#dc3545' : '#ffc107';
                
                reportHTML += `
                    <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 12px;">
                        <div style="color: ${severityColor}; font-weight: bold; margin-bottom: 8px;">
                            <span style="background: ${severityColor}; color: white; padding: 2px 8px; 
                                       border-radius: 3px; font-size: 11px; margin-right: 8px;">
                                ${warning.severity}
                            </span>
                            ${warning.type}: ${warning.description}
                        </div>
                        <div style="margin-top: 10px;">
                            <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                                ✅ Required Actions:
                            </div>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #555;">
                `;
                
                warning.actions.forEach(action => {
                    reportHTML += `<li>${action}</li>`;
                });
                
                reportHTML += `
                            </ul>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `</div>`;
        });
        
        reportHTML += `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        For safety compliance assistance:
                    </p>
                    <div style="font-weight: bold; color: #333; font-size: 16px;">
                        Barangay Blue Ridge B Business Permit Office
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: reportHTML,
            width: 950,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('Error in business SDSS:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate business safety report: ' + error.message
        });
    }
}

/**
 * Show comprehensive SDSS report for all construction sites with spatial analysis
 */
async function showAllConstructionSDSSReport() {
    if (!allMarkersData || allMarkersData.length === 0) {
        Swal.fire({
            title: 'No Data',
            text: 'No construction sites found',
            icon: 'info'
        });
        return;
    }
    
    const constructionData = allMarkersData.filter(m => m.type === 'construction');
    
    if (constructionData.length === 0) {
        Swal.fire({
            title: 'No Construction Sites',
            text: 'No construction data available for analysis',
            icon: 'info'
        });
        return;
    }
    
    Swal.fire({
        title: 'Analyzing Construction Sites...',
        html: 'Checking construction safety compliance...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const warnings = [];
        
        for (const construction of constructionData) {
            const lat = parseFloat(construction.latitude);
            const lng = parseFloat(construction.longitude);
            
            if (isNaN(lat) || isNaN(lng)) continue;
            
            const point = L.latLng(lat, lng);
            const siteWarnings = [];
            
            // SDSS RULE 1: Check if in flood zone
            let inFloodZone = false;
            let floodRiskLevel = 'none';
            
            if (floodLayer) {
                floodLayer.eachLayer(layer => {
                    if (layer.getBounds && layer.getBounds().contains(point)) {
                        inFloodZone = true;
                        if (layer.hazardData) {
                            floodRiskLevel = layer.hazardData.risk_level || 'unknown';
                        }
                    }
                });
            }
            
            if (inFloodZone) {
                siteWarnings.push({
                    type: 'Flood Risk Construction',
                    severity: 'HIGH',
                    description: `Construction site in ${floodRiskLevel.toUpperCase()} flood risk zone`,
                    actions: [
                        'Elevate foundation minimum 1.5 meters above flood level',
                        'Use flood-resistant building materials',
                        'Install proper drainage systems',
                        'Raise electrical outlets above potential flood level',
                        'Consider waterproofing basement/ground floor'
                    ]
                });
            }
            
            // SDSS RULE 2: Check proximity to fault line
            if (faultLine) {
                let minDistance = Infinity;
                const faultCoords = faultLine.getLatLngs();
                
                faultCoords.forEach(faultPoint => {
                    const distance = map.distance(point, faultPoint);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                });
                
                if (minDistance < 50) {
                    siteWarnings.push({
                        type: 'CRITICAL - Fault Line Violation',
                        severity: 'CRITICAL',
                        description: `Construction within ${Math.round(minDistance)}m of fault line - PROHIBITED`,
                        actions: [
                            '🚨 STOP WORK ORDER - Construction must be relocated',
                            'This violates National Building Code Section 305',
                            'Contact Barangay Engineering Office immediately',
                            'Site must be at least 50 meters from fault line'
                        ]
                    });
                } else if (minDistance < 100) {
                    siteWarnings.push({
                        type: 'Seismic Requirements',
                        severity: 'HIGH',
                        description: `Construction ${Math.round(minDistance)}m from fault line`,
                        actions: [
                            'Seismic-resistant design MANDATORY',
                            'Structural engineer certification required',
                            'Use reinforced concrete and steel framework',
                            'Follow earthquake-resistant building codes',
                            'Regular seismic safety inspections needed'
                        ]
                    });
                }
            }
            
            // SDSS RULE 3: Worker safety
            const workers = parseInt(construction.number_of_workers) || 0;
            if (workers < 2 && construction.type_of_work && 
                (construction.type_of_work.toLowerCase().includes('major') || 
                 construction.type_of_work.toLowerCase().includes('construction'))) {
                siteWarnings.push({
                    type: 'Inadequate Workforce',
                    severity: 'MEDIUM',
                    description: `Only ${workers} worker(s) for construction project`,
                    actions: [
                        'Increase workforce for safety and efficiency',
                        'Minimum 2 workers required for major construction',
                        'Ensure adequate supervision on site',
                        'Update work schedule if needed'
                    ]
                });
            }
            
            if (siteWarnings.length > 0) {
                warnings.push({
                    construction: construction,
                    warnings: siteWarnings
                });
            }
        }
        
        // Build report
        if (warnings.length === 0) {
            Swal.fire({
                icon: 'success',
                title: 'All Construction Sites Compliant',
                html: `
                    <div style="padding: 20px; text-align: left;">
                        <p style="color: #28a745; font-size: 16px;">
                            ✓ All ${constructionData.length} construction sites meet safety requirements!
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <strong>No safety violations detected</strong>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                Continue monitoring and regular safety inspections.
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            });
            return;
        }
        
        const critical = warnings.filter(w => w.warnings.some(x => x.severity === 'CRITICAL'));
        const high = warnings.filter(w => !critical.includes(w) && w.warnings.some(x => x.severity === 'HIGH'));
        const medium = warnings.filter(w => !critical.includes(w) && !high.includes(w));
        
        let reportHTML = `
            <div style="max-width: 900px; text-align: left;">
                <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                        🏗️ Construction Safety Compliance Report
                    </h3>
                    <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                        ${warnings.length}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${warnings.length === 1 ? 'Site' : 'Sites'} with Safety Warnings
                    </div>
                    
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${critical.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Critical</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${high.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">High Risk</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 28px; font-weight: bold;">${medium.length}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Medium</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">📋 SDSS Rules Applied:</h4>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
                        <li><strong>Rule 1:</strong> Flood-resistant construction requirements</li>
                        <li><strong>Rule 2:</strong> Fault line setback and seismic standards</li>
                        <li><strong>Rule 3:</strong> Worker safety and workforce adequacy</li>
                    </ul>
                </div>
        `;
        
        // Show critical first
        [...critical, ...high, ...medium].forEach(item => {
            const site = item.construction;
            const hasCritical = item.warnings.some(w => w.severity === 'CRITICAL');
            const borderColor = hasCritical ? '#8B0000' : 
                               item.warnings.some(w => w.severity === 'HIGH') ? '#dc3545' : '#ffc107';
            const bgColor = hasCritical ? '#ffebee' : '#fffbeb';
            
            const owner = [site.first_name, site.last_name].filter(Boolean).join(' ') || 'Unknown Owner';
            
            reportHTML += `
                <div style="border-left: 4px solid ${borderColor}; background: ${bgColor}; 
                            padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <strong style="font-size: 18px; color: #333;">
                            ${owner}
                        </strong>
                        <span style="background: ${borderColor}; color: white; padding: 4px 12px; 
                                     border-radius: 3px; font-size: 12px; font-weight: bold;">
                            ${item.warnings.length} WARNING${item.warnings.length > 1 ? 'S' : ''}
                        </span>
                    </div>
                    
                    <div style="font-size: 14px; color: #555; margin-bottom: 15px;">
                        <div>📍 <strong>Address:</strong> ${site.construction_address || 'Not specified'}</div>
                        <div>🔨 <strong>Type:</strong> ${site.type_of_work || 'N/A'}</div>
                        <div>👷 <strong>Workers:</strong> ${site.number_of_workers || 'N/A'}</div>
                    </div>
            `;
            
            item.warnings.forEach(warning => {
                const severityColor = warning.severity === 'CRITICAL' ? '#8B0000' : 
                                     warning.severity === 'HIGH' ? '#dc3545' : '#ffc107';
                
                reportHTML += `
                    <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 12px;">
                        <div style="color: ${severityColor}; font-weight: bold; margin-bottom: 8px;">
                            <span style="background: ${severityColor}; color: white; padding: 2px 8px; 
                                       border-radius: 3px; font-size: 11px; margin-right: 8px;">
                                ${warning.severity}
                            </span>
                            ${warning.type}: ${warning.description}
                        </div>
                        <div style="margin-top: 10px;">
                            <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                                ${warning.severity === 'CRITICAL' ? '🚨 IMMEDIATE ACTIONS:' : '✅ Required Actions:'}
                            </div>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #555;">
                `;
                
                warning.actions.forEach(action => {
                    reportHTML += `<li>${action}</li>`;
                });
                
                reportHTML += `
                            </ul>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `</div>`;
        });
        
        reportHTML += `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        For construction permits and safety compliance:
                    </p>
                    <div style="font-weight: bold; color: #333; font-size: 16px;">
                        Barangay Blue Ridge B Engineering Office
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: reportHTML,
            width: 950,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('Error in construction SDSS:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate construction safety report: ' + error.message
        });
    }
}

/**
 * Helper function to get flood risk color
 */
function getFloodRiskColor(riskLevel) {
    const colors = {
        'high': '#ff0000',
        'medium': '#ff9900',
        'low': '#ffff00',
        'very-low': '#0066cc'
    };
    return colors[riskLevel] || '#666666';
}

/**
 * Test fixed flood detection
 */
async function testFixedFloodDetectionButton() {
    console.log('Testing fixed flood detection...');
    
    if (!floodLayer) {
        Swal.fire({
            title: 'Flood Layer Not Loaded',
            text: 'Please enable the flood layer first',
            icon: 'warning'
        });
        return;
    }
    
    let floodCount = 0;
    floodLayer.eachLayer(() => floodCount++);
    
    Swal.fire({
        title: 'Flood Detection Test',
        html: `
            <div style="text-align: left;">
                <h4>✅ Flood Detection Status</h4>
                <p><strong>Flood Layer Active:</strong> ${floodLayerActive ? 'Yes' : 'No'}</p>
                <p><strong>Flood Areas Found:</strong> ${floodCount}</p>
                <p><strong>House Polygons Loaded:</strong> ${housePolygonsData.length}</p>
                <p><strong>Status:</strong> ${floodCount > 0 ? '✅ Working correctly' : '⚠️ No flood areas detected'}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Close'
    });
}

// Make new functions available globallyx   
window.showFaultLineRiskAssessment = showFaultLineRiskAssessment;
window.showAllBusinessesSDSSReport = showAllBusinessesSDSSReport;
window.showAllConstructionSDSSReport = showAllConstructionSDSSReport;