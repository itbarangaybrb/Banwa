import supabase from "/Banwa/server/api/supabase.js";

/**
 * UI Element Mapping
 * Centralized object for managing DOM references in the Reset Password view.
 */
const resetPassElements = {
    form: document.getElementById('resetPassForm'),
    password: document.getElementById('password'),
    reTypePassword: document.getElementById('reTypePassword'),
    formMessage: document.getElementById('formMessage')
};

/**
 * Validator Module
 * Encapsulates password-specific validation logic.
 * Using a Module Pattern ensures we don't leak internal helper logic to the global scope.
 */
const validator = (() => {
    // DOM Traversal helpers to find neighboring error message containers
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el)?.querySelector('.error-msg'); }

    // UI: Toggle error classes and inject text
    function showError(el, message) {
        const errorEl = getErrorEl(el);
        el.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    // UI: Reset field to neutral state
    function clearError(el) {
        const errorEl = getErrorEl(el);
        el.classList.remove('error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }

    /**
     * Complexity Rules: 8-16 chars, must be Alphanumeric.
     * Enforcing this client-side reduces unnecessary round-trips to the Auth provider.
     */
    function validatePassword(input) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, 'Password is required'); return false; }
        if (value.length < 8 || value.length > 16) {
            showError(input, 'Password should be 8-16 characters long');
            return false;
        }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            showError(input, 'Password must contain letters and numbers');
            return false;
        }
        clearError(input);
        return true;
    }

    // Comparison Logic: Ensure the user didn't make a typo in the second field
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

/**
 * Validation Configuration
 * Links specific DOM elements to their respective validation 'strategy'.
 */
const validationConfig = [
    { el: resetPassElements.password, type: 'password' },
    { el: resetPassElements.reTypePassword, type: 'matchPassword', passwordEl: resetPassElements.password }
];

/**
 * Strategy Dispatcher
 * Routes the field to the correct validator function based on the config.
 */
function validateField(config) {
    if (!config.el) return true;
    switch (config.type) {
        case 'password': return validator.password(config.el);
        case 'matchPassword': return validator.matchPassword(config.passwordEl, config.el);
    }
}

/**
 * Batch Validation
 * Used during form submission to ensure the entire 'step' is valid before calling Supabase.
 */
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

/**
 * Event Listeners: Real-time UX
 * Clears errors on 'input' (as they type) and validates on 'blur' (when they leave the field).
 */
function setupRealtimeValidation() {
    validationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;

        el.addEventListener('blur', () => validateField(config));
        el.addEventListener('input', () => validator.clear(el));
    });
}

/**
 * Handle Form Submission
 * Sends the new password to Supabase.
 * Note: updateUser() works here because the recovery link automatically sets a temporary session.
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    resetPassElements.formMessage.textContent = '';
    resetPassElements.formMessage.style.display = 'none';

    // Frontend Guard
    if (!validateStep([resetPassElements.password, resetPassElements.reTypePassword])) return;

    try {
        // SUPABASE CALL: Updates the user record associated with the current recovery session
        const { data, error } = await supabase.auth.updateUser({
            password: resetPassElements.password.value
        });

        if (error) {
            resetPassElements.formMessage.style.display = 'block';
            resetPassElements.formMessage.style.color = 'red';
            resetPassElements.formMessage.textContent = `Reset failed: ${error.message}`;
            return;
        }

        // Success State
        resetPassElements.formMessage.style.display = 'block';
        resetPassElements.formMessage.style.color = 'green';
        resetPassElements.formMessage.textContent = 'Password successfully updated. You may now sign in.';

        // Graceful redirect to sign-in page
        setTimeout(() => {
            window.location.href = '/client/pages/auth/signin.php';
        }, 2000);

    } catch (err) {
        console.error("Auth Update Error:", err);
        resetPassElements.formMessage.style.display = 'block';
        resetPassElements.formMessage.style.color = 'red';
        resetPassElements.formMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Initialization Logic
 */
function initialize() {
    if (!resetPassElements.formMessage) return;

    /**
     * SECURITY CHECK: Distributed State Validation
     * When a user clicks a reset link, Supabase puts the session in the URL.
     * If the session is missing, the link is either expired, tampered with, or used already.
     */
    supabase.auth.getSession().then(({ data: sessionData }) => {
        if (!sessionData || !sessionData.session) {
            resetPassElements.formMessage.style.display = 'block';
            resetPassElements.formMessage.style.color = 'red';
            resetPassElements.formMessage.textContent = 'Reset link is invalid or expired.';

            // Optional: Disable the form if no session exists
            if (resetPassElements.form) resetPassElements.form.style.opacity = "0.5";
        }
    });

    setupRealtimeValidation();
    if (resetPassElements.form) {
        resetPassElements.form.addEventListener('submit', handleFormSubmit);
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', initialize);
