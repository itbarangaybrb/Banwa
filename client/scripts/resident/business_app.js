// Configuration imports for Supabase, address data, and service worker registration
const BUSINESS_HANDLER_URL = '/Banwa/server/handlers/staff/business/business_handler.php';

import supabase from '../../../server/api/supabase.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import { registerServiceWorker } from '../../../register_sw.js';

registerServiceWorker();

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    /* Universal Popup Spacing */
    .swal2-popup {
        padding: 2rem 1.5rem !important; 
        border-radius: 15px !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Consistent Icon Margins for Success/Error/Warning */
    .swal2-icon {
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        border-width: 4px !important;
    }

    /* Standardized Titles */
    .swal2-title {
        color: #00247C !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        margin: 0.5rem 0 !important;
        padding: 0 !important;
    }

    /* Standardized Text Content */
    .swal2-html-container {
        margin: 1rem 0 !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }

    /* Button Spacing */
    .swal2-actions {
        margin-top: 1.5rem !important;
        margin-bottom: 0.5rem !important;
    }
`;
document.head.appendChild(swalStyle);

const business_app_swal = Swal.mixin({
    confirmButtonColor: '#00247C',
    confirmButtonText: 'OK',
    color: '#363636',
    customClass: {
        popup: 'modal-content',
        confirmButton: 'btn-proceed',
        title: 'swal-title',
        htmlContainer: 'swal-text'
    },
    // Force perfect centering + spacing for every alert
    didOpen: (popup) => {
        const container = popup.querySelector('.swal2-html-container');
        if (container) {
            container.style.textAlign = 'center';
            container.style.padding = '15px 30px';
            container.style.lineHeight = '1.65';
            container.style.marginBottom = '20px';
        }
    }
});

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
const addressOwner = document.getElementById('addressOwner');

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

// OCR runs asynchronously on the server after upload; resident-side verify UI removed.

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
    { el: addressOwner, type: 'text', message: 'Address is required' },
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

// ================== OCR VERIFICATION CONFIG (EDIT AS NEEDED) ==================
// These are fallbacks only — the real matching happens in your analyze_files() $KEYWORDS array
const requirementKeywords = {
    'SEC': ['securities and exchange commission', 'sec registration', 'certificate of registration', 'articles of incorporation'],
    'DTI': ['department of trade and industry', 'dti registration', 'business name registration'],
    'TCT': ['transfer certificate of title', 'tct no.', "owner's duplicate copy"],
    'Lease Contract': ['contract of lease', 'lease agreement', 'lessor', 'lessee'],
    'Previous Business Permit': ['business permit', "mayor's permit", 'barangay business clearance', 'business clearance']
    // ← ADD MORE HERE when you add new requirement types
};

// ================== PER-REQUIREMENT NAME CHECKING RULES ==================
const requirementNameRules = {
    'DTI': 'business',           // must contain business name
    'TCT': 'owner',              // must contain owner name
    'Lease Contract': 'owner',   // must contain owner name
    'SEC': 'either',             // business OR owner name
    'Previous Business Permit': 'either'
};

// let documentVerificationDone = false;
// const BUSINESS_NAME_FIELD = document.getElementById('businessName');

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

    // Address validation for business address
    [businessLotNo, businessStreet].forEach(el => {
        el.addEventListener('blur', () => {
            if (businessLotNo.value && businessStreet.value) validator.address(businessLotNo, businessStreet);
        });
        el.addEventListener('input', () => validator.clear(el));
    });

    // Input sanitization for numeric fields (remove non-digit characters)
    [contactNoOwner, contactNoBusiness, businessLotNo, noOfEmployees].forEach(el => {
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
    const stepFields = [firstName, lastName, contactNoOwner, addressOwner];
    if (!validateStep(stepFields)) return;

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

    // Soft reminder if not verified
    if (requirementUpload.files.length > 0 && !documentVerificationDone) {
        if (!confirm("Documents have not been verified with OCR yet.\n\nContinue anyway?")) {
            return;
        }
    }

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
        document.getElementById('sumAddressOwner').textContent = addressOwner.value;
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

newSummaryForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }

    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Business Application Submitted", {
                body: "Click to view your application status",
                icon: "/Banwa/client/img/banwalogo.png",
                data: { url: "/Banwa/client/pages/resident/status.php" }
            });
        });
    }

    const confirmBusResult = await business_app_swal.fire({
        icon: 'question',
        title: 'Submit Application?',
        html: 'Are you sure you want to submit this application?',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#ad2c2c',
        customClass: {
            cancelButton: 'btn-cancel'
        }
    });

    if (confirmBusResult.isConfirmed) {
        const formData = new FormData();

        // Add action for business_handler.php
        formData.append('action', 'create');

        // Capture form data
        formData.append('businessName', document.getElementById('businessName').value);

        // Get Supabase user ID
        const { data: { user } } = await supabase.auth.getUser();
        const supabaseUserId = user?.id;
        formData.append('supabase_user_id', supabaseUserId);

        // Type of Business (radio)
        const typeBiz = document.querySelector('input[name="typeOfBusiness"]:checked');
        formData.append('typeOfBusiness', typeBiz ? typeBiz.value : '');

        // Nature of Business
        formData.append('natureOfBusiness', document.getElementById('natureOfBusinessSelect').value);
        formData.append('natureOfBusinessSpecify', document.getElementById('natureOfBusinessSpecify').value);

        // Business Address
        formData.append('businessLotNo', document.getElementById('businessLotNo').value);
        formData.append('businessStreet', document.getElementById('businessStreet').value);
        formData.append('contactNoBusiness', document.getElementById('contactNoBusiness').value);
        formData.append('emailAddress', document.getElementById('emailAddress').value);

        // Business Status (radio)
        const bizStatus = document.querySelector('input[name="businessStatus"]:checked');
        if (bizStatus) formData.append('businessStatus[]', bizStatus.value);

        // Owner Details
        formData.append('firstName', document.getElementById('firstName').value);
        formData.append('middleName', document.getElementById('middleName').value);
        formData.append('suffix', document.getElementById('suffix').value);
        formData.append('lastName', document.getElementById('lastName').value);
        formData.append('contactNoOwner', document.getElementById('contactNoOwner').value);
        formData.append('addressOwner', document.getElementById('addressOwner').value);

        // Structure Details
        formData.append('typeOfStructureSelect', document.getElementById('typeOfStructureSelect').value);
        formData.append('typeOfStructureSpecify', document.getElementById('typeOfStructureSpecify').value);
        formData.append('noOfEmployees', document.getElementById('noOfEmployees').value);

        // Requirements (checkboxes)
        const reqCheckboxes = document.querySelectorAll('input[name="requirements"]:checked');
        reqCheckboxes.forEach((checkbox) => {
            formData.append('requirements[]', checkbox.value);
        });

        // File Upload - send ALL files as array
        const fileInput = document.getElementById('requirementUpload');
        if (fileInput.files.length > 0) {
            for (const file of fileInput.files) {
                formData.append('requirementUpload[]', file);
            }
        } else {
            // validation already catches this, but safe
            formData.append('requirementUpload[]', ''); // empty if none
        }

        // Coordinates
        const lat = document.getElementById('latitude2')?.value || '';
        const lng = document.getElementById('longitude2')?.value || '';
        formData.append('latitude2', lat);
        formData.append('longitude2', lng);

        // Application Date
        const appDate = document.getElementById('applicationDate')?.value || '';
        formData.append('applicationDate', appDate);

        fetch(`${BUSINESS_HANDLER_URL}`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    business_app_swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        html: 'Submitted successfully!<br><br>Reference ID: <strong>' + data.id + '</strong>'
                    }).then(() => {
                        window.location.href = '/Banwa/client/pages/resident/status.php';
                    });
                } else {
                    business_app_swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        html: 'An error occurred:<br><br><strong>' + data.message + '</strong>'
                    });
                }
            })
            .catch(err => {
                console.error(err);
                business_app_swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    html: 'An error occurred:<br><br><strong>' + err.message + '</strong>'
                });
            });
    }
});


// ====================== OCR DOCUMENT VERIFICATION ======================

let documentVerificationDone = false;
const BUSINESS_NAME_FIELD = document.getElementById('businessName');

// Get full owner name for cross-checking
function getFullOwnerName() {
    const first = (document.getElementById('firstName').value || '').trim();
    const middle = (document.getElementById('middleName').value || '').trim();
    const last = (document.getElementById('lastName').value || '').trim();
    const suffix = (document.getElementById('suffix').value || '').trim();
    return [first, middle, last, suffix].filter(Boolean).join(' ').toLowerCase();
}

// Show section + auto-verify exactly 1 second after file selection
requirementUpload.addEventListener('change', () => {
    if (requirementUpload.files.length > 0) {
        document.getElementById('verificationSection').style.display = 'block';
        setTimeout(verifyUploadedDocuments, 1000);
    }
});

document.getElementById('verifyDocumentsBtn').addEventListener('click', verifyUploadedDocuments);

async function verifyUploadedDocuments() {
    const verifyBtn = document.getElementById('verifyDocumentsBtn');
    const resultsDiv = document.getElementById('verificationResults');

    const selectedReqs = Array.from(document.querySelectorAll('input[name="requirements"]:checked'))
        .map(cb => cb.value);

    if (selectedReqs.length === 0) {
        resultsDiv.innerHTML = `<p style="color:#e74c3c;">Please select at least one requirement first.</p>`;
        return;
    }

    const total = requirementUpload.files.length;
    if (total > 5) {
        if (total > 5) {
            business_app_swal.fire({
                icon: 'warning',
                title: 'Too Many Files',
                html: 'Maximum <strong>5 files</strong> allowed for verification.'
            });
            return;
        }
                return;
    }

    verifyBtn.textContent = `Processing file 1 of ${total}...`;
    verifyBtn.disabled = true;

    let allResults = { results: [] };

    try {
        for (let i = 0; i < total; i++) {
            const file = requirementUpload.files[i];
            verifyBtn.textContent = `OCR on file ${i + 1}/${total}: ${file.name}`;

            const formData = new FormData();
            formData.append('action', 'analyze_documents');
            formData.append('requirementUpload[]', file);   // ← matches your main upload name
            selectedReqs.forEach(r => formData.append('requirements[]', r));

            const res = await fetch(BUSINESS_HANDLER_URL, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const raw = await res.text();
            if (!raw.trim()) throw new Error('Empty response from server');

            const data = JSON.parse(raw);

            if (data.status === 'success' && data.analysis) {
                allResults.results = allResults.results.concat(data.analysis.results || []);
            }
        }

        renderVerificationResults(allResults, selectedReqs);
        documentVerificationDone = true;

    } catch (err) {
        console.error('OCR Error:', err);
        resultsDiv.innerHTML = `
            <p style="color:#e74c3c; font-weight:600;">❌ OCR Verification Failed</p>
            <p style="color:#666; font-size:0.9em;">Error: ${err.message}</p>
            <p style="color:#e67e22;">You can still submit — staff will review manually.</p>
        `;
    } finally {
        verifyBtn.textContent = 'Re-Verify Documents with OCR';
        verifyBtn.disabled = false;
    }
}


function renderVerificationResults(analysis, selectedReqs) {
    const div = document.getElementById('verificationResults');
    let html = `<strong style="color:#1e40af;">OCR Results (per file):</strong><br><br>`;

    const businessName = (BUSINESS_NAME_FIELD.value || '').toLowerCase().trim();
    const ownerName = getFullOwnerName();
    let overallGood = true;

    analysis.results.forEach((result, index) => {
        const filename = result.filename || `File ${index + 1}`;
        const textLower = (result.text || '').toLowerCase();
        const detected = result.detected || [];

        let fileStatus = [];

        selectedReqs.forEach(reqType => {
            const rule = requirementNameRules[reqType] || 'either';
            let nameMatched = false;

            // Smart name check based on rule
            if (rule === 'business' && businessName) {
                nameMatched = textLower.includes(businessName);
            } else if (rule === 'owner' && ownerName) {
                nameMatched = textLower.includes(ownerName);
            } else if (rule === 'either') {
                nameMatched = (businessName && textLower.includes(businessName)) ||
                    (ownerName && textLower.includes(ownerName));
            }

            // Keyword detection from backend
            const keywordMatched = detected.includes(reqType);

            const finalMatch = keywordMatched && nameMatched;

            if (!finalMatch) overallGood = false;

            fileStatus.push(`
                <div style="margin:4px 0;">
                    <strong>${reqType}</strong>: 
                    ${keywordMatched ? '✅ Keywords' : '⚠️ Keywords'} 
                    ${nameMatched ? '✅ Name' : '⚠️ Name'}
                </div>
            `);
        });

        html += `
            <div style="background:#fff; padding:14px; margin:10px 0; border-radius:8px; border:1px solid #e2e8f0;">
                <strong>${filename}</strong><br>
                ${fileStatus.join('')}
                
                <details style="margin-top:10px; font-size:0.82em; color:#64748b;">
                    <summary>Show extracted text</summary>
                    <pre style="background:#f8fafc; padding:10px; overflow:auto; max-height:180px; font-size:0.78em;">
${(result.text || 'No text extracted').substring(0, 900)}${(result.text || '').length > 900 ? '...' : ''}
                    </pre>
                </details>
            </div>`;
    });

    if (overallGood) {
        html += `<p style="color:#16a34a; margin-top:15px; font-weight:600;">🎉 All requirements verified with correct names!</p>`;
    } else {
        html += `<p style="color:#ea580c; margin-top:12px;">Some requirements need staff review but you can proceed.</p>`;
    }

    div.innerHTML = html;
}


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
        const response = await fetch('/Banwa/server/handlers/map/map_handler.php', { method: 'POST', body: formData });
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
                            // if (target === '1') { // Owner
                            //     const lotNo = document.getElementById('lotNo');
                            //     const street = document.getElementById('street');
                            //     lotNo.value = house.house_number || '';
                            //     street.value = house.street_name || '';
                            //     [lotNo, street].forEach(el => {
                            //         el.dispatchEvent(new Event('input', { bubbles: true }));
                            //         el.dispatchEvent(new Event('change', { bubbles: true }));
                            //     });
                            // }

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