import supabase from "../../../server/api/supabase.js";

function validations() {
    // =========================
    // Form elements
    // =========================
    const email = document.getElementById('email');

    // =========================
    // Validation inputs (GENERIC)
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg') || input.nextElementSibling;
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            errorEl.textContent = message;
            errorEl.classList.add('show');
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            errorEl.classList.add('show');
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            errorEl.classList.add('show');
            return false;
        }

        if (rules.minLength && value.length < rules.minLength) {
            input.classList.add('error');
            errorEl.textContent = `Minimum ${rules.minLength} characters required`;
            errorEl.classList.add('show');
            return false;
        }

        input.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Specialized Email Validations
    // =========================
    function emailValidation() {
        const wrapper = email.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = email.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (value === '') {
            email.classList.add('error');
            errorEl.textContent = 'Email is required';
            errorEl.classList.add('show');
        } else if (!emailPattern.test(value)) {
            email.classList.add('error');
            errorEl.textContent = 'Enter a valid email address';
            errorEl.classList.add('show');
        } else {
            email.classList.remove('error');
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }

    // =========================
    // Real-time validation setup (single IIFE)
    // =========================
    (() => {
        if (!email) return;
        email.addEventListener('input', emailValidation);
    })();

    // =========================
    // Navigation buttons
    // =========================
    document.getElementById('forgotPassBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/Banwa/client/pages/auth/signin.php';
    });

    const formMessage = document.getElementById('formMessage');
    formMessage.style.display = 'none';

    document.getElementById('forgotPassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';

        const validations = validateInput(
            email,
            'Email is required',
            { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage: 'Enter a valid email address' }
        );

        if (!validations) return;

        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email.value,
                {
                    redirectTo: 'http://localhost:8080/Banwa/client/pages/auth/reset_pass1.php'
                }
            );

            if (error) {
                console.error('Supabase reset error:', error.message);
                formMessage.style.display = 'block';
                formMessage.style.color = 'red';
                formMessage.textContent = `Reset failed: ${error.message}`;
                return;
            }

            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.textContent = 'Email submitted. Check your inbox for the reset link.';

        } catch (err) {
            console.error('Unexpected error:', err);
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
    });

}

validations();