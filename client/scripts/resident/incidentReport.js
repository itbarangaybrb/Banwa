// Configuration imports for service worker registration, address data, and Supabase authentication
import { registerServiceWorker } from '../../../register_sw.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import supabase from '../../../server/api/supabase.js';
import { initSocket, sockets } from '../utils/socket.js';

const IR_HANDLER_URL = '/server/handlers/staff/incident_report/ir_handler.php';

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

const ir_swal = Swal.mixin({
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
 * Switches the visible panel in the multi-step incident report form interface
 * @param {string} panelId - The ID of the panel to display ('reportingPerson', 'victimDetails', 'suspectDetails', 'witnessesSection', 'incidentDetails', or 'summary')
 */
function switchPanel(panelId) {
    const panels = ['reportingPerson', 'victimDetails', 'suspectDetails', 'witnessesSection', 'incidentDetails', 'summary']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
    window.scrollTo(0, 0);
}

// Tracks which panels have been properly validated and completed
const completedPanels = {
    reportingPerson: false,
    victimDetails: false,
    suspectDetails: false,
    witnessesSection: false,
    incidentDetails: false,
};

// Initialize the form with reporting person panel visible
switchPanel('reportingPerson');

// Form element references for reporting person section
const rpFullName = document.getElementById('rpFullName');
const rpAddress = document.getElementById('rpAddress'); // Updated
const rpContact = document.getElementById('rpContact');
const rpRelationship = document.getElementById('rpRelationship');
const victimSameAsRP = document.getElementById('victimSameAsRP');

// Form element references for victim details section
const vicFullName = document.getElementById('vicFullName');
const vicAddress = document.getElementById('vicAddress'); // Updated
const vicContact = document.getElementById('vicContact');
const vicCitizenship = document.getElementById('vicCitizenship');
const vicGender = document.getElementById('vicGender');
const vicDOB = document.getElementById('vicDOB');
const vicOccupation = document.getElementById('vicOccupation');

// Form element references for suspect details section
const susFullName = document.getElementById('susFullName');
const susAddress = document.getElementById('susAddress');
const susContact = document.getElementById('susContact');
const susGender = document.getElementById('susGender');
const susDescription = document.getElementById('susDescription');

// Form element references for incident details section
const incidentType = document.getElementById('incidentType');
const otherIncidentType = document.getElementById('otherIncidentType');
const incidentTimestamp = document.getElementById('incidentTimestamp');
const incidentAddress = document.getElementById('incidentAddress'); // Updated
const incidentLatitude = document.getElementById('incidentLatitude');
const incidentLongitude = document.getElementById('incidentLongitude');
const description = document.getElementById('description');

// Witness management variables and container reference
let witnessCount = 0;
const witnessesContainer = document.getElementById('witnessesContainer');

/**
 * Comprehensive validation utility for incident report form input fields
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
        if (rules.lettersOnly && !/^[A-Za-z\s]+$/.test(value)) {
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
     * Validates date input fields with various constraints (past/future only)
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
        const now = new Date();
        const currentYear = today.getFullYear();

        if (rules.birthDate) {
            const minBirthDate = new Date(today);
            minBirthDate.setFullYear(minBirthDate.getFullYear() - 18);
            const minRealisticYear = 1900;

            if (date.getFullYear() < minRealisticYear) {
                showError(input, rules.errorMessage || `Birth year must be ${minRealisticYear} or later`);
                return false;
            }
            if (date > minBirthDate) {
                showError(input, rules.errorMessage || 'Must be at least 18 years old');
                return false;
            }

            clearError(input);
            return true;
        }

        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        if (date < yearStart || date > yearEnd) {
            showError(input, rules.errorMessage || `Date must be within the current year (${currentYear})`);
            return false;
        }

        if (rules.pastOnly) {
            const threshold = input.type === 'datetime-local' ? now : today;
            if (date >= threshold) {
                showError(input, rules.errorMessage || 'Date must be in the past');
                return false;
            }
        }

        if (rules.futureOnly && date <= today) {
            showError(input, rules.errorMessage || 'Date must be in the future');
            return false;
        }

        if (rules.todayOnly) {
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

    /**
     * Validates textarea input fields for required content and minimum length
     * @param {HTMLTextAreaElement} input - The textarea element
     * @param {string} message - Required field error message
     * @param {Object} rules - Validation rules for textarea input
     * @returns {boolean} - Whether the textarea content is valid
     */
    function validateTextarea(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '') { showError(input, message); return false; }
        if (rules.minLength && value.length < rules.minLength) {
            showError(input, rules.errorMessage || `Must be at least ${rules.minLength} characters`); return false;
        }
        clearError(input); return true;
    }

    /**
     * Validates address fields with optional validation for existence in addressCoordinates database
     * @param {Object} options - Validation options (optional fields, existence validation)
     * @returns {boolean} - Whether the address is valid
     */
    function validateAddress(addressInput, options = {}) {
        const address = addressInput.value.trim();

        if (!address && !options.optional) {
            showError(addressInput, 'Address is required');
            return false;
        }

        if (!address) return true;

        // Try to find a match in your database (case-insensitive for better UX)
        const match = addressCoordinates.find(a => a.address.toLowerCase() === address.toLowerCase());

        if (!match && options.validateExistence !== false) {
            const wrapper = addressInput.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            addressInput.classList.add('error');
            errorEl.textContent = 'Address does not exist in our records';
            errorEl.classList.add('show');
            return false;
        }

        clearError(addressInput);

        // AUTO-SET COORDINATES FOR INCIDENT LOCATION WHEN ADDRESS IS VALID
        if (addressInput.id === 'incidentAddress' && match) {
            if (incidentLatitude && incidentLongitude) {
                incidentLatitude.value = match.lat.toFixed(6);
                incidentLongitude.value = match.lng.toFixed(6);
                console.log('Coordinates auto-set from address:', {
                    lat: incidentLatitude.value,
                    lng: incidentLongitude.value
                });
            }
        }

        return true;
    }

    // Public API of the validator module
    return {
        text: validateText,
        select: validateSelect,
        number: validateNumber,
        date: validateDate,
        textarea: validateTextarea,
        address: validateAddress,
        clear: clearError
    };
})();

