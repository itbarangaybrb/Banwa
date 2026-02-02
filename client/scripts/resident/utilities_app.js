// Configuration imports for service worker registration and address data
const UTILITY_HANDLER_URL = '/Banwa/server/handlers/staff/utility/utility_handler.php';

import { registerServiceWorker } from '../../../register_sw.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';

registerServiceWorker();

/**
 * Switches the visible panel in the multi-step form interface
 * @param {string} panelId - The ID of the panel to display ('owner', 'utilities', 'waiver', or 'summary')
 */
function switchPanel(panelId) {
    const panels = ['owner', 'utilities', 'waiver', 'summary'].map(id => document.getElementById(id))
    panels.forEach(panel => { panel.classList.toggle('hidden', panel.id !== panelId) });
    window.scrollTo(0, 0);
}

// Initialize the form with owner panel visible
switchPanel('owner');

// Form element references for owner information section
const firstName = document.getElementById('firstName');
const middleName = document.getElementById('middleName');
const suffix = document.getElementById('suffix');
const lastName = document.getElementById('lastName');
const contactNoOwner = document.getElementById('contactNoOwner');
const lotNo = document.getElementById('lotNo');
const street = document.getElementById('street');

// Form element references for utilities information section
const requestDate = document.getElementById('requestDate');
const dateOfWork = document.getElementById('dateOfWork');
const natureOfWork = document.getElementById('natureOfWork');
const provider = document.getElementById('provider');
const utilityLotNo = document.getElementById('utilityLotNo');
const utilityStreet = document.getElementById('utilityStreet');

// Form element references for waiver agreement section
const waiverFullname = document.getElementById('waiverFullname');
const agreeCheckBox = document.getElementById('agreeCheckBox');

/**
 * Comprehensive validation utility for form input fields
 * Provides methods to validate different input types and display error messages
 */
