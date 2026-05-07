import supabase from '../../../server/api/supabase.js';

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

/**
 * Panel switch helper
 */
function switchPanel(panelId) {
    const mapping = {
        changePass: 'changePasswordForm',
        manageAcc: 'manageAccountForm'
    };
    const targetId = mapping[panelId] || panelId;
    const panels = Array.from(document.querySelectorAll('.form-card'));
    panels.forEach(p => {
        if (p.id === targetId) p.classList.add('active');
        else p.classList.remove('active');
    });
    window.scrollTo(0, 0);
}

/**
 * Form element references
 */
// Change password elements
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const reTypeNewPassword = document.getElementById('reTypeNewPassword');
const newPassFields = document.getElementById('newPassFields');
let currentPassVerified = false;

// Manage account elements
const firstName = document.getElementById('firstName');
const middleName = document.getElementById('middleName');
const lastName = document.getElementById('lastName');
const suffix = document.getElementById('suffix');
const contactNo = document.getElementById('contactNo');
const address = document.getElementById('address');

/**
 * Toggle Password Visibility
 */
const EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const EYE_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

document.querySelectorAll('.input-with-icon .input-icon').forEach(icon => {
    icon.style.cursor = 'pointer';
    icon.addEventListener('click', () => {
        const input = icon.closest('.input-with-icon').querySelector('input');
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.innerHTML = isPassword ? EYE_OFF : EYE_OPEN;
    });
});

// Show panel by default
switchPanel('changePass');

/**
 * COMPREHENSIVE VALIDATOR UTILITY (Same pattern as first code)
 */
