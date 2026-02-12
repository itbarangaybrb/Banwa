import supabase from "../../../server/api/supabase.js";

/**
 * Centralized DOM element references for the login form
 */
const loginElements = {
    form: document.getElementById('login'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    formMessage: document.getElementById('formMessage')
};

/**
 * Reusable validation utilities (IIFE module pattern)
 * Matches password & email rules used during registration
 */
const validator = (() => {
    function getWrapper(el) {
        return el.closest('.label-and-input');
    }

    function getErrorEl(el) {
        return getWrapper(el)?.querySelector('.error-msg');
    }

    function showError(el, message) {
        const errorEl = getErrorEl(el);
        if (!errorEl) return;
        el.classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    function clearError(el) {
        const errorEl = getErrorEl(el);
        if (!errorEl) return;
        el.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) return showError(input, message), false;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            showError(input, 'Enter a valid email address');
            return false;
        }

        clearError(input);
        return true;
    }

    function validatePassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) return showError(input, message), false;

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

    return {
        email: validateEmail,
        password: validatePassword,
        clear: clearError
    };
})();

/**
 * Validation rules for login fields
 * IMPORTANT: Do NOT reference loginValidationConfig inside its own definition
 */
const loginValidationConfig = [
    { el: loginElements.email,    type: 'email',    message: 'Email is required' },
    { el: loginElements.password, type: 'password', message: 'Please enter a password' }
];

/**
 * Validates a single field based on its config
 * @param {Object} config - { el, type, message }
 * @returns {boolean} is valid
 */
function validateField(config) {
    const { el, type, message } = config;
    if (!el) return true;

    switch (type) {
        case 'email':    return validator.email(el, message);
        case 'password': return validator.password(el, message);
        default:         return true;
    }
}

/**
 * Validates multiple fields at once (typically used on form submit)
 * @param {HTMLElement[]} fields
 * @returns {boolean} all fields are valid
 */
function validateStep(fields) {
    return fields.every(field => {
        const config = loginValidationConfig.find(c => c.el === field);
        return config ? validateField(config) : true;
    });
}

/**
 * Attaches real-time validation events (blur + input)
 */
function setupRealtimeValidation() {
    loginValidationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;

        // Validate when user leaves the field
        el.addEventListener('blur', () => validateField(config));

        // Clear error while typing
        el.addEventListener('input', () => validator.clear(el));
    });
}

/**
 * Handles the full login flow:
 * 1. Client-side validation
 * 2. Check if user exists in local DB
 * 3. Authenticate with Supabase
 * 4. Sync session with PHP backend (RBAC)
 * 5. Redirect on success
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    loginElements.formMessage.textContent = '';
    loginElements.formMessage.style.color = '';

    // 1. Frontend validation
    if (!validateStep([loginElements.email, loginElements.password])) {
        return;
    }

    try {
        // 2. Check if account exists in local system
        const existsResp = await fetch('/Banwa/server/api/shared/check_email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginElements.email.value.trim() })
        });

        const existsResult = await existsResp.json();

        if (!existsResult.exists) {
            loginElements.formMessage.style.color = 'red';
            loginElements.formMessage.textContent = 'Account does not exist.';
            return;
        }

        // 3. Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginElements.email.value.trim(),
            password: loginElements.password.value.trim()
        });

        if (error) {
            loginElements.formMessage.style.color = 'red';

            if (error.message.toLowerCase().includes('not confirmed')) {
                loginElements.formMessage.textContent = 'Account not verified. Please check your email.';
            } else {
                loginElements.formMessage.textContent = 'Email or password is incorrect.';
            }
            return;
        }

        // 4. Sync session with PHP backend (sets role-based session)
        const syncResp = await fetch('/Banwa/server/api/shared/signin_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Required for PHP session cookies
            body: JSON.stringify({ supabase_user_id: data.user.id })
        });

        const result = await syncResp.json();

        if (!result.success) {
            loginElements.formMessage.style.color = 'red';
            loginElements.formMessage.textContent = result.message || 'Login failed. Please try again.';
            return;
        }

        // 5. Success → redirect
        if (result.success && result.redirect) {
            loginElements.formMessage.style.color = 'green';
            loginElements.formMessage.textContent = 'Login successful! Redirecting...';

            // Small delay improves perceived UX
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 800);
        }

    } catch (err) {
        console.error('Login error:', err);
        loginElements.formMessage.style.color = 'red';
        loginElements.formMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Initialize login page behavior
 */
function initializeLogin() {
    if (!loginElements.form) {
        console.warn('Login form not found');
        return;
    }

    setupRealtimeValidation();
    loginElements.form.addEventListener('submit', handleLoginSubmit);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLogin);