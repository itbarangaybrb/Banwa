import supabase from "../../../server/api/supabase.js";

// =========================
// Reset Password Elements
// =========================
const resetPassElements = {
    form: document.getElementById('resetPassForm'),
    password: document.getElementById('password'),
    reTypePassword: document.getElementById('reTypePassword'),
    formMessage: document.getElementById('formMessage')
};

// =========================
// Validator Module
// =========================
const validator = (() => {
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el)?.querySelector('.error-msg'); }

    function showError(el, message) {
        const errorEl = getErrorEl(el);
        el.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    function clearError(el) {
        const errorEl = getErrorEl(el);
        el.classList.remove('error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }

    function validatePassword(input) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, 'Password is required'); return false; }
        if (value.length < 8 || value.length > 16) { showError(input, 'Password should be 8-16 characters long'); return false; }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must contain letters and numbers'); return false; }
        clearError(input);
        return true;
    }

    function validatePasswordMatch(passwordInput, reTypeInput) {
        const passwordVal = passwordInput.value.trim();
        const reTypeVal = reTypeInput.value.trim();
        if (!reTypeVal) { showError(reTypeInput, 'Please re-type your password'); return false; }
        if (passwordVal !== reTypeVal) { showError(reTypeInput, 'Passwords do not match'); return false; }
        clearError(reTypeInput);
        return true;
    }

    return { password: validatePassword, matchPassword: validatePasswordMatch, clear: clearError };
})();

// =========================
// Validation Config
// =========================
const validationConfig = [
    { el: resetPassElements.password, type: 'password' },
    { el: resetPassElements.reTypePassword, type: 'matchPassword', passwordEl: resetPassElements.password }
];

// =========================
// Validate Field Helper
// =========================
function validateField(config) {
    if (!config.el) return true;
    switch (config.type) {
        case 'password': return validator.password(config.el);
        case 'matchPassword': return validator.matchPassword(config.passwordEl, config.el);
    }
}

// =========================
// Step Validation
// =========================
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

// =========================
// Real-time Validation
// =========================
function setupRealtimeValidation() {
    validationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;

        const targets = [el];
        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(config));
            target.addEventListener('input', () => validator.clear(target));
        });
    });
}


// =========================
// Form Submission
// =========================
async function handleFormSubmit(e) {
    e.preventDefault();
    resetPassElements.formMessage.textContent = '';
    resetPassElements.formMessage.style.display = 'none';

    if (!validateStep([resetPassElements.password, resetPassElements.reTypePassword])) return;

    try {
        const { data, error } = await supabase.auth.updateUser({
            password: resetPassElements.password.value
        });

        if (error) {
            resetPassElements.formMessage.style.display = 'block';
            resetPassElements.formMessage.style.color = 'red';
            resetPassElements.formMessage.textContent = `Reset failed: ${error.message}`;
            return;
        }

        resetPassElements.formMessage.style.display = 'block';
        resetPassElements.formMessage.style.color = 'green';
        resetPassElements.formMessage.textContent = 'Password successfully updated. You may now sign in.';

        setTimeout(() => {
            window.location.href = '/Banwa/client/pages/auth/signin.php';
        }, 2000);

    } catch (err) {
        console.error(err);
        resetPassElements.formMessage.style.display = 'block';
        resetPassElements.formMessage.style.color = 'red';
        resetPassElements.formMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
}

// =========================
// Initialize All Functionality
// =========================
function initialize() {
    if (!resetPassElements.formMessage) return;

    // Show invalid session
    supabase.auth.getSession().then(({ data: sessionData }) => {
        if (!sessionData || !sessionData.session) {
            resetPassElements.formMessage.style.display = 'block';
            resetPassElements.formMessage.style.color = 'red';
            resetPassElements.formMessage.textContent = 'Reset link is invalid or expired.';
        }
    });

    setupRealtimeValidation();
    if (resetPassElements.form) resetPassElements.form.addEventListener('submit', handleFormSubmit);
}

// =========================
// DOM Ready
// =========================
document.addEventListener('DOMContentLoaded', initialize);