const validator = (() => {
    /**
     * Gets the wrapper element containing the input and error message
     * @param {HTMLElement} el - The input element
     * @returns {HTMLElement} - The parent wrapper element
     */
    function getWrapper(el) {
        if (!el) return null;
        return el.closest('.label-and-input') || el.closest('.form-group') || el.closest('.input-with-icon') || el.parentElement;
    }

    /**
     * Gets the error message element associated with an input
     * @param {HTMLElement} el - The input element
     * @returns {HTMLElement} - The error message span element
     */
    function getErrorEl(el) {
        const wrapper = getWrapper(el);
        if (!wrapper) return null;
        return wrapper.querySelector('.error-msg');
    }

    /**
     * Displays an error message for an invalid input field
     * @param {HTMLElement} el - The input element with validation error
     * @param {string} message - The error message to display
     */
    function showError(el, message) {
        const errorEl = getErrorEl(el);
        if (!errorEl) return;
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
        if (!errorEl) return;
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
        
        if (value === '') { 
            showError(input, message); 
            return false; 
        }
        
        if (rules.lettersOnly) {
            if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
                showError(input, rules.errorMessage || 'Only letters are allowed'); 
                return false;
            }
            if (value.length < 2) { 
                showError(input, 'Too short'); 
                return false; 
            }
            if (value.length > 50) { 
                showError(input, 'Too long'); 
                return false; 
            }
            if (/(.)\1{3,}/.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
            if (/^([A-Za-z])\s\1(\s\1)*$/.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
            if (/^(.{2,6})\1{2,}$/i.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
            if (value.length >= 6 && !/[aeiouAEIOU]/.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
        }

        if (rules.minLength && value.length < rules.minLength) { 
            showError(input, rules.errorMessage || `Minimum ${rules.minLength} characters`); 
            return false; 
        }
        if (rules.maxLength && value.length > rules.maxLength) { 
            showError(input, rules.errorMessage || `Maximum ${rules.maxLength} characters`); 
            return false; 
        }
        if (rules.noSpam) {
            if (/(.)\1{4,}/.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
            if (/^(.{2,6})\1{2,}$/i.test(value)) { 
                showError(input, rules.errorMessage || 'Invalid input'); 
                return false; 
            }
        }

        clearError(input); 
        return true;
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
        
        if (value === '') { 
            showError(input, message); 
            return false; 
        }
        
        if (!/^\d+$/.test(value)) { 
            showError(input, rules.errorMessage || 'Only numeric digits are allowed'); 
            return false; 
        }
        
        if (rules.phoneType === 'ph') {
            const isMobile = /^09\d{9}$/.test(value);
            const isLandline8 = /^[2-9]\d{7}$/.test(value);
            const isLandlineArea = /^0[2-9]\d{8}$/.test(value);
            if (!isMobile && !isLandline8 && !isLandlineArea) { 
                showError(input, 'Enter a valid number (e.g. 09171234567 or 85359822)'); 
                return false; 
            }
            if (/^(\d)\1{10}$/.test(value) || /^09(\d)\1{8}$/.test(value)) { 
                showError(input, 'Enter a real contact number'); 
                return false; 
            }
            if (/^(?:0(?:123456789|987654321)|09(?:12345678|87654321))$/.test(value)) { 
                showError(input, 'Enter a real contact number'); 
                return false; 
            }
            clearError(input); 
            return true;
        }
        
        if (rules.exactLength && value.length !== rules.exactLength) { 
            showError(input, rules.errorMessage || `Must be exactly ${rules.exactLength} digits`); 
            return false; 
        }
        if (rules.minLength && value.length < rules.minLength) { 
            showError(input, rules.errorMessage || `At least ${rules.minLength} digits`); 
            return false; 
        }
        if (rules.maxLength && value.length > rules.maxLength) { 
            showError(input, rules.errorMessage || `Cannot exceed ${rules.maxLength} digits`); 
            return false; 
        }
        
        clearError(input); 
        return true;
    }

    /**
     * Validates password fields with strength requirements
     * @param {HTMLInputElement} input - The password input element
     * @param {string} message - Required field error message
     * @param {Object} rules - Validation rules for password
     * @returns {boolean} - Whether the password is valid
     */
    function validatePassword(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value;
        
        if (value === '') { 
            showError(input, message); 
            return false; 
        }
        
        if (rules.minLength && value.length < rules.minLength) {
            showError(input, rules.errorMessage || `Minimum ${rules.minLength} characters`);
            return false;
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            showError(input, rules.errorMessage || `Maximum ${rules.maxLength} characters`);
            return false;
        }
        
        if (rules.requireLettersAndNumbers) {
            if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
                showError(input, 'Password must contain both letters and numbers');
                return false;
            }
        }
        
        clearError(input);
        return true;
    }

    /**
     * Validates password confirmation match
     * @param {HTMLInputElement} passwordInput - The password input
     * @param {HTMLInputElement} confirmInput - The confirm password input
     * @param {string} message - Error message when passwords don't match
     * @returns {boolean} - Whether passwords match
     */
    function validatePasswordMatch(passwordInput, confirmInput, message) {
        if (!passwordInput || !confirmInput) return true;
        
        if (confirmInput.value !== passwordInput.value) {
            showError(confirmInput, message);
            return false;
        }
        
        clearError(confirmInput);
        return true;
    }

    return {
        text: validateText,
        number: validateNumber,
        password: validatePassword,
        passwordMatch: validatePasswordMatch,
        clear: clearError,
        showError: showError
    };
})();

/**
 * VALIDATION CONFIGURATION
 */
const validationConfig = [
    { el: firstName, type: 'text', message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: middleName, type: 'text', message: 'Middle name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: lastName, type: 'text', message: 'Last name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: suffix, type: 'text', message: 'Suffix is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: contactNo, type: 'number', message: 'Contact number is required', rules: { phoneType: 'ph' } },
    { el: address, type: 'text', message: 'Address is required', rules: { minLength: 5, maxLength: 200 } },
    { el: currentPassword, type: 'password', message: 'Current password is required', rules: { minLength: 1 } },
    { el: newPassword, type: 'password', message: 'New password is required', rules: { minLength: 8, maxLength: 16, requireLettersAndNumbers: true } }
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
        case 'password': return validator.password(el, message, rules);
    }
    return true;
}

/**
 * Sets up real-time validation on form field interactions
 * Validates on blur and clears errors on input for immediate feedback
 */
(() => {
    validationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;

        el.addEventListener('blur', () => validateField(config));
        el.addEventListener('input', () => validator.clear(el));
    });

    // Special handling for password match
    if (newPassword && reTypeNewPassword) {
        newPassword.addEventListener('blur', () => {
            validateField(validationConfig.find(c => c.el === newPassword));
            if (reTypeNewPassword.value) {
                validator.passwordMatch(newPassword, reTypeNewPassword, 'Passwords do not match');
            }
        });
        
        reTypeNewPassword.addEventListener('blur', () => {
            validator.passwordMatch(newPassword, reTypeNewPassword, 'Passwords do not match');
        });
        
        reTypeNewPassword.addEventListener('input', () => {
            if (newPassword.value && reTypeNewPassword.value) {
                validator.passwordMatch(newPassword, reTypeNewPassword, 'Passwords do not match');
            } else {
                validator.clear(reTypeNewPassword);
            }
        });
    }

    // Contact number input filtering
    if (contactNo) {
        contactNo.addEventListener('input', () => {
            contactNo.value = contactNo.value.replace(/\D/g, '');
        });
    }
})();

/**
 * Validates a group of fields
 * @param {Array} fields - Array of form elements to validate
 * @returns {boolean} - Whether all fields are valid
 */
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

/**
 * Autofill user data
 */
async function loadUserData() {
    try {
        const res = await fetch('/server/api/resident/get_user.php', { credentials: 'include' });
        const data = await res.json();
        if (data.error) { console.error(data.error); return; }

        firstName.value = data.first_name || '';
        middleName.value = data.middle_name || '';
        lastName.value = data.last_name || '';
        suffix.value = data.suffix || '';
        contactNo.value = data.contact_no || '';
        address.value = data.address || '';
        
        const emailEl = document.getElementById('email');
        if (emailEl) emailEl.value = data.email || '';

        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.value = data.email || '';

        const avatar = document.getElementById('profileAvatar');
        const fullNameEl = document.getElementById('userFullName');
        let full = '';
        const parts = [data.first_name, data.middle_name, data.last_name].filter(Boolean);
        if (parts.length) full = parts.join(' ').trim();
        else if (data.full_name) full = (data.full_name || '').trim();

        if (fullNameEl) fullNameEl.textContent = full || fullNameEl.textContent;

        const memberSinceEl = document.getElementById('memberSince');
        if (memberSinceEl && data.member_since) {
            memberSinceEl.textContent = data.member_since;
        }

        if (avatar) {
            function getInitialsFromParts(first, middle, last, fullNameFallback) {
                if (first && last) return (first[0] + last[0]).toUpperCase();
                if (first && first.length >= 2) return first.slice(0, 2).toUpperCase();
                if (fullNameFallback) {
                    const toks = fullNameFallback.split(/\s+/).filter(Boolean);
                    if (toks.length >= 2) return (toks[0][0] + toks[1][0]).toUpperCase();
                    if (toks.length === 1 && toks[0].length >= 2) return toks[0].slice(0, 2).toUpperCase();
                }
                return 'U';
            }

            const initials = getInitialsFromParts(data.first_name, data.middle_name, data.last_name, data.full_name);
            avatar.textContent = initials;

            try {
                const nameForColor = full || data.full_name || data.first_name || data.last_name || 'User';
                let hash = 0;
                for (let i = 0; i < nameForColor.length; i++) hash = nameForColor.charCodeAt(i) + ((hash << 5) - hash);
                const hue = Math.abs(hash) % 360;
                const bg = `hsl(${hue} 70% 45%)`;
                avatar.style.background = bg;
                avatar.classList.add('colored', 'avatar-animated');
                avatar.style.color = '#ffffff';
                setTimeout(() => avatar.classList.remove('avatar-animated'), 500);
            } catch (e) { console.warn('avatar color calc failed', e); }
        }

        captureOriginalData();
    } catch (err) { console.error('Failed to load user data:', err); }
}

async function loadApplicationSummary() {
    try {
        const res = await fetch('/server/api/resident/get_applications.php', { credentials: 'include' });
        const json = await res.json();
        if (json.error) return;
        const apps = json.applications || [];
        const total = apps.length;
        const approved = apps.filter(a => a.status && a.status.toLowerCase() === 'approved').length;
        const pending = apps.filter(a => a.status && ['pending', 'in progress', 'new'].includes(a.status.toLowerCase())).length;
        const rejected = apps.filter(a => a.status && a.status.toLowerCase() === 'rejected').length;

        const elTotal = document.querySelector('.stat-item[data-key="applications"] .stat-number');
        const elApproved = document.querySelector('.stat-item[data-key="approved"] .stat-number');
        const elPending = document.querySelector('.stat-item[data-key="pending"] .stat-number');
        const elRejected = document.querySelector('.stat-item[data-key="rejected"] .stat-number');
        if (elTotal) elTotal.textContent = total;
        if (elApproved) elApproved.textContent = approved;
        if (elPending) elPending.textContent = pending;
        if (elRejected) elRejected.textContent = rejected;
    } catch (err) { console.error('Failed to load applications summary', err); }
}

// Run after init
loadUserData();
loadApplicationSummary();

/**
 * Change Password Functions
 */
function setChangePassReadonly(state) {
    if (currentPassword) currentPassword.disabled = state;
    if (newPassword) newPassword.disabled = true;
    if (reTypeNewPassword) reTypeNewPassword.disabled = true;
    if (state) {
        if (newPassFields) newPassFields.style.display = 'none';
        if (currentPassword && currentPassword.closest('.form-group')) {
            currentPassword.closest('.form-group').style.display = 'block';
        }
        const saveBtn = document.getElementById('saveNewPass');
        if (saveBtn) saveBtn.style.display = 'none';
        currentPassVerified = false;
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
        if (reTypeNewPassword) reTypeNewPassword.value = '';
    }
}

function toggleChangePassButtons(mode) {
    const btnEdit = document.getElementById('changePassEditBtn');
    const btnSave = document.getElementById('saveNewPass');
    const btnCancel = document.getElementById('changePassCancelBtn');
    const next = document.getElementById('nextBtn');

    if (mode === "view") {
        if (btnEdit) btnEdit.style.display = "block";
        if (btnSave) btnSave.style.display = "none";
        if (btnCancel) btnCancel.style.display = "none";
        if (next) next.style.display = "none";
    }

    if (mode === "edit") {
        if (btnEdit) btnEdit.style.display = "none";
        if (btnSave) btnSave.style.display = "none";
        if (btnCancel) btnCancel.style.display = "block";
        if (next) next.style.display = "block";
    }
}

let originalPassData = {};

function captureOriginalPassData() {
    originalPassData = {
        current: currentPassword ? currentPassword.value : '',
        newPass: newPassword ? newPassword.value : '',
        retype: reTypeNewPassword ? reTypeNewPassword.value : ''
    };
}

function clearChangePassErrors() {
    [currentPassword, newPassword, reTypeNewPassword].forEach(input => {
        if (!input) return;
        validator.clear(input);
        // Reset eye icon
        const icon = input.closest('.input-with-icon')?.querySelector('.input-icon');
        if (icon) icon.innerHTML = EYE_OPEN;
        input.type = 'password';
    });
}

/**
 * Change Password: "Next" button click — verify current password
 */
const nextBtn = document.getElementById('nextBtn');
if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
        // Validate current password field
        const isValid = validateField(validationConfig.find(c => c.el === currentPassword));
        if (!isValid) return;

        const val = currentPassword.value.trim();

        // Show loading state
        nextBtn.disabled = true;
        nextBtn.textContent = 'Verifying...';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Next';
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: val
        });

        nextBtn.disabled = false;
        nextBtn.textContent = 'Next';

        if (signInError) {
            currentPassVerified = false;
            validator.showError(currentPassword, 'Current password is incorrect');
        } else {
            currentPassVerified = true;
            validator.clear(currentPassword);

            if (currentPassword.closest('.form-group')) {
                currentPassword.closest('.form-group').style.display = 'none';
            }
            nextBtn.style.display = 'none';
            if (newPassFields) newPassFields.style.display = 'block';
            const saveBtn = document.getElementById('saveNewPass');
            if (saveBtn) {
                saveBtn.style.display = 'block';
                saveBtn.disabled = true;
            }
            if (newPassword) {
                newPassword.disabled = false;
                newPassword.focus();
            }
            if (reTypeNewPassword) reTypeNewPassword.disabled = false;
        }
    });
}

