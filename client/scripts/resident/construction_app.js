// Configuration imports for Supabase, address data, and service worker registration
import supabase from '../../../server/api/supabase.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import { registerServiceWorker } from '../../../register_sw.js';
import { initSocket, sockets } from '../../scripts/utils/socketUtils.js';

const CONSTRUCTION_HANDLER_URL = '/server/handlers/staff/construction/construction_handler.php';

registerServiceWorker();

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    .swal2-popup {
        padding: 2.5rem 0 !important; /* Forces vertical breathing room */
        border-radius: 15px !important;
    }
    .swal2-icon {
        margin-top: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        border-width: 4px !important;
    }
    .swal2-title {
        color: #00247C !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.5rem !important;
    }
    .swal2-html-container {
        margin-bottom: 1.5rem !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }
`;
document.head.appendChild(swalStyle);

/**
 * Switches the visible panel in the multi-step form interface
 * @param {string} panelId - The ID of the panel to display ('owner', 'construction', 'waiver', or 'summary')
 */
function switchPanel(panelId) {
    const panels = ['owner', 'construction', 'waiver', 'summary']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
    window.scrollTo(0, 0);
}

// Tracks which panels have been properly validated and completed
const completedPanels = {
    owner: false,
    construction: false,
    waiver: false
}

// Form element references for owner information section
const firstName = document.getElementById('firstName');
const middleName = document.getElementById('middleName');
const suffix = document.getElementById('suffix');
const lastName = document.getElementById('lastName');
const contactNoOwner = document.getElementById('contactNoOwner');
const addressOwner = document.getElementById('addressOwner');

// Form element references for construction information section
const typeOfWork = document.getElementById('typeOfWork');
const natureOfActivity = document.getElementById('natureOfActivity');
const detailsOfWork = document.getElementById('detailsOfWork');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const numberOfWorkingDays = document.getElementById('numberOfWorkingDays');
const numberOfWorkers = document.getElementById('numberOfWorkers');
const contractorName = document.getElementById('contractorName');
const contractorContactNumber = document.getElementById('contractorContactNumber');
const applicationMethod = document.getElementById('applicationMethod');
const constructionLotNo = document.getElementById('constructionLotNo');
const constructionStreet = document.getElementById('constructionStreet');
const requirementUpload = document.getElementById('requirementUpload');

// Form element reference for waiver agreement
const agreeCheckBox = document.getElementById('agreeCheckBox');
const waiverFullname = document.getElementById('waiverFullname');

// Initialize the form with owner panel visible
switchPanel('owner');

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
        if (rules.lettersOnly) {
            if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
                showError(input, rules.errorMessage || 'Only letters are allowed'); return false;
            }
            if (value.length < 2) { showError(input, 'Too short'); return false; }
            if (value.length > 50) { showError(input, 'Too long'); return false; }
            if (/(.)\1{3,}/.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            if (/^([A-Za-z])\s\1(\s\1)*$/.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            if (/^(.{2,6})\1{2,}$/i.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            if (value.length >= 6 && !/[aeiouAEIOU]/.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            if (value.length >= 8) {
                const lower = value.toLowerCase();
                const chunk = lower.slice(0, 4);
                if (lower.split(chunk).length - 1 >= 3) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            }
        }

        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `Minimum ${rules.minLength} characters`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Maximum ${rules.maxLength} characters`); return false; }
        if (rules.noSpam) {
            if (/(.)\1{4,}/.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
            if (/^(.{2,6})\1{2,}$/i.test(value)) { showError(input, rules.errorMessage || 'Invalid input'); return false; }
        }

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
        if (rules.phoneType === 'ph') {
            const isMobile = /^09\d{9}$/.test(value);
            const isLandline8 = /^[2-9]\d{7}$/.test(value);
            const isLandlineArea = /^0[2-9]\d{8}$/.test(value);
            if (!isMobile && !isLandline8 && !isLandlineArea) { showError(input, 'Enter a valid number (e.g. 09171234567 or 85359822)'); return false; }
            if (/^(\d)\1{10}$/.test(value) || /^09(\d)\1{8}$/.test(value)) { showError(input, 'Enter a real contact number'); return false; }
            if (/^(?:0(?:123456789|987654321)|09(?:12345678|87654321))$/.test(value)) { showError(input, 'Enter a real contact number'); return false; }
            clearError(input); return true;
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
     * Validates file upload inputs for presence, type, and size constraints
     * @param {HTMLInputElement} input - The file input element
     * @param {string} message - Required field error message
     * @param {Object} options - File validation options (accept types, size limit)
     * @returns {boolean} - Whether the file is valid
     */
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

    /**
     * Validates address fields and verifies existence in addressCoordinates database
     * Also automatically populates latitude/longitude if address is valid
     * @param {HTMLInputElement} lotInput - Lot number input element
     * @param {HTMLSelectElement} streetInput - Street selection element
     * @returns {boolean} - Whether the address is valid and exists
     */
    function validateAddress(lotInput, streetInput) {
        const lot = lotInput.value.trim(), street = streetInput.value.trim();
        if (!lot) return validator.number(lotInput, 'House No. is required');
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
        file: validateFile,
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
    { el: lastName, type: 'text', message: 'Please enter your last name', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: contactNoOwner, type: 'number', message: 'Contact No. is required', rules: { phoneType: 'ph' } },
    { el: addressOwner, type: 'text', message: 'Address is required' },
    { el: natureOfActivity, type: 'select', message: 'Please select nature of activity' },
    { el: typeOfWork, type: 'select', message: 'Please select the type of construction work' },
    { el: detailsOfWork, type: 'text', message: 'Details required', rules: { minLength: 10, maxLength: 500 } },
    { el: startDate, type: 'date', message: 'Please select the expected start date' },
    { el: endDate, type: 'date', message: 'Please select the expected completion date' },
    { el: numberOfWorkers, type: 'number', message: 'Please enter the number of workers', rules: { minLength: 1, maxLength: 2, errorMessage: 'Number of workers must be at least 1' } },
    { el: contractorName, type: 'text', message: 'Please enter the contractor\'s name', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: contractorContactNumber, type: 'number', message: 'Contractor contact number is required', rules: { phoneType: 'ph' } },
    { el: applicationMethod, type: 'select', message: 'Please select how you will submit the application' },
    { el: constructionLotNo, type: 'number', message: 'Please enter the lot number', rules: { maxLength: 2 } },
    { el: constructionStreet, type: 'select', message: 'Please select the street' },
    { el: requirementUpload, type: 'file', message: 'Please select at least one required document' },
    { el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' },
];

/**
 * Validates a single form field based on its configuration
 * @param {Object} config - Validation configuration object
 * @returns {boolean} - Whether the field passed validation
 */
function validateField(config) {
    const { el, type, message, rules } = config;
    if (!el) return true;

    if (rules && rules.conditional) {
        const applicationMethod = document.getElementById('applicationMethod').value;
        if (applicationMethod === 'In Person') {
            validator.clear(el);
            return true;
        }
    }

    switch (type) {
        case 'number': return validator.number(el, message, rules);
        case 'text': if (el.closest('.label-and-input')?.style.display === 'none') { validator.clear(el); return true; }
            return validator.text(el, message, rules);;
        case 'file': return validator.file(el, message, rules);
        case 'checkbox': return validator.checkbox(el, message);
        case 'select': return validator.select(el, message);
        case 'date': return validator.date(el, message);
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

        const targets = ['checkboxGroup', 'radio'].includes(type) ? Array.from(el) : [el];

        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(config));
            target.addEventListener('input', () => validator.clear(target));
        });
    });

    // Address validation for construction address
    [constructionLotNo, constructionStreet].forEach(el => {
        el.addEventListener('blur', () => {
            if (constructionLotNo.value && constructionStreet.value) validator.address(constructionLotNo, constructionStreet);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Input sanitization for numeric fields (remove non-digit characters)
    [contactNoOwner, contractorContactNumber, constructionLotNo, numberOfWorkers].forEach(el => {
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
 * Handles navigation from owner information panel to construction information panel
 * Validates all owner fields and updates waiver display before proceeding
 */
document.getElementById('nextToConstruction').addEventListener('click', () => {
    const stepFields = [firstName, lastName, contactNoOwner, addressOwner];
    if (!validateStep(stepFields)) return;
    waiverFullname.textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`;

    completedPanels.owner = true;
    switchPanel('construction');
});

/**
 * Handles navigation from construction information panel to waiver panel
 * Validates all construction fields before proceeding
 */
document.getElementById('nextToWaiver').addEventListener('click', () => {
    const stepFields = [
        typeOfWork,
        typeOfWork.value === 'Other' ? detailsOfWork : null,
        natureOfActivity,
        startDate,
        endDate,
        numberOfWorkers,
        contractorName,
        contractorContactNumber,
        natureOfActivity.value !== 'Demolition' ? applicationMethod : null,
        constructionLotNo,
        constructionStreet,
        requirementUpload.closest('.label-and-input').style.display !== 'none' ? requirementUpload : null
    ].filter(f => f !== null);

    if (!validateStep(stepFields)) return;
    if (!validator.address(constructionLotNo, constructionStreet)) return;

    completedPanels.construction = true;
    switchPanel('waiver');
});

/**
 * Handles navigation from waiver panel to summary panel
 * Validates agreement checkbox and populates summary display with all form data
 */
document.getElementById('nextToSummary').addEventListener('click', () => {
    const lat = document.getElementById('latitude2').value;
    const lng = document.getElementById('longitude2').value;

    if (validateField({ el: agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' })) {
        const typeOfWorkEl = document.getElementById('typeOfWork');
        const typeOfWorkDisplay = typeOfWorkEl.value === 'Other'
            ? detailsOfWork.value.trim()
            : typeOfWorkEl.options[typeOfWorkEl.selectedIndex].text.trim();

        document.getElementById('sumTypeOfConstruction').textContent = typeOfWorkDisplay;
        document.getElementById('sumNatureOfActivity').textContent = natureOfActivity.value;
        document.getElementById('sumStartDate').textContent = startDate.value;
        document.getElementById('sumEndDate').textContent = endDate.value;
        document.getElementById('sumNumberOfWorkingDays').textContent = numberOfWorkingDays.value;
        document.getElementById('sumNumberOfWorkers').textContent = numberOfWorkers.value;
        document.getElementById('sumContractorName').textContent = contractorName.value;
        document.getElementById('sumContractorContactNumber').textContent = contractorContactNumber.value;
        document.getElementById('sumApplicationMethod').textContent = applicationMethod.value;
        document.getElementById('sumAddressConstruction').textContent = `${constructionLotNo.value} ${constructionStreet.value}`;
        document.getElementById('sumRequirementUpload').textContent = requirementUpload.value;
        document.getElementById('sumFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim();
        document.getElementById('sumContactNoOwner').textContent = contactNoOwner.value;
        document.getElementById('sumAddressOwner').textContent = addressOwner.value;
        document.getElementById('sumAgreed').textContent = agreeCheckBox.checked ? 'Yes' : 'No';

        completedPanels.waiver = true;
        switchPanel('summary');
    }
});

/**
 * Sets up navigation between form panels with back button functionality
 * First back button returns to services page, others navigate to previous panel
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ownerBackBtn').addEventListener('click', () => window.location.href = '/client/pages/resident/home.php');
    document.getElementById('constructionBackBtn').addEventListener('click', () => switchPanel('owner'));
    document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('construction'));
    document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
});

/**
 * Handles final form submission with Supabase integration
 * Collects all form data, validates, sends to backend, and handles response
 * Includes notification permission request and success/error handling
 */
const summaryForm = document.getElementById('summaryForm');

// Clone form to prevent duplicate event listeners on page refresh
const newSummaryForm = summaryForm.cloneNode(true);
summaryForm.parentNode.replaceChild(newSummaryForm, summaryForm);

newSummaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const requiredPanels = ['owner', 'construction', 'waiver'];
    const bypassed = requiredPanels.some(panel => !completedPanels[panel]);

    if (bypassed) {
        await Swal.fire({
            icon: 'warning',
            title: 'Incomplete Submission',
            html: 'Your report cannot be submitted because one or more required sections have not been properly completed.<br><br>Please go back and ensure all steps are filled out before proceeding to submission.',
            confirmButtonText: 'Go Back',
            confirmButtonColor: '#00247C',
        });
        switchPanel('owner');
        return;
    }

    // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }

    const confirmResult = await Swal.fire({
        icon: 'question',
        title: 'Submit your application?',
        text: 'Are you sure you want to submit this application?',
        showCancelButton: true,
        confirmButtonColor: '#00247C',
        cancelButtonColor: '#ad2c2c',
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel',
        customClass: {
            popup: 'modal-content',
            confirmButton: 'btn-proceed',
            cancelButton: 'btn-cancel'
        }
    });

    if (confirmResult.isConfirmed) {
        const formData = new FormData();

        // 1. ADD THE ACTION (Crucial for construction_handler.php)
        formData.append('action', 'create');

        // 2. CAPTURE DATA (Re-selecting elements ensures we get the latest values)
        const { data: { user } } = await supabase.auth.getUser();
        const supabaseUserId = user?.id;
        formData.append('supabase_user_id', supabaseUserId);

        // Owner Details
        formData.append('firstName', document.getElementById('firstName').value);
        formData.append('middleName', document.getElementById('middleName').value);
        formData.append('suffix', document.getElementById('suffix').value);
        formData.append('lastName', document.getElementById('lastName').value);
        formData.append('contactNoOwner', document.getElementById('contactNoOwner').value);
        formData.append('addressOwner', document.getElementById('addressOwner').value);

        // Construction Details
        const typeOfWorkEl = document.getElementById('typeOfWork');
        const typeOfWorkValue = typeOfWorkEl.value === 'Other'
            ? document.getElementById('detailsOfWork').value
            : typeOfWorkEl.options[typeOfWorkEl.selectedIndex].text;
        formData.append('typeOfWork', typeOfWorkValue);
        formData.append('natureOfActivity', document.getElementById('natureOfActivity').value);
        formData.append('detailsOfWork', document.getElementById('detailsOfWork').value);
        formData.append('startDate', document.getElementById('startDate').value);
        formData.append('endDate', document.getElementById('endDate').value);
        formData.append('numberOfWorkingDays', document.getElementById('numberOfWorkingDays').value);
        formData.append('numberOfWorkers', document.getElementById('numberOfWorkers').value);
        formData.append('contractorName', document.getElementById('contractorName').value);
        formData.append('contractorContactNumber', document.getElementById('contractorContactNumber').value);
        formData.append('applicationMethod', document.getElementById('applicationMethod').value);
        formData.append('constructionLotNo', document.getElementById('constructionLotNo').value);
        formData.append('constructionStreet', document.getElementById('constructionStreet').value);

        const requirementUploadInput = document.getElementById('requirementUpload');
        if (requirementUploadInput && requirementUploadInput.files.length > 0) {
            for (let i = 0; i < requirementUploadInput.files.length; i++) {
                formData.append('requirementUpload[]', requirementUploadInput.files[i]);
            }
            console.log(`[UPLOAD SUCCESS] Sending ${requirementUploadInput.files.length} file(s) for construction`);
        } else {
            console.warn('[UPLOAD WARNING] No file selected!');
        }

        // Additional files (if user selected any)
        const additionalFilesInput = document.getElementById('additionalFiles');
        if (additionalFilesInput && additionalFilesInput.files.length > 0) {
            for (let i = 0; i < additionalFilesInput.files.length; i++) {
                formData.append('requirementUpload[]', additionalFilesInput.files[i]);
            }
        }

        const latitudeEl = document.getElementById('latitude2');
        const longitudeEl = document.getElementById('longitude2');
        formData.append('latitude2', latitudeEl?.value || '');
        formData.append('longitude2', longitudeEl?.value || '');

        // Application Date
        formData.append('applicationDate', getCurrentDateString());

        // 3. SEND TO BACKEND
        fetch(`${CONSTRUCTION_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification('Application Submitted', {
                                body: "Click to view your application status",
                                icon: "/client/img/banwalogo.png",
                                data: { url: "/client/pages/resident/status.php" }
                            });
                        });
                    }

                    sockets["construction_applications"]?.readyState === WebSocket.OPEN &&
                        sockets["construction_applications"].send(JSON.stringify({
                            type: "construction_applications_update",
                            action: "new_application"
                        }));

                    Swal.fire({
                        title: 'Success!',
                        text: 'Submitted successfully! Reference ID: ' + data.id,
                        confirmButtonText: 'OK',
                        color: '#363636',
                        confirmButtonColor: '#00247C',
                        customClass: {
                            popup: 'modal-content',
                            confirmButton: 'btn-proceed',
                        }
                    }).then(() => {
                        window.location.href = '/client/pages/resident/status.php';
                    });
                } else {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Error: ' + data.message,
                        confirmButtonText: 'OK',
                        color: '#363636',
                        confirmButtonColor: '#00247C',
                        customClass: {
                            popup: 'modal-content',
                            confirmButton: 'btn-proceed',
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Error: ' + err,
                    confirmButtonText: 'OK',
                    color: '#363636',
                    confirmButtonColor: '#00247C',
                    customClass: {
                        popup: 'modal-content',
                        confirmButton: 'btn-proceed',
                    }
                });
            });
    }
});

