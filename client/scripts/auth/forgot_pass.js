import supabase from "../../../server/api/supabase.js";

// =========================
// Forgot Password Elements
// =========================
const forgotPassElements = {
    form: document.getElementById('forgotPassForm'),
    email: document.getElementById('email'),
    formMessage: document.getElementById('formMessage'),
    backBtn: document.getElementById('forgotPassBackBtn')
};

// =========================
// Validator Module
// =========================
const validator = (() => {
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

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(input, 'Enter a valid email address'); return false; }
        clearError(input); return true;
    }

    return { email: validateEmail, clear: clearError };
})();

// =========================
// Validation Config
// =========================
const validationConfig = [
    { el: forgotPassElements.email, type: 'email', message: 'Email is required' }
];

// =========================
// Validate Field Helper
// =========================
function validateField(config) {
    const { el, type, message } = config;
    if (!el) return true;
    switch (type) {
        case 'email': return validator.email(el, message);
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
        el.addEventListener('input', () => validator.clear(el));
        el.addEventListener('blur', () => validateField(config));
    });
}

// =========================
// Handle Form Submission
// =========================
async function handleForgotPassSubmit(e) {
    e.preventDefault();
    forgotPassElements.formMessage.textContent = '';
    forgotPassElements.formMessage.style.display = 'none';

    if (!validateStep([forgotPassElements.email])) return;

    try {
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

        forgotPassElements.formMessage.style.display = 'block';
        forgotPassElements.formMessage.style.color = 'green';
        forgotPassElements.formMessage.textContent = 'Email submitted. Check your inbox for the reset link.';
    } catch (err) {
        console.error(err);
        forgotPassElements.formMessage.style.display = 'block';
        forgotPassElements.formMessage.style.color = 'red';
        forgotPassElements.formMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
}

// =========================
// Navigation Buttons
// =========================
function setupNavigationButtons() {
    if (forgotPassElements.backBtn) {
        forgotPassElements.backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/Banwa/client/pages/auth/signin.php';
        });
    }
}

// =========================
// Initialize All Functionality
// =========================
function initialize() {
    setupRealtimeValidation();
    setupNavigationButtons();
    if (forgotPassElements.form) forgotPassElements.form.addEventListener('submit', handleForgotPassSubmit);
}

// =========================
// DOM Ready
// =========================
document.addEventListener('DOMContentLoaded', initialize);