// Enable save button when new password is valid
if (newPassword && reTypeNewPassword) {
    const checkEnableSubmit = () => {
        const saveBtn = document.getElementById('saveNewPass');
        if (!saveBtn) return;
        
        const newPassValid = newPassword.value.length >= 8 &&
            newPassword.value.length <= 16 &&
            /[A-Za-z]/.test(newPassword.value) &&
            /[0-9]/.test(newPassword.value);
        const passwordsMatch = newPassword.value === reTypeNewPassword.value;
        
        saveBtn.disabled = !(currentPassVerified && passwordsMatch && newPassValid && 
                            newPassword.value.trim() !== '' && reTypeNewPassword.value.trim() !== '');
    };

    newPassword.addEventListener('input', checkEnableSubmit);
    reTypeNewPassword.addEventListener('input', checkEnableSubmit);
}

/**
 * Change Password: Form Submit
 */
const changePassForm = document.getElementById('changePassForm');
if (changePassForm) {
    changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate new password fields
        const newPassValid = validateField(validationConfig.find(c => c.el === newPassword));
        const confirmValid = validator.passwordMatch(newPassword, reTypeNewPassword, 'Passwords do not match');

        if (!newPassValid || !confirmValid) return;

        const result = await Swal.fire({
            title: 'Change Password',
            text: 'Are you sure you want to change your password?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, change it',
            cancelButtonText: 'Cancel',
            color: '#363636',
            confirmButtonColor: '#00247C',
            cancelButtonColor: '#d33',
            customClass: { popup: 'modal-content', confirmButton: 'btn-proceed' }
        });

        if (!result.isConfirmed) return;

        const { data, error } = await supabase.auth.updateUser({ password: newPassword.value });

        if (error) {
            Swal.fire({ 
                title: 'Error!', 
                text: 'Failed to update password: ' + error.message, 
                icon: 'error', 
                confirmButtonText: 'OK', 
                confirmButtonColor: '#00247C' 
            });
        } else {
            Swal.fire({ 
                title: 'Success!', 
                text: 'Password updated successfully!', 
                icon: 'success', 
                confirmButtonText: 'OK', 
                confirmButtonColor: '#00247C' 
            });
            setChangePassReadonly(true);
            toggleChangePassButtons("view");
            captureOriginalPassData();
            disablePanelSwitch(false);
        }
    });
}