const validator = (() => {
    /**
     * Gets the wrapper element containing the input and error message
     * @param {HTMLElement} el - The input element
     * @returns {HTMLElement} - The parent wrapper element
     */
    function getWrapper(el) { return el.closest('.label-and-input'); }

    /**
     * Gets the error message element associated with an input
     * @param {HTMLElement} el - The input element
     * @returns {HTMLElement} - The error message span element
     */
    function getErrorEl(el) { return getWrapper(el).querySelector('.error-msg'); }

    /**
     * Displays an error message for an invalid input field
     * @param {HTMLElement} el - The input element with validation error
     * @param {string} message - The error message to display
     */
    function showError(el, message) {
        const errorEl = getErrorEl(el);
        el.classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    /**
     * Clears any error state from a validated input field
     * @param {HTMLElement} el - The input element to clear
     */
    function clearError(el) {
        const errorEl = getErrorEl(el);
        el.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }

    /**
     * Validates text input fields with optional normalization and pattern rules
     * @param {HTMLInputElement} input - The text input element
     * @param {string} message - Required field error message
     * @param {Object} rules - Validation rules configuration
     * @returns {boolean} - Whether the input is valid
     */
    function validateText(input, message, rules = {}) {
        if (!input) return true;
        let value = input.value.trim();
        if (rules.normalizeSpaces) value = value.replace(/\s+/g, ' ').trim();
        if (value === '' || value === 'select') { showError(input, message); return false; }
        if (rules.lettersOnly && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
            showError(input, rules.errorMessage || 'Only letters with single spaces are allowed'); return false;
        }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || message); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || message); return false; }
        clearError(input); return true;
    }

    /**
     * Validates select/dropdown elements for required selection
     * @param {HTMLSelectElement} input - The select element
     * @param {string} message - Required field error message
     * @returns {boolean} - Whether a valid option is selected
     */
    function validateSelect(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '' || value === 'select') { showError(input, message); return false; }
        clearError(input); return true;
    }

    /**
     * Validates numeric input fields with digit and length constraints
     * @param {HTMLInputElement} input - The number input element
     * @param {string} message - Required field error message
     * @param {Object} rules - Validation rules for numeric input
     * @returns {boolean} - Whether the number is valid
     */
    function validateNumber(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '') { showError(input, message); return false; }
        if (!/^\d+$/.test(value)) { showError(input, rules.errorMessage || 'Only numeric digits are allowed'); return false; }
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(input, rules.errorMessage || message);
            return false;
        }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `Number must be at least ${rules.minLength} digits`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Number cannot exceed ${rules.maxLength} digits`); return false; }
        clearError(input); return true;
    }

    /**
     * Validates checkbox elements for required agreement/selection
     * @param {HTMLInputElement} input - The checkbox element
     * @param {string} message - Required field error message
     * @returns {boolean} - Whether the checkbox is checked
     */
    function validateCheckbox(input, message) { if (!input.checked) { showError(input, message); return false; } clearError(input); return true; }

    /**
     * Validates address fields and verifies existence in addressCoordinates database
     * Also automatically populates latitude/longitude if address is valid
     * @param {HTMLInputElement} lotInput - Lot number input element
     * @param {HTMLSelectElement} streetInput - Street selection element
     * @returns {boolean} - Whether the address is valid and exists
     */
    function validateAddress(lotInput, streetInput) {
        const lot = lotInput.value.trim(), street = streetInput.value.trim();
        if (!lot) return validator.number(lotInput, 'Lot no. is required');
        if (!street || street === 'select') return validator.select(streetInput, 'Street is required');
        const fullAddress = `${lot} ${street}`;
        const match = addressCoordinates.find(a => a.address === fullAddress);
        if (!match) {
            const wrapper = streetInput.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            streetInput.classList.add('error');
            errorEl.textContent = 'Street does not exist for this lot';
            errorEl.classList.add('show');
            return false;
        }
        clearError(streetInput);
        const lat = document.getElementById('latitude2');
        const lng = document.getElementById('longitude2');
        if (lat && lng) { lat.value = match.lat.toFixed(6); lng.value = match.lng.toFixed(6); }
        return true;
    }

    /**
     * Validates date input fields with various constraints (past/future/today only, min/max dates)
     * @param {HTMLInputElement} input - The date input element
     * @param {string} message - Required field error message
     * @param {Object} rules - Validation rules for date input
     * @returns {boolean} - Whether the date is valid
     */
    function validateDate(input, message, rules = {}) {
        if (!input) return true;

        const value = input.value;
        if (!value) { showError(input, message); return false; }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            showError(input, rules.errorMessage || 'Invalid date');
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (rules.pastOnly && date >= today) {
            showError(input, rules.errorMessage || 'Date must be in the past');
            return false;
        }

        if (rules.futureOnly && date <= today) {
            showError(input, rules.errorMessage || 'Date must be in the future');
            return false;
        }

        if (rules.todayOnly) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const inputDate = new Date(value);
            inputDate.setHours(0, 0, 0, 0);

            if (inputDate.getTime() !== today.getTime()) {
                showError(input, rules.errorMessage || 'Date must be today');
                return false;
            }
        }

        if (rules.minDate && date < new Date(rules.minDate)) {
            showError(input, rules.errorMessage || `Date must be after ${rules.minDate}`);
            return false;
        }

        if (rules.maxDate && date > new Date(rules.maxDate)) {
            showError(input, rules.errorMessage || `Date must be before ${rules.maxDate}`);
            return false;
        }

        clearError(input);
        return true;
    }

    // Public API of the validator module
    return {
        text: validateText,
        select: validateSelect,
        number: validateNumber,
        checkbox: validateCheckbox,
        address: validateAddress,
        date: validateDate,
        clear: clearError
    };
})();

/**
 * Configuration array defining validation rules for all form fields
 * Each object specifies element, validation type, error message, and any additional rules
 */
const validationConfig = [
    { el: firstName, type: 'text', message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: lastName, type: 'text', message: 'Last name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: contactNoOwner, type: 'number', message: 'Contact no. is required', rules: { pattern: /^[0-9]{11}$/, minLength: 7, maxLength: 11, errorMessage: 'Contact no. must be exactly 11 digits' } },
    { el: lotNo, type: 'number', message: 'Lot no. is required', rules: { maxLength: 2 } },
    { el: street, type: 'select', message: 'Street is required' },

    { el: requestDate, type: 'date', message: 'Request date is required', rules: { todayOnly: true } },
    { el: dateOfWork, type: 'date', message: 'Date of work is required', rules: { futureOnly: true } },
    { el: natureOfWork, type: 'select', message: 'Nature of work is required' },
    { el: provider, type: 'select', message: 'Provider is required' },
    { el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' },
    { el: utilityLotNo, type: 'number', message: 'Lot no. is required', rules: { maxLength: 2 } },
    { el: utilityStreet, type: 'select', message: 'Street is required' },
];

/**
 * Validates a single form field based on its configuration
 * @param {Object} config - Validation configuration object
 * @returns {boolean} - Whether the field passed validation
 */
function validateField(config) {
    const { el, type, message, rules } = config;
    if (!el) return true;

    switch (type) {
        case 'number': return validator.number(el, message, rules);
        case 'text': return validator.text(el, message, rules);
        case 'checkbox': return validator.checkbox(el, message);
        case 'select': return validator.select(el, message);
        case 'date': return validator.date(el, message, rules);
    }
}

/**
 * Sets up real-time validation on form field interactions
 * Validates on blur and clears errors on input for immediate feedback
 */
(() => {
    validationConfig.forEach(config => {
        const { el, type } = config;
        if (!el) return;

        const targets = [el];

        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(config));
            target.addEventListener('input', () => validator.clear(target));
        });
    });

    // Address validation for owner address
    [lotNo, street].forEach(el => {
        el.addEventListener('blur', () => {
            if (lotNo.value && street.value) validator.address(lotNo, street);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Address validation for utilities address
    [utilityLotNo, utilityStreet].forEach(el => {
        el.addEventListener('blur', () => {
            if (utilityLotNo.value && utilityStreet.value) validator.address(utilityLotNo, utilityStreet);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Input sanitization for numeric fields (remove non-digit characters)
    [contactNoOwner, lotNo, utilityLotNo].forEach(el => {
        el.addEventListener('input', () => {
            el.value = el.value.replace(/\D/g, '');
            validator.clear(el);
        });
    });
})();

/**
 * Validates a group of fields for a specific form step
 * @param {Array} fields - Array of form elements to validate
 * @returns {boolean} - Whether all fields in the step are valid
 */
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

/**
 * Handles navigation from owner information panel to utilities information panel
 * Validates all owner fields and updates waiver display before proceeding
 */
document.getElementById('nextToUtilities').addEventListener('click', () => {
    const stepFields = [firstName, lastName, contactNoOwner, lotNo, street];

    if (!validateStep(stepFields)) return;
    if (!validator.address(lotNo, street)) return;

    waiverFullname.textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`;
    switchPanel('utilities');
});

