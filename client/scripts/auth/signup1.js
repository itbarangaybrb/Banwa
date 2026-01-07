import supabase from "../../../server/api/supabase.js";

// =========================
// Panel Utility
// =========================
function switchPanel(panelId) {
    const panels = ['personalDetails', 'selectId', 'createAcc']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
}

// =========================
// Form Elements
// =========================
const formElements = {
    idType: document.getElementById('idType'),
    idFile: document.getElementById('idFile'),
    firstName: document.getElementById('firstName'),
    middleName: document.getElementById('middleName'),
    lastName: document.getElementById('lastName'),
    suffix: document.getElementById('suffix'),
    sex: document.getElementById('sex'),
    contactNo: document.getElementById('contactNo'),
    address: document.getElementById('address'),
    email: document.getElementById('createAccEmail'),
    password: document.getElementById('password'),
    reTypePassword: document.getElementById('reTypePassword'),
    agreeCheckBox: document.getElementById('agreeCheckBox'),
    formMessage: document.getElementById('formMessage'),
    resendBtn: document.getElementById('resendEmailBtn'),
    createAccForm: document.getElementById('createAccForm')
};

switchPanel('personalDetails');

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

    function validateText(input, message, rules = {}) {
        if (!input) return true;
        let value = input.value.trim();
        if (rules.normalizeSpaces) value = value.replace(/\s+/g, ' ').trim();
        if (value === '' || value === 'select') { showError(input, message); return false; }
        if (rules.lettersOnly && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
            showError(input, rules.errorMessage || 'Only letters with single spaces are allowed'); return false;
        }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || message); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || message); return false; }
        clearError(input); return true;
    }

    function validatePassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '') { showError(input, message); return false; }
        if (value.length < 8 || value.length > 16) { showError(input, 'Password should be 8-16 characters long'); return false; }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must contain letters and numbers'); return false; }
        clearError(input); return true;
    }

    function validatePasswordMatches(passwordInput, reTypeInput) {
        const password = passwordInput.value.trim();
        const reType = reTypeInput.value.trim();
        if (!reType) { showError(reTypeInput, 'Please re-type your password'); return false; }
        if (password !== reType) { showError(reTypeInput, 'Passwords do not match'); return false; }
        clearError(reTypeInput); return true;
    }

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (value === '') { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(input, 'Enter a valid email address'); return false; }
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
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `Number must be at least ${rules.minLength} digits`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Number cannot exceed ${rules.maxLength} digits`); return false; }
        clearError(input); return true;
    }

    function validateCheckbox(input, message) { if (!input.checked) { showError(input, message); return false; } clearError(input); return true; }

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

    return {
        text: validateText,
        password: validatePassword,
        matchPassword: validatePasswordMatches,
        email: validateEmail,
        file: validateFile,
        select: validateSelect,
        number: validateNumber,
        checkbox: validateCheckbox,
        clear: clearError
    };
})();

// =========================
// Validation Config
// =========================
const validationConfig = [
    { el: formElements.firstName, type: 'text', message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.lastName, type: 'text', message: 'Last name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.sex, type: 'select', message: 'Please select sex' },
    { el: formElements.contactNo, type: 'number', message: 'Contact no. is required', rules: { minLength: 7, maxLength: 11, errorMessage: 'Contact no. must be exactly 11 digits' } },
    { el: formElements.email, type: 'email', message: 'Email is required', rules: { errorMessage: 'Please enter a valid email address' } },
    { el: formElements.address, type: 'text', message: 'Address is required' },
    { el: formElements.agreeCheckBox, type: 'checkbox', message: 'You must agree to proceed' },
    { el: formElements.idType, type: 'select', message: 'Please select type of ID' },
    { el: formElements.idFile, type: 'file', message: 'Please upload a document', rules: { accept: ['.pdf', '.jpg', '.png'], errorMessage: 'Only .pdf, .jpg, or .png files are allowed' } },
    { el: formElements.password, type: 'password', message: 'Please enter a password' },
    { el: formElements.reTypePassword, type: 'password', message: 'Please re-type your password' }
];

// =========================
// Validate Field Helper
// =========================
function validateField(config) {
    const { el, type, message, rules } = config;
    if (!el) return true;
    switch (type) {
        case 'number': return validator.number(el, message, rules);
        case 'text': return validator.text(el, message, rules);
        case 'email': return validator.email(el, message, rules);
        case 'file': return validator.file(el, message, rules);
        case 'checkbox': return validator.checkbox(el, message);
        case 'radio': return validator.radioGroup(el, message);
        case 'select': return validator.select(el, message);
        case 'password': return validator.password(el, message);
    }
}

// =========================
// Real-time Validation
// =========================
function setupRealtimeValidation() {
    validationConfig.forEach(config => {
        const { el, type } = config;
        if (!el) return;
        const targets = ['checkboxGroup', 'radio'].includes(type) ? Array.from(el) : [el];
        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(config));
            target.addEventListener('input', () => validator.clear(target));
        });
    });

    formElements.reTypePassword.addEventListener('blur', () => validator.matchPassword(formElements.password, formElements.reTypePassword));
    formElements.reTypePassword.addEventListener('input', () => validator.clear(formElements.reTypePassword));
    formElements.contactNo.addEventListener('input', () => {
        formElements.contactNo.value = formElements.contactNo.value.replace(/\D/g, '');
        validator.clear(formElements.contactNo);
    });
}

// =========================
// Step Validation
// =========================
function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

// =========================
// Navigation Buttons
// =========================
function setupNavigationButtons() {
    document.getElementById('personalDetailsBackBtn').addEventListener('click', e => { e.preventDefault(); window.location.href = '/Banwa/client/pages/auth/signin.php'; });
    document.getElementById('selectIdBackBtn').addEventListener('click', () => switchPanel('personalDetails'));
    document.getElementById('createAccBackBtn').addEventListener('click', () => switchPanel('selectId'));

    document.getElementById('personalDetailsNextBtn').addEventListener('click', () => {
        const stepFields = [formElements.firstName, formElements.lastName, formElements.sex, formElements.contactNo, formElements.address];
        if (validateStep(stepFields)) switchPanel('selectId');
    });

    document.getElementById('selectIdNextBtn').addEventListener('click', () => {
        const stepFields = [formElements.idType, formElements.idFile];
        if (validateStep(stepFields)) switchPanel('createAcc');
    });
}

// =========================
// Account Submission
// =========================
let allData = null;
let resendCount = 0;
const MAX_RESENDS = 3;

function startResendCooldown() {
    const submitBtn = document.getElementById('createAccSubmitBtn');
    if (submitBtn) submitBtn.style.display = 'none';
    const btn = formElements.resendBtn;
    btn.disabled = true;
    let countdown = 90;
    btn.textContent = `Resend available in ${countdown}s`;
    const interval = setInterval(() => {
        countdown--;
        btn.textContent = `Resend available in ${countdown}s`;
        if (countdown <= 0) {
            clearInterval(interval);
            if (resendCount < MAX_RESENDS) { btn.disabled = false; btn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`; }
            else btn.remove();
        }
    }, 1000);
}

async function resendVerificationEmail() {
    if (!allData || resendCount >= MAX_RESENDS) return;
    formElements.resendBtn.disabled = true;
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: allData.email,
        options: { emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php" }
    });
    if (error) {
        formElements.formMessage.style.color = 'red';
        formElements.formMessage.textContent = 'Failed to resend verification email. Please try again later.';
        formElements.resendBtn.disabled = false;
        return;
    }
    resendCount++;
    formElements.formMessage.style.color = 'green';
    formElements.formMessage.textContent = `Verification email resent (${resendCount}/${MAX_RESENDS}). Please check your inbox and spam folder.`;
    startResendCooldown();
}

formElements.resendBtn.addEventListener('click', resendVerificationEmail);

function setupAccountSubmission() {
    formElements.formMessage.style.display = 'none';
    formElements.createAccForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formElements.formMessage.textContent = '';
        const stepFields = [formElements.password, formElements.reTypePassword, formElements.email, formElements.agreeCheckBox];
        if (!validateStep(stepFields)) return;
        if (!confirm('Are you sure you want to submit this application?')) return;

        allData = {
            fullname: `${formElements.firstName.value} ${formElements.middleName.value} ${formElements.lastName.value} ${formElements.suffix.value}`.trim(),
            sex: formElements.sex.value,
            contactNo: formElements.contactNo.value,
            address: formElements.address.value,
            idType: formElements.idType.value,
            email: formElements.email.value,
            password: formElements.password.value,
            agreeCheckBox: formElements.agreeCheckBox.checked
        };

        try {
            const respCheck = await fetch('/Banwa/server/api/shared/check_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: allData.email })
            });
            const dbCheck = await respCheck.json();
            if (dbCheck.exists) {
                formElements.formMessage.style.display = 'block';
                formElements.formMessage.style.color = 'red';
                formElements.formMessage.textContent = 'An account with this email already exists.';
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: allData.email,
                password: allData.password,
                options: {
                    data: allData,
                    emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php",
                },
            });

            if (error) {
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('already') || msg.includes('registered') || error.status === 400) {
                    formElements.formMessage.style.display = 'block';
                    formElements.formMessage.style.color = 'red';
                    formElements.formMessage.textContent = 'An account with this email already exists.';
                    return;
                }
                throw error;
            }

            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'green';
            formElements.formMessage.innerHTML = `
                Account created successfully.<br>
                Please verify your email to activate your account.<br><br>
                If you don’t receive the email within 1–2 minutes:
                <br>
                1. Make sure the email address is correct<br>
                2. Check your Spam / Promotions folder<br>
                3. You can resend the verification email
            `;

            formElements.resendBtn.classList.add('show');
            startResendCooldown();

        } catch (err) {
            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'red';
            formElements.formMessage.textContent = 'An error occurred. ' + (err.message || err);
        }
    });
}

// =========================
// Initialize all functionality
// =========================
function initialize() {
    switchPanel('personalDetails');
    setupRealtimeValidation();
    setupNavigationButtons();
    setupAccountSubmission();
}

document.addEventListener('DOMContentLoaded', initialize);
