// Map variables
const map = L.map('map').setView([14.6175, 121.0756], 17);
let utilityMarkers = [];
let constructionMarkers = [];
let businessMarkers = [];
let householdMarkers = [];
let visibleMarkers = {
    utility: true,
    household: true,
    business: true,
    construction: true
};

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

// Navigation active state management - SIMPLIFIED
function setActiveNav(element) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav_select, .nav_select_btn').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked element
    element.classList.add('active');
}

// Helper function to get icon based on marker type
function getMarkerIcon(markerType) {
    switch (markerType?.toLowerCase()) {
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

// Toggle marker visibility
function toggleMarkerType(type) {
    if (type === 'household' || type === 'business' || type === 'construction' || type === 'utility') {
        visibleMarkers[type] = !visibleMarkers[type];
    }

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(button => {
        const buttonType = button.dataset.type;
        if (buttonType === type) {
            button.classList.toggle('active', visibleMarkers[type]);
        }
    });

    updateMarkerVisibility();
}

function updateMarkerVisibility() {
    householdMarkers.forEach(marker => {
        visibleMarkers.household ? map.addLayer(marker) : map.removeLayer(marker);
    });

    utilityMarkers.forEach(marker => {
        visibleMarkers.utility ? map.addLayer(marker) : map.removeLayer(marker);
    });

    constructionMarkers.forEach(marker => {
        visibleMarkers.construction ? map.addLayer(marker) : map.removeLayer(marker);
    });

    businessMarkers.forEach(marker => {
        visibleMarkers.business ? map.addLayer(marker) : map.removeLayer(marker);
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
            marker.address_of_business || ''
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
                        marker.id ? 'business' : 'household');

                const title = marker.title ||
                    marker.business_name ||
                    marker.homeowner_name ||
                    'Unnamed Marker';

                const subtitle = marker.description ||
                    marker.address_of_construction ||
                    marker.address_of_business ||
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

    map.closePopup();
}

function highlightSearchResult(markerData) {
    if (activeSearchMarker) {
        map.removeLayer(activeSearchMarker);
    }

    const lat = parseFloat(markerData.latitude);
    const lng = parseFloat(markerData.longitude);

    const highlightIcon = L.divIcon({
        className: 'highlighted-marker',
        html: `<div style="
            width: 20px;
            height: 20px;
            background: #ffeb3b;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(255, 235, 59, 0.8);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    activeSearchMarker = L.marker([lat, lng], { icon: highlightIcon }).addTo(map);

    map.flyTo([lat, lng], 18, {
        duration: 1
    });

    let popupContent = '';
    const type = markerData.marker_type ||
        (markerData.construction_id ? 'construction' :
            markerData.id ? 'business' : 'household');

    if (type === 'utility') {
        popupContent = createUtilityPopup(markerData);
    } else if (type === 'construction') {
        popupContent = createConstructionPopup(markerData);
    } else if (type === 'business') {
        popupContent = createBusinessPopup(markerData);
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

    // Hide search results after selection
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// Create construction popup with modal button
function createUtilityPopup(utility) {
    const ownerName = `${utility.first_name || ''} ${utility.middle_name || ''} ${utility.last_name || ''}`.trim();

    return `
        <div class="popup-content">
            <h4>🔧 UTILITY <span class="utility-badge">Utility</span></h4>

            <div class="popup-section">
                <p><strong>Owner:</strong> ${ownerName || 'Not specified'}</p>
                <p><strong>Provider:</strong> ${utility.provider || 'Not specified'}</p>
                <p><strong>Address:</strong> ${utility.address_of_utility || 'Not specified'}</p>
            </div>

             <div class="popup-section">
                <p><strong>Status:</strong> <span class="status-${utility.status?.toLowerCase() || 'pending'}">${utility.status || 'Pending'}</span></p>
                <p><strong>Application Date:</strong> ${utility.request_date}</p>
            </div>

            <button class="view-details-btn"
                onclick="showUtilitiesDetails(${utility.id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

function createConstructionPopup(construction) {
    const ownerName = `${construction.first_name || ''} ${construction.middle_name || ''} ${construction.last_name || ''}`.trim();

    return `
        <div class="popup-content">
            <h4>🏗️ CONSTRUCTION SITE <span class="construction-badge">Construction</span></h4>
            
            <div class="popup-section">
                <p><strong>Permit No:</strong> ${construction.permit_no || 'Pending'}</p>
                <p><strong>Homeowner:</strong> ${ownerName || 'Not specified'}</p>
                <p><strong>Contractor:</strong> ${construction.contractor_name || 'Not specified'}</p>
                <p><strong>Address:</strong> ${construction.address_of_construction || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Start Date:</strong> ${formatDate(construction.start_date)}</p>
                <p><strong>End Date:</strong> ${formatDate(construction.end_date)}</p>
                <p><strong>Payment Status:</strong> <span class="status-${construction.payment_status?.toLowerCase() || 'unknown'}">${construction.payment_status || 'Unknown'}</span></p>
            </div>
            
            <button class="view-details-btn" onclick="showConstructionDetails(${construction.id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Create business popup with modal button
function createBusinessPopup(business) {
    const ownerName = `${business.first_name || ''} ${business.middle_name || ''} ${business.last_name || ''}`.trim();

    return `
        <div class="popup-content">
            <h4>🏪 BUSINESS <span class="business-badge">Business</span></h4>
            
            <div class="popup-section">
                <p><strong>Business Name:</strong> ${business.business_name || 'Not specified'}</p>
                <p><strong>Owner:</strong> ${ownerName || 'Not specified'}</p>
                <p><strong>Type:</strong> ${business.type_of_business || 'Not specified'}</p>
                <p><strong>Address:</strong> ${business.address_of_business || 'Not specified'}</p>
            </div>
            
            <div class="popup-section">
                <p><strong>Status:</strong> <span class="status-${business.status?.toLowerCase() || 'pending'}">${business.status || 'Pending'}</span></p>
                <p><strong>Application Date:</strong> ${formatDate(business.application_date)}</p>
            </div>
            
            <button class="view-details-btn" onclick="showBusinessDetails(${business.id})">
                📋 View Full Details
            </button>
        </div>
    `;
}

// Create household popup with modal button
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

// MODAL FUNCTIONS
async function showUtilitiesDetails(utilitiesId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_utilities_details');
        formData.append('id', utilitiesId);

        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load utilities details');
        }

        currentMarkerData = data.data;
        displayUtilityModal(data.data);

    } catch (error) {
        console.error('ERROR LOADING UTILITY DETAILS:', error);
        alert('Error loading utilty details. Please try again.');
    }
}

async function showConstructionDetails(constructionId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_construction_details');
        formData.append('id', constructionId);

        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load construction details');
        }

        currentMarkerData = data.data;
        displayConstructionModal(data.data);

    } catch (error) {
        console.error('ERROR LOADING CONSTRUCTION DETAILS:', error);
        alert('Error loading construction details. Please try again.');
    }
}

async function showBusinessDetails(businessId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_business_details');
        formData.append('id', businessId);

        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load business details');
        }

        currentMarkerData = data.data;
        displayBusinessModal(data.data);

    } catch (error) {
        console.error('ERROR LOADING BUSINESS DETAILS:', error);
        alert('Error loading business details. Please try again.');
    }
}

async function showHouseholdDetails(markerId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_household_details');
        formData.append('id', markerId);

        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load household details');
        }

        currentMarkerData = data.data;
        displayHouseholdModal(data.data);

    } catch (error) {
        console.error('ERROR LOADING HOUSEHOLD DETAILS:', error);
        alert('Error loading household details. Please try again.');
    }
}

// Display modal functions
function displayUtilityModal(utility) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = `Utility Details - ${utility.utility_type || 'Unnamed Utility'}`;

    modalContent.innerHTML = `
        <table class="detail-table">

            <!-- Basic Information -->
            <tr>
                <td>Utility ID</td>
                <td>${utility.id || 'N/A'}</td>
            </tr>
            <tr>
                <td>Utility Type</td>
                <td>${utility.utility_type || 'N/A'}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td>
                    <span class="status-${utility.status?.toLowerCase() || 'unknown'}">
                        ${utility.status || 'Unknown'}
                    </span>
                </td>
            </tr>

            <!-- Location -->
            <tr>
                <td>Utility Address</td>
                <td>${utility.address_of_utility || 'N/A'}</td>
            </tr>
            <tr>
                <td>Owner Address</td>
                <td>${utility.owner_address || 'N/A'}</td>
            </tr>
            <tr>
                <td>Coordinates</td>
                <td>${utility.latitude || 'N/A'}, ${utility.longitude || 'N/A'}</td>
            </tr>

            <!-- Owner / Requestor -->
            <tr>
                <td>First Name</td>
                <td>${utility.first_name || 'N/A'}</td>
            </tr>
            <tr>
                <td>Middle Name</td>
                <td>${utility.middle_name || 'N/A'}</td>
            </tr>
            <tr>
                <td>Last Name</td>
                <td>${utility.last_name || 'N/A'}</td>
            </tr>
            <tr>
                <td>Suffix</td>
                <td>${utility.suffix || 'N/A'}</td>
            </tr>
            <tr>
                <td>Contact Number</td>
                <td>${utility.owner_contact_no || 'N/A'}</td>
            </tr>

            <!-- Work Details -->
            <tr>
                <td>Nature of Work</td>
                <td>${utility.nature_of_work || 'N/A'}</td>
            </tr>
            <tr>
                <td>Service Provider</td>
                <td>${utility.provider || 'N/A'}</td>
            </tr>
            <tr>
                <td>Date of Work</td>
                <td>${utility.date_of_work || 'N/A'}</td>
            </tr>

            <!-- Application Details -->
            <tr>
                <td>Request Date</td>
                <td>${formatDate(utility.request_date)}</td>
            </tr>
            <tr>
                <td>Application Date</td>
                <td>${formatDate(utility.application_date)}</td>
            </tr>
            <tr>
                <td>Agreed</td>
                <td>${utility.agreed || 'N/A'}</td>
            </tr>

            <!-- Approval Details -->
            <tr>
                <td>Approval Comments</td>
                <td>${utility.approval_comments || 'None'}</td>
            </tr>
            <tr>
                <td>Disapproval Reason</td>
                <td>${utility.disapproval_reason || 'None'}</td>
            </tr>

            <!-- System Info -->
            <tr>
                <td>Submitted By (User ID)</td>
                <td>${utility.supabase_user_id || 'N/A'}</td>
            </tr>
            <tr>
                <td>Date Created</td>
                <td>${formatDate(utility.created_at)}</td>
            </tr>
            <tr>
                <td>Last Updated</td>
                <td>${formatDate(utility.updated_at)}</td>
            </tr>

        </table>
    `;

    openModal();
}

function displayConstructionModal(construction) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = `Construction Site Details - ${construction.permit_no || 'No Permit'}`;

    modalContent.innerHTML = `
        <table class="detail-table">

            <!-- Basic Information -->
            <tr>
                <td>Construction ID</td>
                <td>${construction.id || 'N/A'}</td>
            </tr>
            <tr>
                <td>Permit Number</td>
                <td>${construction.permit_no || 'Pending'}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td>
                    <span class="status-${construction.status?.toLowerCase() || 'unknown'}">
                        ${construction.status || 'Unknown'}
                    </span>
                </td>
            </tr>

            <!-- Homeowner -->
            <tr>
                <td>Homeowner Name</td>
                <td>
                    ${construction.first_name || ''} 
                    ${construction.middle_name || ''} 
                    ${construction.last_name || ''} 
                    ${construction.suffix || ''}
                </td>
            </tr>
            <tr>
                <td>Homeowner Contact</td>
                <td>${construction.contact_no_owner || 'N/A'}</td>
            </tr>

            <!-- Contractor -->
            <tr>
                <td>Contractor Name</td>
                <td>${construction.contractor_name || 'N/A'}</td>
            </tr>
            <tr>
                <td>Contractor Contact</td>
                <td>${construction.contractor_contact_number || 'N/A'}</td>
            </tr>

            <!-- Location -->
            <tr>
                <td>Construction Address</td>
                <td>${construction.construction_address || 'N/A'}</td>
            </tr>
            <tr>
                <td>Coordinates</td>
                <td>${construction.latitude || 'N/A'}, ${construction.longitude || 'N/A'}</td>
            </tr>

            <!-- Work Details -->
            <tr>
                <td>Nature of Activity</td>
                <td>${construction.nature_of_activity || 'N/A'}</td>
            </tr>
            <tr>
                <td>Nature of Work</td>
                <td>${construction.nature_of_work || 'N/A'}</td>
            </tr>
            <tr>
                <td>Type of Work</td>
                <td>${construction.type_of_work || 'N/A'}</td>
            </tr>
            <tr>
                <td>Details of Work</td>
                <td>${construction.details_of_work || 'N/A'}</td>
            </tr>
            <tr>
                <td>Number of Workers</td>
                <td>${construction.number_of_workers || '0'}</td>
            </tr>
            <tr>
                <td>Working Days</td>
                <td>${construction.number_of_working_days || '0'}</td>
            </tr>

            <!-- Schedule -->
            <tr>
                <td>Start Date</td>
                <td>${formatDate(construction.start_date)}</td>
            </tr>
            <tr>
                <td>End Date</td>
                <td>${formatDate(construction.end_date)}</td>
            </tr>

            <!-- Payment -->
            <tr>
                <td>Fee Paid</td>
                <td>${formatCurrency(construction.fee_paid)}</td>
            </tr>
            <tr>
                <td>Payment Type</td>
                <td>${construction.payment_type || 'N/A'}</td>
            </tr>
            <tr>
                <td>Payment Status</td>
                <td>
                    <span class="status-${construction.payment_status?.toLowerCase() || 'unknown'}">
                        ${construction.payment_status || 'Unknown'}
                    </span>
                </td>
            </tr>

            <!-- Application -->
            <tr>
                <td>Application Method</td>
                <td>${construction.application_method || 'N/A'}</td>
            </tr>
            <tr>
                <td>Requirements Uploaded</td>
                <td>${construction.requirement_upload || 'No'}</td>
            </tr>
            <tr>
                <td>Agreed to Terms</td>
                <td>${construction.agreed || 'No'}</td>
            </tr>

            <!-- System Info -->
            <tr>
                <td>Last Updated</td>
                <td>${formatDate(construction.updated_at)}</td>
            </tr>

        </table>
    `;

    openModal();
}


function displayBusinessModal(business) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const ownerName = `${business.first_name || ''} ${business.middle_name || ''} ${business.last_name || ''}`.trim();

    modalTitle.textContent = `Business Details - ${business.business_name || 'Unnamed Business'}`;

    modalContent.innerHTML = `
        <table class="detail-table">
            <tr>
                <td>Business ID</td>
                <td>${business.id || 'N/A'}</td>
            </tr>
            <tr>
                <td>Business Name</td>
                <td>${business.business_name || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Type of Business</td>
                <td>${business.type_of_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Nature of Business</td>
                <td>${business.nature_of_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Nature Details</td>
                <td>${business.nature_of_business_specify || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Business Address</td>
                <td>${business.address_of_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Business Telephone</td>
                <td>${business.telephone_no_business || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Email Address</td>
                <td>${business.email_address || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Owner Name</td>
                <td>${ownerName || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Owner Telephone</td>
                <td>${business.telephone_no_owner || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Owner Address</td>
                <td>${business.address_owner || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Type of Structure</td>
                <td>${business.type_of_structure || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Structure Details</td>
                <td>${business.type_of_structure_specify || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Number of Employees</td>
                <td>${business.no_of_employees || '0'}</td>
            </tr>
            <tr>
                <td>Requirements</td>
                <td>${business.requirements || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Application Date</td>
                <td>${formatDate(business.application_date)}</td>
            </tr>
            <tr>
                <td>Status</td>
                <td><span class="status-${business.status?.toLowerCase() || 'pending'}">${business.status || 'Pending'}</span></td>
            </tr>
            <tr>
                <td>Approval Comments</td>
                <td>${business.approval_comments || 'None'}</td>
            </tr>
            <tr>
                <td>Disapproval Reason</td>
                <td>${business.disapproval_reason || 'None'}</td>
            </tr>
            <tr>
                <td>Coordinates</td>
                <td>${business.latitude}, ${business.longitude}</td>
            </tr>
        </table>
    `;

    openModal();
}

function displayHouseholdModal(household) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const markerType = household.marker_type || 'Household';

    modalTitle.textContent = `${markerType} Details - ${household.title || 'Unnamed Marker'}`;

    modalContent.innerHTML = `
        <table class="detail-table">
            <tr>
                <td>Marker ID</td>
                <td>${household.marker_id || 'N/A'}</td>
            </tr>
            <tr>
                <td>Title</td>
                <td>${household.title || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Description</td>
                <td>${household.description || 'No description'}</td>
            </tr>
            <tr>
                <td>Location</td>
                <td>${household.location || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Marker Type</td>
                <td>${markerType}</td>
            </tr>
            <tr>
                <td>Created By</td>
                <td>${household.created_by || 'Not specified'}</td>
            </tr>
            <tr>
                <td>Created Date</td>
                <td>${formatDate(household.created_at)}</td>
            </tr>
            <tr>
                <td>Coordinates</td>
                <td>${household.latitude}, ${household.longitude}</td>
            </tr>
        </table>
    `;

    openModal();
}

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

// Load all markers
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
            throw new Error('Server returned error');
        }

        allMarkersData = [
            ...data.utilities,
            ...data.constructions,
            ...data.businesses,
            ...data.households
        ];

        // Process construction markers
        data.utilities.forEach(utility => {
            if (utility.latitude && utility.longitude) {
                const popupContent = createUtilityPopup(utility);

                const marker = L.marker([parseFloat(utility.latitude), parseFloat(utility.longitude)], { icon: utilityIcon })
                    .bindPopup(popupContent)
                    .addTo(map);
                utilityMarkers.push(marker);
            }
        });

        data.constructions.forEach(construction => {
            if (construction.latitude && construction.longitude) {
                const popupContent = createConstructionPopup(construction);

                const marker = L.marker([parseFloat(construction.latitude), parseFloat(construction.longitude)], { icon: constructionIcon })
                    .bindPopup(popupContent)
                    .addTo(map);
                constructionMarkers.push(marker);
            }
        });

        // Process business markers
        data.businesses.forEach(business => {
            if (business.latitude && business.longitude) {
                const popupContent = createBusinessPopup(business);

                const marker = L.marker([parseFloat(business.latitude), parseFloat(business.longitude)], { icon: businessIcon })
                    .bindPopup(popupContent)
                    .addTo(map);
                businessMarkers.push(marker);
            }
        });

        // Process household markers
        data.households.forEach(household => {
            if (household.latitude && household.longitude) {
                const markerType = household.marker_type || 'household';
                const icon = getMarkerIcon(markerType);
                const popupContent = createHouseholdPopup(household);

                const marker = L.marker([parseFloat(household.latitude), parseFloat(household.longitude)], { icon: icon })
                    .bindPopup(popupContent)
                    .addTo(map);
                householdMarkers.push(marker);
            }
        });

        console.log(`Loaded ${constructionMarkers.length} construction sites, ${businessMarkers.length} businesses, and ${householdMarkers.length} household/other markers`);

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Check console for details.');
    }
}

function clearAllMarkers() {
    utilityMarkers.forEach(marker => map.removeLayer(marker));
    constructionMarkers.forEach(marker => map.removeLayer(marker));
    businessMarkers.forEach(marker => map.removeLayer(marker));
    householdMarkers.forEach(marker => map.removeLayer(marker));

    utilityMarkers = [];
    constructionMarkers = [];
    businessMarkers = [];
    householdMarkers = [];
}

// Barangay boundary
const blueRidgeGeoJSON = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": { "name": "Barangay Blue Ridge B" },
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

// Load house polygons from database
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
            // Create a layer group for houses
            const houseLayer = L.layerGroup();

            data.houses.forEach(house => {
                if (house.coordinates) {
                    try {
                        const coords = JSON.parse(house.coordinates);
                        // Convert [lng, lat] to [lat, lng] for Leaflet
                        const latLngCoords = coords.map(coord => [coord[1], coord[0]]);

                        // Close the polygon
                        latLngCoords.push(latLngCoords[0]);

                        const polygon = L.polygon(latLngCoords, {
                            color: '#3388ff',
                            weight: 1,
                            fillColor: '#3388ff',
                            fillOpacity: 0.1,
                            interactive: true
                        }).addTo(houseLayer);

                        // Add popup
                        polygon.bindPopup(`
                            <div class="house-popup">
                                <h4>🏠 ${house.address}</h4>
                                ${house.street_name ? `<p><strong>Street:</strong> ${house.street_name}</p>` : ''}
                                ${house.house_number ? `<p><strong>House #:</strong> ${house.house_number}</p>` : ''}
                                <button onclick="zoomToHouse(${house.house_id})" class="view-btn">Zoom To</button>
                            </div>
                        `);

                        polygon.houseId = house.house_id;

                    } catch (e) {
                        console.error('Error parsing house coordinates:', e);
                    }
                }
            });

            houseLayer.addTo(map);
            console.log(`Loaded ${data.houses.length} house polygons`);
        }
    } catch (error) {
        console.error('ERROR LOADING HOUSE POLYGONS:', error);
    }
}

// Check if point is inside a house (for marker placement)
async function checkLocationInHouse(lat, lng) {
    try {
        const formData = new FormData();
        formData.append('action', 'check_location');
        formData.append('lat', lat);
        formData.append('lng', lng);

        const response = await fetch('/Banwa/client/pages/staff/map_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        return {
            isInside: data.is_inside,
            house: data.house
        };

    } catch (error) {
        console.error('ERROR CHECKING LOCATION:', error);
        return { isInside: false, house: null };
    }
}

// Add your GeoJSON
const barangayLayer = L.geoJSON(blueRidgeGeoJSON, {
    style: {
        color: "#ff7800",
        weight: 2,
        fillColor: "#3388ff",
        fillOpacity: 0.2
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<h3>${feature.properties.name}</h3>`);
    }
}).addTo(map);

// Get bounds with padding
const bounds = barangayLayer.getBounds().pad(0.3);

// Set initial view to bounds
map.fitBounds(bounds);

// Set zoom constraints
map.options.minZoom = 17.2;
map.options.maxZoom = 22;

// Set maximum bounds with buffer
const buffer = 0.01;
const maxBounds = L.latLngBounds(
    bounds.getSouthWest().wrap([bounds.getSouth() - buffer, bounds.getWest() - buffer]),
    bounds.getNorthEast().wrap([bounds.getNorth() + buffer, bounds.getEast() + buffer])
);
map.setMaxBounds(maxBounds);

// Map controls
L.control.scale().addTo(map);
L.control.layers({ "Street Map": osmLayer, "Satellite": satelliteLayer }).addTo(map);

function resetView() {
    map.fitBounds(bounds);
}

function toggleStreetMap() {
    // Remove satellite layer if it exists
    if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
    }

    // Add OSM layer if it doesn't exist
    if (!map.hasLayer(osmLayer)) {
        osmLayer.addTo(map);
    }
}

function toggleSatellite() {
    // Remove OSM layer if it exists
    if (map.hasLayer(osmLayer)) {
        map.removeLayer(osmLayer);
    }

    // Add satellite layer if it doesn't exist
    if (!map.hasLayer(satelliteLayer)) {
        satelliteLayer.addTo(map);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);

        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        document.addEventListener('click', function (e) {
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer && !resultsContainer.contains(e.target) && e.target !== searchInput) {
                if (searchInput.value === '') {
                    resultsContainer.style.display = 'none';
                }
            }
        });
    }

    // Close modal when clicking outside
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('detail-modal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Update initialization
map.whenReady(function () {
    loadAllMarkers();
    loadHousePolygons();
    setupMapClickHandler();
    initDateTime();
    setupMobileMenuClose();
});

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
    document.addEventListener('click', function (e) {
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

// ========== ADDITIONAL FUNCTIONS NEEDED ==========

function setupMapClickHandler() {
    map.on('click', async function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Check if clicked location is inside a house
        const locationCheck = await checkLocationInHouse(lat, lng);

        if (locationCheck.isInside && locationCheck.house) {
            // Show confirmation for placing marker inside house
            showMarkerPlacementDialog(lat, lng, locationCheck.house);
        } else {
            // Show warning for placing marker outside house
            showOutsideHouseWarning(lat, lng);
        }
    });
}

function zoomToHouse(houseId) {
    console.log('Zoom to house function called for ID:', houseId);
    // Find the house polygon by houseId and zoom to it
    map.eachLayer(function (layer) {
        if (layer.houseId === houseId) {
            map.fitBounds(layer.getBounds().pad(0.1));
            layer.openPopup();
            return;
        }
    });
}

function showMarkerPlacementDialog(lat, lng, house) {
    const popupContent = `
        <div class="placement-popup">
            <h4>📍 Place Marker</h4>
            <p><strong>House:</strong> ${house.address}</p>
            <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            <div class="placement-buttons">
                <button onclick="confirmMarkerPlacement(${lat}, ${lng}, ${house.house_id}, '${house.address.replace(/'/g, "\\'")}')" class="confirm-btn">
                    ✅ Place Marker Here
                </button>
                <button onclick="map.closePopup()" class="cancel-btn">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `;

    L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
}

function showOutsideHouseWarning(lat, lng) {
    const popupContent = `
        <div class="placement-popup warning">
            <h4>⚠️ Outside Building Area</h4>
            <p>This location is not inside a registered house polygon.</p>
            <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            <div class="placement-buttons">
                <button onclick="confirmMarkerPlacement(${lat}, ${lng}, null, 'Outside House')" class="confirm-btn">
                    📍 Place Anyway
                </button>
                <button onclick="map.closePopup()" class="cancel-btn">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `;

    L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
}

function confirmMarkerPlacement(lat, lng, houseId, address) {
    map.closePopup();
    showMarkerForm(lat, lng, houseId, address);
}

function showMarkerForm(lat, lng, houseId, address) {
    const modalContent = `
        <h3>Add New Marker</h3>
        <div class="form-group">
            <label>Title:</label>
            <input type="text" id="marker-title" placeholder="Enter marker title" required>
        </div>
        <div class="form-group">
            <label>Description:</label>
            <textarea id="marker-description" placeholder="Enter marker description" rows="3"></textarea>
        </div>
        <div class="form-group">
            <label>Marker Type:</label>
            <select id="marker-type">
                <option value="household">Household</option>
                <option value="utility">Utility</option>
                <option value="incident">Incident</option>
                <option value="other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label>Location:</label>
            <input type="text" id="marker-location" value="${address}" readonly>
        </div>
        <div class="form-group">
            <label>Coordinates:</label>
            <input type="text" id="marker-coords" value="${lat}, ${lng}" readonly>
        </div>
        <input type="hidden" id="marker-house-id" value="${houseId || ''}">
        <div class="form-buttons">
            <button onclick="submitMarker()" class="submit-btn">Add Marker</button>
            <button onclick="closeMarkerForm()" class="cancel-btn">Cancel</button>
        </div>
    `;

    document.getElementById('modal-title').textContent = 'Add New Marker';
    document.getElementById('modal-content').innerHTML = modalContent;
    openModal();
}

function submitMarker() {
    const markerData = {
        title: document.getElementById('marker-title').value,
        description: document.getElementById('marker-description').value,
        marker_type: document.getElementById('marker-type').value,
        location: document.getElementById('marker-location').value,
        latitude: parseFloat(document.getElementById('marker-coords').value.split(',')[0]),
        longitude: parseFloat(document.getElementById('marker-coords').value.split(',')[1]),
        house_id: document.getElementById('marker-house-id').value || null
    };

    console.log('Marker data to save:', markerData);
    alert('Marker save function needs to be implemented!');
    closeModal();
}

function closeMarkerForm() {
    closeModal();
}