/**
 * Configuration array defining validation rules for all incident report form fields
 * Each object specifies element, validation type, error message, and any additional rules
 */
const validationConfig = [
    // Reporting Person validation rules
    { el: rpFullName, type: 'text', message: 'Please enter your full name', rules: { minLength: 3 } },
    { el: rpAddress, type: 'text', message: 'Please enter your address', rules: { minLength: 5 } },
    { el: rpContact, type: 'number', message: 'Please enter your contact number', rules: { phoneType: 'ph' } },

    // Victim Details validation rules
    { el: vicFullName, type: 'text', message: 'Please enter victim full name', rules: { minLength: 3 } },
    { el: vicAddress, type: 'text', message: 'Please enter victim address', rules: { minLength: 5 } },
    { el: vicContact, type: 'number', message: 'Please enter victim contact number', rules: { phoneType: 'ph' } },
    { el: vicCitizenship, type: 'text', message: 'Please enter victim citizenship', rules: { minLength: 3 } },
    { el: vicGender, type: 'select', message: 'Please select victim gender' },
    { el: vicDOB, type: 'date', message: 'Please enter victim date of birth', rules: { birthDate: true } },
    { el: vicOccupation, type: 'text', message: 'Please enter victim occupation', rules: { minLength: 2 } },

    // Suspect Details validation rules
    { el: susDescription, type: 'textarea', message: 'Please describe the suspect', rules: { minLength: 10 } },

    // Incident Details validation rules
    { el: incidentType, type: 'select', message: 'Please select incident type' },
    { el: otherIncidentType, type: 'text', message: 'Please specify the incident type', rules: { minLength: 3 } },
    { el: incidentTimestamp, type: 'date', message: 'Please select incident date and time', rules: { pastOnly: true } },
    { el: incidentAddress, type: 'text', message: 'Please enter incident location address', rules: { minLength: 5 } },
    { el: description, type: 'textarea', message: 'Please describe the incident', rules: { minLength: 20 } },
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
        case 'text':
            if (el.closest('.label-and-input')?.style.display === 'none') {
                validator.clear(el);
                return true;
            }
            return validator.text(el, message, rules);
        case 'textarea': return validator.textarea(el, message, rules);
        case 'select': return validator.select(el, message);
        case 'date': return validator.date(el, message, rules);
        default: return true;
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

    // Input sanitization for contact number fields (remove non-digit characters)
    [rpContact, vicContact, susContact].forEach(el => {
        if (el) {
            el.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '');
                validator.clear(this);
            });
        }
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
 * Handles navigation from reporting person panel to victim details panel
 * Validates all reporting person fields before proceeding
 */
