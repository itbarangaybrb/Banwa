// function updateDateTime() {
//     const now = new Date();
//     const options = { 
//         weekday: 'long', 
//         year: 'numeric', 
//         month: 'long',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//     };
//     document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
// }

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav_select');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function setupDateValidation() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start_date').min = today;

    document.getElementById('start_date').addEventListener('change', function () {
        document.getElementById('end_date').min = this.value;
    });
}

// =========================
// Input Validation
// =========================
function validateInput(input, rules = {}) {
    const wrapper = input.closest('.label-and-input');
    const errorEl = wrapper.querySelector('.error-msg');
    const value = input.type === 'checkbox' ? input.checked : input.value.trim();

    if (rules.required && ((input.type === 'checkbox' && !value) || (!input.type.includes('checkbox') && value === ''))) {
        input.classList.add('error');
        errorEl.textContent = rules.message || 'This field is required';
        errorEl.classList.add('show');
        return false;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
        input.classList.add('error');
        errorEl.textContent = rules.errorMessage || 'Invalid format';
        errorEl.classList.add('show');
        return false;
    }

    if (rules.min !== undefined && value && parseFloat(value) < rules.min) {
        input.classList.add('error');
        errorEl.textContent = `Minimum value is ${rules.min}`;
        errorEl.classList.add('show');
        return false;
    }
    if (rules.max !== undefined && value && parseFloat(value) > rules.max) {
        input.classList.add('error');
        errorEl.textContent = `Maximum value is ${rules.max}`;
        errorEl.classList.add('show');
        return false;
    }

    if (input.type === 'file' && value) {
        const files = input.files;
        const allowedTypes = rules.allowedTypes || [];
        const maxSize = rules.maxSize || 5 * 1024 * 1024;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (allowedTypes.length && !allowedTypes.includes(fileExt)) {
                input.classList.add('error');
                errorEl.textContent = `Invalid file type: ${file.name}`;
                errorEl.classList.add('show');
                return false;
            }
            if (file.size > maxSize) {
                input.classList.add('error');
                errorEl.textContent = `File too large: ${file.name}`;
                errorEl.classList.add('show');
                return false;
            }
        }
    }

    input.classList.remove('error');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
    return true;
}

function setupFormValidation() {
    const form = document.getElementById('construction-form');
    if (!form) return;

    const fields = {
        permit_no: { required: true },
        homeowner_name: { required: true },
        contractor_name: { required: true },
        address_of_construction: { required: true },
        latitude: { required: true, pattern: /^-?\d{1,2}\.\d{6,8}$/, errorMessage: 'Enter valid latitude (decimal)' },
        longitude: { required: true, pattern: /^-?\d{1,3}\.\d{6,8}$/, errorMessage: 'Enter valid longitude (decimal)' },
        nature_of_activity: { required: true },
        type_of_work: { required: true },
        details_of_work: { required: true },
        start_date: { required: true },
        end_date: { required: true },
        num_of_workers: { required: true, min: 1 },
        num_of_working_days: { required: true, min: 1 },
        fee_paid: { required: true, min: 0 },
        payment_type: { required: true },
        payment_status: { required: true },
        blueprint_image: { required: true, allowedTypes: ['jpg', 'jpeg', 'png', 'pdf'], maxSize: 5 * 1024 * 1024 },
        additional_images: { allowedTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'], maxSize: 5 * 1024 * 1024 }
    };

    Object.keys(fields).forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => validateInput(input, fields[id]));
            if (input.type === 'file') input.addEventListener('change', () => validateInput(input, fields[id]));
        }
    });

    form.addEventListener('submit', function (e) {
        // e.preventDefault();

        let isValid = true;
        Object.keys(fields).forEach(id => {
            const input = document.getElementById(id);
            if (input && !validateInput(input, fields[id])) isValid = false;
        });

        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            const wrapper = document.getElementById('end_date').closest('.label-and-input');
            wrapper.querySelector('.error-msg').textContent = 'End date cannot be before start date';
            errorEl.classList.add('show');
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault(); // block only if invalid
        }
    }, { once: true });
}

// =========================
// Map & Coordinate Functions
// =========================
function openMapPicker() {
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <div class="map-modal-header">
                    <h3>Select Construction Location</h3>
                    <button class="close-map" onclick="closeMapPicker()">Close</button>
                </div>
                <div class="coordinate-display">
                    Click on the map to select location: <span id="current-coords">Not selected</span>
                </div>
            </div>
            <div id="map-container"></div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    initializeMapPicker();
}

