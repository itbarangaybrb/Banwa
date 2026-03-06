import supabase from "/Banwa/server/api/supabase.js";

// ────────────────────────────────────────────────
//                  UI PANEL SWITCHING
// ────────────────────────────────────────────────
/**
 * Switches visibility between registration panels
 * @param {string} panelId - ID of the panel to show
 */
function switchPanel(panelId) {
    const panelIds = ['personalDetails', 'selectId', 'createAcc'];
    const panels = panelIds.map(id => document.getElementById(id));

    panels.forEach(panel => {
        // Show only the requested panel, hide others
        panel.classList.toggle('hidden', panel.id !== panelId);
    });
}

// ────────────────────────────────────────────────
//                  FORM VALIDATION & SUBMISSION
// ────────────────────────────────────────────────
function validation() {
    // ── DOM Elements ───────────────────────────────────────
    const elements = {
        // Personal Details
        firstName: document.getElementById('firstName'),
        middleName: document.getElementById('middleName'),
        lastName: document.getElementById('lastName'),
        suffix: document.getElementById('suffix'),
        sex: document.getElementById('sex'),
        contactNo: document.getElementById('contactNo'),
        address: document.getElementById('address'),

        // ID Upload
        idType: document.getElementById('idType'),
        idFile: document.getElementById('idFile'),

        // Account Creation
        email: document.getElementById('createAccEmail'),
        password: document.getElementById('password'),
        reTypePassword: document.getElementById('reTypePassword'),
        agreeCheckBox: document.getElementById('agreeCheckBox'),
    };

    // Start with first panel visible
    switchPanel('personalDetails');

    // ── Shared Validation Helpers ───────────────────────────
    /**
     * Finds the closest .label-and-input wrapper
     * @param {HTMLElement} el 
     * @returns {HTMLElement|null}
     */
    function getWrapper(el) {
        return el.closest('.label-and-input');
    }

    /**
     * Gets the error message element inside the wrapper
     * @param {HTMLElement} el 
     * @returns {HTMLElement|null}
     */
    function getErrorEl(el) {
        const wrapper = getWrapper(el);
        return wrapper?.querySelector('.error-msg') || null;
    }

    /**
     * Displays error message and adds error styling
     */
    function showError(input, message) {
        const errorEl = getErrorEl(input);
        if (!errorEl) return;

        input.classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    /**
     * Clears error state
     */
    function clearError(input) {
        const errorEl = getErrorEl(input);
        if (!errorEl) return;

        input.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }

    /**
     * Main validation function for most inputs
     * Handles text, email, password, phone, checkbox, etc.
     * @param {HTMLElement} input 
     * @param {string} defaultMessage 
     * @returns {boolean} is valid
     */
    function validateInput(input, defaultMessage = 'This field is required') {
        if (!input) return true;

        const wrapper = getWrapper(input);
        const errorEl = wrapper?.querySelector('.error-msg');
        if (!errorEl) return true;

        let value = input.type === 'checkbox'
            ? input.checked
            : (input.value ?? '').trim();

        const setError = (msg) => {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = msg;
            return false;
        };

        const clear = () => {
            input.classList.remove('error');
            errorEl.classList.remove('show');
            errorEl.textContent = '';
            return true;
        };

        // ── Field-specific validations ────────────────────────
        if (input === elements.password) {
            if (!value) return setError('Password is required');
            if (value.length < 8 || value.length > 16) {
                return setError('Password should be 8-16 characters long');
            }
            if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
                return setError('Password must contain letters and numbers');
            }
            return clear();
        }

        if (input === elements.reTypePassword) {
            if (!value) return setError('Please re-type your password');
            if (value !== (elements.password.value || '').trim()) {
                return setError('Passwords do not match');
            }
            return clear();
        }

        if (input === elements.contactNo) {
            // Clean input to digits only
            const digits = value.replace(/\D/g, '');
            input.value = digits;

            if (!digits) return setError('Phone number is required');
            if (digits.length !== 11) return setError('Phone number must be 11 digits');
            return clear();
        }

        if (input === elements.email) {
            if (!value) return setError('Email is required');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) return setError('Enter a valid email address');
            return clear();
        }

        // Generic required check for other fields
        if (!value || value === 'select') {
            return setError(defaultMessage);
        }

        return clear();
    }

    // ── Real-time & blur validation ────────────────────────
    (function attachInputListeners() {
        const inputsToValidate = [
            elements.firstName,
            elements.lastName,
            elements.contactNo,
            elements.email,
            elements.password,
            elements.reTypePassword,
        ].filter(Boolean);

        inputsToValidate.forEach(input => {
            // Clear error when user starts typing
            input.addEventListener('input', () => {
                if (input === elements.contactNo) {
                    input.value = input.value.replace(/\D/g, '');
                }
                clearError(input);
            });

            // Validate on blur (when user leaves the field)
            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });
    })();

    // ── Navigation & Form Submission ───────────────────────
    // Back to login
    document.getElementById('personalDetailsBackBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/client/pages/auth/signin.php';
    });

    // Back to ID selection
    document.getElementById('createAccBackBtn')?.addEventListener('click', () => {
        switchPanel('selectId');
    });

    // Personal Details → ID Upload
    document.getElementById('personalDetailsNextBtn')?.addEventListener('click', (e) => {
        e.preventDefault();

        const isValid = [
            validateInput(elements.firstName, 'First name is required'),
            validateInput(elements.lastName, 'Last name is required'),
        ].every(Boolean);

        if (isValid) switchPanel('selectId');
    });

    // ID Upload → Create Account
    document.getElementById('selectIdNextBtn')?.addEventListener('click', () => {
        const isValid = [
            validateInput(elements.idType, 'Please select a type of ID'),
            validateInput(elements.idFile, 'Please upload your ID file'),
        ].every(Boolean);

        if (isValid) switchPanel('createAcc');
    });

    // ── Final Account Creation ─────────────────────────────
    const formMessage = document.getElementById('formMessage');
    const resendBtn = document.getElementById('resendEmailBtn');
    let signupData = null;

    formMessage.style.display = 'none';

    document.getElementById('createAccForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';
        formMessage.style.display = 'none';

        const isValid = [
            validateInput(elements.password),
            validateInput(elements.reTypePassword),
            validateInput(elements.email),
        ].every(Boolean);

        if (!isValid) return;

        if (!confirm('Are you sure you want to submit this application?')) return;

        signupData = {
            fullname: [
                elements.firstName.value,
                elements.middleName.value,
                elements.lastName.value,
                elements.suffix.value
            ].filter(Boolean).join(' ').trim(),
            email: elements.email.value.trim(),
            password: elements.password.value,
        };

        try {
            // Check if email already exists (custom backend check)
            const resp = await fetch(`/server/api/resident/check_email.php?email=${encodeURIComponent(signupData.email)}`);
            const { exists } = await resp.json();

            if (exists) {
                formMessage.style.display = 'block';
                formMessage.style.color = 'red';
                formMessage.textContent = 'An account with this email already exists.';
                return;
            }

            // Supabase signup
            const { data, error } = await supabase.auth.signUp({
                email: signupData.email,
                password: signupData.password,
                options: {
                    data: signupData,
                    emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php",
                },
            });

            if (error) {
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('already') || msg.includes('registered') || error.status === 400) {
                    formMessage.style.display = 'block';
                    formMessage.style.color = 'red';
                    formMessage.textContent = 'An account with this email already exists.';
                    return;
                }
                throw error;
            }

            // Success
            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.innerHTML = `
                Account created successfully.<br>
                Please verify your email to activate your account.<br><br>
                If you don’t receive the email within 1–2 minutes:<br>
                1. Make sure the email address is correct<br>
                2. Check your Spam / Promotions folder<br>
                3. You can resend the verification email
            `;

            resendBtn.classList.add('show');
            startResendCooldown();

        } catch (err) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'An error occurred. Please try again.';
            console.error('Signup error:', err);
        }
    });

    // ── Resend Verification Email Logic ─────────────────────
    let resendCount = 0;
    const MAX_RESENDS = 3;

    function startResendCooldown() {
        const submitBtn = document.getElementById('createAccSubmitBtn');
        if (submitBtn) submitBtn.style.display = 'none';

        resendBtn.disabled = true;
        let countdown = 90;

        const updateButton = () => {
            resendBtn.textContent = `Resend available in ${countdown}s`;
        };
        updateButton();

        const interval = setInterval(() => {
            countdown--;
            updateButton();

            if (countdown <= 0) {
                clearInterval(interval);
                if (resendCount < MAX_RESENDS) {
                    resendBtn.disabled = false;
                    resendBtn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`;
                } else {
                    resendBtn.remove();
                }
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', async () => {
        if (!signupData || resendCount >= MAX_RESENDS) return;

        resendBtn.disabled = true;

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: signupData.email,
            options: {
                emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php"
            }
        });

        if (error) {
            formMessage.style.color = 'red';
            formMessage.textContent = 'Failed to resend verification email. Please try again later.';
            resendBtn.disabled = false;
            return;
        }

        resendCount++;
        formMessage.style.color = 'green';
        formMessage.textContent = `Verification email resent (${resendCount}/${MAX_RESENDS}). Please check your inbox and spam folder.`;

        startResendCooldown();
    });
}

// Initialize validation & event listeners
validation();
