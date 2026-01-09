// Configuration
// Adjust this path to point to your existing staff handler. 
// Assuming structure: /Banwa/client/pages/resident/business_app.php -> /Banwa/scripts/business_staff/business_handler.php
import supabase from '../../../server/api/supabase.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import { registerServiceWorker } from '../../../register_sw.js';

// const API_URL = '../../../client/scripts/business_staff/business_handler.php';

registerServiceWorker();

// ==========================
// Function: Hide/Show Panels
// ==========================
function switchPanel(panelId) {
    const panels = ['owner', 'business', 'waiver', 'summary']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
    window.scrollTo(0, 0);
}

// ==========================
// Function: Validation
// ==========================
function validation() {
    // Owner form elements 
    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const suffix = document.getElementById('suffix');
    const lastName = document.getElementById('lastName');
    const contactNoOwner = document.getElementById('contactNoOwner');
    const lotNo = document.getElementById('lotNo');
    const street = document.getElementById('street');

    // Business form elements 
    const businessName = document.getElementById('businessName');
    const typeOfBusiness = document.getElementsByName('typeOfBusiness');
    const natureOfBusinessSelect = document.getElementById('natureOfBusinessSelect');
    const natureOfBusinessSpecify = document.getElementById('natureOfBusinessSpecify');
    const businessStatus = document.getElementsByName('businessStatus');
    const contactNoBusiness = document.getElementById('contactNoBusiness');
    const emailAddress = document.getElementById('emailAddress');
    const noOfEmployees = document.getElementById('noOfEmployees');
    const businessLotNo = document.getElementById('businessLotNo');
    const businessStreet = document.getElementById('businessStreet');
    const typeOfStructureSelect = document.getElementById('typeOfStructureSelect');
    const typeOfStructureSpecify = document.getElementById('typeOfStructureSpecify');
    const natureOfApplication = document.getElementById('natureOfApplication');
    const requirements = document.getElementsByName('requirements');
    const requirementUpload = document.getElementById('requirementUpload');
    const requirementsSection = document.getElementById('requirementsSection');

    // Waiver form elements
    const agreeCheckBox = document.getElementById('agreeCheckBox');

    // Show Owner panel by default
    switchPanel('owner');

    typeOfStructureSpecify.closest('.label-and-input').style.display = 'none';
    natureOfBusinessSpecify.closest('.label-and-input').style.display = 'none';
    requirementsSection.style.display = 'none';

    typeOfStructureSelect.addEventListener('change', () => handleOthersSelect(typeOfStructureSelect, typeOfStructureSpecify));
    natureOfBusinessSelect.addEventListener('change', () => handleOthersSelect(natureOfBusinessSelect, natureOfBusinessSpecify));

    natureOfApplication.addEventListener('change', (e) => natureOfApplicationSel(e.target));

    // ===============================
    // Function: Validate single input
    // ===============================
    const validator = (() => {
        function getWrapper(el) { return el.closest('.label-and-input'); }
        function getErrorEl(el) { return getWrapper(el).querySelector('.error-msg'); }
        function showError(el, message) {
            const errorEl = getErrorEl(el);
            el.classList.add('error');
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
        function clearError(el) {
            const errorEl = getErrorEl(el);
            el.classList.remove('error');
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }

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

        function validateEmail(input, message) {
            if (!input) return true;
            const value = input.value.trim();
            if (value === '') { showError(input, message); return false; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(input, 'Enter a valid email address'); return false; }
            clearError(input); return true;
        }

        function validateSelect(input, message) {
            if (!input) return true;
            const value = input.value.trim();
            if (value === '' || value === 'select') { showError(input, message); return false; }
            clearError(input); return true;
        }

        function validateNumber(input, message, rules = {}) {
            if (!input) return true;
            const value = input.value.trim();
            if (value === '') { showError(input, message); return false; }
            if (!/^\d+$/.test(value)) { showError(input, rules.errorMessage || 'Only numeric digits are allowed'); return false; }
            if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `Number must be at least ${rules.minLength} digits`); return false; }
            if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Number cannot exceed ${rules.maxLength} digits`); return false; }
            clearError(input); return true;
        }

        function validateCheckbox(input, message) { if (!input.checked) { showError(input, message); return false; } clearError(input); return true; }

        function validateFile(input, message, options = {}) {
            if (!input || input.files.length === 0) { showError(input, message); return false; }
            const file = input.files[0];
            if (options.accept?.length > 0) {
                const isValid = options.accept.some(a => a.startsWith('.') ? file.name.toLowerCase().endsWith(a.toLowerCase()) : file.type === a);
                if (!isValid) { showError(input, options.errorMessage || `Invalid file type. Accepted: ${options.accept.join(', ')}`); return false; }
            }
            if (file.size > 5 * 1024 * 1024) { showError(input, 'File exceeds 5MB'); return false; }
            clearError(input); return true;
        }

        function validateCheckboxGroup(checkboxes, message) {
            const wrapper = checkboxes[0].closest('.label-and-input');
            if (wrapper.style.display === 'none') return true;
            if (!Array.from(checkboxes).some(c => c.checked)) { showError(checkboxes[0], message); return false; }
            clearError(checkboxes[0]); return true;
        }

        function validateRadioGroup(radios, message) {
            if (!Array.from(radios).some(r => r.checked)) { showError(radios[0], message); return false; }
            clearError(radios[0]); return true;
        }

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

        return {
            text: validateText,
            email: validateEmail,
            file: validateFile,
            select: validateSelect,
            number: validateNumber,
            checkbox: validateCheckbox,
            checkboxGroup: validateCheckboxGroup,
            radioGroup: validateRadioGroup,
            address: validateAddress,
            clear: clearError
        };
    })();

    // ==============================
    // Configuration for all inputs
    // ==============================
    const validationConfig = [
        { el: firstName, type: 'text', message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
        { el: lastName, type: 'text', message: 'Last name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
        { el: contactNoOwner, type: 'number', message: 'Contact no. is required', rules: { pattern: /^[0-9]{11}$/, minLength: 7, maxLength: 11, errorMessage: 'Contact no. must be exactly 11 digits' } },
        { el: lotNo, type: 'number', message: 'Lot no. is required', rules: { maxLength: 2 } },
        { el: street, type: 'select', message: 'Street is required' },
        { el: businessName, type: 'text', message: 'Business Name is required' },
        { el: natureOfBusinessSelect, type: 'select', message: 'Nature of business is required' },
        { el: natureOfBusinessSpecify, type: 'text', message: 'Please specify the business details' },
        { el: typeOfBusiness, type: 'radio', message: 'Please select a type of business' },
        { el: businessStatus, type: 'radio', message: 'Please select business status' },
        { el: contactNoBusiness, type: 'number', message: 'Contact no. is required', rules: { pattern: /^[0-9]{11}$/, minLength: 7, maxLength: 11, errorMessage: 'Contact no. must be exactly 11 digits' } },
        { el: emailAddress, type: 'email', message: 'Email is required', rules: { errorMessage: 'Please enter a valid email address' } },
        { el: noOfEmployees, type: 'number', message: 'No. of employees is required', rules: { errorMessage: 'Number of employees must be 1 or 2 digits' } },
        { el: businessLotNo, type: 'number', message: 'Lot no. is required', rules: { maxLength: 2 } },
        { el: businessStreet, type: 'select', message: 'Street is required' },
        { el: typeOfStructureSelect, type: 'select', message: 'Type of structure is required' },
        { el: typeOfStructureSpecify, type: 'text', message: 'Please specify the business details' },
        { el: natureOfApplication, type: 'select', message: 'Nature of application is required' },
        { el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' },
        { el: requirements, type: 'checkboxGroup', message: 'Please select at least one requirement' },
        { el: requirementUpload, type: 'file', message: 'Please upload a document', rules: { accept: ['.pdf', '.jpg', '.png'], errorMessage: 'Only .pdf, .jpg, or .png files are allowed' } }
    ];

    // ==============================
    // Helper: validate a field by config
    // ==============================
    function validateField(config) {
        const { el, type, message, rules } = config;
        if (!el) return true;

        switch (type) {
            case 'number': return validator.number(el, message, rules);
            case 'text': return validator.text(el, message, rules);
            case 'email': return validator.email(el, message, rules);
            case 'file': return validator.file(el, message, rules);
            case 'checkbox': return validator.checkbox(el, message);
            case 'checkboxGroup': return validator.checkboxGroup(el, message);
            case 'radio': return validator.radioGroup(el, message);
            case 'select': return validator.select(el, message);
        }
    }

    // ==============================
    // Real-time validator
    // ==============================
    (() => {
        validationConfig.forEach(config => {
            const { el, type } = config;
            if (!el) return;

            const targets = ['checkboxGroup', 'radio'].includes(type) ? Array.from(el) : [el];

            targets.forEach(target => {
                target.addEventListener('blur', () => validateField(config));
                target.addEventListener('input', () => validator.clear(target));
            });
        });

        [lotNo, street].forEach(el => {
            el.addEventListener('blur', () => {
                if (lotNo.value && street.value) validator.address(lotNo, street);
            });
            el.addEventListener('input', () => validator.clear(el));
        });

        [businessLotNo, businessStreet].forEach(el => {
            el.addEventListener('blur', () => {
                if (businessLotNo.value && businessStreet.value) validator.address(businessLotNo, businessStreet);
            });
            el.addEventListener('input', () => validator.clear(el));
        });

        [contactNoOwner, contactNoBusiness, lotNo, businessLotNo, noOfEmployees].forEach(el => {
            el.addEventListener('input', () => {
                el.value = el.value.replace(/\D/g, '');
                validator.clear(el);
            });
        });
    })();

    // ==============================
    // Button-triggered validation (for steps)
    // ==============================
    function validateStep(fields) {
        return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
    }

    // =========================
    // Owner "Next" button click
    // =========================
    document.getElementById('nextToBusiness').addEventListener('click', () => {
        const stepFields = [firstName, lastName, contactNoOwner, lotNo, street];
        if (validateStep(stepFields)) {
            document.getElementById('waiverFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value}`;
            switchPanel('business');
        }
    });

    // ============================
    // Business "Next" button click
    // ============================
    document.getElementById('nextToWaiver').addEventListener('click', () => {
        const stepFields = [
            businessName,
            typeOfBusiness,
            natureOfBusinessSelect,
            natureOfBusinessSelect.value === 'Others' ? natureOfBusinessSpecify : null,
            businessStatus,
            contactNoBusiness,
            emailAddress,
            requirements,
            requirementUpload,
            noOfEmployees,
            natureOfApplication,
            typeOfStructureSelect,
            typeOfStructureSelect.value === 'Others' ? typeOfStructureSpecify : null,
            businessLotNo,
            businessStreet,
            noOfEmployees
        ].filter(Boolean);

        if (validateStep(stepFields)) {
            document.getElementById('waiverFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value}`;
            switchPanel('waiver');
        }
    });

    // ==========================
    // Waiver "Next" button click
    // ==========================
    document.getElementById('nextToSummary').addEventListener('click', () => {
        const lat = document.getElementById('latitude2').value;
        const lng = document.getElementById('longitude2').value;

        if (validateField({ el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' })) {
            document.getElementById('sumBusinessName').textContent = businessName.value;
            document.getElementById('sumTypeOfBusiness').textContent = Array.from(typeOfBusiness).find(r => r.checked)?.value || '';
            document.getElementById('sumNatureOfBusiness').textContent = (natureOfBusinessSelect.value === 'Others' ? natureOfBusinessSpecify.value : natureOfBusinessSelect.value).trim();
            document.getElementById('sumBusinessStatus').textContent = Array.from(businessStatus).find(r => r.checked)?.value || '';
            document.getElementById('sumAddressOfBusiness').textContent = `${businessLotNo.value} ${businessStreet.value}` + (lat && lng ? ` (Lat: ${lat}, Lng: ${lng})` : '');
            document.getElementById('sumContactNoBusiness').textContent = contactNoBusiness.value;
            document.getElementById('sumEmail').textContent = emailAddress.value;
            document.getElementById('sumFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim();
            document.getElementById('sumContactNoOwner').textContent = contactNoOwner.value;
            document.getElementById('sumAddressOwner').textContent = `${lotNo.value} ${street.value}`;
            document.getElementById('sumStructureType').textContent = (typeOfStructureSelect.value === 'Others' ? typeOfStructureSpecify.value : typeOfStructureSelect.value).trim();
            document.getElementById('sumRequirements').textContent = Array.from(requirements).filter(r => r.checked).map(r => r.value).join(', ');
            document.getElementById('sumEmployees').textContent = noOfEmployees.value;
            document.getElementById('sumAgreed').textContent = agreeCheckBox.checked ? 'Yes' : 'No';

            switchPanel('summary');
        }
    });

    // ==========================
    // Back buttons
    // ==========================
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('ownerBackBtn').addEventListener('click', () => {
            window.location.href = '/Banwa/client/pages/resident/services.php';
        });
        
        document.getElementById('businessBackBtn').addEventListener('click', () => switchPanel('owner'));
        document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('business'));
        document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
    });


    // FINAL FORM SUBMISSION HANDLER
    const summaryForm = document.getElementById('summaryForm');

    // Remove existing listeners to prevent duplicates
    const newSummaryForm = summaryForm.cloneNode(true);
    summaryForm.parentNode.replaceChild(newSummaryForm, summaryForm);

    newSummaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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


        if (confirm('Are you sure you want to submit this application?')) {
            const formData = new FormData();

            // 1. ADD THE ACTION (Crucial for business_handler.php)
            formData.append('action', 'create');

            // 2. CAPTURE DATA (Re-selecting elements ensures we get the latest values)
            formData.append('businessName', document.getElementById('businessName').value);
            const { data: { user } } = await supabase.auth.getUser();
            const supabaseUserId = user?.id;
            formData.append('supabase_user_id', supabaseUserId);

            // Radio Buttons: Type of Business
            const typeBiz = document.querySelector('input[name="typeOfBusiness"]:checked');
            formData.append('typeOfBusiness', typeBiz ? typeBiz.value : '');

            // Nature of Business (Split into Select and Specify for the DB)
            formData.append('natureOfBusiness', document.getElementById('natureOfBusinessSelect').value);
            formData.append('natureOfBusinessSpecify', document.getElementById('natureOfBusinessSpecify').value);

            // Address & Contacts
            formData.append('businessLotNo', document.getElementById('businessLotNo').value);
            formData.append('businessStreet', document.getElementById('businessStreet').value);
            formData.append('contactNoBusiness', document.getElementById('contactNoBusiness').value);
            formData.append('emailAddress', document.getElementById('emailAddress').value);

            // Business Status (Radio Button)
            const bizStatus = document.querySelector('input[name="businessStatus"]:checked');
            // The PHP handler expects this as an array/json, but implies a single string in your HTML structure. 
            // We send it as a key that PHP will json_encode.
            if (bizStatus) formData.append('businessStatus[]', bizStatus.value);

            // Owner Details
            formData.append('firstName', document.getElementById('firstName').value);
            formData.append('middleName', document.getElementById('middleName').value);
            formData.append('suffix', document.getElementById('suffix').value);
            formData.append('lastName', document.getElementById('lastName').value);
            formData.append('contactNoOwner', document.getElementById('contactNoOwner').value);
            formData.append('lotNo', document.getElementById('lotNo').value);
            formData.append('street', document.getElementById('street').value);

            // Structure (Split into Select and Specify)
            formData.append('typeOfStructureSelect', document.getElementById('typeOfStructureSelect').value);
            formData.append('typeOfStructureSpecify', document.getElementById('typeOfStructureSpecify').value);
            formData.append('noOfEmployees', document.getElementById('noOfEmployees').value);

            // Requirements (Checkbox Array)
            const reqCheckboxes = document.querySelectorAll('input[name="requirements"]:checked');
            reqCheckboxes.forEach((checkbox) => {
                formData.append('requirements[]', checkbox.value);
            });

            // File Upload
            const fileInput = document.getElementById('requirementUpload');
            if (fileInput.files.length > 0) {
                formData.append('requirementUpload', fileInput.files[0]);
            }

            const latitudeEl = document.getElementById('latitude2');
            const longitudeEl = document.getElementById('longitude2');
            formData.append('latitude2', latitudeEl?.value || '');
            formData.append('longitude2', longitudeEl?.value || '');

            // Application Date
            formData.append('applicationDate', document.getElementById('applicationDate').value);

            // 3. SEND TO BACKEND
            // Make sure this path points correctly to your business_handler.php
            fetch('../../scripts/staff/business_staff/business_handler.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json()) // Parse JSON response
                .then(data => {
                    console.log('Server Response:', data);
                    if (data.status === 'success') {
                        alert('Application submitted successfully! Reference ID: ' + data.id);
                        // location.reload(); // Refresh page
                        window.location.href = '/Banwa/client/pages/resident/status.php';
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                    alert('Something went wrong. Check console for details.');
                });
        }
    });
}