/**
 * Handles navigation from utilities information panel to waiver panel
 * Validates all utilities fields before proceeding
 */
document.getElementById('nextToWaiver').addEventListener('click', () => {
    const stepFields = [requestDate, dateOfWork, natureOfWork, provider]
    if (validateStep(stepFields)) {
        switchPanel('waiver');
    }
});

/**
 * Handles navigation from waiver panel to summary panel
 * Validates agreement checkbox and populates summary display with all form data
 */
document.getElementById('nextToSummary').addEventListener('click', () => {
    const lat = document.getElementById('latitude2').value;
    const lng = document.getElementById('longitude2').value;

    if (validateField({ el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' })) {
        document.getElementById('sumFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim();
        document.getElementById('sumContactNoOwner').textContent = contactNoOwner.value;
        document.getElementById('sumAddressOwner').textContent = `${lotNo.value} ${street.value}`;
        document.getElementById('sumAgreed').textContent = agreeCheckBox.checked ? 'Yes' : 'No';
        document.getElementById('sumReqDate').textContent = requestDate.value;
        document.getElementById('sumDateOfWork').textContent = dateOfWork.value;
        document.getElementById('sumNatureOfWork').textContent = natureOfWork.value;
        document.getElementById('sumProvider').textContent = provider.value;
        document.getElementById('sumAddressOfUtility').textContent = `${utilityLotNo.value} ${utilityStreet.value}` + (lat && lng ? ` (Lat: ${lat}, Lng: ${lng})` : '');

        switchPanel('summary');
    }
});

/**
 * Sets up navigation between form panels with back button functionality
 * First back button returns to services page, others navigate to previous panel
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ownerBackBtn').addEventListener('click', () => {
        window.location.href = '/Banwa/client/pages/resident/services.php';
    });

    document.getElementById('utilitiesBackBtn').addEventListener('click', () => switchPanel('owner'));
    document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('utilities'));
    document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
});

/**
 * Handles final form submission with server integration
 * Collects all form data, validates, sends to backend, and handles response
 * Includes notification permission request and success/error handling
 */
const summaryForm = document.getElementById('summaryForm');

// Clone form to prevent duplicate event listeners on page refresh
const newSummaryForm = summaryForm.cloneNode(true);
summaryForm.parentNode.replaceChild(newSummaryForm, summaryForm);

newSummaryForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }

    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Application Submitted", {
                body: "Click to view your application status",
                icon: "/Banwa/client/img/banwalogo.png",
                data: { url: "/Banwa/client/pages/resident/status.php" }
            });
        });
    }

    const confirmResult = await Swal.fire({
        title: 'Submit Application?',
        text: 'Are you sure you want to submit this application?',
        showCancelButton: true,
        confirmButtonColor: '#00247C',
        cancelButtonColor: '#ad2c2c',
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel'
    });

    if (confirmResult.isConfirmed) {
        const formData = new FormData();

        formData.append('action', 'create');
        formData.append('firstName', firstName.value);
        formData.append('middleName', middleName.value);
        formData.append('lastName', lastName.value);
        formData.append('suffix', suffix.value);
        formData.append('contactNoOwner', contactNoOwner.value);
        formData.append('addressOwner', `${lotNo.value} ${street.value}`);
        formData.append('requestDate', requestDate.value);
        formData.append('dateOfWork', dateOfWork.value);
        formData.append('natureOfWork', natureOfWork.value);
        formData.append('provider', provider.value);
        formData.append('utilityLotNo', utilityLotNo.value);
        formData.append('utilityStreet', utilityStreet.value);
        formData.append('agreed', agreeCheckBox.checked ? 1 : 0);
        const lat = document.getElementById('latitude2')?.value || '';
        const lng = document.getElementById('longitude2')?.value || '';
        formData.append('latitude2', lat);
        formData.append('longitude2', lng);
        const appDate = document.getElementById('applicationDate')?.value || '';
        formData.append('applicationDate', appDate);

        fetch(`${UTILITY_HANDLER_URL}`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Application submitted successfully! Reference ID: ' + data.id,
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.href = '/Banwa/client/pages/resident/status.php';
                    });
                } else {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Error: ' + data.message,
                        confirmButtonText: 'OK'
                    });
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire({
                    title: 'Error!',
                    text: 'Something went wrong. Check console for details.',
                    confirmButtonText: 'OK'
                });
            });
    }
});