document.getElementById('nextToVictim').addEventListener('click', () => {
    const stepFields = [rpFullName, rpAddress, rpContact];
    if (!validateStep(stepFields)) return;

    completedPanels.reportingPerson = true;
    switchPanel('victimDetails');
});

/**
 * Handles navigation from victim details panel to suspect details panel
 * Validates victim fields or copies reporting person data if "same as RP" is checked
 */
document.getElementById('nextToSuspect').addEventListener('click', () => {
    if (!victimSameAsRP.checked) {
        // Copy reporting person data to victim
        vicFullName.value = rpFullName.value;
        vicAddress.value = rpAddress.value;
        vicContact.value = rpContact.value;
        const stepFields = [vicFullName, vicAddress, vicContact, vicCitizenship, vicGender, vicDOB, vicOccupation];
        if (!validateStep(stepFields)) return;
        completedPanels.victimDetails = true;
        switchPanel('suspectDetails');
    } else {
        const stepFields = [vicCitizenship, vicGender, vicDOB, vicOccupation];
        if (!validateStep(stepFields)) return;
        completedPanels.victimDetails = true;
        switchPanel('suspectDetails');
    }
});

/**
 * Handles navigation from suspect details panel to witnesses section panel
 * Validates suspect description and adds default witness if none exists
 */
document.getElementById('nextToWitnesses').addEventListener('click', () => {
    const stepFields = [susDescription];
    if (!validateStep(stepFields)) return;

    completedPanels.suspectDetails = true;
    if (witnessCount === 0) addWitness();
    switchPanel('witnessesSection');
});

/**
 * Handles navigation from witnesses section panel to incident details panel
 */
document.getElementById('nextToIncident').addEventListener('click', () => {
    completedPanels.witnessesSection = true;
    switchPanel('incidentDetails');
});

/**
 * Handles navigation from incident details panel to summary panel
 * Validates all incident fields and populates summary display with all form data
 */
document.getElementById('nextToSummary').addEventListener('click', () => {
    const stepFields = [
        incidentType,
        incidentType.value === 'Other' ? otherIncidentType : null,
        incidentTimestamp,
        incidentAddress,
        description
    ].filter(f => f !== null);

    if (!validateStep(stepFields)) return;
    completedPanels.incidentDetails = true;

    // Populate summary display with all collected data
    document.getElementById('sumRpFullName').textContent = rpFullName.value;
    document.getElementById('sumRpAddress').textContent = rpAddress.value;
    document.getElementById('sumRpContact').textContent = rpContact.value;
    document.getElementById('sumRpRelationship').textContent = rpRelationship.value || 'Not specified';

    if (victimSameAsRP.checked) {
        document.getElementById('sumVicFullName').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicAddress').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicContact').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicCitizenship').textContent = vicCitizenship.value || 'Not specified';
        document.getElementById('sumVicGender').textContent = vicGender.value || 'Not specified';
        document.getElementById('sumVicDOB').textContent = vicDOB.value || 'Not specified';
        document.getElementById('sumVicOccupation').textContent = vicOccupation.value || 'Not specified';
    } else {
        document.getElementById('sumVicFullName').textContent = vicFullName.value;
        document.getElementById('sumVicAddress').textContent = vicAddress.value;
        document.getElementById('sumVicContact').textContent = vicContact.value;
        document.getElementById('sumVicCitizenship').textContent = vicCitizenship.value || 'Not specified';
        document.getElementById('sumVicGender').textContent = vicGender.value || 'Not specified';
        document.getElementById('sumVicDOB').textContent = vicDOB.value || 'Not specified';
        document.getElementById('sumVicOccupation').textContent = vicOccupation.value || 'Not specified';
    }

    document.getElementById('sumSusFullName').textContent = susFullName.value || 'Not specified';
    document.getElementById('sumSusAddress').textContent = susAddress.value || 'Not specified';
    document.getElementById('sumSusContact').textContent = susContact.value || 'Not specified';
    document.getElementById('sumSusGender').textContent = susGender.value || 'Not specified';
    document.getElementById('sumSusDescription').textContent = susDescription.value;

    document.getElementById('sumIncidentType').textContent =
        incidentType.value === 'Other' ? otherIncidentType.value : incidentType.value;
    document.getElementById('sumIncidentTimestamp').textContent = incidentTimestamp.value;
    document.getElementById('sumIncidentLocation').textContent = incidentAddress.value;
    document.getElementById('sumDescription').textContent = description.value;

    switchPanel('summary');
});

