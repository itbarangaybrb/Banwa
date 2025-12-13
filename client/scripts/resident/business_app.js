// Configuration
// Adjust this path to point to your existing staff handler. 
// Assuming structure: /Banwa/client/pages/resident/business_app.php -> /Banwa/scripts/business_staff/business_handler.php
import supabase from '../../../server/api/supabase.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';

// const API_URL = '../../../client/scripts/business_staff/business_handler.php';



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
    function validateInput(input, message = 'This field is required', rules = {}) {
        if (!input) return true;
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = message;
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        input.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
        return true;
    }

    // ===========================
    // Function: Validate checkbox
    // ===========================
    function validateCheckboxGroup(checkboxes, message) {
        const wrapper = checkboxes[0].closest('.label-and-input');

        if (wrapper.style.display === 'none') return true;

        const errorEl = wrapper.querySelector('.error-msg');
        if (!Array.from(checkboxes).some(c => c.checked)) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            return false;
        }
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        return true;
    }

    // ========================
    // Function: Validate radio
    // ========================
    function validateRadioGroup(radios, message) {
        const wrapper = radios[0].closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        if (!Array.from(radios).some(r => r.checked)) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            return false;
        }
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        return true;
    }

    // ===========================
    // Function: Validate address
    // ===========================
    function validateAddress(lotInput, streetInput) {
        const lotWrapper = lotInput.closest('.label-and-input');
        const streetWrapper = streetInput.closest('.label-and-input');

        const lotError = lotWrapper.querySelector('.error-msg');
        const streetError = streetWrapper.querySelector('.error-msg');

        const lot = lotInput.value.trim();
        const street = streetInput.value.trim();

        // reset errors
        [lotInput, streetInput].forEach(i => i.classList.remove('error'));
        [lotError, streetError].forEach(e => {
            e.textContent = '';
            e.classList.remove('show');
        });

        if (lot === '') {
            lotInput.classList.add('error');
            lotError.textContent = 'Lot no. is required';
            lotError.classList.add('show');
            return false;
        }

        if (street === '' || street === 'select') {
            return true; // skip validation if street not selected
        }

        // validate lot + street combination
        const fullAddress = `${lot} ${street}`;
        const match = addressCoordinates.find(entry => entry.address === fullAddress);

        if (!match) {
            lotInput.classList.add('error');
            lotError.textContent = 'Street does not exist for this lot';
            lotError.classList.add('show');
            return false;
        }

        // If matched, fill coordinates automatically
        const latInput = document.getElementById('latitude2');
        const lngInput = document.getElementById('longitude2');
        if (latInput && lngInput) {
            latInput.value = match.lat.toFixed(6);
            lngInput.value = match.lng.toFixed(6);
        }

        return true;
    }

    // ==============================
    // Function: Real-time validation
    // ==============================
    // TODO: FOR JEFERSON
    // change the input into ( change or  blur).
    (() => {
        const inputs = [
            natureOfApplication, businessName, natureOfBusinessSelect, natureOfBusinessSpecify,
            contactNoBusiness, emailAddress, firstName, lastName,
            contactNoOwner, typeOfStructureSelect, typeOfStructureSpecify, noOfEmployees,
            requirementUpload, lotNo, businessLotNo, street, businessStreet
        ];

        inputs.forEach(input => {
            if (!input) return;
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, () => validateInput(input));
        });

        emailAddress.addEventListener('input', () => {
            validateInput(emailAddress, 'Email is required', {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                errorMessage: 'Please enter a valid email address'
            });
        });

        const lots = [
            { lot: lotNo, street: street },
            { lot: businessLotNo, street: businessStreet }
        ];

        lots.forEach(({ lot, street }) => {

            lot.addEventListener('input', () => {
                const wrapper = lot.closest('.label-and-input');
                const errorEl = wrapper.querySelector('.error-msg');

                lot.value = lot.value.replace(/[^0-9]/g, '');

                if (lot.value.trim() === '') {
                    lot.classList.add('error');
                    errorEl.textContent = 'Lot no. is required';
                    errorEl.classList.add('show');
                } else {
                    lot.classList.remove('error');
                    errorEl.textContent = '';
                    errorEl.classList.remove('show');
                }
            });

            // revalidate address when lot or street changes
            lot.addEventListener('input', () => validateAddress(lot, street));
            street.addEventListener('change', () => validateAddress(lot, street));
        });



        contactNoBusiness.addEventListener('input', () => {
            const wrapper = contactNoBusiness.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            contactNoBusiness.value = contactNoBusiness.value.replace(/[^0-9]/g, '');
            if (contactNoBusiness.value === '') {
                contactNoBusiness.classList.add('error');
                errorEl.classList.add('show');
                errorEl.textContent = 'Contact number is required';
            } else if (contactNoBusiness.value.length !== 11) {
                contactNoBusiness.classList.add('error');
                errorEl.classList.add('show');
                errorEl.textContent = 'Contact number must be exactly 11 digits';
            } else {
                errorEl.classList.remove('show');
                errorEl.textContent = '';
            }
        });

        contactNoOwner.addEventListener('input', () => {
            const wrapper = contactNoOwner.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            contactNoOwner.value = contactNoOwner.value.replace(/[^0-9]/g, '');
            if (contactNoOwner.value === '') {
                errorEl.classList.add('show');
                contactNoOwner.classList.add('error');
                errorEl.textContent = 'Contact no. is required';
            } else if (contactNoOwner.value.length !== 11) {
                errorEl.classList.add('show');
                contactNoOwner.classList.add('error');
                errorEl.textContent = 'Contact no. must be exactly 11 digits';
            } else {
                errorEl.classList.remove('show');
                errorEl.textContent = '';
            }
        });

        noOfEmployees.addEventListener('input', () => {
            const wrapper = noOfEmployees.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            noOfEmployees.value = noOfEmployees.value.replace(/[^0-9]/g, '');
            if (noOfEmployees.value === '') {
                errorEl.classList.add('show');
                noOfEmployees.classList.add('error');
                errorEl.textContent = 'No. of employees is required';
            } else {
                errorEl.classList.remove('show');
                errorEl.textContent = '';
            }
        });

        Array.from(typeOfBusiness).forEach(radio => {
            radio.addEventListener('change', () => validateRadioGroup(typeOfBusiness, 'Please select a type of business'));
        });

        Array.from(businessStatus).forEach(radio => {
            radio.addEventListener('change', () => validateRadioGroup(businessStatus, 'Please select business status'));
        });

        Array.from(requirements).forEach(checkbox => {
            checkbox.addEventListener('change', () => validateCheckboxGroup(requirements, 'Please select at least one requirement'));
        });

        agreeCheckBox.addEventListener('change', () => validateInput(agreeCheckBox));
    })();

    // =========================
    // Owner "Next" button click
    // =========================
    document.getElementById('nextToBusiness').addEventListener('click', () => {
        const validations = [
            validateInput(firstName, 'First name is required', {
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage: 'First name must only contain letters and spaces'
            }),
            validateInput(lastName, 'Last name is required', {
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage: 'Last name must only contain letters and spaces'
            }),
            validateInput(contactNoOwner, 'Contact no. is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Contact no. must be numeric, max 11 digits'
            }),
            validateInput(lotNo, 'Lot no. is required', {
                pattern: /^[0-9]+$/,
                maxLength: 2,
                errorMessage: 'Lot no. must be numeric, max 2 digits'
            }),
            validateInput(street, 'Street is required'),
            validateAddress(lotNo, street)
        ];

        if (validations.every(v => v)) {
            document.getElementById('waiverFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value}`;
            switchPanel('business');
        }
    });

    // ============================
    // Business "Next" button click
    // ============================
    document.getElementById('nextToWaiver').addEventListener('click', () => {
        const validations = [
            validateInput(businessName, 'Business Name is required'),
            validateRadioGroup(typeOfBusiness, 'Please select a type of business'),
            validateInput(natureOfBusinessSelect, 'Nature of business is required'),
            natureOfBusinessSelect.value === 'Others'
                ? validateInput(natureOfBusinessSpecify, 'Please specify the business details')
                : true,
            validateRadioGroup(businessStatus, 'Please select business status'),
            validateInput(contactNoBusiness, 'Contact no. is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Contact no. must be numeric, max 11 digits'
            }),
            validateInput(emailAddress, 'Email is required', {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                errorMessage: 'Please enter a valid email address'
            }),
            validateCheckboxGroup(requirements, 'Please select at least one requirement'),
            validateInput(requirementUpload, 'Please upload a document'),
            validateInput(noOfEmployees, 'Number of employees is required', {
                pattern: /^[0-9]{1,2}$/,
                errorMessage: 'Number of employees must be 1 or 2 digits'
            }),
            validateInput(businessLotNo, 'Lot no. is required', {
                pattern: /^[0-9]+$/,
                maxLength: 2,
                errorMessage: 'Lot no. must be numeric, max 2 digits'
            }),
            validateInput(natureOfApplication, 'Nature of application is required'),
            validateInput(businessStreet, 'Street is required'),
            validateInput(typeOfStructureSelect, 'Type of structure is required'),
            typeOfStructureSelect.value === 'Others'
                ? validateInput(typeOfStructureSpecify, 'Please specify the business details')
                : true,
            validateAddress(businessLotNo, businessStreet),
        ];

        if (validations.every(v => v)) {
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
        const isValid = validateInput(agreeCheckBox, 'You must agree to proceed');

        if (isValid) {
            document.getElementById('sumBusinessName').textContent = businessName.value;
            document.getElementById('sumTypeOfBusiness').textContent = Array.from(typeOfBusiness).find(r => r.checked)?.value || '';
            document.getElementById('sumNatureOfBusiness').textContent = `${natureOfBusinessSelect.value === 'Others' ? natureOfBusinessSpecify.value : natureOfBusinessSelect.value}`.trim();
            document.getElementById('sumBusinessStatus').textContent = Array.from(businessStatus).find(r => r.checked)?.value || '';
            document.getElementById('sumAddressOfBusiness').textContent =
                `${document.getElementById('businessLotNo').value} ${document.getElementById('businessStreet').value}` +
                (lat && lng ? ` (Lat: ${lat}, Lng: ${lng})` : '');
            document.getElementById('sumContactNoBusiness').textContent = contactNoBusiness.value;
            document.getElementById('sumEmail').textContent = emailAddress.value;
            document.getElementById('sumFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim();
            document.getElementById('sumContactNoOwner').textContent = contactNoOwner.value;
            document.getElementById('sumAddressOwner').textContent = `${lotNo.value} ${street.value}`;
            document.getElementById('sumStructureType').textContent = `${typeOfStructureSelect.value === 'Others' ? typeOfStructureSpecify.value : typeOfStructureSelect.value}`.trim();
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
// Function: Real-time validation
// ==============================
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==============================
// Function: Real-time validation
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
// Function: Handler "Others" Select Show Sepecify
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

    // Show/hide the whole Requirements section
    requirementsSection.style.display = anyVisible ? 'block' : 'none';
}

// =========================
// Map & Coordinate Functions
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
        const target = modal.dataset.target; // 1 or 2
        const preview = document.getElementById(`map-preview-${target}`);
        if (preview) preview.style.display = 'none'; // hide the preview
        modal.remove(); // remove the modal
    });

    initializeMapPicker(target, `map-container-${target}`);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => openMapPicker(btn.dataset.target));
    });
});

async function initializeMapPicker(target, containerId) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    // Map click handler
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