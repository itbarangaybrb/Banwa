// Configuration imports for service worker registration, address data, and Supabase authentication
const IR_HANDLER_URL = '/Banwa/server/handlers/staff/incident_report/ir_handler.php';

import { registerServiceWorker } from '../../../register_sw.js';
import { addressCoordinates } from '../../../server/api/resident/addresses.js';
import supabase from '../../../server/api/supabase.js';

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

// Initialize the form with reporting person panel visible
switchPanel('reportingPerson');

// Form element references for reporting person section
const rpFullName = document.getElementById('rpFullName');
const rpLotNo = document.getElementById('rpLotNo');
const rpStreet = document.getElementById('rpStreet');
const rpContact = document.getElementById('rpContact');
const rpRelationship = document.getElementById('rpRelationship');
const victimSameAsRP = document.getElementById('victimSameAsRP');

// Form element references for victim details section
const vicFullName = document.getElementById('vicFullName');
const vicLotNo = document.getElementById('vicLotNo');
const vicStreet = document.getElementById('vicStreet');
const vicContact = document.getElementById('vicContact');
const vicCitizenship = document.getElementById('vicCitizenship');
const vicGender = document.getElementById('vicGender');
const vicDOB = document.getElementById('vicDOB');
const vicOccupation = document.getElementById('vicOccupation');

// Form element references for suspect details section
const susFullName = document.getElementById('susFullName');
const susLotNo = document.getElementById('susLotNo');
const susStreet = document.getElementById('susStreet');
const susContact = document.getElementById('susContact');
const susGender = document.getElementById('susGender');
const susDescription = document.getElementById('susDescription');

