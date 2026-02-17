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

// ==================== NAVIGATION BAR EXPAND/COLLAPSE WITH HOVER AND CLICK ====================

function initNavbar() {
    const sideNav = document.querySelector('.side_nav');
    const navHeader = document.querySelector('.nav_header');
    let hoverTimer;
    
    if (sideNav) {
        // Hover to expand temporarily
        sideNav.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
            // Only add hover class if not pinned
            if (!this.classList.contains('pinned')) {
                this.classList.add('expanded');
            }
        });
        
        sideNav.addEventListener('mouseleave', function() {
            // Small delay before collapsing to prevent accidental closes
            hoverTimer = setTimeout(() => {
                // Remove expanded class but keep pinned if it exists
                if (!this.classList.contains('pinned')) {
                    this.classList.remove('expanded');
                }
            }, 300);
        });
        
        // Click logo/header to toggle pin/unpin
        if (navHeader) {
            navHeader.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (sideNav.classList.contains('pinned')) {
                    // Unpin
                    sideNav.classList.remove('pinned');
                    sideNav.classList.remove('expanded');
                } else {
                    // Pin - remove expanded class first then add pinned
                    sideNav.classList.remove('expanded');
                    sideNav.classList.add('pinned');
                }
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sideNav.classList.contains('pinned')) {
                sideNav.classList.remove('pinned');
                sideNav.classList.remove('expanded');
            }
        });
        
        // On mobile, close when clicking outside
        if (window.innerWidth <= 768) {
            document.addEventListener('click', function(e) {
                if (!sideNav.contains(e.target) && 
                    !document.querySelector('.mobile-menu-btn')?.contains(e.target)) {
                    sideNav.classList.remove('active');
                    sideNav.classList.remove('expanded');
                    sideNav.classList.remove('pinned');
                }
            });
        }
    }
}

// ==================== SWEETALERT2 CUSTOM CONFIGURATION ====================
// Default SweetAlert2 configuration for consistent styling
const swalDefaultConfig = {
    confirmButtonColor: '#00247c', // Navy blue
    cancelButtonColor: '#666666',   // Gray
    background: '#ffffff',           // White
    color: '#333333',                // Dark gray for text
    iconColor: '#00247c',            // Navy blue for icons
    showCloseButton: true,
    closeButtonHtml: '&times;',
    customClass: {
        container: 'swal-navy-container',
        popup: 'swal-navy-popup',
        header: 'swal-navy-header',
        title: 'swal-navy-title',
        closeButton: 'swal-navy-close',
        icon: 'swal-navy-icon',
        content: 'swal-navy-content',
        htmlContainer: 'swal-navy-html',
        confirmButton: 'swal-navy-confirm',
        cancelButton: 'swal-navy-cancel',
        footer: 'swal-navy-footer'
    }
};

// Helper function to show SweetAlert with custom config
function showSwal(options) {
    return Swal.fire({
        ...swalDefaultConfig,
        ...options
    });
}

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

// ==================== CONSTRUCTION SUB-FILTER ====================

// Map nature_of_activity values to filter types
const natureToSubtypeMap = {
    'Major Renovation': 'major',
    'Major Construction': 'major',
    'New Construction': 'major',
    'Minor Renovation': 'minor',
    'Minor Construction': 'minor',
    'Repair': 'repair',
    'Maintenance': 'repair',
    'Demolition': 'demolition',
    'Complete Demolition': 'demolition',
    'Partial Demolition': 'demolition'
};

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

// Helper function to determine if a construction marker should be shown
function shouldShowConstructionMarker(marker) {
    if (constructionSubFilter === 'all') {
        return true;
    }
    
    // Get the nature_of_activity from marker data
    const nature = marker.nature_of_work || (marker.construction_data ? 
                   (marker.construction_data.nature_of_work || marker.construction_data.nature_of_activity) : '') || '';
    const mappedType = natureToSubtypeMap[nature] || 'other';
    
    return mappedType === constructionSubFilter;
}

