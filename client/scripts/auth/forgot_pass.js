import supabase from "../../../server/api/supabase.js";

/**
 * UI Element Selectors
 * Centralizing DOM references makes the code easier to maintain if IDs change.
 */
const forgotPassElements = {
    form: document.getElementById('forgotPassForm'),
    email: document.getElementById('email'),
    formMessage: document.getElementById('formMessage'),
    backBtn: document.getElementById('forgotPassBackBtn')
};

/**
 * Validator Module
 * Encapsulates validation logic using an IIFE (Immediately Invoked Function Expression).
 * Provides a clean API for showing/clearing errors without exposing internal DOM manipulation.
 */
const validator = (() => {
    // Helpers to find the parent container and error label for specific inputs
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el).querySelector('.error-msg'); }

    // UI: Attach error state to the input and display message
    function showError(el, message) {
        const errorEl = getErrorEl(el);
        el.classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    // UI: Reset error state
    function clearError(el) {
        const errorEl = getErrorEl(el);
        el.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }

    // Business Logic: Email Regex validation
    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { 
            showError(input, 'Enter a valid email address'); 
            return false; 
        }
        clearError(input); 
        return true;
    }

    return { email: validateEmail, clear: clearError };
})();

/**
 * Validation Configuration
 * Decouples the field definitions from the validation logic.
 * Scalable: adding new fields only requires a new object here.
 */
const validationConfig = [
    { el: forgotPassElements.email, type: 'email', message: 'Email is required' }
];

/**
 * Field-level Strategy Dispatcher
 * Determines which validation logic to apply based on the config type.
 */
function validateField(config) {
    const { el, type, message } = config;
    if (!el) return true;
    switch (type) {
        case 'email': return validator.email(el, message);
    }
}

/**
 * Step Validation
 * Aggregates multiple field checks. Returns true only if all fields pass.
 */
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

/**
 * Event Listeners: Real-time Validation
 * Enhances UX by clearing errors as the user types and validating on 'blur' (focus loss).
 */
function setupRealtimeValidation() {
    validationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;
        el.addEventListener('input', () => validator.clear(el));
        el.addEventListener('blur', () => validateField(config));
    });
}

/**
 * Form Submission Handler
 * Triggers the Supabase Password Reset flow.
 */
async function handleForgotPassSubmit(e) {
    e.preventDefault();
    
    // Reset UI state before processing
    forgotPassElements.formMessage.textContent = '';
    forgotPassElements.formMessage.style.display = 'none';

    // Guard Clause: Only proceed if frontend validation passes
    if (!validateStep([forgotPassElements.email])) return;

    try {
        /**
         * SUPABASE CALL: Request a reset email.
         * redirectTo: The URL the user lands on after clicking the email link.
         */
        const { data, error } = await supabase.auth.resetPasswordForEmail(
            forgotPassElements.email.value.trim(),
            { redirectTo: 'http://localhost:8080/Banwa/client/pages/auth/reset_pass.php' }
        );

        if (error) {
            forgotPassElements.formMessage.style.display = 'block';
            forgotPassElements.formMessage.style.color = 'red';
            forgotPassElements.formMessage.textContent = `Reset failed: ${error.message}`;
            return;
        }

        // Inform user to check their external inbox (Handing off control to the email provider)
        forgotPassElements.formMessage.style.display = 'block';
        forgotPassElements.formMessage.style.color = 'green';
        forgotPassElements.formMessage.textContent = 'Email submitted. Check your inbox for the reset link.';
        
    } catch (err) {
        console.error("Critical Auth Error:", err);
        forgotPassElements.formMessage.style.display = 'block';
        forgotPassElements.formMessage.style.color = 'red';
        forgotPassElements.formMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Navigation Handlers
 */
function setupNavigationButtons() {
    if (forgotPassElements.backBtn) {
        forgotPassElements.backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/Banwa/client/pages/auth/signin.php';
        });
    }
}

/**
 * Initialization Logic
 */
function initialize() {
    setupRealtimeValidation();
    setupNavigationButtons();
    if (forgotPassElements.form) {
        forgotPassElements.form.addEventListener('submit', handleForgotPassSubmit);
    }
}

// Bootstrap the script
document.addEventListener('DOMContentLoaded', initialize);