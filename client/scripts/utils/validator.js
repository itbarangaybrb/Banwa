/**
 * Comprehensive validation utility module
 * Import and use across any form script
 */

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
    if (rules.lettersOnly) {
        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) { showError(input, rules.errorMessage || 'Only letters are allowed'); return false; }
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

function validateCheckbox(input, message) {
    if (!input.checked) { showError(input, message); return false; }
    clearError(input); return true;
}

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

function validateDate(input, message, rules = {}) {
    if (!input) return true;
    const value = input.value;
    if (!value) { showError(input, message); return false; }
    const date = new Date(value);
    if (isNaN(date.getTime())) { showError(input, rules.errorMessage || 'Invalid date'); return false; }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (rules.pastOnly && date >= today) { showError(input, rules.errorMessage || 'Date must be in the past'); return false; }
    if (rules.futureOnly && date <= today) { showError(input, rules.errorMessage || 'Date must be in the future'); return false; }
    if (rules.todayOnly) {
        const inputDate = new Date(value);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate.getTime() !== today.getTime()) { showError(input, rules.errorMessage || 'Date must be today'); return false; }
    }
    if (rules.minDate && date < new Date(rules.minDate)) { showError(input, rules.errorMessage || `Date must be after ${rules.minDate}`); return false; }
    if (rules.maxDate && date > new Date(rules.maxDate)) { showError(input, rules.errorMessage || `Date must be before ${rules.maxDate}`); return false; }
    clearError(input); return true;
}

/**
 * Address validator is form-specific — inject addressCoordinates and field IDs at call site.
 * @param {HTMLInputElement} lotInput
 * @param {HTMLSelectElement} streetInput
 * @param {Array} addressCoordinates - The address dataset to match against
 * @param {{ latId: string, lngId: string }} [coordFieldIds] - IDs of hidden lat/lng inputs to auto-fill
 */
function validateAddress(lotInput, streetInput, addressCoordinates, coordFieldIds = {}) {
    const lot = lotInput.value.trim();
    const street = streetInput.value.trim();
    if (!lot) return validateNumber(lotInput, 'House No. is required');
    if (!street || street === 'select') return validateSelect(streetInput, 'Street is required');
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
    if (coordFieldIds.latId && coordFieldIds.lngId) {
        const lat = document.getElementById(coordFieldIds.latId);
        const lng = document.getElementById(coordFieldIds.lngId);
        if (lat && lng) { lat.value = match.lat.toFixed(6); lng.value = match.lng.toFixed(6); }
    }
    return true;
}

/**
 * Binds real-time blur/input validation to a validationConfig array.
 * @param {Array} config - Same shape as your validationConfig arrays
 * @param {Function} validateField - Your per-script validateField function
 */
function bindRealTimeValidation(config, validateField) {
    config.forEach(entry => {
        const { el, type } = entry;
        if (!el) return;
        const targets = ['checkboxGroup', 'radio'].includes(type) ? Array.from(el) : [el];
        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(entry));
            target.addEventListener('input', () => clearError(target));
        });
    });
}

/**
 * Strips non-digit characters from numeric inputs on every keystroke.
 * @param {HTMLInputElement[]} elements
 */
function bindNumericSanitizer(elements) {
    elements.forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => {
            el.value = el.value.replace(/\D/g, '');
            clearError(el);
        });
    });
}

export const validator = {
    text: validateText,
    file: validateFile,
    select: validateSelect,
    number: validateNumber,
    checkbox: validateCheckbox,
    address: validateAddress,
    date: validateDate,
    clear: clearError,
    showError,
    bindRealTimeValidation,
    bindNumericSanitizer,
};