/**
 * Opens an interactive map modal for location selection
 * @param {string} target - Identifier for which address field is being mapped ('1' for owner, '2' for construction)
 */
function openMapPicker(target) {
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <div class="map-modal-header">
                    <h3>Select Location</h3>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button id="picker-street-btn" style="padding:5px 12px;border-radius:6px;border:none;background:#00247c;color:white;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">
                            <i class="fas fa-map"></i> Street
                        </button>
                        <button id="picker-satellite-btn" style="padding:5px 12px;border-radius:6px;border:1px solid #ccc;background:white;color:#555;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">
                            <i class="fas fa-satellite"></i> Satellite
                        </button>
                    </div>
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

    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 22
    });
    const satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri World Imagery',
        maxNativeZoom: 19,
        maxZoom: 22
    });

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);
    osmTile.addTo(map);

    const POLY_COLORS = {
        street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.12, weight: 2 },
        satellite: { color: '#FFFFFF', fillColor: '#FFFFFF', fillOpacity: 0.15, weight: 2 }
    };
    const BOUND_COLORS = {
        street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.08, dashArray: '8,6', weight: 2 },
        satellite: { color: '#FFFFFF', fillColor: '#000000', fillOpacity: 0, dashArray: '8,6', weight: 2 }
    };

    let currentMode = 'street';
    let housePolygons = [];
    let boundaryLayers = [];
    let selectedMarker = null;

    function applyColors(mode) {
        housePolygons.forEach(p => p.setStyle(POLY_COLORS[mode]));
        boundaryLayers.forEach(b => b.setStyle(BOUND_COLORS[mode]));
    }

    const streetBtn = document.getElementById('picker-street-btn');
    const satBtn = document.getElementById('picker-satellite-btn');
    if (streetBtn && satBtn) {
        streetBtn.addEventListener('click', () => {
            map.removeLayer(satTile); osmTile.addTo(map);
            currentMode = 'street'; applyColors('street');
            streetBtn.style.background = '#00247c'; streetBtn.style.color = 'white'; streetBtn.style.border = 'none';
            satBtn.style.background = 'white'; satBtn.style.color = '#555'; satBtn.style.border = '1px solid #ccc';
        });
        satBtn.addEventListener('click', () => {
            map.removeLayer(osmTile); satTile.addTo(map);
            currentMode = 'satellite'; applyColors('satellite');
            satBtn.style.background = '#00247c'; satBtn.style.color = 'white'; satBtn.style.border = 'none';
            streetBtn.style.background = 'white'; streetBtn.style.color = '#555'; streetBtn.style.border = '1px solid #ccc';
        });
    }

    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        if (selectedMarker) map.removeLayer(selectedMarker);
        selectedMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;">Selected Location</div>')
            .openPopup();
        document.getElementById(`latitude${target}`).value = lat;
        document.getElementById(`longitude${target}`).value = lng;
        document.getElementById(`map-preview-${target}`).style.display = 'block';
    });

    // Load boundaries from DB
    try {
        const bRes = await fetch('/server/handlers/map/map_handler.php', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_boundaries'
        });
        const bData = await bRes.json();
        if (bData.success && bData.boundaries && bData.boundaries.length > 0) {
            bData.boundaries.forEach(b => {
                try {
                    const coords = JSON.parse(b.coordinates);
                    const latLngs = coords.map(c => Array.isArray(c) ? [c[1], c[0]] : [c.lat, c.lng]);
                    const layer = L.polygon(latLngs, BOUND_COLORS.street).addTo(map);
                    boundaryLayers.push(layer);
                    // ── Boundary lock: mirrors map.js setupSoftBoundary ──────────────
                    try {
                        const _bounds = layer.getBounds();
                        const _soft = _bounds.pad(0.15);
                        const _warn = _bounds.pad(0.05);
                        const _hard = _bounds.pad(0.25);
                        map.setMinZoom(18);
                        map.setMaxZoom(22);
                        map.setMaxBounds(_hard);
                        let _bTimer;
                        map.on('move', function () {
                            clearTimeout(_bTimer);
                            if (!_warn.contains(map.getCenter())) {
                                _bTimer = setTimeout(function () {
                                    const c = map.getCenter();
                                    const lat = Math.max(_warn.getSouth(), Math.min(_warn.getNorth(), c.lat));
                                    const lng = Math.max(_warn.getWest(), Math.min(_warn.getEast(), c.lng));
                                    map.flyTo([lat, lng], map.getZoom(), { duration: 1, easeLinearity: 0.25 });
                                }, 800);
                            }
                        });
                        map.on('moveend', function () {
                            const c = map.getCenter();
                            if (!_soft.contains(c)) {
                                const lat = Math.max(_soft.getSouth(), Math.min(_soft.getNorth(), c.lat));
                                const lng = Math.max(_soft.getWest(), Math.min(_soft.getEast(), c.lng));
                                map.panTo([lat, lng], { animate: true, duration: 0.5 });
                            }
                        });
                    } catch (_le) { console.warn('Boundary lock error:', _le); }
                } catch (err) { console.error('Boundary parse error:', err); }
            });
        }
    } catch (err) { console.error('Failed to load boundaries:', err); }

    // Load houses
    try {
        const hRes = await fetch('/server/handlers/map/map_handler.php', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_houses'
        });
        const hData = await hRes.json();

        if (hData.success && hData.houses) {
            const houseLayer = L.layerGroup();

            hData.houses.forEach(house => {
                if (!house.coordinates) return;
                try {
                    const coords = JSON.parse(house.coordinates);
                    // Normalise: unwrap GeoJSON array-of-rings [[[lng,lat],...]] → [[lng,lat],...]
                    const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) ? coords[0] : coords;
                    const latLngs = ring.map(c => [c[1], c[0]]);
                    latLngs.push(latLngs[0]);

                    const polygon = L.polygon(latLngs, { ...POLY_COLORS.street, interactive: true });
                    housePolygons.push(polygon);

                    const isLandmark = house.address && !/^\d/.test(house.address.trim());
                    const titleText = isLandmark ? (house.address || 'Landmark') : ('House #' + (house.house_number || '—'));
                    const subtitleHtml = house.street_name
                        ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>'
                        : '';
                    const addrHtml = (!isLandmark && house.address)
                        ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>'
                        : '';
                    const streetHtml = house.street_name
                        ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>'
                        : '';

                    const popupHtml =
                        '<div style="font-family:Inter,sans-serif;min-width:190px;">' +
                        '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                        '<div style="font-weight:700;font-size:13px;">' + titleText + '</div>' +
                        subtitleHtml +
                        '</div>' +
                        addrHtml +
                        streetHtml +
                        '<div style="margin-top:6px;font-size:11px;color:#999;font-style:italic;">Click to select this location</div>' +
                        '</div>';

                    polygon.bindPopup(popupHtml, { maxWidth: 240 });

                    polygon.on('click', function (e) {
                        L.DomEvent.stopPropagation(e);
                        const lat = house.center_lat ? parseFloat(house.center_lat).toFixed(6) : e.latlng.lat.toFixed(6);
                        const lng = house.center_lng ? parseFloat(house.center_lng).toFixed(6) : e.latlng.lng.toFixed(6);

                        if (selectedMarker) map.removeLayer(selectedMarker);
                        const isLandmarkSel = house.address && !/^\d/.test(house.address.trim());
                        const selTitle = isLandmarkSel ? (house.address || 'Landmark') : ('House #' + (house.house_number || '—'));
                        const selAddr = (!isLandmarkSel && house.address)
                            ? '<p style="margin:4px 0 0;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>'
                            : '';
                        const selStreet = house.street_name
                            ? '<p style="margin:4px 0 0;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>'
                            : '';
                        const selPopup =
                            '<div style="font-family:Inter,sans-serif;min-width:190px;">' +
                            '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                            '<div style="font-weight:700;font-size:13px;">&#10003; ' + selTitle + '</div>' +
                            (house.street_name ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>' : '') +
                            '</div>' +
                            selAddr +
                            selStreet +
                            '</div>';
                        selectedMarker = L.marker([lat, lng]).addTo(map)
                            .bindPopup(selPopup, { maxWidth: 240 })
                            .openPopup();

                        document.getElementById(`latitude${target}`).value = lat;
                        document.getElementById(`longitude${target}`).value = lng;
                        document.getElementById(`map-preview-${target}`).style.display = 'block';

                        if (target === '2') {
                            const constructionLot = document.getElementById('constructionLotNo');
                            const constructionStreet = document.getElementById('constructionStreet');
                            if (constructionLot) { constructionLot.value = house.house_number || ''; constructionLot.dispatchEvent(new Event('change', { bubbles: true })); }
                            if (constructionStreet) { constructionStreet.value = house.street_name || ''; constructionStreet.dispatchEvent(new Event('change', { bubbles: true })); }
                        }
                    });

                    polygon.addTo(houseLayer);
                } catch (err) { console.error('House parse error:', err); }
            });

            houseLayer.addTo(map);
        }
    } catch (err) { console.error('Failed to load houses:', err); }
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
 * Generates current date in YYYY-MM-DD format for application timestamp
 * @returns {string} - Current date formatted as YYYY-MM-DD
 */
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Updates the application date field with current date and maintains freshness
 * Runs on page load and refreshes every minute while form is open
 */
