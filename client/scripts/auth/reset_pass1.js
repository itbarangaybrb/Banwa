import supabase from "../../../server/api/supabase.js";

async function validations() {

    // =====================================================
    // Check the session if it is valid or not
    // =====================================================
    const formMessage = document.getElementById('formMessage');
    formMessage.style.display = 'none';

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData || !sessionData.session) {
        formMessage.style.display = 'block';
        formMessage.style.color = 'red';
        formMessage.textContent = 'Reset link is invalid or expired.';
        return;
    }

    // console.log("Recovery session active.");

    // =====================================================
    // Form elements
    // =====================================================
    const password = document.getElementById("password");
    const reTypePassword = document.getElementById("reTypePassword");

    // =====================================================
    // Validation inputs (GENERIC)
    // =====================================================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg') || input.nextElementSibling;
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = message;
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('show');
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        if (rules.minLength && value.length < rules.minLength) {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = `Minimum ${rules.minLength} characters required`;
            return false;
        }

        input.classList.remove('error');
        input.classList.remove('show');
        errorEl.textContent = '';
        return true;
    }

    // =====================================================
    // Check password match
    // =====================================================
    function checkPasswordMatch() {
        const wrapper = reTypePassword.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        const value = reTypePassword.value.trim();

        if (value === '') {
            reTypePassword.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Please re-type your password';
            return false;
        }

        if (value !== password.value) {
            reTypePassword.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Passwords do not match';
            return false;
        }

        reTypePassword.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
        return true;
    }

    // =====================================================
    // Password validation
    function passwordValidation() {
        const wrapper = password.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        const value = password.value;

        if (value.trim() === '') {
            password.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Password is required';
            return false;
        }

        if (value.length < 8 || value.length > 16) {
            password.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Password should be 8-16 characters long';
            return false;
        }

        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            password.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Password must contain letters and numbers';
            return false;
        }

        password.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
        return true;
    }

    // =====================================================
    // Real-time validation
    // =====================================================
    (() => {
        if (!password) return;
        password.addEventListener('input', () => passwordValidation());
        reTypePassword.addEventListener('input', () => checkPasswordMatch());
    })();

    // =====================================================
    // Reset form "Submit" click
    // =====================================================
    document.getElementById('resetPassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // formMessage.textContent = '';

        const allValid = [
            passwordValidation(),  // validate password independently
            checkPasswordMatch()
        ].every(v => v === true);

        if (!allValid) return;

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password.value
            });

            if (error) {
                console.error('Supabase reset error:', error.message);
                formMessage.style.display = 'block';
                formMessage.style.color = 'red';
                formMessage.textContent = `Reset failed: ${error.message}`;
                return;
            }

            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.textContent = 'Password successfully updated. You may now sign in.';

            setTimeout(() => {
                window.location.href = '/Banwa/client/pages/auth/signin.php'; // change to your actual sign-in page path
            }, 2000);

        } catch (err) {
            console.error('Unexpected error:', err);
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
    });

}

validations();
