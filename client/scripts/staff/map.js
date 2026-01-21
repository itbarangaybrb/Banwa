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

// Filter state - only one can be active
let activeFilter = 'household'; // 'household', 'business', 'construction', 'utility'
let constructionSubFilter = 'all'; // 'all', 'major', 'minor', 'repair', 'demolition'
let markerVisibility = {
    household: true,
    business: false,
    construction: false,
    utility: false
};
let housePolygonsVisible = true;

// Search variables
let allMarkersData = [];
let searchResults = [];
let activeSearchMarker = null;
let searchTimeout = null;

// Modal state
let currentMarkerData = null;

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

const defaultIcon = L.divIcon({ 
    className: 'household-marker',
    iconSize: [12, 12] 
});

// Navigation active state management
function setActiveNav(element) {
    document.querySelectorAll('.nav_select, .nav_select_btn').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// Helper function to get icon based on marker type
function getMarkerIcon(markerType) {
    switch(markerType?.toLowerCase()) {
        case 'household': return householdIcon;
        case 'utility': return utilityIcon;
        case 'incident': return incidentIcon;
        case 'business': return businessIcon;
        case 'construction': return constructionIcon;
        default: return householdIcon;
    }
}

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

// FIXED: Dropdown toggle function
function toggleFilterDropdown(event) {
    if (event) {
        event.stopPropagation(); // Prevent event bubbling
    }
    
    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdownBtn.classList.remove('active');
    } else {
        // Close any other open dropdowns
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

// FIXED: selectFilterType function
function selectFilterType(type, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Close dropdown
    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');
    dropdown.classList.remove('show');
    dropdownBtn.classList.remove('active');
    
    // Update current filter text
    const filterTextMap = {
        'household': 'Households',
        'business': 'Businesses',
        'construction': 'Construction',
        'utility': 'Utilities'
    };
    
    document.getElementById('currentFilterText').textContent = filterTextMap[type] || 'Filter';
    
    // Show/hide construction sub-filters
    const subFilters = document.getElementById('constructionSubFilters');
    if (subFilters) {
        if (type === 'construction') {
            subFilters.style.display = 'block';
        } else {
            subFilters.style.display = 'none';
        }
    }
    
    // Update active state in dropdown
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.type === type) {
            link.classList.add('active');
        }
    });
    
    // Activate the filter
    activateFilter(type);
}

// FIXED: Construction sub-filter function
function filterConstructionByType(subtype, event) {
    if (event) {
        event.stopPropagation();
    }
    
    // Update construction sub-filter
    constructionSubFilter = subtype;
    
    // Update active state of sub-filter buttons
    document.querySelectorAll('.sub-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const clickedBtn = event ? event.currentTarget : 
        document.querySelector(`.sub-filter-btn[data-subtype="${subtype}"]`);
    
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Update filter info
    const filterText = subtype === 'all' ? 'Showing all construction sites' : `Showing ${subtype} construction sites`;
    document.getElementById('filterInfo').textContent = filterText;
    
    // If construction is the active filter, update the visibility
    if (activeFilter === 'construction') {
        updateConstructionMarkersBySubtype();
    }
}

// NEW: Function to filter construction markers by subtype
function updateConstructionMarkersBySubtype() {
    // First, hide all construction markers
    constructionMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    // Then show only the ones matching the subtype
    // Note: You need to implement actual filtering based on your data structure
    // For now, we'll show all construction markers
    if (markerVisibility.construction) {
        constructionMarkers.forEach(marker => {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        });
    }
}

// Activate a single filter (only one can be active)
function activateFilter(type) {
    // Update active filter
    activeFilter = type;
    
    // Reset construction sub-filter when switching away from construction
    if (type !== 'construction') {
        constructionSubFilter = 'all';
        
        // Reset sub-filter buttons
        document.querySelectorAll('.sub-filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.subtype === 'all') {
                btn.classList.add('active');
            }
        });
    }
    
    // Update filter info
    updateFilterInfo();
    
    // Update visibility based on active filter
    updateAllVisibility();
}

// Update filter info display
function updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    let infoText = '';
    
    switch(activeFilter) {
        case 'household':
            infoText = 'Showing households';
            break;
        case 'business':
            infoText = 'Showing businesses';
            break;
        case 'construction':
            if (constructionSubFilter === 'all') {
                infoText = 'Showing all construction sites';
            } else {
                infoText = `Showing ${constructionSubFilter} construction sites`;
            }
            break;
        case 'utility':
            infoText = 'Showing utilities';
            break;
    }
    
    filterInfo.textContent = infoText;
}