function updateApplicationDate() {
    const dateInput = document.getElementById('applicationDate');
    if (dateInput) {
        dateInput.value = getCurrentDateString();
    }
}

// Update application date on load and keep it current
document.addEventListener('DOMContentLoaded', () => {
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);
});

/**
 * Automatically populates owner information fields with user data from session
 * Fetches resident profile data to pre-fill the form for convenience
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {

        await Swal.fire({
            icon: 'warning',
            title: 'Important Disclaimer',
            html: 'Submitting false information, unapproved plans, or fraudulent documents for a <strong>Construction Clearance</strong> is a serious offense punishable by project suspension and legal penalties.<br><br>By proceeding, you certify that all information and attached documents provided are true and accurate to the best of your knowledge.',
            confirmButtonText: 'I Understand and Agree',
            confirmButtonColor: '#00247C',
            allowOutsideClick: false,
            allowEscapeKey: false
        });

        const resp = await fetch('/server/api/resident/get_user.php', { credentials: 'include', cache: 'no-store' });
        const data = await resp.json();
        // console.debug('construction_app autofill response:', data);

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        if ((!data.first_name || data.first_name.trim() === '') && data.full_name) {
            const parts = data.full_name.trim().split(/\s+/);
            data.first_name = parts[0] || '';
            data.last_name = parts.length > 1 ? parts[parts.length - 1] : '';
            data.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
        }

        if (data.first_name) firstName.value = data.first_name;
        if (data.middle_name) middleName.value = data.middle_name;
        if (data.last_name) lastName.value = data.last_name;
        if (data.suffix) suffix.value = data.suffix;
        if (data.contact_no) contactNoOwner.value = data.contact_no;
        if (data.address) addressOwner.value = data.address;
    } catch (err) {
        console.error('Failed to fetch user data for autofill:', err);
    }
});

/**
 * Calculates total working days between start and end dates
 * Updates the numberOfWorkingDays field automatically when dates change
 * @param {HTMLInputElement} startEl - Start date input element
 * @param {HTMLInputElement} endEl - End date input element
 * @param {HTMLInputElement} outputEl - Output field for calculated days
 */