/**
 * Manage Account Functions
 */
function setManageAccReadonly(state) {
    [firstName, middleName, lastName, suffix, contactNo, address].forEach(i => {
        if (i) i.readOnly = state;
    });
}

function toggleManageButtons(mode) {
    const btnEdit = document.getElementById('manageAccEditBtn');
    const btnSave = document.getElementById('saveNewAccDetails');
    const btnCancel = document.getElementById('manageAccCancelBtn');

    if (mode === "view") {
        if (btnEdit) btnEdit.style.display = "inline-block";
        if (btnSave) {
            btnSave.style.display = "none";
            btnSave.disabled = true;
        }
        if (btnCancel) {
            btnCancel.style.display = "none";
            btnCancel.disabled = true;
        }
    }

    if (mode === "edit") {
        if (btnEdit) btnEdit.style.display = "none";
        if (btnSave) {
            btnSave.style.display = "inline-block";
            btnSave.disabled = false;
        }
        if (btnCancel) {
            btnCancel.style.display = "inline-block";
            btnCancel.disabled = false;
        }
    }
}

setManageAccReadonly(true);
toggleManageButtons("view");

let originalManageData = {};

function captureOriginalData() {
    originalManageData = {
        firstName: firstName ? firstName.value : '',
        middleName: middleName ? middleName.value : '',
        lastName: lastName ? lastName.value : '',
        suffix: suffix ? suffix.value : '',
        contactNo: contactNo ? contactNo.value : '',
        address: address ? address.value : '',
    };
}