validation();

// ==============================
// Function: Get current date
// ==============================
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==============================
// Function: update the applciation date
// ==============================
function updateApplicationDate() {
    const dateInput = document.getElementById('applicationDate');
    if (dateInput) {
        dateInput.value = getCurrentDateString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);
});

// ===============================================
// Function: Handler "Others" Select input Show Sepecify
// ===============================================
function handleOthersSelect(selectEl, specifyEl) {
    const wrapper = specifyEl.closest('.label-and-input');
    if (selectEl.value === 'Others') {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
        specifyEl.value = '';
    }
}

// ======================================
// Function: Nature Of Application Select
// ======================================
function natureOfApplicationSel(selectEl) {
    const checkboxes = requirementsSection.querySelectorAll('input[name="requirements"]');

    const visibleMap = {
        'New': ['SEC', 'DTI', 'TCT', 'Lease Contract'],
        'Renew': ['Previous Business Permit', 'Photocopy of Valid ID of Business Owner'],
        'Closure': ['Notarized affidavit for Business Closure']
    };

    const selected = selectEl.value;

    let anyVisible = false;

    checkboxes.forEach(cb => {
        if (visibleMap[selected] && visibleMap[selected].includes(cb.value)) {
            cb.parentElement.style.display = 'block';
            anyVisible = true;
        } else {
            cb.parentElement.style.display = 'none';
            cb.checked = false;
        }
    });

    requirementsSection.style.display = anyVisible ? 'block' : 'none';
}