/**
 * Sets up navigation between form panels with back button functionality
 * First back button returns to services page, others navigate to previous panel
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reportingPersonBackBtn').addEventListener('click', () => window.location.href = '/client/pages/resident/home.php');
    document.getElementById('victimBackBtn').addEventListener('click', () => switchPanel('reportingPerson'));
    document.getElementById('suspectBackBtn').addEventListener('click', () => switchPanel('victimDetails'));
    document.getElementById('witnessesBackBtn').addEventListener('click', () => switchPanel('suspectDetails'));
    document.getElementById('incidentBackBtn').addEventListener('click', () => switchPanel('witnessesSection'));
    document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('incidentDetails'));
});

/**
 * Handles toggling of "Victim same as reporting person" checkbox
 * Shows/hides victim details fields and clears validation errors accordingly
 */
victimSameAsRP.addEventListener('change', function () {
    // const victimContainer = document.getElementById('victimDetailsContainer');
    const victimFullNameWrapper = document.getElementById('vicFullName').closest('.label-and-input');
    const victimAddressWrapper = document.getElementById('vicAddress').closest('.label-and-input');
    const victimContactWrapper = document.getElementById('vicContact').closest('.label-and-input');

    if (this.checked) {
        // victimContainer.style.display = 'none';
        victimFullNameWrapper.style.display = 'none';
        victimAddressWrapper.style.display = 'none';
        victimContactWrapper.style.display = 'none';
        // Clear validation errors for victim fields
        [vicFullName, vicAddress, vicContact].forEach(el => {
            validator.clear(el);
        });
    } else {
        // victimContainer.style.display = 'block';
        victimFullNameWrapper.style.display = '';
        victimAddressWrapper.style.display = '';
        victimContactWrapper.style.display = '';
    }
});

/**
 * Adds a new witness entry with input fields for name, address, and contact information
 * Each witness is dynamically added to the form with remove functionality
 */
function addWitness() {
    witnessCount++;
    const witnessDiv = document.createElement('div');
    witnessDiv.className = 'witness-group';
    witnessDiv.style = 'border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px; position: relative;';
    witnessDiv.innerHTML = `
        <h7>Witness ${witnessCount}</h7>
        <div class="label-and-input">
            <label class="label" for="witnessName${witnessCount}">Full Name</label>
            <input type="text" class="witness-name" id="witnessName${witnessCount}" placeholder="Full Name">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessAddress${witnessCount}">Complete Address</label>
            <input type="text" class="witness-address" id="witnessAddress${witnessCount}" placeholder="Address">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessContact${witnessCount}">Contact Number</label>
            <input type="text" class="witness-contact" id="witnessContact${witnessCount}" maxlength="11" pattern="[0-9]{1,11}" placeholder="e.g., 09XXXXXXXXX">
        </div>
        <button type="button" class="remove-witness-btn" style="margin-top: 10px; ">Remove Witness</button>
    `;

    witnessesContainer.appendChild(witnessDiv);

    // Add remove functionality for witness entry
    witnessDiv.querySelector('.remove-witness-btn').addEventListener('click', () => {
        witnessDiv.remove();
        witnessCount--;
    });
}

// Set up witness addition button when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addWitnessBtn').addEventListener('click', addWitness);
});

/**
 * Handles final incident report submission with server integration
 * Collects all form data, validates, sends to backend, and handles response
 * Includes notification permission request, report generation, and success/error handling
 */
const summaryForm = document.getElementById('summaryForm');

// Clone form to prevent duplicate event listeners on page refresh
const newSummaryForm = summaryForm.cloneNode(true);
summaryForm.parentNode.replaceChild(newSummaryForm, summaryForm);

newSummaryForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const requiredPanels = ['reportingPerson', 'victimDetails', 'suspectDetails', 'witnessesSection', 'incidentDetails'];
    const bypassed = requiredPanels.some(panel => !completedPanels[panel]);

    if (bypassed) {
        await ir_swal.fire({
            icon: 'warning',
            title: 'Incomplete Submission',
            html: 'Your report cannot be submitted because one or more required sections have not been properly completed.<br><br>Please go back and ensure all steps are filled out before proceeding to submission.',
            confirmButtonText: 'Go Back',
        });
        switchPanel('reportingPerson');
        return;
    }

    // // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }

    const confirmInciStaffResult = await ir_swal.fire({
        icon: 'question',
        title: 'Submit your application?',
        text: 'Are you sure you want to submit this application?',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#ad2c2c',
        customClass: {
            cancelButton: 'btn-cancel'
        }
    });

    if (confirmInciStaffResult.isConfirmed) {
        const formData = new FormData();

        formData.append('action', 'create');

        // Get Supabase user ID for authentication
        const { data: { user } } = await supabase.auth.getUser();
        const supabaseUserId = user?.id;
        formData.append('supabase_user_id', supabaseUserId);

        // Reporting Person data
        formData.append('rpFullName', rpFullName.value);
        formData.append('rpAddress', rpAddress.value);
        formData.append('rpContact', rpContact.value);
        formData.append('rpRelationship', rpRelationship.value);

        // Victim Details data (conditionally included if different from RP)
        formData.append('victimSameAsRP', victimSameAsRP.checked ? '1' : '0');
        if (!victimSameAsRP.checked) {
            formData.append('vicFullName', vicFullName.value);
            formData.append('vicAddress', vicAddress.value);
            formData.append('vicContact', vicContact.value);
            formData.append('vicCitizenship', vicCitizenship.value);
            formData.append('vicGender', vicGender.value);
            formData.append('vicDOB', vicDOB.value);
            formData.append('vicOccupation', vicOccupation.value);
        }

        // Suspect Details data
        formData.append('susFullName', susFullName.value);
        formData.append('susAddress', susAddress.value);
        formData.append('susContact', susContact.value);
        formData.append('susGender', susGender.value);
        formData.append('susDescription', susDescription.value);

        // Witnesses data collected as JSON array
        const witnesses = [];
        document.querySelectorAll('.witness-group').forEach((group, index) => {
            const name = group.querySelector('.witness-name').value;
            const address = group.querySelector('.witness-address').value;
            const contact = group.querySelector('.witness-contact').value;

            if (name || address || contact) {
                witnesses.push({
                    name,
                    address,
                    contact
                });
            }
        });
        formData.append('witnesses', JSON.stringify(witnesses));

        // Incident Details data (only this section includes coordinates)
        const incidentTypeVal = incidentType.value;

        formData.append('incidentType', incidentTypeVal === 'Other' ? otherIncidentType.value : incidentTypeVal);
        formData.append('incidentTimestamp', incidentTimestamp.value);
        formData.append('incidentAddress', incidentAddress.value); // Added!
        formData.append('incidentLatitude', incidentLatitude.value);
        formData.append('incidentLongitude', incidentLongitude.value);
        formData.append('description', description.value);
        formData.append('dateReported', new Date().toISOString());

        // Send data to backend handler
        fetch(`${IR_HANDLER_URL}`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification("Incident Report Submitted", {
                                body: "Click to view your report status",
                                icon: "/client/img/banwalogo.png",
                                data: { url: "/client/pages/resident/status.php" }
                            });
                        });
                    }

                    const socket = sockets["main"];
                    if (socket) {
                        socket.emit('incident_report_applications_update', { action: 'status_update' });
                    }

                    ir_swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        html: 'Submitted successfully!<br><br>Reference ID: <strong>' + data.id + '</strong>'
                    }).then(() => {
                        // generateReportDocument();
                        window.location.href = '/client/pages/resident/status.php';
                    });
                } else {
                    ir_swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        html: 'An error occurred:<br><br><strong>' + data.message + '</strong>'
                    });
                }
            })
            .catch(err => {
                console.error(err);
                ir_swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    html: 'An error occurred:<br><br><strong>' + err.message + '</strong>'
                });
            });
    }
});

/**
 * Opens an interactive map modal specifically for incident location selection
 * @param {string} target - Identifier for which address field is being mapped
 */