function hasChanges() {
    return (
        (firstName && firstName.value !== originalManageData.firstName) ||
        (middleName && middleName.value !== originalManageData.middleName) ||
        (lastName && lastName.value !== originalManageData.lastName) ||
        (suffix && suffix.value !== originalManageData.suffix) ||
        (contactNo && contactNo.value !== originalManageData.contactNo) ||
        (address && address.value !== originalManageData.address)
    );
}

function clearManageAccErrors() {
    const inputs = [firstName, middleName, lastName, suffix, contactNo, address];
    inputs.forEach(input => {
        if (input) validator.clear(input);
    });
}

/**
 * Manage Account Event Listeners
 */
const manageAccEditBtn = document.getElementById('manageAccEditBtn');
if (manageAccEditBtn) {
    manageAccEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        captureOriginalData();
        setManageAccReadonly(false);
        toggleManageButtons("edit");
        disablePanelSwitch(true);
    });
}

const manageAccCancelBtn = document.getElementById('manageAccCancelBtn');
if (manageAccCancelBtn) {
    manageAccCancelBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!hasChanges()) {
            clearManageAccErrors();
            setManageAccReadonly(true);
            toggleManageButtons("view");
            disablePanelSwitch(false);
            return;
        }

        const result = await Swal.fire({
            title: 'Discard Changes?',
            text: 'You made changes. Discard them?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Keep editing',
            color: '#363636',
            confirmButtonColor: '#00247C',
            cancelButtonColor: '#d33',
            customClass: {
                popup: 'modal-content',
                confirmButton: 'btn-proceed',
            }
        });

        if (result.isConfirmed) {
            if (firstName) firstName.value = originalManageData.firstName;
            if (middleName) middleName.value = originalManageData.middleName;
            if (lastName) lastName.value = originalManageData.lastName;
            if (suffix) suffix.value = originalManageData.suffix;
            if (contactNo) contactNo.value = originalManageData.contactNo;
            if (address) address.value = originalManageData.address;
        }

        clearManageAccErrors();
        setManageAccReadonly(true);
        toggleManageButtons("view");
        disablePanelSwitch(false);
    });
}