function calculateTotalDays(startEl, endEl, outputEl) {
    const start = new Date(startEl.value);
    const end = new Date(endEl.value);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        outputEl.value = '';
        return;
    }

    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    outputEl.value = diffDays > 0 ? diffDays : 0;
}

/**
 * Toggles visibility of file upload inputs based on application method selection
 * Hides the file upload fields when "In Person" is selected, shows them when "Online" is selected
 */
function toggleFileUploads() {
    const applicationMethod = document.getElementById('applicationMethod');
    const requirementUpload = document.getElementById('requirementUpload').closest('.label-and-input');
    const additionalFiles = document.getElementById('additionalFiles').closest('.label-and-input');

    if (applicationMethod.value === 'In Person' || applicationMethod.value === '') {
        // Hide file upload inputs
        requirementUpload.style.display = 'none';
        additionalFiles.style.display = 'none';

        // Optional: Clear any existing validation errors
        validator.clear(document.getElementById('requirementUpload'));
        validator.clear(document.getElementById('additionalFiles'));
    } else {
        // Show file upload inputs (for 'Online' or default)
        requirementUpload.style.display = 'block';
        additionalFiles.style.display = 'block';
    }
}

/**
 * Toggles visibility of the application method field based on nature of activity selection
 * Hides the field and clears its value when 'Demolition' is selected, as submission
 * method is not applicable for demolition work. Also re-triggers file upload visibility.
 */