// =========================
// FN: Map & Coordinate Functions
// =========================
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

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => openMapPicker(btn.dataset.target));
    });
});

async function initializeMapPicker(target) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Location').openPopup();

        document.getElementById(`latitude${target}`).value = lat;
        document.getElementById(`longitude${target}`).value = lng;
        document.getElementById(`map-preview-${target}`).style.display = 'block';
    });

    // Optional: Load barangay polygon
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

    // Load houses from server
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

                        // Polygon click autofill
                        polygon.on('click', function (e) {
                            const lat = e.latlng.lat.toFixed(6);
                            const lng = e.latlng.lng.toFixed(6);

                            if (marker) map.removeLayer(marker);
                            marker = L.marker([lat, lng]).addTo(map).bindPopup("Selected House").openPopup();

                            // document.getElementById(`current-coords`).textContent = `${lat}, ${lng}`;
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

                            if (target === '2') { // Business
                                const businessLot = document.getElementById('businessLotNo');
                                const businessStreet = document.getElementById('businessStreet');
                                businessLot.value = house.house_number || '';
                                businessStreet.value = house.street_name || '';
                                document.getElementById(`latitude2`).value = lat;
                                document.getElementById(`longitude2`).value = lng;

                                [businessLot, businessStreet].forEach(el => {
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                });
                            }
                        });


                        // Add popup
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

// =========================
// FN: Auto format coordinates on blur
// =========================
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

// Initialize both forms
document.addEventListener('DOMContentLoaded', () => {
    [1, 2].forEach(target => setupCoordinateAutoFormat(target));
});

// =========================
// FN: Owner Autofilled Application
// =========================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch('/Banwa/server/api/resident/get_user.php');
        const data = await resp.json();

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        if (data.household_head_name) firstName.value = data.household_head_name;
        if (data.contact_no) contactNoOwner.value = data.contact_no;
    } catch (err) {
        console.error('Failed to fetch user data for autofill:', err);
    }
});