// Configuration imports for Supabase, address data, and service worker registration
const BUSINESS_HANDLER_URL = '/Banwa/server/handlers/staff/business/business_handler.php';

import supabase from '../../../server/api/supabase.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import { registerServiceWorker } from '../../../register_sw.js';

registerServiceWorker();

/**
 * Switches the visible panel in the multi-step form interface
 * @param {string} panelId - The ID of the panel to display ('owner', 'business', 'waiver', or 'summary')
 */
function switchPanel(panelId) {
    const panels = ['owner', 'business', 'waiver', 'summary']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
    window.scrollTo(0, 0);
}

// Form element references for owner information section
const firstName = document.getElementById('firstName');
const middleName = document.getElementById('middleName');
const suffix = document.getElementById('suffix');
const lastName = document.getElementById('lastName');
const contactNoOwner = document.getElementById('contactNoOwner');
const lotNo = document.getElementById('lotNo');
const street = document.getElementById('street');

// Form element references for business information section
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

// Form element reference for waiver agreement
const agreeCheckBox = document.getElementById('agreeCheckBox');

// Initialize the form with owner panel visible
switchPanel('owner');

// Hide specify fields by default as they're only shown when "Others" is selected
typeOfStructureSpecify.closest('.label-and-input').style.display = 'none';
natureOfBusinessSpecify.closest('.label-and-input').style.display = 'none';
requirementsSection.style.display = 'none';