function closeMapPicker() {
    const modal = document.querySelector('.map-modal');
    if (modal) modal.remove();
}

function initializeMapPicker() {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Â© OpenStreetMap contributors' }).addTo(map);

    let marker = null;

    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Update visible coords
        document.getElementById('current-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        // Remove existing marker
        if (marker) map.removeLayer(marker);

        // Add new marker
        marker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Location').openPopup();

        // Update form fields
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');

        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);

        // Dispatch events so validators react to programmatic changes
        latInput.dispatchEvent(new Event('input', { bubbles: true }));
        latInput.dispatchEvent(new Event('change', { bubbles: true }));
        lngInput.dispatchEvent(new Event('input', { bubbles: true }));
        lngInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Show preview
        document.getElementById('map-preview').style.display = 'block';
        document.getElementById('selected-location').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });

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
                    [121.07449698388697, 14.62017411386342]
                ]]
            }
        }]
    };
    L.geoJSON(blueRidgeGeoJSON, { style: { color: "#ff7800", weight: 2, fillColor: "#3388ff", fillOpacity: 0.2 } }).addTo(map);
}

function validateCoordinates() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const lat = latInput.value.trim();
    const lng = lngInput.value.trim();

    // Regex for manual validation
    const latRegex = /^-?\d{1,2}\.\d{6,8}$/;
    const lngRegex = /^-?\d{1,3}\.\d{6,8}$/;

    // If both have non-empty values and both match the regex -> clear errors and return true
    if (lat && lng && latRegex.test(lat) && lngRegex.test(lng)) {
        latInput.classList.remove('error');
        lngInput.classList.remove('error');
        const latWrapper = latInput.closest('.label-and-input');
        const lngWrapper = lngInput.closest('.label-and-input');
        if (latWrapper) latWrapper.querySelector('.error-msg').textContent = '';
        if (lngWrapper) lngWrapper.querySelector('.error-msg').textContent = '';
        return true;
    }

    // If both are empty, show required error (consistent with other fields)
    if (!lat && !lng) {
        latInput.classList.add('error');
        lngInput.classList.add('error');
        const latWrapper = latInput.closest('.label-and-input');
        const lngWrapper = lngInput.closest('.label-and-input');
        if (latWrapper) latWrapper.querySelector('.error-msg').textContent = 'Latitude is required';
        if (lngWrapper) lngWrapper.querySelector('.error-msg').textContent = 'Longitude is required';
        return false;
    }

    // If one or both present but invalid, show specific messages
    let valid = true;

    if (!lat || !latRegex.test(lat)) {
        latInput.classList.add('error');
        const wrapper = latInput.closest('.label-and-input');
        if (wrapper) wrapper.querySelector('.error-msg').textContent = lat ? 'Enter valid latitude (decimal)' : 'Latitude is required';
        valid = false;
    } else {
        latInput.classList.remove('error');
        const wrapper = latInput.closest('.label-and-input');
        if (wrapper) wrapper.querySelector('.error-msg').textContent = '';
    }

    if (!lng || !lngRegex.test(lng)) {
        lngInput.classList.add('error');
        const wrapper = lngInput.closest('.label-and-input');
        if (wrapper) wrapper.querySelector('.error-msg').textContent = lng ? 'Enter valid longitude (decimal)' : 'Longitude is required';
        valid = false;
    } else {
        lngInput.classList.remove('error');
        const wrapper = lngInput.closest('.label-and-input');
        if (wrapper) wrapper.querySelector('.error-msg').textContent = '';
    }

    return valid;
}



function setupCoordinateValidation() {
    const form = document.getElementById('construction-form');
    if (form) form.addEventListener('submit', function (e) {
        if (!validateCoordinates()) e.preventDefault();
    });
}

function setupCoordinateAutoFormat() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput && lngInput) {
        latInput.addEventListener('blur', function () { if (this.value && !this.value.includes('.')) this.value = parseFloat(this.value).toFixed(6); });
        lngInput.addEventListener('blur', function () { if (this.value && !this.value.includes('.')) this.value = parseFloat(this.value).toFixed(6); });
    }
}

// =========================
// Initialize everything
// =========================
document.addEventListener('DOMContentLoaded', function () {
    // updateDateTime();
    // setInterval(updateDateTime, 1000);
    setupNavigation();
    setupDateValidation();
    setupCoordinateValidation();
    setupCoordinateAutoFormat();
    setupFormValidation();
});