// Update all visibility based on active filter
function updateAllVisibility() {
    // Reset all to false first
    markerVisibility.household = false;
    markerVisibility.business = false;
    markerVisibility.construction = false;
    markerVisibility.utility = false;
    housePolygonsVisible = false;
    
    // Enable only the active filter
    switch(activeFilter) {
        case 'household':
            markerVisibility.household = true;
            housePolygonsVisible = true;
            break;
        case 'business':
            markerVisibility.business = true;
            break;
        case 'construction':
            markerVisibility.construction = true;
            break;
        case 'utility':
            markerVisibility.utility = true;
            break;
    }
    
    // Update marker visibility
    updateMarkerVisibility();
    
    // Update house polygon visibility
    updateHousePolygonVisibility();
}

// Update marker visibility
function updateMarkerVisibility() {
    // Handle household markers
    householdMarkers.forEach(marker => {
        if (markerVisibility.household) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    // Handle construction markers
    constructionMarkers.forEach(marker => {
        if (markerVisibility.construction) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    // Handle business markers
    businessMarkers.forEach(marker => {
        if (markerVisibility.business) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    // Handle utility markers
    utilityMarkers.forEach(marker => {
        if (markerVisibility.utility) {
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

// REAL-TIME SEARCH FUNCTIONS
function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchTerm) {
        if (resultsContainer) resultsContainer.style.display = 'none';
        return;
    }
    
    // Clear previous search results
    searchResults = [];
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    // Search in all markers data
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
            marker.applicant_address || ''
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
    
    // Sort by relevance score (highest first)
    searchResults.sort((a, b) => b.score - a.score);
    
    // Display results
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
                             marker.utility_id ? 'utility' : 'household');
                
                const title = marker.title || 
                             marker.business_name || 
                             marker.homeowner_name || 
                             marker.applicant_name ||
                             'Unnamed Marker';
                
                const subtitle = marker.description || 
                               marker.address_of_construction || 
                               marker.address_of_business || 
                               marker.applicant_address ||
                               marker.location || 
                               '';
                
                const highlightedTitle = highlightText(title, searchTerm);
                const highlightedSubtitle = highlightText(subtitle.substring(0, 60), searchTerm);
                
                item.innerHTML = `
                    <div class="result-icon ${type}-marker"></div>
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

// Highlight text in search results
function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(searchRegex, '<span class="highlight">$1</span>');
}

// Debounced search function (search as you type)
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
    
    // Restore all markers based on current filter
    updateAllVisibility();
    
    // Also show house polygons if they should be visible
    if (housePolygonsVisible && housePolygonsLayer) {
        if (!map.hasLayer(housePolygonsLayer)) {
            housePolygonsLayer.addTo(map);
        }
    }
    
    map.closePopup();
}

function highlightSearchResult(markerData) {
    // First, hide all markers
    hideAllMarkers();
    
    // Then show only the searched marker
    showOnlySearchedMarker(markerData);
}

// Function to hide all markers
function hideAllMarkers() {
    // Hide all marker layers
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
    
    // Also hide house polygons
    if (housePolygonsLayer && map.hasLayer(housePolygonsLayer)) {
        map.removeLayer(housePolygonsLayer);
    }
}

// Function to show only the searched marker
function showOnlySearchedMarker(markerData) {
    // Remove previous search marker if exists
    if (activeSearchMarker) {
        map.removeLayer(activeSearchMarker);
    }
    
    const lat = parseFloat(markerData.latitude);
    const lng = parseFloat(markerData.longitude);
    
    // Determine the marker type and get the correct icon
    const type = markerData.marker_type || 
                (markerData.construction_id ? 'construction' : 
                 markerData.id ? 'business' : 
                 markerData.utility_id ? 'utility' : 'household');
    
    // Create a highlight icon
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
    
    // Create the searched marker with highlight
    activeSearchMarker = L.marker([lat, lng], { icon: highlightIcon }).addTo(map);
    
    // Fly to the marker
    map.flyTo([lat, lng], 18, {
        duration: 1
    });
    
    // Create popup content based on marker type
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
    
    // Open popup after animation
    setTimeout(() => {
        activeSearchMarker.bindPopup(popupContent).openPopup();
    }, 500);
    
    // Highlight the search result item
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('active');
        const resultIndex = searchResults.findIndex(result => result.marker === markerData);
        if (parseInt(item.dataset.index) === resultIndex) {
            item.classList.add('active');
        }
    });
    
    // Hide search results after selection
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Update filter info to show we're viewing a search result
    document.getElementById('filterInfo').textContent = 'Showing searched marker';
}

// Create construction popup
function createConstructionPopup(construction) {
    const paymentStatus = construction.payment_status ? 
        construction.payment_status.toLowerCase() : 'unknown';
    
    // Format the fee paid
    const feePaid = construction.fee_paid ? 
        formatCurrency(construction.fee_paid) : 'Not specified';
    
    return `
        <div class="popup-content">
            <h4>🏗️ CONSTRUCTION SITE <span class="construction-badge">Construction</span></h4>
            
            <div class="popup-section">
                <p><strong>Permit No:</strong> ${construction.permit_no || 'Pending'}</p>
                <p><strong>Homeowner:</strong> ${construction.homeowner_name || 'Not specified'}</p>
                <p><strong>Contractor:</strong> ${construction.contractor_name || 'Not specified'}</p>
                <p><strong>Address:</strong> ${construction.address_of_construction || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Type of Work:</strong> ${construction.type_of_work || 'Not specified'}</p>
                <p><strong>Nature of Activity:</strong> ${construction.nature_of_activity || 'Not specified'}</p>
                <p><strong>Details:</strong> ${construction.details_of_work || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Start Date:</strong> ${formatDate(construction.start_date)}</p>
                <p><strong>End Date:</strong> ${formatDate(construction.end_date)}</p>
                <p><strong>Workers:</strong> ${construction.num_of_workers || 'Not specified'}</p>
                <p><strong>Working Days:</strong> ${construction.num_of_working_days || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Fee Paid:</strong> ${feePaid}</p>
                <p><strong>Payment Type:</strong> ${construction.payment_type || 'Not specified'}</p>
                <p><strong>Payment Status:</strong> <span class="status-${paymentStatus}">${construction.payment_status || 'Unknown'}</span></p>
            </div>
            
            <button class="view-details-btn" onclick="showConstructionDetails(${construction.construction_id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Create business popup
function createBusinessPopup(business) {
    const ownerName = `${business.first_name || ''} ${business.middle_name || ''} ${business.last_name || ''}`.trim();
    const status = business.status ? business.status.toLowerCase() : 'pending';
    
    return `
        <div class="popup-content">
            <h4>🏪 BUSINESS <span class="business-badge">Business</span></h4>
            
            <div class="popup-section">
                <p><strong>Business Name:</strong> ${business.business_name || 'Not specified'}</p>
                <p><strong>Owner:</strong> ${ownerName || 'Not specified'}</p>
                <p><strong>Business Type:</strong> ${business.type_of_business || 'Not specified'}</p>
                <p><strong>Nature:</strong> ${business.nature_of_business || business.nature_of_business_specify || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Address:</strong> ${business.address_of_business || 'Not specified'}</p>
                <p><strong>Telephone:</strong> ${business.telephone_no_business || 'Not specified'}</p>
                <p><strong>Email:</strong> ${business.email_address || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Owner Address:</strong> ${business.address_owner || 'Not specified'}</p>
                <p><strong>Owner Tel:</strong> ${business.telephone_no_owner || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Structure Type:</strong> ${business.type_of_structure || business.type_of_structure_specify || 'Not specified'}</p>
                <p><strong>Employees:</strong> ${business.no_of_employees || 'Not specified'}</p>
                <p><strong>Status:</strong> <span class="status-${status}">${business.status || 'Pending'}</span></p>
                <p><strong>Application Date:</strong> ${formatDate(business.application_date)}</p>
            </div>
            
            <button class="view-details-btn" onclick="showBusinessDetails(${business.id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Create utility popup
function createUtilityPopup(utility) {
    return `
        <div class="popup-content">
            <h4>🔧 UTILITY WORK <span class="utility-badge">Utility</span></h4>
            
            <div class="popup-section">
                <p><strong>Applicant:</strong> ${utility.applicant_name || 'Not specified'}</p>
                <p><strong>Applicant Address:</strong> ${utility.applicant_address || 'Not specified'}</p>
                <p><strong>Contact No:</strong> ${utility.contact_no || 'Not specified'}</p>
                <p><strong>Service Provider:</strong> ${utility.service_provider || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Nature of Work:</strong> ${utility.nature_of_work || 'Not specified'}</p>
                <p><strong>Authorization:</strong> ${utility.authorization_name || 'Not specified'}</p>
                <p><strong>Waiver:</strong> ${utility.waiver_acknowledgement || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Request Date:</strong> ${formatDate(utility.date_of_request)}</p>
                <p><strong>Work Date:</strong> ${formatDate(utility.date_of_work)}</p>
                <p><strong>Received By:</strong> ${utility.received_by || 'Not specified'}</p>
                <p><strong>Approved By:</strong> ${utility.approved_by || 'Not specified'}</p>
            </div>
            
            ${utility.work_completed_by ? `
            <div class="popup-section">
                <p><strong>Completed By:</strong> ${utility.work_completed_by}</p>
                <p><strong>Completion Date:</strong> ${formatDate(utility.work_completed_date)}</p>
            </div>
            ` : ''}
            
            <button class="view-details-btn" onclick="showUtilityDetails(${utility.utility_id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Create household popup
function createHouseholdPopup(household) {
    const markerType = household.marker_type || 'Household';
    const badgeClass = markerType.toLowerCase() + '-badge';
    const badgeName = markerType.charAt(0).toUpperCase() + markerType.slice(1);
    
    return `
        <div class="popup-content">
            <h4>📍 ${household.title || 'Marker'} <span class="${badgeClass}">${badgeName}</span></h4>
            
            <div class="popup-section">
                <p><strong>Description:</strong> ${household.description || 'No description'}</p>
                <p><strong>Location:</strong> ${household.location || 'Not specified'}</p>
                <p><strong>Type:</strong> ${markerType}</p>
            </div>
            
            ${household.created_at ? `
            <div class="popup-section">
                <p><strong>Created:</strong> ${formatDate(household.created_at)}</p>
            </div>
            ` : ''}
            
            <button class="view-details-btn" onclick="showHouseholdDetails(${household.marker_id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Load all markers - FIXED VERSION FOR YOUR DATABASE
async function loadAllMarkers() {
    clearAllMarkers();
    
    try {
        const formData = new FormData();
        formData.append('action', 'get_markers');
        
        console.log('Fetching markers from map_handler.php...');
        
        const response = await fetch('map_handler.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Data received from server:', data);
        
        if (!data.success) {
            throw new Error('Server returned error: ' + (data.message || 'Unknown error'));
        }

        // Combine all markers data for search
        allMarkersData = [
            ...(data.constructions || []).map(c => ({...c, type: 'construction'})),
            ...(data.businesses || []).map(b => ({...b, type: 'business'})),
            ...(data.households || []).map(h => ({...h, type: 'household'})),
            ...(data.utilities || []).map(u => ({...u, type: 'utility'}))
        ];

        console.log(`Total markers data: ${allMarkersData.length} records`);

        // Process construction markers
        if (data.constructions && Array.isArray(data.constructions)) {
            console.log(`Found ${data.constructions.length} construction records`);
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
                            if (markerVisibility.construction) {
                                marker.addTo(map);
                            }
                            console.log('✅ Added construction marker:', construction.homeowner_name || 'Unnamed');
                        } else {
                            console.warn('❌ Invalid coordinates for construction:', construction.latitude, construction.longitude);
                        }
                    } catch (error) {
                        console.error('Error processing construction marker:', error, construction);
                    }
                } else {
                    console.warn('❌ Construction missing coordinates:', construction.homeowner_name || 'Unnamed');
                }
            });
        } else {
            console.warn('No construction data found or data is not an array');
        }

        // Process business markers
        if (data.businesses && Array.isArray(data.businesses)) {
            console.log(`Found ${data.businesses.length} business records`);
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
                            if (markerVisibility.business) {
                                marker.addTo(map);
                            }
                            console.log('✅ Added business marker:', business.business_name || 'Unnamed');
                        } else {
                            console.warn('❌ Invalid coordinates for business:', business.latitude, business.longitude);
                        }
                    } catch (error) {
                        console.error('Error processing business marker:', error, business);
                    }
                } else {
                    console.warn('❌ Business missing coordinates:', business.business_name || 'Unnamed');
                }
            });
        } else {
            console.warn('No business data found or data is not an array');
        }

        // Process household markers - NOTE: marker table doesn't have lat/lng!
        if (data.households && Array.isArray(data.households)) {
            console.log(`Found ${data.households.length} household/marker records`);
            console.warn('⚠️ Marker table does not have latitude/longitude columns! Household markers cannot be displayed on map.');
            // You need to add latitude/longitude columns to the marker table
        }

        // Process utility markers
        if (data.utilities && Array.isArray(data.utilities)) {
            console.log(`Found ${data.utilities.length} utility records`);
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
                            if (markerVisibility.utility) {
                                marker.addTo(map);
                            }
                            console.log('✅ Added utility marker:', utility.applicant_name || 'Unnamed');
                        } else {
                            console.warn('❌ Invalid coordinates for utility:', utility.latitude, utility.longitude);
                        }
                    } catch (error) {
                        console.error('Error processing utility marker:', error, utility);
                    }
                } else {
                    console.warn('❌ Utility missing coordinates:', utility.applicant_name || 'Unnamed');
                }
            });
        } else {
            console.warn('No utility data found or data is not an array');
        }

        console.log(`Summary: ${constructionMarkers.length} construction, ${businessMarkers.length} business, ${utilityMarkers.length} utility markers loaded.`);

        // Set initial visibility
        updateAllVisibility();

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Please check browser console for details.');
    }
}

function clearAllMarkers() {
    constructionMarkers.forEach(marker => map.removeLayer(marker));
    businessMarkers.forEach(marker => map.removeLayer(marker));
    householdMarkers.forEach(marker => map.removeLayer(marker));
    utilityMarkers.forEach(marker => map.removeLayer(marker));
    constructionMarkers = [];
    businessMarkers = [];
    householdMarkers = [];
    utilityMarkers = [];
}

// Update house polygon visibility
function updateHousePolygonVisibility() {
    if (housePolygonsLayer) {
        if (housePolygonsVisible) {
            housePolygonsLayer.addTo(map);
        } else {
            map.removeLayer(housePolygonsLayer);
        }
    }
}

// Load house polygons
async function loadHousePolygons() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses');
        
        const response = await fetch('map_handler.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && data.houses) {
            housePolygonsData = data.houses;
            renderHousePolygons();
            console.log(`Loaded ${data.houses.length} house polygons`);
        }
    } catch (error) {
        console.error('ERROR LOADING HOUSE POLYGONS:', error);
    }
}

// Render house polygons
function renderHousePolygons() {
    // Clear existing house polygons layer
    if (housePolygonsLayer) {
        map.removeLayer(housePolygonsLayer);
    }
    
    // Create new layer group
    housePolygonsLayer = L.layerGroup();
    
    housePolygonsData.forEach(house => {
        if (house.coordinates) {
            try {
                const coords = JSON.parse(house.coordinates);
                // Convert [lng, lat] to [lat, lng] for Leaflet
                const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
                
                // Close the polygon
                latLngCoords.push(latLngCoords[0]);
                
                // Create polygon with styling
                const polygon = L.polygon(latLngCoords, {
                    color: '#3388ff',
                    weight: 2,
                    fillColor: '#3388ff',
                    fillOpacity: 0.3,
                    interactive: true
                });
                
                // Add to layer group
                polygon.addTo(housePolygonsLayer);
                
                // Create popup content
                const popupContent = createHousePopup(house);
                polygon.bindPopup(popupContent);
                
                // Store house data with polygon
                polygon.houseData = house;
                
            } catch (e) {
                console.error('Error parsing house coordinates:', e);
            }
        }
    });
    
    // Add to map if enabled
    if (housePolygonsVisible) {
        housePolygonsLayer.addTo(map);
    }
}

// Create house popup
function createHousePopup(house) {
    return `
        <div class="popup-content">
            <h4>🏠 HOUSE <span class="house-badge">House</span></h4>
            
            <div class="popup-section">
                <p><strong>Address:</strong> ${house.address || 'Not specified'}</p>
                ${house.house_number ? `<p><strong>House #:</strong> ${house.house_number}</p>` : ''}
                ${house.street_name ? `<p><strong>Street:</strong> ${house.street_name}</p>` : ''}
                ${house.area_sqm ? `<p><strong>Area:</strong> ${house.area_sqm} m²</p>` : ''}
            </div>
            
            <div class="popup-section">
                <p><strong>Created:</strong> ${formatDate(house.created_at)}</p>
                ${house.updated_at ? `<p><strong>Updated:</strong> ${formatDate(house.updated_at)}</p>` : ''}
            </div>
            
            <button class="view-details-btn" onclick="showHouseDetails(${house.house_id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Modal functions
function openModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentMarkerData = null;
    }
}

// Detail viewing functions
async function showConstructionDetails(constructionId) {
    console.log('Show construction details:', constructionId);
    // Implement AJAX call to get construction details
    try {
        const formData = new FormData();
        formData.append('action', 'get_construction_details');
        formData.append('id', constructionId);
        
        const response = await fetch('map_handler.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display details in modal
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');
            
            modalTitle.textContent = `Construction Site: ${data.data.homeowner_name || 'Details'}`;
            
            // Create detailed HTML
            const detailsHTML = `
                <div class="detail-table">
                    ${Object.entries(data.data).map(([key, value]) => `
                        <tr>
                            <td>${key.replace(/_/g, ' ').toUpperCase()}</td>
                            <td>${value || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </div>
            `;
            
            modalContent.innerHTML = detailsHTML;
            openModal();
        }
    } catch (error) {
        console.error('Error loading construction details:', error);
    }
}

async function showBusinessDetails(businessId) {
    console.log('Show business details:', businessId);
    // Similar implementation for business details
}

async function showHouseholdDetails(markerId) {
    console.log('Show household details:', markerId);
    // Similar implementation for household details
}

async function showHouseDetails(houseId) {
    console.log('Show house details:', houseId);
    // Similar implementation for house details
}

async function showUtilityDetails(utilityId) {
    console.log('Show utility details:', utilityId);
    // Similar implementation for utility details
}

// Map view functions
function toggleStreetMap() {
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
}

function toggleSatellite() {
    map.removeLayer(osmLayer);
    satelliteLayer.addTo(map);
}

function resetView() {
    map.setView([14.6175, 121.0756], 17);
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
}

// Toggle fault line visibility
function toggleFaultLine() {
    if (faultLine && warningMarker) {
        if (map.hasLayer(faultLine)) {
            map.removeLayer(faultLine);
            map.removeLayer(warningMarker);
        } else {
            faultLine.addTo(map);
            warningMarker.addTo(map);
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Hide results when clicking outside
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
        
        // Show results when focusing on input (if there's text)
        searchInput.addEventListener('focus', function() {
            if (this.value.trim() !== '') {
                performSearch();
            }
        });
    }
    
    // FIXED: Close dropdown when clicking outside
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
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('detail-modal');
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Initialize with "Households" active by default
    updateFilterInfo();
    
    // Set active state for dropdown
    document.querySelector('.dropdown-content a[data-type="household"]').classList.add('active');
});

// Update initialization - Add barangay boundary with soft constraints and fault line
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
    
    // Add fault line to map with earthquake-themed styling
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
            // Add popup with warning
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
            
            // Add hover effect
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
    }).addTo(map);
    
    // Create a fault line warning marker at the midpoint
    const faultCoords = faultLineGeoJSON.features[0].geometry.coordinates;
    const midIndex = Math.floor(faultCoords.length / 2);
    const warningPoint = faultCoords[midIndex];
    
    // Add warning marker
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
    }).addTo(map);
    
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
    loadHousePolygons();
    initDateTime();
    setupMobileMenuClose();
});

// Set up soft boundary (allows some movement but gently pulls back)
function setupSoftBoundary() {
    // Get bounds from GeoJSON
    const bounds = L.geoJSON(blueRidgeGeoJSON).getBounds();
    
    // Create expanded bounds for the "soft boundary" (15% larger)
    const softBounds = L.latLngBounds(
        bounds.getSouthWest(),
        bounds.getNorthEast()
    ).pad(0.15); // 15% padding around the boundary
    
    // Create "warning bounds" (5% larger than actual boundary)
    const warningBounds = L.latLngBounds(
        bounds.getSouthWest(),
        bounds.getNorthEast()
    ).pad(0.05);
    
    // Set maximum bounds to prevent going too far
    const maxBounds = L.latLngBounds(
        bounds.getSouthWest(),
        bounds.getNorthEast()
    ).pad(0.25); // 25% maximum padding
    
    // Set the max bounds on the map
    map.setMaxBounds(maxBounds);
    
    // Set up event listeners for boundary checking
    let boundaryTimeout;
    
    map.on('move', function() {
        clearTimeout(boundaryTimeout);
        
        const currentCenter = map.getCenter();
        
        // Check if we're outside the warning bounds
        if (!warningBounds.contains(currentCenter)) {
            // Show warning message if not already showing
            showBoundaryMessage("You're leaving Barangay Blue Ridge B");
            
            // If we're outside the soft bounds, gently pull back when movement stops
            if (!softBounds.contains(currentCenter)) {
                boundaryTimeout = setTimeout(function() {
                    // Calculate the closest point inside the warning bounds
                    let snappedLat = currentCenter.lat;
                    let snappedLng = currentCenter.lng;
                    
                    // Snap to the nearest edge of warning bounds
                    if (snappedLat > warningBounds.getNorth()) snappedLat = warningBounds.getNorth();
                    if (snappedLat < warningBounds.getSouth()) snappedLat = warningBounds.getSouth();
                    if (snappedLng > warningBounds.getEast()) snappedLng = warningBounds.getEast();
                    if (snappedLng < warningBounds.getWest()) snappedLng = warningBounds.getWest();
                    
                    const snappedCenter = L.latLng(snappedLat, snappedLng);
                    
                    // Smoothly pan back to boundary area
                    map.flyTo(snappedCenter, map.getZoom(), {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                }, 1000); // 1 second delay before pulling back
            }
        }
    });
    
    // Also check on moveend for immediate correction
    map.on('moveend', function() {
        const currentCenter = map.getCenter();
        
        // Immediate correction if way outside bounds
        if (!softBounds.contains(currentCenter)) {
            let snappedLat = currentCenter.lat;
            let snappedLng = currentCenter.lng;
            
            // Snap to the nearest edge of soft bounds
            if (snappedLat > softBounds.getNorth()) snappedLat = softBounds.getNorth();
            if (snappedLat < softBounds.getSouth()) snappedLat = softBounds.getSouth();
            if (snappedLng > softBounds.getEast()) snappedLng = softBounds.getEast();
            if (snappedLng < softBounds.getWest()) snappedLng = softBounds.getWest();
            
            const snappedCenter = L.latLng(snappedLat, snappedLng);
            
            // Immediate correction (no animation for extreme cases)
            if (!bounds.contains(currentCenter)) {
                map.panTo(snappedCenter, {
                    animate: true,
                    duration: 0.5
                });
            }
        }
    });
    
    // Add boundary info to map
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
    
    // Set zoom limits
    map.setMinZoom(15);
    map.setMaxZoom(20);
    
    // Add boundary notification element
    addBoundaryNotification();
}

// Show boundary message
function showBoundaryMessage(message = "Returning to Barangay Blue Ridge B") {
    const notification = document.getElementById('boundary-notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('visible');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('visible');
        }, 3000);
    }
}

// Add boundary notification element to DOM
function addBoundaryNotification() {
    // Remove existing notification if any
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
    
    // Add CSS for the visible state
    const style = document.createElement('style');
    style.textContent = `
        #boundary-notification.visible {
            transform: translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Mobile menu functionality
function toggleMobileMenu() {
    const sideNav = document.querySelector('.side_nav');
    sideNav.classList.toggle('active');
    
    // Close search results when opening mobile menu
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Date/time functionality
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

// Initialize date/time and set up interval
function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// Add mobile menu close when clicking outside on mobile
function setupMobileMenuClose() {
    document.addEventListener('click', function(e) {
        const sideNav = document.querySelector('.side_nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
        if (window.getComputedStyle(mobileMenuBtn).display !== 'none') {
            // If clicking outside the nav while it's open, close it
            if (sideNav.classList.contains('active') && 
                !sideNav.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sideNav.classList.remove('active');
            }
        }
    });
}

// Example to get location data (be respectful of their servers!)
async function getHazardHunterData(lat, lng) {
    try {
        const response = await fetch(
            `https://hazardhunter.georisk.gov.ph/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=georisk:flood_hazard&bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&width=768&height=768&srs=EPSG:4326&format=image/png`
        );
        // This gets a map tile, not structured data
    } catch (error) {
        console.error('Cannot access HazardHunter directly');
    }
}