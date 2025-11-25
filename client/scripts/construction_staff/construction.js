function updateDateTime() {
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
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav_select');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function setupDateValidation() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start_date').min = today;
    
    document.getElementById('start_date').addEventListener('change', function() {
        document.getElementById('end_date').min = this.value;
    });
}

// Coordinate and Map Functions
function openMapPicker() {
    // Create and show map modal
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-modal-header">
                <h3>Select Construction Location</h3>
                <button class="close-map" onclick="closeMapPicker()">Close</button>
            </div>
            <div class="coordinate-display">
                Click on the map to select location: <span id="current-coords">Not selected</span>
            </div>
            <div id="map-container"></div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Initialize map
    initializeMapPicker();
}

function closeMapPicker() {
    const modal = document.querySelector('.map-modal');
    if (modal) {
        modal.remove();
    }
}

function initializeMapPicker() {
    // Default coordinates for Barangay Blue Ridge B
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;
    
    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Â© OpenStreetMap contributors'
    }).addTo(map);
    
    let marker = null;
    
    // Add click event to map
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Update coordinate display
        document.getElementById('current-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Remove existing marker
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Add new marker
        marker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Selected Location')
            .openPopup();
        
        // Update form fields
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
        
        // Show preview
        document.getElementById('map-preview').style.display = 'block';
        document.getElementById('selected-location').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });
    
    // Add barangay boundary
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
    
    L.geoJSON(blueRidgeGeoJSON, {
        style: { color: "#ff7800", weight: 2, fillColor: "#3388ff", fillOpacity: 0.2 }
    }).addTo(map);
}

function validateCoordinates() {
    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    
    const latRegex = /^-?\d{1,2}\.\d{6,8}$/;
    const lngRegex = /^-?\d{1,3}\.\d{6,8}$/;
    
    if (!latRegex.test(lat) || !lngRegex.test(lng)) {
        alert('Please enter valid coordinates in decimal format (e.g., 14.617500, 121.075600)');
        return false;
    }
    
    return true;
}

function setupCoordinateValidation() {
    // Add form validation for coordinates
    const form = document.getElementById('construction-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validateCoordinates()) {
                e.preventDefault();
            }
        });
    }
}

// Auto-fill coordinates when manually typing (optional enhancement)
function setupCoordinateAutoFormat() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput && lngInput) {
        latInput.addEventListener('blur', function() {
            if (this.value && !this.value.includes('.')) {
                // Auto-format to 6 decimal places if user enters whole number
                this.value = parseFloat(this.value).toFixed(6);
            }
        });
        
        lngInput.addEventListener('blur', function() {
            if (this.value && !this.value.includes('.')) {
                // Auto-format to 6 decimal places if user enters whole number
                this.value = parseFloat(this.value).toFixed(6);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupNavigation();
    setupDateValidation();
    setupCoordinateValidation();
    setupCoordinateAutoFormat();
});