function openMapPicker(target) {
    if (target !== 'incident') {
        ir_swal.fire({
            icon: 'info',
            title: 'Map Picker Limited',
            html: 'Map picker is only available for <strong>incident location</strong>.'
        });
        return;
    }

    let modal = document.querySelector('.dynamic-map-modal');
    if (!modal) {
        modal = document.createElement('div');
        // Removed 'map-modal' class to detach from external CSS forcing it to the right
        modal.className = 'dynamic-map-modal';

        // Foolproof full-screen centered overlay
        modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.6) !important; z-index: 99999 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 !important; padding: 0 !important;';

        // Removed 'map-modal-content' class and replaced with strict inline styles
        modal.innerHTML = `
            <div style="position: relative !important; margin: 0 !important; max-width: 900px !important; width: 90% !important; height: 85vh !important; display: flex !important; flex-direction: column !important; background: white !important; padding: 20px !important; border-radius: 8px !important; box-shadow: 0 5px 20px rgba(0,0,0,0.3) !important; box-sizing: border-box !important;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #ddd; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #00247C; font-family: Arial, sans-serif;">Select Incident Location</h3>
                    <div style="display: flex; gap: 8px;">
                        <button id="picker-street-btn" type="button" style="background: #00247c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">Street</button>
                        <button id="picker-satellite-btn" type="button" style="background: white; color: #555; border: 1px solid #ccc; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">Satellite</button>
                    </div>
                    <button class="close-map" type="button" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #333; line-height: 1; padding: 0;">&times;</button>
                </div>

                <div id="dynamic-map-container" style="width: 100%; flex-grow: 1; min-height: 300px; border-radius: 8px; z-index: 1;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-map').addEventListener('click', () => {
            // Revert display back to none when closing
            modal.style.setProperty('display', 'none', 'important');
        });
    }

    // Force it to use flex so centering applies when reopening
    modal.style.setProperty('display', 'flex', 'important');

    // Add a slight delay to allow the modal to display before initializing Leaflet
    setTimeout(() => {
        initializeMapPicker('dynamic-map-container', target);
    }, 150);
}

/**
 * Initializes the map, dynamically fetches barangay boundary & clickable house polygons,
 * and includes a street/satellite toggle. Adapted for Incident Reports.
 */
async function initializeMapPicker(containerId, target) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    // Clean up existing Leaflet instance if reopening modal
    const container = document.getElementById(containerId);
    if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
    }

    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });
    const satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri World Imagery'
    });

    const map = L.map(containerId).setView([defaultLat, defaultLng], 17);
    osmTile.addTo(map);

    // Match main map color system
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

    // Street / Satellite toggle listeners
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

    // Click anywhere to pick a point (Fallback for areas without polygons)
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        if (selectedMarker) map.removeLayer(selectedMarker);
        selectedMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;">Selected Location</div>')
            .openPopup();

        document.getElementById('incidentLatitude').value = lat;
        document.getElementById('incidentLongitude').value = lng;
    });

    // Load barangay boundaries from DB
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
                } catch (err) { console.error('Boundary parse error:', err); }
            });
        }
    } catch (err) { console.error('Failed to load boundaries:', err); }

    // Load house polygons
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
                    const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) ? coords[0] : coords;
                    const latLngs = ring.map(c => [c[1], c[0]]);
                    latLngs.push(latLngs[0]);

                    const polygon = L.polygon(latLngs, { ...POLY_COLORS.street, interactive: true });
                    housePolygons.push(polygon);

                    const isLandmark = house.address && !/^\d/.test(house.address.trim());
                    const titleText = isLandmark ? (house.address || 'Landmark') : ('House #' + (house.house_number || '—'));
                    const subtitleHtml = house.street_name ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>' : '';
                    const addrHtml = (!isLandmark && house.address) ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>' : '';
                    const streetHtml = house.street_name ? '<p style="margin:0 0 4px;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>' : '';

                    const popupHtml =
                        '<div style="font-family:Inter,sans-serif;min-width:190px;">' +
                        '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                        '<div style="font-weight:700;font-size:13px;">' + titleText + '</div>' + subtitleHtml +
                        '</div>' + addrHtml + streetHtml +
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
                        const selAddr = (!isLandmarkSel && house.address) ? '<p style="margin:4px 0 0;font-size:12px;color:#333;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>' : '';
                        const selStreet = house.street_name ? '<p style="margin:4px 0 0;font-size:12px;color:#333;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>' : '';

                        const selPopup =
                            '<div style="font-family:Inter,sans-serif;min-width:190px;">' +
                            '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                            '<div style="font-weight:700;font-size:13px;">&#10003; ' + selTitle + '</div>' +
                            (house.street_name ? '<div style="font-size:11px;opacity:0.85;margin-top:2px;">' + house.street_name + '</div>' : '') +
                            '</div>' + selAddr + selStreet + '</div>';

                        selectedMarker = L.marker([lat, lng]).addTo(map).bindPopup(selPopup, { maxWidth: 240 }).openPopup();

                        // Target Resident Incident Report Coordinates
                        document.getElementById('incidentLatitude').value = lat;
                        document.getElementById('incidentLongitude').value = lng;

                        // Auto-fill Incident Address dynamically
                        let formattedAddress = house.address;
                        if (!formattedAddress) {
                            const lot = house.house_number ? `House/Unit ${house.house_number}, ` : '';
                            const street = house.street_name ? `${house.street_name}, ` : '';
                            formattedAddress = `${lot}${street}Brgy. Blue Ridge B, Quezon City`.trim();
                        }
                        const addressInput = document.getElementById('incidentAddress');
                        if (addressInput) {
                            addressInput.value = formattedAddress;
                            // Trigger input event to clear validation errors automatically
                            addressInput.dispatchEvent(new Event('input'));
                        }
                    });

                    polygon.addTo(houseLayer);
                } catch (err) { console.error('House parse error:', err); }
            });

            houseLayer.addTo(map);
        }
    } catch (err) { console.error('Failed to load houses:', err); }

    setTimeout(() => map.invalidateSize(), 300);
}

/**
 * Sets up coordinate field formatting to ensure proper decimal precision for incident coordinates
 * @param {string} target - Identifier for which coordinate set to format ('incident' only)
 */
function setupCoordinateAutoFormat(target) {
    const latInput = document.getElementById(`${target}Latitude`);
    const lngInput = document.getElementById(`${target}Longitude`);
    if (!latInput || !lngInput) return;

    [latInput, lngInput].forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value && !this.value.includes('.')) {
                this.value = parseFloat(this.value).toFixed(6);
            }
        });
    });
}

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


// Initialize coordinate formatting only for incident location when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupCoordinateAutoFormat('incident');
});

// Initialize map buttons when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => openMapPicker(btn.dataset.target));
    });
});

/**
 * Automatically populates reporting person information fields with user data from session
 * Fetches resident profile data to pre-fill the form for convenience
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {

        await ir_swal.fire({
            icon: 'warning',
            title: 'Important Disclaimer',
            html: 'Filing a false, fabricated, or malicious incident report is a serious offense and is punishable by law.<br><br>By proceeding, you certify that all information you provide is true and accurate to the best of your knowledge.',
            confirmButtonText: 'I Understand and Agree',
            allowOutsideClick: false,
            allowEscapeKey: false
        });

        // 1. Added credentials and cache settings exactly like the business app
        const resp = await fetch('/server/api/resident/get_user.php', { credentials: 'include', cache: 'no-store' });
        const data = await resp.json();

        // console.debug('incident_report autofill response:', data);

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        // 2. Added the fallback logic to split 'full_name' if individual fields are missing
        if ((!data.first_name || data.first_name.trim() === '') && data.full_name) {
            const parts = data.full_name.trim().split(/\s+/);
            data.first_name = parts[0] || '';
            data.last_name = parts.length > 1 ? parts[parts.length - 1] : '';
            data.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
        }

        // 3. Populate reporting person fields with user data safely
        if (data.first_name || data.last_name) {
            const last = data.last_name || '';
            const first = data.first_name || '';
            const middle = data.middle_name ? ' ' + data.middle_name : '';

            // Formats to match the input placeholder: "Last, First, Middle Name"
            if (last && first) {
                rpFullName.value = `${last}, ${first}${middle}`;
            } else {
                rpFullName.value = `${last}${first}${middle}`.trim();
            }
        }

        if (data.contact_no) {
            rpContact.value = data.contact_no;
        }

        if (data.address) {
            // If your DB returns a full address string
            rpAddress.value = data.address;
        } else if (data.lot_no || data.street_name) {
            // Otherwise, combine lot and street into a complete address
            const lot = data.lot_no ? `House/Unit ${data.lot_no}, ` : '';
            const street = data.street_name ? `${data.street_name}, ` : '';
            rpAddress.value = `${lot}${street}Brgy. Blue Ridge B, Quezon City`.trim();
        }

        // Set default citizenship for victim
        if (vicCitizenship) {
            vicCitizenship.value = 'Filipino';
        }

    } catch (err) {
        console.error('Failed to fetch user data for autofill:', err);
    }

    if (!sockets["main"]) initSocket("main", "http://localhost:8081", () => { });

    incidentType.addEventListener('change', () => handleOthersSelect(incidentType, otherIncidentType));
    handleOthersSelect(incidentType, otherIncidentType);
});