function toggleApplicationMethod() {
    const natureOfActivity = document.getElementById('natureOfActivity');
    const applicationMethodWrapper = document.getElementById('applicationMethod').closest('.label-and-input');

    if (natureOfActivity.value === 'Demolition') {
        applicationMethodWrapper.style.display = 'none';
        document.getElementById('applicationMethod').value = '';
        validator.clear(document.getElementById('applicationMethod'));
    } else {
        applicationMethodWrapper.style.display = '';
    }

    toggleFileUploads();
}

toggleApplicationMethod();
natureOfActivity.addEventListener('change', toggleApplicationMethod);

/**
 * Shows or hides "specify" text fields based on "Others" selection in dropdowns
 * @param {HTMLSelectElement} selectEl - The primary select element
 * @param {HTMLInputElement} specifyEl - The text input for specifying "Other" option
 */
function handleOthersSelect(selectEl, specifyEl) {
    const wrapper = specifyEl.closest('.label-and-input');
    if (selectEl.value === 'Other') {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
        specifyEl.value = '';
    }
}

// Set up automatic calculation of working days when dates change
document.addEventListener('DOMContentLoaded', () => {
    if (startDate && endDate) {
        [startDate, endDate].forEach(el => {
            el.addEventListener('change', () => calculateTotalDays(startDate, endDate, numberOfWorkingDays));
        });
    }

    if (!sockets["construction_applications"]) initSocket("construction_applications", "ws://localhost:8081", () => { });

    const applicationMethod = document.getElementById('applicationMethod');
    toggleFileUploads();
    applicationMethod.addEventListener('change', toggleFileUploads);

    typeOfWork.addEventListener('change', () => handleOthersSelect(typeOfWork, detailsOfWork));
    handleOthersSelect(typeOfWork, detailsOfWork);
});