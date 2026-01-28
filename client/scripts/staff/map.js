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
        if (floodLegend && !map.hasControl(floodLegend)) {
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
            if (map.hasControl(floodLegend)) {
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
        if (floodLegend && !map.hasControl(floodLegend)) {
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
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
            <button class="view-details-btn" onclick="viewDetails(${data.id}, 'construction')">
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
            <button class="view-details-btn" onclick="viewDetails(${data.id}, 'business')">
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
            <button class="view-details-btn" onclick="viewDetails(${data.id}, 'utility')">
                View Full Details
            </button>
        </div>
    `;
}

function createHouseholdPopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>${data.title || 'Household'}</span>
                <span class="household-badge">Household</span>
            </h4>
            <div class="popup-section">
                <p><strong>Description:</strong> ${data.description || 'Not specified'}</p>
                <p><strong>Location:</strong> ${data.location || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Type:</strong> ${data.marker_type || 'household'}</p>
                <p><strong>Created:</strong> ${formatDate(data.created_at)}</p>
            </div>
            <button class="view-details-btn" onclick="viewDetails(${data.marker_id}, 'household')">
                View Full Details
            </button>
        </div>
    `;
}

function createFloodPopup(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    const riskClass = `flood-risk-${data.risk_level || 'medium'}`;
    
    return `
        <div class="popup-content">
            <h4>
                <span>${data.hazard_name || 'Flood Hazard Area'}</span>
                <span class="flood-risk-badge" style="background: ${riskColor}; color: white;">${(data.risk_level || 'medium').toUpperCase()} RISK</span>
            </h4>
            <div class="popup-section flood-popup-section">
                <p><strong>Risk Level:</strong> <span class="${riskClass}">${(data.risk_level || 'medium').toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${data.description || 'Flood-prone area'}</p>
                <p><strong>Last Flood:</strong> ${formatDate(data.last_flood_date) || 'Not recorded'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Safety Advice:</strong> ${getFloodSafetyAdvice(data.risk_level)}</p>
                <p><strong>Reported By:</strong> ${data.reported_by || 'Barangay Office'}</p>
                <p><strong>Identified:</strong> ${formatDate(data.date_identified)}</p>
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
                <span>House ${data.house_number || ''}</span>
                <span class="household-badge">House</span>
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
                View House Details
            </button>
        </div>
    `;
}

// View details functions
async function viewDetails(id, type) {
    try {
        const formData = new FormData();
        formData.append('action', `get_${type}_details`);
        formData.append('id', id);
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
                <td>${formatDate(data.last_flood_date) || 'Not recorded'}</td>
            </tr>
            <tr>
                <td>Reported By</td>
                <td>${data.reported_by || 'Barangay Office'}</td>
            </tr>
            <tr>
                <td>Date Identified</td>
                <td>${formatDate(data.date_identified)}</td>
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
    return `
        <table class="detail-table">
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
        formData.append('action', 'get_markers');
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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

        const floodFormData = new FormData();
        floodFormData.append('action', 'get_flood_data_for_search');
        
        const floodResponse = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: floodFormData
        });
        
        const floodData = await floodResponse.json();
        
        allMarkersData = [
            ...(data.constructions || []).map(c => ({...c, type: 'construction'})),
            ...(data.businesses || []).map(b => ({...b, type: 'business'})),
            ...(data.households || []).map(h => ({...h, type: 'household'})),
            ...(data.utilities || []).map(u => ({...u, type: 'utility'})),
            ...(floodData.success ? (floodData.hazards || []).map(f => ({...f, type: 'flood'})) : [])
        ];

        if (data.constructions && Array.isArray(data.constructions)) {
            data.constructions.forEach(construction => {
                if (construction.latitude && construction.longitude) {
                    try {
                        const lat = parseFloat(construction.latitude);
                        const lng = parseFloat(construction.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createConstructionPopup(construction);
                            const marker = L.marker([lat, lng], { 
                                icon: constructionIcon,
                                title: construction.homeowner_name || 'Construction Site'
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

        if (data.businesses && Array.isArray(data.businesses)) {
            data.businesses.forEach(business => {
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

        if (data.households && Array.isArray(data.households)) {
            data.households.forEach(household => {
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

        if (data.utilities && Array.isArray(data.utilities)) {
            data.utilities.forEach(utility => {
                if (utility.latitude && utility.longitude) {
                    try {
                        const lat = parseFloat(utility.latitude);
                        const lng = parseFloat(utility.longitude);
                        
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const popupContent = createUtilityPopup(utility);
                            const marker = L.marker([lat, lng], { 
                                icon: utilityIcon,
                                title: utility.applicant_name || 'Utility Work'
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

async function loadFloodData() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_hazards');
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
            if (floodLayerActive && floodLegend && !map.hasControl(floodLegend)) {
                floodLegend.addTo(map);
            }
        } else {
            console.warn('No flood data found:', data.message);
            floodLayer = L.layerGroup();
            floodLegend = null; // Reset legend if no data
        }
    } catch (error) {
        console.error('ERROR LOADING FLOOD DATA:', error);
        floodLayer = L.layerGroup();
        floodLegend = null; // Reset legend on error
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
            if (!hazard.geojson) {
                console.warn('Flood hazard missing GeoJSON:', hazard.hazard_id);
                return;
            }
            
            const geoJson = JSON.parse(hazard.geojson);
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
        
        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
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
    householdMarkers = [];
    utilityMarkers = [];
    floodLayer = null;
    floodLegend = null; // Reset the legend variable
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
    
    // ============= ADD FAULT LINE =============
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
    
    // Create fault line but don't add to map yet
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
    
    // Create warning marker but don't add to map yet
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
    console.log('Flood Legend on map:', floodLegend ? map.hasControl(floodLegend) : false);
    
    // Check DOM for legend
    const legendElement = document.querySelector('.flood-legend');
    console.log('Flood Legend in DOM:', !!legendElement);
}