// Set up event listeners for dynamic field display
typeOfStructureSelect.addEventListener('change', () => handleOthersSelect(typeOfStructureSelect, typeOfStructureSpecify));
natureOfBusinessSelect.addEventListener('change', () => handleOthersSelect(natureOfBusinessSelect, natureOfBusinessSpecify));
natureOfApplication.addEventListener('change', (e) => natureOfApplicationSel(e.target));

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
     * Validates email input format and presence
     * @param {HTMLInputElement} input - The email input element
     * @param {string} message - Required field error message
     * @returns {boolean} - Whether the email is valid
     */
    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '') { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(input, 'Enter a valid email address'); return false; }
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
     * Validates that at least one checkbox in a group is selected
     * @param {NodeList} checkboxes - Collection of checkbox elements
     * @param {string} message - Required selection error message
     * @returns {boolean} - Whether at least one checkbox is checked
     */
    function validateCheckboxGroup(checkboxes, message) {
        const wrapper = checkboxes[0].closest('.label-and-input');
        if (wrapper.style.display === 'none') return true;
        if (!Array.from(checkboxes).some(c => c.checked)) { showError(checkboxes[0], message); return false; }
        clearError(checkboxes[0]); return true;
    }

    /**
     * Validates that one radio button in a group is selected
     * @param {NodeList} radios - Collection of radio button elements
     * @param {string} message - Required selection error message
     * @returns {boolean} - Whether a radio button is selected
     */
    function validateRadioGroup(radios, message) {
        if (!Array.from(radios).some(r => r.checked)) { showError(radios[0], message); return false; }
        clearError(radios[0]); return true;
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

    // Public API of the validator module
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
        case 'email': return validator.email(el, message, rules);
        case 'file': return validator.file(el, message, rules);
        case 'checkbox': return validator.checkbox(el, message);
        case 'checkboxGroup': return validator.checkboxGroup(el, message);
        case 'radio': return validator.radioGroup(el, message);
        case 'select': return validator.select(el, message);
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

    // Address validation for owner address
    [lotNo, street].forEach(el => {
        el.addEventListener('blur', () => {
            if (lotNo.value && street.value) validator.address(lotNo, street);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Address validation for business address
    [businessLotNo, businessStreet].forEach(el => {
        el.addEventListener('blur', () => {
            if (businessLotNo.value && businessStreet.value) validator.address(businessLotNo, businessStreet);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Input sanitization for numeric fields (remove non-digit characters)
    [contactNoOwner, contactNoBusiness, lotNo, businessLotNo, noOfEmployees].forEach(el => {
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
 * Handles navigation from owner information panel to business information panel
 * Validates all owner fields and updates waiver display before proceeding
 */
document.getElementById('nextToBusiness').addEventListener('click', () => {
    const stepFields = [firstName, lastName, contactNoOwner, lotNo, street];
    if (!validateStep(stepFields)) return;

    if (!validator.address(lotNo, street)) return;

    waiverFullname.textContent = `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`;
    switchPanel('business');
});

/**
 * Handles navigation from business information panel to waiver panel
 * Validates all business fields including dynamic requirements based on application type
 */
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

    if (!validator.address(businessLotNo, businessStreet)) return;

    if (!validateStep(stepFields)) return;

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

/**
 * Sets up navigation between form panels with back button functionality
 * First back button returns to services page, others navigate to previous panel
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ownerBackBtn').addEventListener('click', () => {
        window.location.href = '/Banwa/client/pages/resident/services.php';
    });

    document.getElementById('businessBackBtn').addEventListener('click', () => switchPanel('owner'));
    document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('business'));
    document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
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

document.addEventListener('DOMContentLoaded', () => {
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);
});

/**
 * Shows or hides "specify" text fields based on "Others" selection in dropdowns
 * @param {HTMLSelectElement} selectEl - The primary select element
 * @param {HTMLInputElement} specifyEl - The text input for specifying "Other" option
 */
function handleOthersSelect(selectEl, specifyEl) {
    const wrapper = specifyEl.closest('.label-and-input');
    if (selectEl.value === 'Others') {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
        specifyEl.value = '';
    }
}

/**
 * Dynamically shows/hides requirement checkboxes based on application type selection
 * Different application types (New, Renew, Closure) require different documents
 * @param {HTMLSelectElement} selectEl - The nature of application select element
 */
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

    // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
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

        // Show loading state during submission
        const submitBtn = newSummaryForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        // 3. SEND TO BACKEND
        try {
            const response = await fetch(`${BUSINESS_HANDLER_URL}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Show success notification
                if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification("Application Submitted", {
                            body: "Click to view your application status",
                            icon: "/Banwa/client/img/banwalogo.png",
                            data: { url: "/Banwa/client/pages/resident/status.php" }
                        });
                    });
                }

                // Show success message
                await Swal.fire({
                    title: 'Success!',
                    html: `Application submitted successfully! Reference ID: ${data.id}<br><br>You will be redirected to your status page.`,
                    confirmButtonText: 'OK'
                });

                // Redirect to status page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/Banwa/client/pages/resident/status.php';
                }, 2000);

            } else {
                await Swal.fire({
                    title: 'Error!',
                    text: 'Error: ' + data.message,
                    confirmButtonText: 'OK'
                });
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            await Swal.fire({
                title: 'Error!',
                text: 'An error occurred while submitting the application.',
                confirmButtonText: 'OK'
            });
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
});

/**
 * Opens an interactive map modal for location selection
 * @param {string} target - Identifier for which address field is being mapped ('1' for owner, '2' for business)
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

// Initialize map buttons when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => openMapPicker(btn.dataset.target));
    });
});

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

                        // Add popup with house information
                        polygon.bindPopup(`
                            <div class="house-popup">
                                <h4>${house.address}</h4>
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

/**
 * Automatically populates owner information fields with user data from session
 * Fetches resident profile data to pre-fill the form for convenience
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch('/Banwa/server/api/resident/get_user.php', { credentials: 'include', cache: 'no-store' });
        const data = await resp.json();
        console.debug('business_app autofill response:', data);

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        // fallback from full_name if individual fields missing
        if ((!data.first_name || data.first_name.trim() === '') && data.full_name) {
            const parts = data.full_name.trim().split(/\s+/);
            data.first_name = parts[0] || '';
            data.last_name = parts.length > 1 ? parts[parts.length-1] : '';
            data.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
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