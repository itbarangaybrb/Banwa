// Map variables
const map = L.map('map').setView([14.6175, 121.0756], 17);
let constructionMarkers = [];
let businessMarkers = [];
let visibleMarkers = {
    construction: true,
    business: true
};

// Tile layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri'
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
    const btn = event.target;
    
    if (type === 'all') {
        visibleMarkers.construction = !visibleMarkers.construction || !visibleMarkers.business;
        visibleMarkers.business = visibleMarkers.construction;
    } else {
        visibleMarkers[type] = !visibleMarkers[type];
    }
    
    // Update button states
    document.querySelectorAll('.toggle-btn').forEach(button => {
        if (button.textContent.includes('All')) {
            button.classList.toggle('active', visibleMarkers.construction && visibleMarkers.business);
        } else if (button.textContent.includes('Business')) {
            button.classList.toggle('active', visibleMarkers.business);
        } else if (button.textContent.includes('Construction')) {
            button.classList.toggle('active', visibleMarkers.construction);
        }
    });
    
    // Update marker visibility
    updateMarkerVisibility();
}

function updateMarkerVisibility() {
    constructionMarkers.forEach(marker => {
        if (visibleMarkers.construction) {
            map.addLayer(marker);
        } else {
            map.removeLayer(marker);
        }
    });
    
    businessMarkers.forEach(marker => {
        if (visibleMarkers.business) {
            map.addLayer(marker);
        } else {
            map.removeLayer(marker);
        }
    });
}

// Load all markers
async function loadAllMarkers() {
    clearAllMarkers();
    
    try {
        const formData = new FormData();
        formData.append('action', 'get_markers');
        
        const response = await fetch('map.php', {
            method: 'POST',
            body: formData
        });
        
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

        // Process construction markers - FIXED: Add markers to map immediately
        data.constructions.forEach(construction => {
            if (construction.latitude && construction.longitude) {
                const popupContent = `
                    <div class="popup-content">
                        <h4>🏗️ CONSTRUCTION SITE <span class="construction-badge">Construction</span></h4>
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
                    </div>
                `;

                const marker = L.marker([parseFloat(construction.latitude), parseFloat(construction.longitude)], { icon: constructionIcon })
                    .bindPopup(popupContent)
                    .addTo(map); // FIXED: Add to map immediately
                constructionMarkers.push(marker);
            }
        });

        // Process business markers - FIXED: Add markers to map immediately
        data.businesses.forEach(business => {
            if (business.latitude && business.longitude) {
                const ownerName = `${business.first_name || ''} ${business.middle_name || ''} ${business.last_name || ''}`.trim();
                
                const popupContent = `
                    <div class="popup-content">
                        <h4>🏪 BUSINESS <span class="business-badge">Business</span></h4>
                        <div class="popup-section">
                            <p><strong>Business Name:</strong> ${business.business_name || 'Not specified'}</p>
                            <p><strong>Owner:</strong> ${ownerName || 'Not specified'}</p>
                            <p><strong>Type:</strong> ${business.type_of_business || 'Not specified'}</p>
                            <p><strong>Nature:</strong> ${business.nature_of_business || 'Not specified'}</p>
                        </div>
                        
                        <div class="popup-section">
                            <p><strong>Address:</strong> ${business.address_of_business || 'Not specified'}</p>
                            <p><strong>Structure:</strong> ${business.type_of_structure || 'Not specified'}</p>
                            <p><strong>Employees:</strong> ${business.no_of_employees || '0'}</p>
                            <p><strong>Status:</strong> <span class="status-${business.status?.toLowerCase() || 'pending'}">${business.status || 'Pending'}</span></p>
                        </div>
                        
                        <div class="popup-section">
                            <p><strong>Business Tel:</strong> ${business.telephone_no_business || 'Not specified'}</p>
                            <p><strong>Owner Tel:</strong> ${business.telephone_no_owner || 'Not specified'}</p>
                            <p><strong>Email:</strong> ${business.email_address || 'Not specified'}</p>
                            <p><strong>Application Date:</strong> ${formatDate(business.application_date)}</p>
                        </div>
                    </div>
                `;

                const marker = L.marker([parseFloat(business.latitude), parseFloat(business.longitude)], { icon: businessIcon })
                    .bindPopup(popupContent)
                    .addTo(map); // FIXED: Add to map immediately
                businessMarkers.push(marker);
            }
        });

        console.log(`Loaded ${constructionMarkers.length} construction sites and ${businessMarkers.length} businesses`);

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Check console for details.');
    }
}

// Debug function
async function debugLoadMarkers() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_markers');
        
        const response = await fetch('map.php', {
            method: 'POST',
            body: formData
        });
        
        const text = await response.text();
        
        document.getElementById('debug-info').style.display = 'block';
        document.getElementById('debug-output').textContent = text;
        
        console.log('Full response:', text);
        
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
    businessMarkers.forEach(marker => map.removeLayer(marker));
    constructionMarkers = [];
    businessMarkers = [];
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

// Map controls
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