const mngAccForm = document.getElementById('mngAccForm');
if (mngAccForm) {
    mngAccForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all manage account fields
        const manageFields = [firstName, middleName, lastName, suffix, contactNo, address];
        const stepFieldsValid = validateStep(manageFields);

        if (!stepFieldsValid) return;

        const result = await Swal.fire({
            title: 'Save Changes?',
            text: 'Save changes to your account?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save',
            cancelButtonText: 'Cancel',
            color: '#363636',
            confirmButtonColor: '#00247C',
            cancelButtonColor: '#d33',
            customClass: {
                popup: 'modal-content',
                confirmButton: 'btn-proceed',
            }
        });

        if (!result.isConfirmed) return;

        const manageAccAllData = {
            firstName: firstName ? firstName.value : '',
            middleName: middleName ? middleName.value : '',
            lastName: lastName ? lastName.value : '',
            suffix: suffix ? suffix.value : '',
            contactNo: contactNo ? contactNo.value : '',
            address: address ? address.value : '',
        };

        try {
            const resp = await fetch('/server/api/resident/update_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(manageAccAllData)
            });
            const json = await resp.json();
            if (json.success) {
                const saveBtn = document.getElementById('saveNewAccDetails');
                if (saveBtn) {
                    saveBtn.textContent = 'Saved';
                    setTimeout(() => saveBtn.textContent = 'Save Changes', 1500);
                }
                setManageAccReadonly(true);
                captureOriginalData();
                toggleManageButtons("view");
                disablePanelSwitch(false);
                loadApplicationSummary();
                
                Swal.fire({
                    title: 'Success!',
                    text: 'Account details updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    color: '#363636',
                    confirmButtonColor: '#00247C',
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to save: ' + (json.error || 'Unknown'),
                    icon: 'error',
                    confirmButtonText: 'OK',
                    color: '#363636',
                    confirmButtonColor: '#00247C',
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to save account details.',
                icon: 'error',
                confirmButtonText: 'OK',
                color: '#363636',
                confirmButtonColor: '#00247C',
            });
        }
    });
}