// Form element references for incident details section
const incidentType = document.getElementById('incidentType');
const otherIncidentType = document.getElementById('otherIncidentType');
const incidentTimestamp = document.getElementById('incidentTimestamp');
const incidentLotNo = document.getElementById('incidentLotNo');
const incidentStreet = document.getElementById('incidentStreet');
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
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(input, rules.errorMessage || message);
            return false;
        }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `Number must be at least ${rules.minLength} digits`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Number cannot exceed ${rules.maxLength} digits`); return false; }
        if (rules.exactLength && value.length !== rules.exactLength) {
            showError(input, rules.errorMessage || `Number must be exactly ${rules.exactLength} digits`); return false;
        }
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

        if (rules.pastOnly && date > today) {
            showError(input, rules.errorMessage || 'Date cannot be in the future');
            return false;
        }

        if (rules.futureOnly && date < today) {
            showError(input, rules.errorMessage || 'Date cannot be in the past');
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
     * @param {HTMLInputElement} lotInput - Lot number input element
     * @param {HTMLSelectElement} streetInput - Street selection element
     * @param {Object} options - Validation options (optional fields, existence validation)
     * @returns {boolean} - Whether the address is valid
     */
    function validateAddress(lotInput, streetInput, options = {}) {
        const lot = lotInput.value.trim(), street = streetInput.value.trim();
        if (!lot && !options.optional) return validator.number(lotInput, 'Lot no. is required');
        if (!street && !options.optional) return validator.select(streetInput, 'Street is required');

        if (!lot || !street || street === 'select') return true;

        const fullAddress = `${lot} ${street}`;
        const match = addressCoordinates.find(a => a.address === fullAddress);
        if (!match && options.validateExistence !== false) {
            const wrapper = streetInput.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            streetInput.classList.add('error');
            errorEl.textContent = 'Street does not exist for this lot';
            errorEl.classList.add('show');
            return false;
        }
        clearError(streetInput);
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
    { el: rpLotNo, type: 'number', message: 'Please enter lot number', rules: { maxLength: 2 } },
    { el: rpStreet, type: 'select', message: 'Please select street' },
    { el: rpContact, type: 'number', message: 'Please enter your contact number', rules: { exactLength: 11 } },

    // Victim Details validation rules
    { el: vicFullName, type: 'text', message: 'Please enter victim full name', rules: { minLength: 3 } },
    { el: vicLotNo, type: 'number', message: 'Please enter victim lot number', rules: { maxLength: 2 } },
    { el: vicStreet, type: 'select', message: 'Please select victim street' },
    { el: vicContact, type: 'number', message: 'Please enter victim contact number', rules: { exactLength: 11 } },
    { el: vicCitizenship, type: 'text', message: 'Please enter victim citizenship', rules: { minLength: 3 } },
    { el: vicGender, type: 'select', message: 'Please select victim gender' },
    { el: vicDOB, type: 'date', message: 'Please enter victim date of birth', rules: { pastOnly: true } },
    { el: vicOccupation, type: 'text', message: 'Please enter victim occupation', rules: { minLength: 2 } },

    // Suspect Details validation rules
    { el: susDescription, type: 'textarea', message: 'Please describe the suspect', rules: { minLength: 10 } },

    // Incident Details validation rules
    { el: incidentType, type: 'select', message: 'Please select incident type' },
    { el: incidentTimestamp, type: 'date', message: 'Please select incident date and time', rules: { pastOnly: true } },
    { el: incidentLotNo, type: 'number', message: 'Please enter incident lot number', rules: { maxLength: 2 } },
    { el: incidentStreet, type: 'select', message: 'Please select incident street' },
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
        case 'text': return validator.text(el, message, rules);
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

    // Address validation setup for different sections with varying requirements
    const addressPairs = [
        { lot: rpLotNo, street: rpStreet, validateExistence: false },
        { lot: vicLotNo, street: vicStreet, validateExistence: false },
        { lot: susLotNo, street: susStreet, optional: true, validateExistence: false },
        { lot: incidentLotNo, street: incidentStreet, validateExistence: true }
    ];

    addressPairs.forEach(({ lot, street, optional = false, validateExistence = true }) => {
        if (!lot || !street) return;

        [lot, street].forEach(el => {
            el.addEventListener('blur', () => {
                if (lot.value && street.value) {
                    validator.address(lot, street, { optional, validateExistence });
                }
            });
            el.addEventListener('input', () => validator.clear(el));
        });
    });

    // Special handling for "Other" incident type selection
    incidentType.addEventListener('change', function () {
        const otherContainer = document.getElementById('otherSpecifyContainer');
        if (this.value === 'other') {
            otherContainer.classList.remove('hidden');
        } else {
            otherContainer.classList.add('hidden');
            validator.clear(otherIncidentType);
        }
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

    // Input sanitization for lot number fields (remove non-digit characters)
    [rpLotNo, vicLotNo, susLotNo, incidentLotNo].forEach(el => {
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
    const stepFields = [rpFullName, rpLotNo, rpStreet, rpContact];

    if (!validateStep(stepFields)) return;
    if (!validator.address(rpLotNo, rpStreet, { validateExistence: false })) return;

    switchPanel('victimDetails');
});

/**
 * Handles navigation from victim details panel to suspect details panel
 * Validates victim fields or copies reporting person data if "same as RP" is checked
 */
document.getElementById('nextToSuspect').addEventListener('click', () => {
    if (victimSameAsRP.checked) {
        // Copy reporting person data to victim
        vicFullName.value = rpFullName.value;
        vicLotNo.value = rpLotNo.value;
        vicStreet.value = rpStreet.value;
        vicContact.value = rpContact.value;
        switchPanel('suspectDetails');
    } else {
        const stepFields = [vicFullName, vicLotNo, vicStreet, vicContact, vicCitizenship, vicGender, vicDOB, vicOccupation];
        if (!validateStep(stepFields)) return;
        if (!validator.address(vicLotNo, vicStreet, { validateExistence: false })) return;
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
    if (susLotNo.value || susStreet.value) {
        validator.address(susLotNo, susStreet, { optional: true, validateExistence: false });
    }

    // Add default witness if none exists
    if (witnessCount === 0) {
        addWitness();
    }
    switchPanel('witnessesSection');
});

/**
 * Handles navigation from witnesses section panel to incident details panel
 */
document.getElementById('nextToIncident').addEventListener('click', () => {
    switchPanel('incidentDetails');
});

/**
 * Handles navigation from incident details panel to summary panel
 * Validates all incident fields and populates summary display with all form data
 */
document.getElementById('nextToSummary').addEventListener('click', () => {
    const stepFields = [incidentType, incidentTimestamp, incidentLotNo, incidentStreet, description];

    // Handle "other" incident type with custom specification
    if (incidentType.value === 'other') {
        if (!otherIncidentType.value.trim()) {
            validator.text(otherIncidentType, 'Please specify the incident type');
            return;
        }
    }

    if (!validateStep(stepFields)) return;
    if (!validator.address(incidentLotNo, incidentStreet, { validateExistence: true })) return;

    // Populate summary display with all collected data
    document.getElementById('sumRpFullName').textContent = rpFullName.value;
    document.getElementById('sumRpAddress').textContent = `${rpLotNo.value} ${rpStreet.value}`;
    document.getElementById('sumRpContact').textContent = rpContact.value;
    document.getElementById('sumRpRelationship').textContent = rpRelationship.value || 'Not specified';

    if (victimSameAsRP.checked) {
        document.getElementById('sumVicFullName').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicAddress').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicContact').textContent = 'Same as Reporting Person';
        document.getElementById('sumVicCitizenship').textContent = 'N/A';
        document.getElementById('sumVicGender').textContent = 'N/A';
        document.getElementById('sumVicDOB').textContent = 'N/A';
        document.getElementById('sumVicOccupation').textContent = 'N/A';
    } else {
        document.getElementById('sumVicFullName').textContent = vicFullName.value;
        document.getElementById('sumVicAddress').textContent = `${vicLotNo.value} ${vicStreet.value}`;
        document.getElementById('sumVicContact').textContent = vicContact.value;
        document.getElementById('sumVicCitizenship').textContent = vicCitizenship.value;
        document.getElementById('sumVicGender').textContent = vicGender.value;
        document.getElementById('sumVicDOB').textContent = vicDOB.value;
        document.getElementById('sumVicOccupation').textContent = vicOccupation.value;
    }

    document.getElementById('sumSusFullName').textContent = susFullName.value || 'Not specified';
    document.getElementById('sumSusAddress').textContent = susLotNo.value && susStreet.value ?
        `${susLotNo.value} ${susStreet.value}` : 'Not specified';
    document.getElementById('sumSusContact').textContent = susContact.value || 'Not specified';
    document.getElementById('sumSusGender').textContent = susGender.value || 'Not specified';
    document.getElementById('sumSusDescription').textContent = susDescription.value;

    document.getElementById('sumIncidentType').textContent =
        incidentType.value === 'other' ? otherIncidentType.value : incidentType.value;
    document.getElementById('sumIncidentTimestamp').textContent = incidentTimestamp.value;
    document.getElementById('sumIncidentLocation').textContent = `${incidentLotNo.value} ${incidentStreet.value}`;
    document.getElementById('sumIncidentCoordinates').textContent =
        incidentLatitude.value && incidentLongitude.value ?
            `Lat: ${incidentLatitude.value}, Lng: ${incidentLongitude.value}` : 'No coordinates';
    document.getElementById('sumDescription').textContent = description.value;

    switchPanel('summary');
});

/**
 * Sets up navigation between form panels with back button functionality
 * First back button returns to services page, others navigate to previous panel
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reportingPersonBackBtn').addEventListener('click', () => {
        window.location.href = '/Banwa/client/pages/resident/services.php';
    });

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
    const victimContainer = document.getElementById('victimDetailsContainer');
    if (this.checked) {
        victimContainer.style.display = 'none';
        // Clear validation errors for victim fields
        [vicFullName, vicLotNo, vicStreet, vicContact, vicCitizenship, vicGender, vicDOB, vicOccupation].forEach(el => {
            validator.clear(el);
        });
    } else {
        victimContainer.style.display = 'block';
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
    witnessDiv.innerHTML = `
        <h7>Witness ${witnessCount}</h7>
        <div class="label-and-input">
            <label class="label" for="witnessName${witnessCount}">Full Name</label>
            <input type="text" class="witness-name" id="witnessName${witnessCount}" placeholder="Full Name">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessLotNo${witnessCount}">Lot No.</label>
            <input type="tel" class="witness-lotNo" id="witnessLotNo${witnessCount}" maxlength="2" pattern="[0-9]{1,2}">
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessStreet${witnessCount}">Street Name</label>
            <select class="witness-street" id="witnessStreet${witnessCount}">
                <option value="" selected>Select</option>
                <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City</option>
                <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City</option>
                <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City</option>
                <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City</option>
                <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City</option>
                <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City</option>
                <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City</option>
                <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City</option>
                <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City</option>
                <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City</option>
                <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City</option>
                <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City</option>
                <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City</option>
            </select>
        </div>
        <div class="label-and-input">
            <label class="label" for="witnessContact${witnessCount}">Contact Number</label>
            <input type="text" class="witness-contact" id="witnessContact${witnessCount}" maxlength="11" pattern="[0-9]{1,11}" placeholder="e.g., 09XXXXXXXXX">
        </div>
        <button type="button" class="remove-witness-btn" style="margin-top: 10px;">Remove Witness</button>
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

    // Request notification permission for submission alerts
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }

    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Incident Report Submitted", {
                body: "Click to view your report status",
                icon: "/Banwa/client/img/banwalogo.png",
                data: { url: "/Banwa/client/pages/resident/status.php" }
            });
        });
    }

    const confirmInciStaffResult = await ir_swal.fire({
        icon: 'question',
        title: 'Submit Report?',
        html: 'Are you sure you want to submit this incident report?',
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
        formData.append('rpLotNo', rpLotNo.value);
        formData.append('rpStreet', rpStreet.value);
        formData.append('rpContact', rpContact.value);
        formData.append('rpRelationship', rpRelationship.value);

        // Victim Details data (conditionally included if different from RP)
        formData.append('victimSameAsRP', victimSameAsRP.checked ? '1' : '0');
        if (!victimSameAsRP.checked) {
            formData.append('vicFullName', vicFullName.value);
            formData.append('vicLotNo', vicLotNo.value);
            formData.append('vicStreet', vicStreet.value);
            formData.append('vicContact', vicContact.value);
            formData.append('vicCitizenship', vicCitizenship.value);
            formData.append('vicGender', vicGender.value);
            formData.append('vicDOB', vicDOB.value);
            formData.append('vicOccupation', vicOccupation.value);
        }

        // Suspect Details data
        formData.append('susFullName', susFullName.value);
        formData.append('susLotNo', susLotNo.value);
        formData.append('susStreet', susStreet.value);
        formData.append('susContact', susContact.value);
        formData.append('susGender', susGender.value);
        formData.append('susDescription', susDescription.value);

        // Witnesses data collected as JSON array
        const witnesses = [];
        document.querySelectorAll('.witness-group').forEach((group, index) => {
            const name = group.querySelector('.witness-name').value;
            const lotNo = group.querySelector('.witness-lotNo').value;
            const street = group.querySelector('.witness-street').value;
            const contact = group.querySelector('.witness-contact').value;

            if (name || lotNo || street || contact) {
                witnesses.push({
                    name,
                    lotNo,
                    street,
                    contact
                });
            }
        });
        formData.append('witnesses', JSON.stringify(witnesses));

        // Incident Details data (only this section includes coordinates)
        const incidentTypeVal = incidentType.value;
        formData.append('incidentType', incidentTypeVal === 'other' ?
            otherIncidentType.value : incidentTypeVal);
        formData.append('incidentTimestamp', incidentTimestamp.value);
        formData.append('incidentLotNo', incidentLotNo.value);
        formData.append('incidentStreet', incidentStreet.value);
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
                    ir_swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        html: 'Submitted successfully!<br><br>Reference ID: <strong>' + data.id + '</strong>'
                    }).then(() => {
                        generateReportDocument();
                        window.location.href = '/Banwa/client/pages/resident/status.php';
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
 * Generates a downloadable incident report document in HTML format
 * Creates a formatted report with all incident details for printing/saving
 */
function generateReportDocument() {
    const reportOutput = document.getElementById('reportOutput');
    const downloadBtn = document.getElementById('downloadBtn');

    if (reportOutput && downloadBtn) {
        reportOutput.classList.remove('hidden');

        downloadBtn.addEventListener('click', () => {
            // Create a simple HTML document for the report
            const reportHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Incident Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .section { margin: 20px 0; }
                        .section h2 { color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .field { margin: 5px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Incident Report</h1>
                    <div class="section">
                        <h2>Reporting Person</h2>
                        <div class="field"><span class="label">Name:</span> ${rpFullName.value}</div>
                        <div class="field"><span class="label">Address:</span> Lot ${rpLotNo.value}, ${rpStreet.value}</div>
                        <div class="field"><span class="label">Contact:</span> ${rpContact.value}</div>
                        <div class="field"><span class="label">Relationship to Victim:</span> ${rpRelationship.value || 'Not specified'}</div>
                    </div>
                    <div class="section">
                        <h2>Victim Details</h2>
                        ${victimSameAsRP.checked ?
                    '<div class="field">Same as Reporting Person</div>' :
                    `
                            <div class="field"><span class="label">Name:</span> ${vicFullName.value}</div>
                            <div class="field"><span class="label">Address:</span> Lot ${vicLotNo.value}, ${vicStreet.value}</div>
                            <div class="field"><span class="label">Contact:</span> ${vicContact.value}</div>
                            <div class="field"><span class="label">Citizenship:</span> ${vicCitizenship.value}</div>
                            <div class="field"><span class="label">Gender:</span> ${vicGender.value}</div>
                            <div class="field"><span class="label">Date of Birth:</span> ${vicDOB.value}</div>
                            <div class="field"><span class="label">Occupation:</span> ${vicOccupation.value}</div>
                            `
                }
                    </div>
                    <div class="section">
                        <h2>Suspect Details</h2>
                        <div class="field"><span class="label">Name:</span> ${susFullName.value || 'Not specified'}</div>
                        <div class="field"><span class="label">Address:</span> ${susLotNo.value && susStreet.value ? `Lot ${susLotNo.value}, ${susStreet.value}` : 'Not specified'}</div>
                        <div class="field"><span class="label">Contact:</span> ${susContact.value || 'Not specified'}</div>
                        <div class="field"><span class="label">Gender:</span> ${susGender.value || 'Not specified'}</div>
                        <div class="field"><span class="label">Description:</span> ${susDescription.value}</div>
                    </div>
                    <div class="section">
                        <h2>Incident Details</h2>
                        <div class="field"><span class="label">Type:</span> ${incidentType.value === 'other' ? otherIncidentType.value : incidentType.value}</div>
                        <div class="field"><span class="label">Date & Time:</span> ${incidentTimestamp.value}</div>
                        <div class="field"><span class="label">Location:</span> Lot ${incidentLotNo.value}, ${incidentStreet.value}</div>
                        <div class="field"><span class="label">Coordinates:</span> ${incidentLatitude.value && incidentLongitude.value ? `Lat: ${incidentLatitude.value}, Lng: ${incidentLongitude.value}` : 'No coordinates'}</div>
                        <div class="field"><span class="label">Description:</span> ${description.value}</div>
                    </div>
                    <div class="section">
                        <h2>Report Information</h2>
                        <div class="field"><span class="label">Date Reported:</span> ${new Date().toLocaleString()}</div>
                    </div>
                </body>
                </html>
            `;

            // Create and download the file as a Word document
            const blob = new Blob([reportHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Incident_Report_${new Date().toISOString().split('T')[0]}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

/**
 * Opens an interactive map modal specifically for incident location selection
 * @param {string} target - Identifier for which address field is being mapped (only 'incident' is supported)
 */
function openMapPicker(target) {
    // Only open map picker for incident location (restricted functionality)
    if (target !== 'incident') {
        ir_swal.fire({
            icon: 'info',
            title: 'Map Picker Limited',
            html: 'Map picker is only available for <strong>incident location</strong>.'
        });
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <div class="map-modal-header">
                    <h3>Select Incident Location</h3>
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
 * Initializes Leaflet map specifically for incident location selection
 * @param {string} target - Identifier for which address field is being mapped (only 'incident' is supported)
 */
async function initializeMapPicker(target) {
    const defaultLat = 14.6175;
    const defaultLng = 121.0756;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    // Handle map clicks to set incident location marker and populate coordinates
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Location').openPopup();

        // ONLY set coordinates for incident location
        if (target === 'incident') {
            incidentLatitude.value = lat;
            incidentLongitude.value = lng;
        }

        document.getElementById(`map-preview-${target}`).style.display = 'block';
    });

    // Barangay polygon for visual reference
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

                        // Polygon click autofill - populate incident fields when house is selected
                        polygon.on('click', function (e) {
                            const lat = e.latlng.lat.toFixed(6);
                            const lng = e.latlng.lng.toFixed(6);

                            if (marker) map.removeLayer(marker);
                            marker = L.marker([lat, lng]).addTo(map).bindPopup("Selected House").openPopup();

                            // ONLY set coordinates for incident location
                            if (target === 'incident') {
                                incidentLatitude.value = lat;
                                incidentLongitude.value = lng;

                                // Fill lot and street fields for incident location
                                incidentLotNo.value = house.house_number || '';
                                incidentStreet.value = house.street_name || '';
                                [incidentLotNo, incidentStreet].forEach(el => {
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                });
                            }

                            document.getElementById(`map-preview-${target}`).style.display = 'block';
                        });

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
        const resp = await fetch('/Banwa/server/api/resident/get_user.php');
        const data = await resp.json();

        if (data.error) {
            console.log('Autofill error:', data.error);
            return;
        }

        // Populate reporting person fields with user data
        if (data.first_name && data.last_name) {
            rpFullName.value = `${data.last_name}, ${data.first_name}${data.middle_name ? ' ' + data.middle_name : ''}`;
        }

        if (data.contact_no) {
            rpContact.value = data.contact_no;
        }

        // Populate address fields if available
        if (data.lot_no) {
            rpLotNo.value = data.lot_no;
        }

        if (data.street_name) {
            // Find matching street in dropdown
            const streetSelect = document.getElementById('rpStreet');
            for (let option of streetSelect.options) {
                if (option.value === data.street_name) {
                    streetSelect.value = data.street_name;
                    break;
                }
            }
        }

        // Set default citizenship for victim
        vicCitizenship.value = 'Filipino';

    } catch (err) {
        console.error('Failed to fetch user data:', err);
    }
});