/**
 * Opens an interactive map modal for location selection
 * @param {string} target - Identifier for which address field is being mapped ('1' for owner, '2' for utilities)
 */
function openMapPicker(target) {
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <div class="map-modal-header">
                    <h3>Select Location</h3>
                    <button class="close-map">Close</button>
                </div>
            </div>
            <div id="map-container"></div>
        </div>
    `;
    modal.dataset.target = target;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    modal.querySelector('.close-map').addEventListener('click', () => {
        const preview = document.getElementById(`map-preview-${target}`);
        if (preview) preview.style.display = 'none';
        modal.remove();
    });

    initializeMapPicker(target);
}

/**
 * Initializes Leaflet map for location selection with house polygons and interactivity
 * @param {string} target - Identifier for which address field is being mapped
 */
async function initializeMapPicker(target) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    // Handle map clicks to set location marker and populate coordinates
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Location').openPopup();

        document.getElementById(`latitude${target}`).value = lat;
        document.getElementById(`longitude${target}`).value = lng;
        document.getElementById(`map-preview-${target}`).style.display = 'block';
    });

    // Optional: Load barangay polygon for visual reference
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

    // Load houses from server database for selection
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses');
        const response = await fetch('../../pages/staff/map_handler.php', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && data.houses) {
            const houseLayer = L.layerGroup();

            data.houses.forEach(house => {
                if (house.coordinates) {
                    try {
                        const coords = JSON.parse(house.coordinates);
                        const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
                        latLngCoords.push(latLngCoords[0]); // close polygon

                        const polygon = L.polygon(latLngCoords, {
                            color: '#3388ff',
                            weight: 1,
                            fillColor: '#3388ff',
                            fillOpacity: 0.1,
                            interactive: true
                        }).addTo(houseLayer);

                        // Polygon click autofill - populate form fields when house is selected
                        polygon.on('click', function (e) {
                            const lat = e.latlng.lat.toFixed(6);
                            const lng = e.latlng.lng.toFixed(6);

                            if (marker) map.removeLayer(marker);
                            marker = L.marker([lat, lng]).addTo(map).bindPopup("Selected House").openPopup();

                            document.getElementById(`latitude${target}`).value = lat;
                            document.getElementById(`longitude${target}`).value = lng;
                            document.getElementById(`map-preview-${target}`).style.display = 'block';

                            // Only fill fields for the correct target
                            if (target === '1') { // Owner
                                const lotNo = document.getElementById('lotNo');
                                const street = document.getElementById('street');
                                lotNo.value = house.house_number || '';
                                street.value = house.street_name || '';
                                [lotNo, street].forEach(el => {
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                });
                            }

                            if (target === '2') { // Utilities
                                const utilityLot = document.getElementById('utilityLotNo');
                                const utilityStreet = document.getElementById('utilityStreet');
                                utilityLot.value = house.house_number || '';
                                utilityStreet.value = house.street_name || '';
                                document.getElementById(`latitude2`).value = lat;
                                document.getElementById(`longitude2`).value = lng;

                                [utilityLot, utilityStreet].forEach(el => {
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                });
                            }
                        });

                        // Add popup with house information
                        polygon.bindPopup(`
                            <div class="house-popup">
                                <h4>🏠 ${house.address}</h4>
                                ${house.street_name ? `<p><strong>Street:</strong> ${house.street_name}</p>` : ''}
                                ${house.house_number ? `<p><strong>House #:</strong> ${house.house_number}</p>` : ''}
                                <button onclick="zoomToHouse(${house.house_id})" class="view-btn">Zoom To</button>
                            </div>
                        `);

                    } catch (err) {
                        console.error('Error parsing house coordinates:', err);
                    }
                }
            });

            houseLayer.addTo(map);
        }
    } catch (err) {
        console.error('Error loading houses:', err);
    }
}

/**
 * Sets up coordinate field formatting to ensure proper decimal precision
 * @param {string} target - Identifier for which coordinate set to format ('1' or '2')
 */
function setupCoordinateAutoFormat(target) {
    const latInput = document.getElementById(`latitude${target}`);
    const lngInput = document.getElementById(`longitude${target}`);
    if (!latInput || !lngInput) return;

    [latInput, lngInput].forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value && !this.value.includes('.')) this.value = parseFloat(this.value).toFixed(6);
        });
    });
}

// Initialize coordinate formatting for both address sections
document.addEventListener('DOMContentLoaded', () => {
    [1, 2].forEach(target => setupCoordinateAutoFormat(target));
});

// Initialize map buttons when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => openMapPicker(btn.dataset.target));
    });
});

/**
 * Automatically populates owner information fields with user data from session
 * Fetches resident profile data to pre-fill the form for convenience
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch('/Banwa/server/api/resident/get_user.php', { credentials: 'include', cache: 'no-store' });
        const data = await resp.json();
        console.debug('utilities_app autofill response:', data);

        // fallback: if first_name missing but full_name present, split it
        if ((!data.first_name || data.first_name.trim() === '') && data.full_name) {
            const parts = data.full_name.trim().split(/\s+/);
            data.first_name = parts[0] || '';
            data.last_name = parts.length > 1 ? parts[parts.length-1] : '';
            data.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
        }

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        if (data.first_name) firstName.value = data.first_name;
        if (data.middle_name) middleName.value = data.middle_name;
        if (data.last_name) lastName.value = data.last_name;
        if (data.suffix) suffix.value = data.suffix;
        if (data.contact_no) contactNoOwner.value = data.contact_no;
    } catch (err) {
        console.error('Failed to fetch user data for autofill:', err);
    }
});