/**
 * Panel Navigation
 */
const changePasswordBtnEl = document.getElementById('changePasswordBtn');
if (changePasswordBtnEl) {
    changePasswordBtnEl.addEventListener('click', () => switchPanel('changePass'));
}

const manageAccountBtnEl = document.getElementById('manageAccountBtn');
if (manageAccountBtnEl) {
    manageAccountBtnEl.addEventListener('click', () => switchPanel('manageAcc'));
}

/**
 * Disable panels during edit
 */
function disablePanelSwitch(state) {
    const btnChange = document.getElementById('changePasswordBtn');
    const btnManage = document.getElementById('manageAccountBtn');

    if (!btnChange || !btnManage) return;

    btnChange.disabled = state;
    btnManage.disabled = state;

    btnChange.style.pointerEvents = state ? "none" : "auto";
    btnManage.style.pointerEvents = state ? "none" : "auto";
}

/**
 * Change Password Edit/Cancel buttons
 */
const changePassEditBtn = document.getElementById('changePassEditBtn');
if (changePassEditBtn) {
    changePassEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        captureOriginalPassData();
        if (currentPassword) currentPassword.disabled = false;
        if (nextBtn) nextBtn.style.display = 'block';
        toggleChangePassButtons("edit");
        disablePanelSwitch(true);
    });
}

const changePassCancelBtn = document.getElementById('changePassCancelBtn');
if (changePassCancelBtn) {
    changePassCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (currentPassword) currentPassword.value = originalPassData.current || '';
        if (newPassword) newPassword.value = originalPassData.newPass || '';
        if (reTypeNewPassword) reTypeNewPassword.value = originalPassData.retype || '';

        clearChangePassErrors();
        setChangePassReadonly(true);
        toggleChangePassButtons("view");
        disablePanelSwitch(false);
    });
}

/**
 * Logout button event listener
 */
function initLogoutBtn() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
        const result = await Swal.fire({
            title: 'Log Out',
            text: 'Are you sure you want to log out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, log out',
            cancelButtonText: 'Cancel',
            color: '#363636',
            confirmButtonColor: '#00247C',
            cancelButtonColor: '#d33',
            customClass: { popup: 'modal-content', confirmButton: 'btn-proceed' }
        });

        if (!result.isConfirmed) return;

        const { error: supabaseError } = await supabase.auth.signOut();
        if (supabaseError) {
            Swal.fire({
                title: 'Error!',
                text: 'Failed to log out from Supabase. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                color: '#363636',
                confirmButtonColor: '#00247C',
                customClass: { popup: 'modal-content', confirmButton: 'btn-proceed' }
            });
            return;
        }

        try {
            const response = await fetch('/server/api/shared/signout_user.php', { method: 'POST' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            window.location.href = "/client/index.php";
        } catch (fetchError) {
            console.error("Server sign-out error:", fetchError);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to log out from the server. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                color: '#363636',
                confirmButtonColor: '#00247C',
                customClass: { popup: 'modal-content', confirmButton: 'btn-proceed' }
            });
        }
    });
}

initLogoutBtn();

// Set initial readonly states
setChangePassReadonly(true);
toggleChangePassButtons("view");