function updateMarkerVisibility() {
    // Note: householdMarkers array is kept empty - only house polygons are used
    
    constructionMarkers.forEach(marker => {
        if (activeFilter === 'construction') {
            // Check if marker should be visible based on construction sub-filter
            const shouldShow = shouldShowConstructionMarker(marker);
            
            if (shouldShow && !map.hasLayer(marker)) {
                marker.addTo(map);
            } else if (!shouldShow && map.hasLayer(marker)) {
                map.removeLayer(marker);
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
            marker.street_name || '',
            marker.nature_of_work || '',
            marker.nature_of_activity || '',
            marker.type_of_work || '',
            marker.type_of_business || ''
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
                    if (word.length > 2 && fieldLower.includes(word)) {
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
    
    // Remove active search marker
    removeActiveSearchMarker();
    
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

function removeActiveSearchMarker() {
    if (activeSearchMarker) {
        if (activeSearchMarker.marker && map.hasLayer(activeSearchMarker.marker)) {
            map.removeLayer(activeSearchMarker.marker);
        }
        if (activeSearchMarker.highlight && map.hasLayer(activeSearchMarker.highlight)) {
            map.removeLayer(activeSearchMarker.highlight);
        }
        if (activeSearchMarker.circle && map.hasLayer(activeSearchMarker.circle)) {
            map.removeLayer(activeSearchMarker.circle);
        }
        if (activeSearchMarker instanceof L.Marker || 
            activeSearchMarker instanceof L.Polygon || 
            activeSearchMarker instanceof L.GeoJSON) {
            map.removeLayer(activeSearchMarker);
        }
        activeSearchMarker = null;
    }
}

function highlightSearchResult(markerData) {
    // First, hide all current markers
    hideAllMarkers();
    
    // Try to find the actual marker object
    let targetMarker = null;
    const type = getMarkerTypeFromData(markerData);
    
    // Search in the appropriate markers array
    if (type === 'construction') {
        targetMarker = constructionMarkers.find(m => 
            m.construction_data && m.construction_data.id === markerData.id
        );
    } else if (type === 'business') {
        targetMarker = businessMarkers.find(m => 
            m.business_data && m.business_data.id === markerData.id
        );
    } else if (type === 'utility') {
        targetMarker = utilityMarkers.find(m => 
            m.utility_data && m.utility_data.id === markerData.id
        );
    }
    
    if (targetMarker) {
        // We found the actual marker, highlight it
        highlightExistingMarker(targetMarker, markerData);
    } else {
        // Fallback: create a temporary highlight
        createTemporaryHighlight(markerData);
    }
}

// Helper function to get marker type from data
function getMarkerTypeFromData(markerData) {
    return markerData.marker_type || markerData.type ||
           (markerData.construction_id ? 'construction' : 
            markerData.id ? 'business' : 
            markerData.utility_id ? 'utility' : 
            markerData.hazard_id ? 'flood' :
            markerData.house_id ? 'household' : 'household');
}

function highlightExistingMarker(marker, markerData) {
    // Get the marker's position
    const latLng = marker.getLatLng();
    
    // Remove any existing highlight
    removeActiveSearchMarker();
    
    // Create a pulsing circle highlight
    const highlightCircle = L.circleMarker(latLng, {
        radius: 25,
        color: '#00247c',
        weight: 3,
        fillColor: '#00247c',
        fillOpacity: 0.2,
        className: 'search-highlight-pulse'
    }).addTo(map);
    
    // Store both the marker and highlight for cleanup
    activeSearchMarker = {
        marker: marker,
        highlight: highlightCircle,
        originalPopup: marker.getPopup()
    };
    
    // Show the marker if it's not already on the map
    if (!map.hasLayer(marker)) {
        marker.addTo(map);
    }
    
    // Bring marker to front
    marker.bringToFront();
    
    // FORCE ZOOM - First fly to location with zoom
    console.log('Zooming to:', latLng); // Debug log
    map.flyTo(latLng, 20, {  // Increased zoom to 20 for closer view
        duration: 1.5,        // Slightly longer duration
        easeLinearity: 0.25
    });
    
    // Open popup after fly with a slight delay
    setTimeout(() => {
        let popupContent = '';
        const type = getMarkerTypeFromData(markerData);
        
        if (type === 'construction') {
            popupContent = createConstructionPopup(markerData);
        } else if (type === 'business') {
            popupContent = createBusinessPopup(markerData);
        } else if (type === 'utility') {
            popupContent = createUtilityPopup(markerData);
        } else {
            popupContent = createHousePopup(markerData);
        }
        
        marker.bindPopup(popupContent).openPopup();
    }, 600); // Slightly longer delay to ensure fly completes
    
    // Update active state in search results
    updateSearchResultActiveState(markerData);
    
    // Hide the search results container
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function createTemporaryHighlight(markerData) {
    const type = getMarkerTypeFromData(markerData);
    
    if (type === 'flood') {
        showFloodAreaHighlight(markerData);
        return;
    }
    
    // For house polygons, show the polygon
    if (type === 'household' && markerData.coordinates) {
        showHousePolygonHighlight(markerData);
        return;
    }
    
    const lat = parseFloat(markerData.latitude || markerData.center_lat);
    const lng = parseFloat(markerData.longitude || markerData.center_lng);
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates for marker:', markerData);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Could not find location for this marker',
            confirmButtonColor: '#00247c'
        });
        return;
    }
    
    console.log('Creating temporary marker at:', lat, lng); // Debug log
    
    // Remove any existing highlight
    removeActiveSearchMarker();
    
    const highlightIcon = L.divIcon({
        className: 'highlighted-marker',
        html: `
            <div style="
                position: relative;
                width: 40px;
                height: 40px;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #00247c;
                    border-radius: 50%;
                    opacity: 0.3;
                    animation: searchPulse 1.5s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    width: 20px;
                    height: 20px;
                    ${type === 'construction' ? 'background: #ffc107;' : ''}
                    ${type === 'business' ? 'background: #9C27B0;' : ''}
                    ${type === 'household' || !type ? 'background: #28a745;' : ''}
                    ${type === 'utility' ? 'background: #2196F3;' : ''}
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                "></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    activeSearchMarker = L.marker([lat, lng], { 
        icon: highlightIcon,
        zIndexOffset: 1000
    }).addTo(map);
    
    // FORCE ZOOM
    map.flyTo([lat, lng], 20, {
        duration: 1.5,
        easeLinearity: 0.25
    });
    
    // Open popup after fly
    setTimeout(() => {
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
        
        activeSearchMarker.bindPopup(popupContent).openPopup();
    }, 600);
    
    updateSearchResultActiveState(markerData);
    
    // Hide the search results container
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function updateSearchResultActiveState(markerData) {
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
    
    // Remove active search marker if it exists
    removeActiveSearchMarker();
}

function showHousePolygonHighlight(houseData) {
    try {
        const coords = JSON.parse(houseData.coordinates);
        const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
        latLngCoords.push(latLngCoords[0]);
        
        // Remove any existing highlight
        removeActiveSearchMarker();
        
        const polygon = L.polygon(latLngCoords, {
            color: '#00247c',
            weight: 4,
            fillColor: '#00247c',
            fillOpacity: 0.2,
            interactive: true,
            className: 'search-highlight-pulse'
        }).addTo(map);
        
        activeSearchMarker = polygon;
        
        const bounds = polygon.getBounds();
        console.log('Fitting bounds to polygon:', bounds); // Debug log
        
        // Force fit bounds with padding
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 20,
            duration: 1.5
        });
        
        // Open popup after a short delay
        setTimeout(() => {
            const popupContent = createHousePopup(houseData);
            polygon.bindPopup(popupContent).openPopup();
        }, 600);
        
        updateSearchResultActiveState(houseData);
        
        // Hide the search results container
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
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Error displaying flood hazard area',
            confirmButtonColor: '#00247c'
        });
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
                highlightStyle.color = '#00247c';
                highlightStyle.className = 'search-highlight-pulse';
                
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
                
                updateSearchResultActiveState({ hazard_id: hazardId });
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
                <p><strong>Nature:</strong> ${data.nature_of_work || data.nature_of_activity || 'Not specified'}</p>
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
                <span class="flood-risk-badge" style="background: ${riskColor};">${(data.risk_level || 'medium').toUpperCase()} RISK</span>
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
    };
    
    return advice[riskLevel] || 'Take necessary precautions during heavy rainfall.';
}

function getFloodRiskColor(riskLevel) {
    const colors = {
        'high': '#ff0000',
        'medium': '#ff9900',
        'low': '#ffff00',
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
                        
                        // Store the original data with the marker
                        marker.construction_data = construction;
                        marker.nature_of_work = construction.nature_of_work || construction.nature_of_activity;
                        
                        constructionMarkers.push(marker);
                        if (activeFilter === 'construction' && shouldShowConstructionMarker(marker)) {
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
                        
                        // Store the original data with the marker
                        marker.business_data = business;
                        
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
                        
                        // Store the original data with the marker
                        marker.utility_data = utility;
                        
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
        showSwal({
            icon: 'error',
            title: 'Error Loading Markers',
            text: 'Please check browser console for details.',
            confirmButtonColor: '#00247c'
        });
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
                    color: '#00247c',
                    weight: 2,
                    fillColor: '#00247c',
                    fillOpacity: 0.1,
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
 * FIXED: Flood Risk Assessment
 * Now properly fetches data from PHP backend with percentages from low to high
 */
async function getFloodHousesSummary() {
    try {
        console.log('Fetching flood risk assessment from server...');
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_flood_summary'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch flood assessment');
        }
        
        const data = result.data;
        
        // Display comprehensive flood risk report
        let reportHTML = `
            <div style="max-width: 900px; text-align: left;">
                <div style="background: #00247c; color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                        Flood Risk Assessment Report
                    </h3>
                    <div style="font-size: 48px; font-weight: bold; margin: 15px 0;">
                        ${data.summary.total}
                    </div>
                    <div style="font-size: 16px; opacity: 0.95;">
                        Households in Flood-Prone Areas
                    </div>
                </div>
        `;
        
        if (data.summary.total === 0) {
            reportHTML += `
                <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 8px; 
                            padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
                    <h3 style="color: #155724; margin: 0 0 10px 0;">No Flood Risk Detected</h3>
                    <p style="color: #155724; margin: 0; font-size: 14px;">
                        All households are currently outside flood hazard zones.
                    </p>
                </div>
            `;
        } else {
            // Impact Level Summary - Sorted from lowest to highest impact
            reportHTML += `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                            gap: 15px; margin-bottom: 25px;">
                    <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #ffc107; margin-bottom: 5px;">
                            ${data.summary.minimally_affected}
                        </div>
                        <div style="font-size: 13px; color: #666;">Minimally Affected (1-24%)</div>
                    </div>
                    <div style="background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #ff9800; margin-bottom: 5px;">
                            ${data.summary.partially_affected}
                        </div>
                        <div style="font-size: 13px; color: #666;">Partially Affected (25-74%)</div>
                    </div>
                    <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #dc3545; margin-bottom: 5px;">
                            ${data.summary.fully_affected}
                        </div>
                        <div style="font-size: 13px; color: #666;">Fully Affected (75-100%)</div>
                    </div>
                </div>
            `;
            
            // Risk Level Breakdown - Sorted from lowest to highest risk
            if (data.summary.by_risk_level && data.summary.by_risk_level.length > 0) {
                // Sort risk levels from lowest to highest
                const riskOrder = {'low': 2, 'medium': 3, 'high': 4};
                const sortedRisks = [...data.summary.by_risk_level].sort((a, b) => {
                    const orderA = riskOrder[a.risk_level?.toLowerCase()] || 999;
                    const orderB = riskOrder[b.risk_level?.toLowerCase()] || 999;
                    return orderA - orderB;
                });
                
                reportHTML += `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h4 style="margin: 0 0 15px 0; color: #00247c;">By Flood Risk Level:</h4>
                        <div style="display: grid; gap: 10px;">
                `;
                
                sortedRisks.forEach(item => {
                    if (item.risk_level) {
                        const colors = {
                            'low': '#ffc107',
                            'medium': '#ff9800',
                            'high': '#dc3545'
                        };
                        const color = colors[item.risk_level.toLowerCase()] || '#666';
                        
                        reportHTML += `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="background: ${color}; color: white; padding: 8px 15px; 
                                           border-radius: 5px; font-weight: bold; min-width: 100px; text-align: center;">
                                    ${item.risk_level.toUpperCase()}
                                </div>
                                <div style="font-size: 24px; font-weight: bold; color: ${color};">
                                    ${item.count}
                                </div>
                                <div style="flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; background: ${color}; 
                                               width: ${(item.count / data.summary.total * 100)}%;"></div>
                                </div>
                            </div>
                        `;
                    }
                });
                
                reportHTML += `
                        </div>
                    </div>
                `;
            }
            
            // Detailed List - Sorted by coverage percentage (lowest to highest)
            if (data.houses && data.houses.length > 0) {
                // Sort houses by flood coverage percentage (lowest to highest)
                const sortedHouses = [...data.houses].sort((a, b) => {
                    const percentA = parseFloat(a.flood_coverage_percent) || 0;
                    const percentB = parseFloat(b.flood_coverage_percent) || 0;
                    return percentA - percentB;
                });
                
                reportHTML += `
                    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; 
                                padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 15px 0; color: #00247c;">Affected Households (Sorted by Coverage %):</h4>
                        <div style="max-height: 400px; overflow-y: auto;">
                `;
                
                sortedHouses.forEach(house => {
                    const impactColors = {
                        'Minimally Affected': '#ffc107',
                        'Partially Affected': '#ff9800',
                        'Fully Affected': '#dc3545',
                        'Affected': '#ff9800'
                    };
                    const color = impactColors[house.impact_level] || '#666';
                    const coveragePercent = parseFloat(house.flood_coverage_percent || 0).toFixed(1);
                    
                    reportHTML += `
                        <div style="border-left: 4px solid ${color}; background: #f8f9fa; 
                                    padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <strong style="font-size: 16px; color: #333;">
                                        ${house.address || 'Address not specified'}
                                    </strong>
                                    ${house.street_name ? `<div style="font-size: 13px; color: #666; margin-top: 3px;">
                                         ${house.street_name}
                                    </div>` : ''}
                                </div>
                                <span style="background: ${color}; color: white; padding: 4px 12px; 
                                             border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap;">
                                    ${house.impact_level} (${coveragePercent}%)
                                </span>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                                        gap: 10px; font-size: 13px; color: #555;">
                                <div>
                                    <strong>Flood Risk:</strong> 
                                    <span style="color: ${color}; font-weight: bold;">
                                        ${(house.risk_level || 'Unknown').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <strong>Coverage:</strong> 
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span>${coveragePercent}%</span>
                                        <div style="flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; width: ${coveragePercent}%; background: ${color};"></div>
                                        </div>
                                    </div>
                                </div>
                                ${house.area_sqm ? `<div><strong>Area:</strong> ${house.area_sqm} sqm</div>` : ''}
                            </div>
                            
                            ${house.hazard_description ? `
                                <div style="margin-top: 12px; padding: 10px; background: white; 
                                            border-radius: 4px; font-size: 13px; color: #555;">
                                    <strong>Hazard Info:</strong> ${house.hazard_description}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                
                reportHTML += `
                        </div>
                    </div>
                `;
            }
        }
        
        reportHTML += `
                <div style="background: #f8f9fa; border-left: 4px solid #00247c; padding: 20px; 
                            border-radius: 8px; margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #00247c;">Recommendations:</h4>
                    <ul style="margin: 5px 0; padding-left: 20px; color: #555; font-size: 14px;">
                        <li>Households in high-risk zones should prepare evacuation plans</li>
                        <li>Install flood barriers and elevate important items</li>
                        <li>Monitor weather alerts during rainy season</li>
                        <li>Contact Barangay Office for flood mitigation assistance</li>
                    </ul>
                </div>
            </div>
        `;
        
        showSwal({
            html: reportHTML,
            width: 950,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'swal-wide'
            }
        });
        
    } catch (error) {
        console.error('Error in flood assessment:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate flood risk assessment: ' + error.message
        });
    }
}

// ==================== FAULT LINE RISK ASSESSMENT FUNCTION ====================

async function showFaultLineRiskAssessment() {
    try {
        console.log('Fetching fault line risk assessment...');
        
        // Show loading indicator
        showSwal({
            title: 'Analyzing Fault Line Risk',
            html: 'Please wait while we assess structures near the fault line...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_fault_line_assessment'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Fault line assessment result:', result);
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch fault line assessment');
        }
        
        const data = result.data;
        
        // Display comprehensive fault line risk report
        let reportHTML = `
            <div style="max-width: 900px; text-align: left;">
                <div style="background: #00247c; color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                        Fault Line Proximity Risk Assessment
                    </h3>
                    <div style="font-size: 48px; font-weight: bold; margin: 15px 0;">
                        ${data.summary.total_at_risk}
                    </div>
                    <div style="font-size: 16px; opacity: 0.95;">
                        Structures Within Risk Zone (<200m from Fault Line)
                    </div>
                </div>
        `;
        
        if (data.summary.total_at_risk === 0) {
            reportHTML += `
                <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 8px; 
                            padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
                    <h3 style="color: #155724; margin: 0 0 10px 0;">No Structures at Risk</h3>
                    <p style="color: #155724; margin: 0; font-size: 14px;">
                        All structures are at safe distances from the fault line.
                    </p>
                </div>
            `;
        } else {
            // Risk Level Summary - Sorted from lowest to highest risk
            reportHTML += `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                            gap: 15px; margin-bottom: 25px;">
                    <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #ffc107; margin-bottom: 5px;">
                            ${data.summary.medium_risk}
                        </div>
                        <div style="font-size: 13px; color: #666;">Medium Risk (100-200m)</div>
                    </div>
                    <div style="background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #ff9800; margin-bottom: 5px;">
                            ${data.summary.high_risk}
                        </div>
                        <div style="font-size: 13px; color: #666;">High Risk (50-100m)</div>
                    </div>
                    <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; border-radius: 8px;">
                        <div style="font-size: 32px; font-weight: bold; color: #dc3545; margin-bottom: 5px;">
                            ${data.summary.critical}
                        </div>
                        <div style="font-size: 13px; color: #666;">Critical (<50m)</div>
                    </div>
                </div>
            `;
            
            // Detailed List - Sorted by distance (closest first - most dangerous)
            if (data.structures && data.structures.length > 0) {
                // Sort structures by distance (closest first)
                const sortedStructures = [...data.structures].sort((a, b) => a.distance_meters - b.distance_meters);
                
                reportHTML += `
                    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; 
                                padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 15px 0; color: #00247c;">Structures at Risk (Sorted by Distance):</h4>
                        <div style="max-height: 400px; overflow-y: auto;">
                `;
                
                sortedStructures.forEach(structure => {
                    const riskColors = {
                        'medium': '#ffc107',
                        'high': '#ff9800',
                        'critical': '#dc3545'
                    };
                    const color = riskColors[structure.risk_level] || '#666';
                    
                    reportHTML += `
                        <div style="border-left: 4px solid ${color}; background: #f8f9fa; 
                                    padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <strong style="font-size: 16px; color: #333;">
                                        ${structure.address || structure.street_name || 'Address not specified'}
                                    </strong>
                                    ${structure.house_number ? `<div style="font-size: 13px; color: #666; margin-top: 3px;">
                                        House #${structure.house_number}
                                    </div>` : ''}
                                </div>
                                <span style="background: ${color}; color: white; padding: 4px 12px; 
                                             border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap;">
                                    ${structure.risk_level.toUpperCase()} - ${structure.distance_meters}m
                                </span>
                            </div>
                            
                            <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                                <strong>Distance from Fault Line:</strong> 
                                <span style="color: ${color}; font-weight: bold; font-size: 18px;">
                                    ${structure.distance_meters}m
                                </span>
                                <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 12px;">Distance:</span>
                                    <div style="flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; max-width: 200px;">
                                        <div style="height: 100%; width: ${Math.min(100, (structure.distance_meters / 200) * 100)}%; 
                                                    background: ${color};"></div>
                                    </div>
                                    <span style="font-size: 12px;">/200m</span>
                                </div>
                            </div>
                            
                            ${structure.requirements && structure.requirements.length > 0 ? `
                                <div style="background: #fff3cd; border-left: 3px solid #856404; 
                                            padding: 10px; border-radius: 4px; margin-top: 12px;">
                                    <strong style="color: #856404;">Required Actions:</strong>
                                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #666;">
                                        ${structure.requirements.map(req => `<li>${req}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                
                reportHTML += `
                        </div>
                    </div>
                `;
            }
        }
        
        reportHTML += `
                <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 20px; 
                            border-radius: 8px; margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">Legal Requirements:</h4>
                    <ul style="margin: 5px 0; padding-left: 20px; color: #666; font-size: 14px;">
                        <li><strong>Critical Zone (<50m):</strong> Construction ALLOWED with enhanced seismic standards. Mandatory structural engineer certification, geological survey, and reinforced foundation required.</li>
                        <li><strong>High Risk (50-100m):</strong> Seismic design standards mandatory. Structural engineer certification required.</li>
                        <li><strong>Medium Risk (100-200m):</strong> Enhanced foundation design recommended. Standard building codes with seismic provisions apply.</li>
                    </ul>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
                        Contact the Barangay Engineering Office for compliance assessment and permits.
                    </p>
                </div>
            </div>
        `;
        
        showSwal({
            html: reportHTML,
            width: 950,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'swal-wide'
            }
        });
        
    } catch (error) {
        console.error('Error in fault line assessment:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate fault line assessment: ' + error.message
        });
    }
}

// ==================== BUSINESS SDSS REPORT ====================

async function showAllBusinessesSDSSReport() {
    try {
        console.log('Fetching business SDSS report...');
        console.log('Using URL:', MAP_HANDLER_URL);
        
        // Show loading indicator
        showSwal({
            title: 'Generating Report',
            html: 'Please wait while we analyze business safety compliance...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: 'action=get_business_sdss_report'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw text was:', text);
            throw new Error('Invalid JSON response from server: ' + text.substring(0, 200));
        }
        
        console.log('Parsed business SDSS result:', result);
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch business SDSS report');
        }
        
        const data = result.data;
        
        // Check if data structure is correct
        if (!data || !data.summary || !data.warnings) {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid data structure received from server');
        }
        
        // Show report using SweetAlert2
        displayBusinessSDSSReport(data);
        
    } catch (error) {
        console.error('Error in business SDSS:', error);
        console.error('Error stack:', error.stack);
        
        showSwal({
            icon: 'error',
            title: 'Error Generating Report',
            html: `
                <div style="text-align: left;">
                    <p><strong>Failed to generate business SDSS report:</strong></p>
                    <p style="color: #dc3545; font-family: monospace; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        ${error.message}
                    </p>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        Please check:
                    </p>
                    <ul style="text-align: left; font-size: 13px; color: #666;">
                        <li>Database connection is working</li>
                        <li>Business applications table has data with coordinates</li>
                        <li>Flood hazard data is properly configured</li>
                        <li>Check browser console for detailed error logs</li>
                    </ul>
                </div>
            `,
            width: 600
        });
    }
}

/**
 * Fixed Construction SDSS Report with better error handling
 */
async function showAllConstructionSDSSReport() {
    try {
        console.log('Fetching construction SDSS report...');
        console.log('Using URL:', MAP_HANDLER_URL);
        
        // Show loading indicator
        showSwal({
            title: 'Generating Report',
            html: 'Please wait while we analyze construction site safety...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: 'action=get_construction_sdss_report'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw text was:', text);
            throw new Error('Invalid JSON response from server: ' + text.substring(0, 200));
        }
        
        console.log('Parsed construction SDSS result:', result);
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch construction SDSS report');
        }
        
        const data = result.data;
        
        // Check if data structure is correct
        if (!data || !data.summary || !data.warnings) {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid data structure received from server');
        }
        
        // Show report using SweetAlert2
        displayConstructionSDSSReport(data);
        
    } catch (error) {
        console.error('Error in construction SDSS:', error);
        console.error('Error stack:', error.stack);
        
        showSwal({
            icon: 'error',
            title: 'Error Generating Report',
            html: `
                <div style="text-align: left;">
                    <p><strong>Failed to generate construction SDSS report:</strong></p>
                    <p style="color: #dc3545; font-family: monospace; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        ${error.message}
                    </p>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        Please check:
                    </p>
                    <ul style="text-align: left; font-size: 13px; color: #666;">
                        <li>Database connection is working</li>
                        <li>Construction applications table has data with coordinates</li>
                        <li>Flood hazard data is properly configured</li>
                        <li>Check browser console for detailed error logs</li>
                    </ul>
                </div>
            `,
            width: 600
        });
    }
}

/**
 * Display Business SDSS Report (same as before but with null checks)
 */
function displayBusinessSDSSReport(data) {
    if (!data || !data.summary || !data.warnings) {
        console.error('Invalid data structure:', data);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Invalid data structure received'
        });
        return;
    }
    
    const { summary, warnings } = data;
    
    if (warnings.length === 0) {
        showSwal({
            title: 'Business Safety Compliance',
            html: `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✓</div>
                    <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 10px; padding: 25px;">
                        <strong style="font-size: 20px; color: #155724;">All businesses compliant</strong>
                        <p style="margin-top: 15px; font-size: 14px; color: #666;">
                            Out of ${summary.total} total businesses analyzed, no safety violations detected.
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#00247c'
        });
        return;
    }
    
    const critical = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'CRITICAL'));
    const high = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'HIGH') && !critical.includes(w));
    const medium = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'MEDIUM') && !critical.includes(w) && !high.includes(w));
    
    let reportHTML = `
        <div style="max-width: 900px; text-align: left;">
            <div style="background: #00247c; color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                    Business Safety Compliance Report
                </h3>
                <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                    ${warnings.length}
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    ${warnings.length === 1 ? 'Business' : 'Businesses'} with Safety Warnings
                </div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                    Out of ${summary.total} total businesses analyzed
                </div>
                
                <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${medium.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">Medium</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${high.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">High Risk</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${critical.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">Critical</div>
                    </div>
                </div>
            </div>
    `;
    
    // Show all warnings - sort by severity
    const sortedWarnings = [...medium, ...high, ...critical];
    
    sortedWarnings.forEach(item => {
        if (!item || !item.business || !item.warnings) return;
        
        const business = item.business;
        const itemWarnings = item.warnings;
        
        // Get highest severity
        const hasCritical = itemWarnings.some(w => w.severity === 'CRITICAL');
        const hasHigh = itemWarnings.some(w => w.severity === 'HIGH');
        const highestSeverity = hasCritical ? 'CRITICAL' : (hasHigh ? 'HIGH' : 'MEDIUM');
        
        const borderColor = highestSeverity === 'CRITICAL' ? '#8B0000' : 
                           highestSeverity === 'HIGH' ? '#dc3545' : '#ffc107';
        const bgColor = highestSeverity === 'CRITICAL' ? '#ffebee' : '#fffbeb';
        
        reportHTML += `
            <div style="border-left: 4px solid ${borderColor}; background: ${bgColor}; 
                        padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong style="font-size: 18px; color: #333;">
                        ${business.business_name || 'Unnamed Business'}
                    </strong>
                    <span style="background: ${borderColor}; color: white; padding: 4px 12px; 
                                 border-radius: 3px; font-size: 12px; font-weight: bold;">
                        ${highestSeverity}
                    </span>
                </div>
                
                <div style="font-size: 14px; color: #555; margin-bottom: 15px;">
                    <div><strong>Address:</strong> ${business.address_of_business || 'Not specified'}</div>
                    <div><strong>Type:</strong> ${business.type_of_business || 'N/A'}</div>
                    <div><strong>Employees:</strong> ${business.no_of_employees || 'N/A'}</div>
                </div>
        `;
        
        // Display all warnings for this business
        itemWarnings.forEach(warning => {
            const warnColor = warning.severity === 'CRITICAL' ? '#8B0000' : 
                            warning.severity === 'HIGH' ? '#dc3545' : '#ffc107';
            
            reportHTML += `
                <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 12px;">
                    <div style="color: ${warnColor}; font-weight: bold; margin-bottom: 8px;">
                        ⚠ ${warning.type}
                    </div>
                    <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                        ${warning.description}
                    </div>
                    <div style="margin-top: 10px;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                            ${warning.severity === 'CRITICAL' ? 'IMMEDIATE ACTIONS:' : 'Required Actions:'}
                        </div>
                        <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #555;">
                            ${warning.actions.map(action => `<li>${action}</li>`).join('')}
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
                    For business permits and safety compliance:
                </p>
                <div style="font-weight: bold; color: #00247c; font-size: 16px;">
                    Barangay Blue Ridge B Business Permits Office
                </div>
            </div>
        </div>
    `;
    
    showSwal({
        html: reportHTML,
        width: 950,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'swal-wide'
        }
    });
}

/**
 * Display Construction SDSS Report (same as before but with null checks)
 */
function displayConstructionSDSSReport(data) {
    if (!data || !data.summary || !data.warnings) {
        console.error('Invalid data structure:', data);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Invalid data structure received'
        });
        return;
    }
    
    const { summary, warnings } = data;
    
    if (warnings.length === 0) {
        showSwal({
            title: 'Construction Site Safety',
            html: `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✓</div>
                    <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 10px; padding: 25px;">
                        <strong style="font-size: 20px; color: #155724;">All construction sites compliant</strong>
                        <p style="margin-top: 15px; font-size: 14px; color: #666;">
                            Out of ${summary.total} total sites analyzed, no safety violations detected.
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#00247c'
        });
        return;
    }
    
    const critical = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'CRITICAL'));
    const high = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'HIGH') && !critical.includes(w));
    const medium = warnings.filter(w => w.warnings && w.warnings.some(warning => warning.severity === 'MEDIUM') && !critical.includes(w) && !high.includes(w));
    
    let reportHTML = `
        <div style="max-width: 900px; text-align: left;">
            <div style="background: #00247c; color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                    Construction Site Safety Report
                </h3>
                <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                    ${warnings.length}
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    ${warnings.length === 1 ? 'Site' : 'Sites'} with Safety Warnings
                </div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                    Out of ${summary.total} total sites analyzed
                </div>
                
                <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${medium.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">Medium</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${high.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">High Risk</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 100px;">
                        <div style="font-size: 28px; font-weight: bold;">${critical.length}</div>
                        <div style="font-size: 12px; opacity: 0.9;">Critical</div>
                    </div>
                </div>
            </div>
    `;
    
    // Show all warnings - sort by severity
    const sortedWarnings = [...medium, ...high, ...critical];
    
    sortedWarnings.forEach(item => {
        if (!item || !item.construction || !item.warnings) return;
        
        const site = item.construction;
        const itemWarnings = item.warnings;
        
        // Get highest severity
        const hasCritical = itemWarnings.some(w => w.severity === 'CRITICAL');
        const hasHigh = itemWarnings.some(w => w.severity === 'HIGH');
        const highestSeverity = hasCritical ? 'CRITICAL' : (hasHigh ? 'HIGH' : 'MEDIUM');
        
        const borderColor = highestSeverity === 'CRITICAL' ? '#8B0000' : 
                           highestSeverity === 'HIGH' ? '#dc3545' : '#ffc107';
        const bgColor = highestSeverity === 'CRITICAL' ? '#ffebee' : '#fffbeb';
        
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
                        ${highestSeverity}
                    </span>
                </div>
                
                <div style="font-size: 14px; color: #555; margin-bottom: 15px;">
                    <div><strong>Address:</strong> ${site.construction_address || 'Not specified'}</div>
                    <div><strong>Type:</strong> ${site.type_of_work || 'N/A'}</div>
                    <div><strong>Workers:</strong> ${site.number_of_workers || 'N/A'}</div>
                </div>
        `;
        
        // Display all warnings for this construction site
        itemWarnings.forEach(warning => {
            const warnColor = warning.severity === 'CRITICAL' ? '#8B0000' : 
                            warning.severity === 'HIGH' ? '#dc3545' : '#ffc107';
            
            reportHTML += `
                <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 12px;">
                    <div style="color: ${warnColor}; font-weight: bold; margin-bottom: 8px;">
                        ⚠ ${warning.type}
                    </div>
                    <div style="font-size: 14px; color: #555; margin-bottom: 10px;">
                        ${warning.description}
                    </div>
                    <div style="margin-top: 10px;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                            ${warning.severity === 'CRITICAL' ? 'IMMEDIATE ACTIONS:' : 'Required Actions:'}
                        </div>
                        <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; color: #555;">
                            ${warning.actions.map(action => `<li>${action}</li>`).join('')}
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
                <div style="font-weight: bold; color: #00247c; font-size: 16px;">
                    Barangay Blue Ridge B Engineering Office
                </div>
            </div>
        </div>
    `;
    
    showSwal({
        html: reportHTML,
        width: 950,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'swal-wide'
        }
    });
}


// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize navbar with hover and click functionality
    initNavbar();
    
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
                FAULT LINE
            </h4>
            <p><strong>Seismic Hazard Zone</strong></p>
            <p>This area has been identified as having potential seismic activity.</p>
            <p style="font-size: 0.9em; color: #666;">
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
                EARTHQUAKE RISK AREA
            </h4>
            <p><strong>Fault Line Detected</strong></p>
            <p>Special precautions required for construction and development.</p>
            <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
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
        background: #00247c;
        color: white;
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
        border-left: 4px solid #ffffff;
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

// ==================== SDSS RULES SUMMARY REPORT ====================

/**
 * Show SDSS Rules Summary Report
 */
async function showSDSSRulesReport() {
    try {
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_sdss_rules_summary'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displaySDSSRulesReport(result.data);
        } else {
            showSwal({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Failed to load SDSS rules summary',
                confirmButtonColor: '#00247c'
            });
        }
    } catch (error) {
        console.error('Error fetching SDSS rules summary:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch SDSS rules summary',
            confirmButtonColor: '#00247c'
        });
    }
}

/**
 * Display SDSS Rules Summary Report
 */
function displaySDSSRulesReport(data) {
    const { summary, rules } = data;
    
    // Group rules by category
    const floodRules = [];
    const seismicRules = [];
    
    for (const [key, rule] of Object.entries(rules)) {
        if (rule.category === 'Flood Hazard') {
            floodRules.push({ key, ...rule });
        } else if (rule.category === 'Seismic Hazard') {
            seismicRules.push({ key, ...rule });
        }
    }
    
    // Build HTML content
    let htmlContent = `
        <div style="max-width: 900px; margin: 0 auto;">
            <!-- Summary Section -->
            <div style="background: #00247c; color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;
                        box-shadow: 0 10px 30px rgba(0, 36, 124, 0.3);">
                <h3 style="margin: 0 0 20px 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-list-check"></i>
                    SDSS Rules Summary Report
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Total Houses</div>
                        <div style="font-size: 32px; font-weight: bold;">${summary.total_houses}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Total Rule Violations</div>
                        <div style="font-size: 32px; font-weight: bold;">${summary.total_rule_violations}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Rules Evaluated</div>
                        <div style="font-size: 32px; font-weight: bold;">${summary.rules_evaluated}</div>
                    </div>
                </div>
            </div>
            
            <!-- Note about multiple violations -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 20px; 
                        border-radius: 8px; margin-bottom: 25px; color: #856404;">
                <i class="fas fa-info-circle"></i>
                <strong>Note:</strong> A single house may violate multiple rules (e.g., both flood and fault line risks). 
                Therefore, total violations may exceed total houses.
            </div>
            
            <!-- Flood Hazard Rules -->
            <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h4 style="color: #00247c; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-water"></i>
                    Flood Hazard Rules
                </h4>
                <div style="display: grid; gap: 15px;">
                    ${floodRules.map(rule => createRuleCard(rule, summary.total_houses)).join('')}
                </div>
            </div>
            
            <!-- Seismic Hazard Rules -->
            <div style="background: white; border-radius: 12px; padding: 25px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h4 style="color: #00247c; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Seismic Hazard Rules (Fault Line)
                </h4>
                <div style="display: grid; gap: 15px;">
                    ${seismicRules.map(rule => createRuleCard(rule, summary.total_houses)).join('')}
                </div>
            </div>
        </div>
    `;
    
    showSwal({
        html: htmlContent,
        width: '95%',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'sdss-rules-popup'
        }
    });
}

/**
 * Create a rule card HTML
 */
function createRuleCard(rule, totalHouses) {
    const severityColors = {
        'CRITICAL': { bg: '#ffebee', border: '#f44336', text: '#c62828' },
        'HIGH': { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
        'MEDIUM': { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' }
    };
    
    const colors = severityColors[rule.severity] || severityColors['MEDIUM'];
    
    return `
        <div style="border: 2px solid ${colors.border}; border-radius: 10px; 
                    background: ${colors.bg}; padding: 20px; transition: all 0.3s ease;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 6px;">
                        ${rule.name}
                    </div>
                    <div style="color: #666; font-size: 14px; line-height: 1.5;">
                        ${rule.description}
                    </div>
                </div>
                <div style="text-align: center; margin-left: 20px;">
                    <div style="background: white; border-radius: 50%; width: 70px; height: 70px; 
                                display: flex; flex-direction: column; align-items: center; justify-content: center;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 3px solid ${colors.border};">
                        <div style="font-size: 26px; font-weight: bold; color: ${colors.text};">
                            ${rule.count}
                        </div>
                        <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-top: 2px;">
                            Houses
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; 
                        border-top: 1px solid ${colors.border}40;">
                <span style="background: ${colors.text}; color: white; padding: 4px 10px; 
                            border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${rule.severity}
                </span>
                <span style="color: #666; font-size: 13px;">
                    ${rule.count > 0 ? 
                        `${((rule.count / totalHouses) * 100).toFixed(1)}% of total houses` : 
                        'No violations detected'}
                </span>
            </div>
        </div>
    `;
}

// Make functions globally available
window.getFloodHousesSummary = getFloodHousesSummary;
window.showFaultLineRiskAssessment = showFaultLineRiskAssessment;
window.showAllBusinessesSDSSReport = showAllBusinessesSDSSReport;
window.showAllConstructionSDSSReport = showAllConstructionSDSSReport;
window.displayBusinessSDSSReport = displayBusinessSDSSReport;
window.displayConstructionSDSSReport = displayConstructionSDSSReport;
window.showSDSSRulesReport = showSDSSRulesReport;