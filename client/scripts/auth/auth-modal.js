/**
 * auth-modal.js
 * Handles the auth modal: signup (3-step) and login flows.
 */

import supabase from "../../../server/api/supabase.js";

const modal         = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn  = document.getElementById('showLoginBtn');
const signupPanel   = document.getElementById('signupPanel');
const loginPanel    = document.getElementById('loginPanel');
const switchToSignup = document.getElementById('switchToSignup');

const steps = document.querySelectorAll('.step');
const panels = {
    selectId:        document.getElementById('selectId'),
    personalDetails: document.getElementById('personalDetails'),
    createAcc:       document.getElementById('createAcc'),
};

const formElements = {
    // Step 1 — Identity
    selectIdNextBtn:      document.getElementById('selectIdNextBtn'),
    idType:               document.getElementById('idType'),
    idFile:               document.getElementById('idFile'),
    ocrStatus:            document.getElementById('ocrStatus'),
    idImagePreview:       document.getElementById('idImagePreview'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),

    // Step 2 — Personal Details
    firstName:                document.getElementById('firstName'),
    middleName:               document.getElementById('middleName'),
    lastName:                 document.getElementById('lastName'),
    suffix:                   document.getElementById('suffix'),
    sex:                      document.getElementById('sex'),
    contactNo:                document.getElementById('contactNo'),
    address:                  document.getElementById('address'),
    personalDetailsNextBtn:   document.getElementById('personalDetailsNextBtn'),
    personalDetailsBackBtn:   document.getElementById('personalDetailsBackBtn'),

    // Step 3 — Create Account
    createAccForm:    document.getElementById('createAccForm'),
    email:            document.getElementById('createAccEmail'),
    password:         document.getElementById('password'),
    reTypePassword:   document.getElementById('reTypePassword'),
    agreeCheckBox:    document.getElementById('agreeCheckBox'),
    formMessage:      document.getElementById('formMessage'),
    resendBtn:        document.getElementById('resendEmailBtn'),
    createAccBackBtn: document.getElementById('createAccBackBtn'),
    createAccSubmitBtn: document.getElementById('createAccSubmitBtn'),
};

const loginElements = {
    form:        document.getElementById('loginForm'),
    email:       document.getElementById('loginEmail'),
    password:    document.getElementById('loginPassword'),
    formMessage: document.getElementById('loginFormMessage'),
    submitBtn:   document.getElementById('loginSubmitBtn'),
};

// OCR state
let lastOcrMeta = null;
let lastOcrData = null;

// Resend state
let allData     = null;
let resendCount = 0;
const MAX_RESENDS = 3;


// ─────────────────────────────────────────────
// MODAL OPEN / CLOSE
// openModal is exposed globally so home.js can
// call window.openModal() instead of toggling
// classList directly.
// ─────────────────────────────────────────────

function openModal() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    showLoginView();
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

window.openModal = openModal;


// ─────────────────────────────────────────────
// AUTH PANEL TOGGLE (Signup ↔ Login)
// ─────────────────────────────────────────────

function showSignupView() {
    signupPanel.classList.remove('hidden');
    loginPanel.classList.add('hidden');
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    switchPanel('selectId');
}

function showLoginView() {
    signupPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
}


// ─────────────────────────────────────────────
// PROGRESS STEPS
// ─────────────────────────────────────────────

function updateProgress(step) {
    steps.forEach((el, i) => {
        const num = i + 1;
        el.classList.toggle('active',    num === step);
        el.classList.toggle('completed', num <  step);
    });
}

function switchPanel(panelId) {
    Object.values(panels).forEach(p => p?.classList.add('hidden'));
    panels[panelId]?.classList.remove('hidden');

    const stepMap = { selectId: 1, personalDetails: 2, createAcc: 3 };
    if (stepMap[panelId]) updateProgress(stepMap[panelId]);
}


// ─────────────────────────────────────────────
// VALIDATOR MODULE
// Encapsulates all field-level validation.
// Signup and login share the same helpers;
// login-specific rules use the `login` namespace.
// ─────────────────────────────────────────────

const validator = (() => {
    // ── Shared DOM helpers ──
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el)?.querySelector('.error-msg'); }

    function showError(el, message) {
        const errorEl = getErrorEl(el);
        el.classList.add('error');
        if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
    }

    function clearError(el) {
        const errorEl = getErrorEl(el);
        el.classList.remove('error');
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('show'); }
    }

    // ── Signup validators ──
    function validateText(input, message, rules = {}) {
        if (!input) return true;
        let value = input.value.trim();
        if (rules.normalizeSpaces) value = value.replace(/\s+/g, ' ').trim();
        if (!value || value === 'select')       { showError(input, message); return false; }
        if (rules.lettersOnly) {
            if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) { showError(input, rules.errorMessage || 'Only letters allowed'); return false; }
            if (/(.)\1{3,}/.test(value))                    { showError(input, 'Enter a real name'); return false; }
            if (value.length < 2)                           { showError(input, 'Name is too short'); return false; }
            if (value.length > 50)                          { showError(input, 'Name is too long'); return false; }
            if (/^([A-Za-z])\s\1(\s\1)*$/.test(value))     { showError(input, 'Enter a real name'); return false; }
        }
        clearError(input); return true;
    }

    function validateNumber(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)              { showError(input, message); return false; }
        if (!/^\d+$/.test(value)) { showError(input, rules.errorMessage || 'Only numbers allowed'); return false; }
        if (rules.phoneType === 'ph') {
            const isMobile       = /^09\d{9}$/.test(value);
            const isLandline8    = /^[2-9]\d{7}$/.test(value);
            const isLandlineArea = /^0[2-9]\d{8}$/.test(value);
            const isRepeated     = /^(\d)\1{10}$/.test(value) || /^09(\d)\1{8}$/.test(value);
            const isSequential   = /^(?:0(?:123456789|987654321)|09(?:12345678|87654321))$/.test(value);
            if (!isMobile && !isLandline8 && !isLandlineArea) { showError(input, 'Enter a valid PH number (e.g. 09171234567)'); return false; }
            if (isRepeated || isSequential)                    { showError(input, 'Enter a real contact number'); return false; }
            clearError(input); return true;
        }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `At least ${rules.minLength} digits required`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Max ${rules.maxLength} digits`); return false; }
        clearError(input); return true;
    }

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)                                            { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))        { showError(input, 'Invalid email'); return false; }
        clearError(input); return true;
    }

    function validatePassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)                                             { showError(input, message); return false; }
        if (value.length < 8 || value.length > 16)             { showError(input, 'Password must be 8–16 characters'); return false; }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value))   { showError(input, 'Password must contain letters and numbers'); return false; }
        clearError(input); return true;
    }

    function validatePasswordMatch(passwordInput, reTypeInput) {
        const password = passwordInput.value.trim();
        const reType   = reTypeInput.value.trim();
        if (!reType)              { showError(reTypeInput, 'Please re-type your password'); return false; }
        if (password !== reType)  { showError(reTypeInput, 'Passwords do not match'); return false; }
        clearError(reTypeInput); return true;
    }

    function validateSelect(input, message) {
        if (!input) return true;
        if (!input.value) { showError(input, message); return false; }
        clearError(input); return true;
    }

    function validateCheckbox(input, message) {
        if (!input.checked) { showError(input, message); return false; }
        clearError(input); return true;
    }

    function validateFile(input, message, options = {}) {
        if (!input || !input.files.length) { showError(input, message); return false; }
        const file = input.files[0];
        if (options.accept?.length && !options.accept.some(a => file.name.toLowerCase().endsWith(a.toLowerCase()))) {
            showError(input, options.errorMessage || `Allowed: ${options.accept.join(', ')}`); return false;
        }
        if (file.size > 5 * 1024 * 1024) { showError(input, 'File must be under 5 MB'); return false; }
        clearError(input); return true;
    }

    function validateAddress(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)              { showError(input, message); return false; }
        if (value.length < 10)   { showError(input, 'Address is too short'); return false; }
        if (value.length > 200)  { showError(input, 'Address is too long'); return false; }
        if (!/\d/.test(value))   { showError(input, 'Include your house/unit number (e.g. 12 Rizal St.)'); return false; }
        if (/(.)\1{3,}/.test(value))   { showError(input, 'Enter a valid address'); return false; }
        if (!/\S+\s+\S+/.test(value))  { showError(input, 'Enter a complete address'); return false; }
        clearError(input); return true;
    }

    // ── Login-specific validators (stricter user-facing messages) ──
    function validateLoginEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)                                        { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))    { showError(input, 'Enter a valid email address'); return false; }
        clearError(input); return true;
    }

    function validateLoginPassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value)                                         { showError(input, message); return false; }
        if (value.length < 8 || value.length > 16)          { showError(input, 'Password must be 8–16 characters'); return false; }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must contain letters and numbers'); return false; }
        clearError(input); return true;
    }

    return {
        text:          validateText,
        number:        validateNumber,
        email:         validateEmail,
        password:      validatePassword,
        matchPassword: validatePasswordMatch,
        select:        validateSelect,
        checkbox:      validateCheckbox,
        file:          validateFile,
        address:       validateAddress,
        clear:         clearError,
        login: {
            email:    validateLoginEmail,
            password: validateLoginPassword,
        },
    };
})();


// ─────────────────────────────────────────────
// VALIDATION CONFIG
// ─────────────────────────────────────────────

const signupConfig = [
    { el: formElements.idType,       type: 'select',   message: 'Please select type of ID' },
    { el: formElements.idFile,       type: 'file',     message: 'Please upload a document',   rules: { accept: ['.pdf', '.jpg', '.png'], errorMessage: 'Only .pdf, .jpg, or .png files are allowed' } },
    { el: formElements.firstName,    type: 'text',     message: 'First name is required',     rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.lastName,     type: 'text',     message: 'Last name is required',      rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.sex,          type: 'select',   message: 'Please select sex' },
    { el: formElements.contactNo,    type: 'number',   message: 'Contact No. is required',    rules: { phoneType: 'ph' } },
    { el: formElements.address,      type: 'address',  message: 'Address is required' },
    { el: formElements.email,        type: 'email',    message: 'Email is required' },
    { el: formElements.password,     type: 'password', message: 'Please enter a password' },
    { el: formElements.reTypePassword, type: 'password', message: 'Please re-type your password' },
    { el: formElements.agreeCheckBox,  type: 'checkbox', message: 'You must agree to proceed' },
];

const loginConfig = [
    { el: loginElements.email,    type: 'email',    message: 'Email is required' },
    { el: loginElements.password, type: 'password', message: 'Password is required' },
];

function validateField(config, isLogin = false) {
    const { el, type, message, rules } = config;
    if (!el) return true;
    if (isLogin) {
        return type === 'email'    ? validator.login.email(el, message)
             : type === 'password' ? validator.login.password(el, message)
             : true;
    }
    switch (type) {
        case 'text':     return validator.text(el, message, rules);
        case 'number':   return validator.number(el, message, rules);
        case 'email':    return validator.email(el, message);
        case 'password': return validator.password(el, message);
        case 'select':   return validator.select(el, message);
        case 'checkbox': return validator.checkbox(el, message);
        case 'file':     return validator.file(el, message, rules);
        case 'address':  return validator.address(el, message);
        default:         return true;
    }
}

function validateFields(fields, configArray, isLogin = false) {
    return fields
        .map(f => validateField(configArray.find(c => c.el === f), isLogin))
        .every(Boolean);
}


// ─────────────────────────────────────────────
// REAL-TIME VALIDATION
// ─────────────────────────────────────────────

function setupRealtimeValidation() {
    signupConfig.forEach(config => {
        const { el } = config;
        if (!el) return;

        // contactNo: only validate on blur (format check needs full number)
        if (el === formElements.contactNo) {
            el.addEventListener('input', () => {
                el.value = el.value.replace(/\D/g, '');
                validator.clear(el);
            });
            el.addEventListener('blur', () => validateField(config));
            return;
        }

        el.addEventListener('blur',  () => validateField(config));
        el.addEventListener('input', () => validator.clear(el));
    });

    // Password match check on re-type
    formElements.reTypePassword?.addEventListener('blur',  () => validator.matchPassword(formElements.password, formElements.reTypePassword));
    formElements.reTypePassword?.addEventListener('input', () => validator.clear(formElements.reTypePassword));

    // Login fields
    loginConfig.forEach(config => {
        const { el } = config;
        if (!el) return;
        el.addEventListener('blur',  () => validateField(config, true));
        el.addEventListener('input', () => validator.clear(el));
    });
}


// ─────────────────────────────────────────────
// OCR — ID UPLOAD & PROCESSING
// ─────────────────────────────────────────────

function setupIdUploadPreview() {
    formElements.idFile?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        // Show image preview
        const reader = new FileReader();
        reader.onload = e => {
            if (formElements.idImagePreview)       formElements.idImagePreview.src = e.target.result;
            if (formElements.imagePreviewContainer) formElements.imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);

        processOCR();
    });
}

async function processOCR() {
    if (!formElements.idFile?.files[0] || !formElements.idType?.value) {
        showOcrStatus('error', 'Please select an ID type and upload a photo.');
        return;
    }

    formElements.selectIdNextBtn.disabled     = true;
    formElements.selectIdNextBtn.textContent  = 'Processing...';
    showOcrStatus('processing', `
        <div class="progress-container"><div class="progress-bar"></div></div>
        <div style="text-align:center;font-weight:bold;margin-top:8px;">Checking ID...</div>
    `);

    const formData = new FormData();
    formData.append('file',   formElements.idFile.files[0]);
    formData.append('idType', formElements.idType.value);
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) formData.append('debug', '1');

    try {
        const response = await fetch('/server/api/auth/ocr_process.php', { method: 'POST', body: formData });
        const result   = await response.json();

        if (!result?.success) {
            showOcrStatus('error', result.error || 'Verification failed.');
            setNextBtn('Retry Verification', processOCR);
            return;
        }

        const d            = result.data || {};
        const hitsMap      = result.meta?.hits_map || {};
        const selectedType = formElements.idType.value;
        const selectedHits = hitsMap[selectedType] || 0;
        const fieldsCount  = typeof result.meta?.fields_count === 'number'
            ? result.meta.fields_count
            : Object.values(d).filter(v => v && String(v).trim()).length;

        if (selectedHits < 1 && fieldsCount < 2) {
            showOcrStatus('error', `ID type "${selectedType}" not confidently detected. Upload the correct ID or proceed manually.`);
            setNextBtn('Retry Verification', () => window.location.reload());
            return;
        }

        // Autofill personal details
        formElements.firstName.value  = d.firstName  || '';
        formElements.middleName.value = d.middleName || '';
        formElements.lastName.value   = d.lastName   || '';
        formElements.address.value    = d.address    || '';

        lastOcrData = d;
        lastOcrMeta = result.meta || null;

        const detected = result.meta?.detected_type || 'Document';
        showOcrStatus('success', `<div style="display:flex;align-items:center;gap:8px;">✓ Verified: <strong>${detected}</strong></div>`);
        setNextBtn('Next: Personal Details', () => {
            switchPanel('personalDetails');
            resetOcrButton();
        });

    } catch (error) {
        console.error('OCR Error:', error);
        showOcrStatus('error', 'Server offline. You can proceed manually.');
        setNextBtn('Proceed Manually', () => switchPanel('personalDetails'));
    }
}

function showOcrStatus(type, html) {
    const el = formElements.ocrStatus;
    if (!el) return;
    el.className       = `ocr-status-${type}`;
    el.innerHTML       = html;
    el.style.display   = 'block';
}

function setNextBtn(label, clickFn) {
    const btn = formElements.selectIdNextBtn;
    btn.disabled    = false;
    btn.textContent = label;
    btn.onclick     = clickFn;
}

function resetOcrButton() {
    setNextBtn('Verify ID', processOCR);
}


// ─────────────────────────────────────────────
// NAVIGATION BETWEEN STEPS
// ─────────────────────────────────────────────

function setupStepNavigation() {
    // Back from step 1 = close modal
    document.getElementById('selectIdBackBtn')?.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Are you sure you want to go back? Your progress will be lost.')) closeModal();
    });

    formElements.personalDetailsBackBtn?.addEventListener('click', () => switchPanel('selectId'));
    formElements.createAccBackBtn?.addEventListener('click',       () => switchPanel('personalDetails'));

    // Step 1 → OCR
    formElements.selectIdNextBtn?.addEventListener('click', async () => {
        const ok = validateFields([formElements.idType, formElements.idFile], signupConfig);
        if (ok) await processOCR();
    });

    // Step 2 → Step 3
    formElements.personalDetailsNextBtn?.addEventListener('click', () => {
        const ok = validateFields(
            [formElements.firstName, formElements.lastName, formElements.sex, formElements.contactNo, formElements.address],
            signupConfig
        );
        if (ok) switchPanel('createAcc');
    });
}


// ─────────────────────────────────────────────
// RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────────

function startResendCooldown() {
    formElements.createAccSubmitBtn?.style && (formElements.createAccSubmitBtn.style.display = 'none');

    const btn = formElements.resendBtn;
    btn.disabled = true;
    let countdown = 90;
    btn.textContent = `Resend available in ${countdown}s`;

    const interval = setInterval(() => {
        countdown--;
        btn.textContent = `Resend available in ${countdown}s`;
        if (countdown <= 0) {
            clearInterval(interval);
            if (resendCount < MAX_RESENDS) {
                btn.disabled    = false;
                btn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`;
            } else {
                btn.remove();
            }
        }
    }, 1000);
}

async function resendVerificationEmail() {
    if (!allData || resendCount >= MAX_RESENDS) return;
    formElements.resendBtn.disabled = true;

    const { error } = await supabase.auth.resend({
        type:    'signup',
        email:   allData.email,
        options: { emailRedirectTo: 'https://banwa.onrender.com/client/pages/auth/confirm_verification.php' },
    });

    if (error) {
        setSignupMessage('red', 'Failed to resend verification email. Please try again later.');
        formElements.resendBtn.disabled = false;
        return;
    }

    resendCount++;
    setSignupMessage('green', `Verification email resent (${resendCount}/${MAX_RESENDS}). Check your inbox and spam folder.`);
    startResendCooldown();
}


// ─────────────────────────────────────────────
// SUBMIT CONFIRMATION MODAL
// ─────────────────────────────────────────────

function showSubmitConfirmation() {
    const confirmModal = document.getElementById('submitConfirmModal');
    if (!confirmModal) return Promise.resolve(confirm('Are you sure you want to submit this application?'));

    const backdrop  = confirmModal.querySelector('.modal-backdrop');
    const btnCancel = confirmModal.querySelector('.btn-cancel');
    const btnConfirm = confirmModal.querySelector('.btn-confirm');

    return new Promise(resolve => {
        confirmModal.style.display = 'block';
        confirmModal.setAttribute('aria-hidden', 'false');
        (btnCancel || btnConfirm)?.focus();

        function close(val) {
            confirmModal.style.display = 'none';
            confirmModal.setAttribute('aria-hidden', 'true');
            document.removeEventListener('keydown', onKey);
            backdrop?.removeEventListener('click', onBackdrop);
            btnCancel?.removeEventListener('click', onCancel);
            btnConfirm?.removeEventListener('click', onConfirm);
            resolve(val);
        }

        function onKey(e)      { if (e.key === 'Escape') close(false); }
        function onBackdrop(e) { if (e.target === backdrop) close(false); }
        function onCancel()    { close(false); }
        function onConfirm()   { close(true); }

        document.addEventListener('keydown', onKey);
        backdrop?.addEventListener('click', onBackdrop);
        btnCancel?.addEventListener('click', onCancel);
        btnConfirm?.addEventListener('click', onConfirm);
    });
}


// ─────────────────────────────────────────────
// SIGNUP SUBMISSION
// ─────────────────────────────────────────────

function setSignupMessage(color, html) {
    formElements.formMessage.style.display = 'block';
    formElements.formMessage.style.color   = color;
    formElements.formMessage.innerHTML     = html;
}

function setupSignupSubmission() {
    formElements.formMessage.style.display = 'none';

    formElements.createAccForm?.addEventListener('submit', async e => {
        e.preventDefault();
        formElements.formMessage.textContent = '';

        const step3Fields = [formElements.email, formElements.password, formElements.reTypePassword, formElements.agreeCheckBox];
        const step3Valid  = validateFields(step3Fields, signupConfig);
        const matchValid  = validator.matchPassword(formElements.password, formElements.reTypePassword);
        if (!step3Valid || !matchValid) return;

        const confirmed = await showSubmitConfirmation();
        if (!confirmed) return;

        allData = {
            fullname:    [formElements.firstName.value, formElements.middleName.value, formElements.lastName.value, formElements.suffix.value]
                            .map(v => v.trim()).filter(Boolean).join(' '),
            sex:         formElements.sex.value,
            contactNo:   formElements.contactNo.value,
            address:     formElements.address.value,
            idType:      formElements.idType.value,
            email:       formElements.email.value,
            password:    formElements.password.value,
            ocrMeta:     lastOcrMeta,
            ocrData:     lastOcrData,
        };

        try {
            // Check for existing account
            const checkResp   = await fetch('/server/api/shared/check_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: allData.email }),
            });
            const { exists } = await checkResp.json();

            if (exists) {
                setSignupMessage('red', 'An account with this email already exists.');
                return;
            }

            // Supabase signup
            const { data, error } = await supabase.auth.signUp({
                email:    allData.email,
                password: allData.password,
                options:  { data: allData, emailRedirectTo: 'https://banwa.onrender.com/client/pages/auth/confirm_verification.php' },
            });

            if (error) {
                const msg = error.message.toLowerCase().includes('already')
                    ? 'An account with this email already exists.'
                    : 'An error occurred: ' + error.message;
                setSignupMessage('red', msg);
                return;
            }

            setSignupMessage('green', `
                Account created successfully.<br>
                Please verify your email to activate your account.<br><br>
                If you don't receive the email within 1–2 minutes:<br>
                1. Make sure the email address is correct<br>
                2. Check your Spam / Promotions folder<br>
                3. You can resend the verification email
            `);
            formElements.resendBtn.classList.add('show');
            startResendCooldown();

            // Fire-and-forget OCR verification
            (async () => {
                try {
                    const payload = {
                        supabase_user_id: data?.user?.id || null,
                        email:   allData.email,
                        ocrMeta: allData.ocrMeta,
                        ocrData: allData.ocrData,
                        debug:   ['localhost', '127.0.0.1'].includes(window.location.hostname),
                    };
                    const resp   = await fetch('/server/api/shared/verify_ocr.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const result = await resp.json();
                    if (result.debug_info) console.error('verify_ocr debug:', result.debug_info);
                    if (result.success && result.verified) {
                        formElements.formMessage.innerHTML += '<br><small>Identity verification applied automatically.</small>';
                    } else if (result.success && !result.verified) {
                        formElements.formMessage.innerHTML += `<br><small>OCR recorded (issues: ${result.reasons?.join(', ') || 'none'}).</small>`;
                    }
                } catch (err) {
                    console.warn('verify_ocr call failed:', err);
                }
            })();

        } catch (err) {
            setSignupMessage('red', 'An error occurred: ' + (err.message || err));
        }
    });
}


// ─────────────────────────────────────────────
// LOGIN SUBMISSION
// ─────────────────────────────────────────────

async function handleLoginSubmit(e) {
    e.preventDefault();
    loginElements.formMessage.textContent = '';
    loginElements.formMessage.style.color = '';

    if (!validateFields([loginElements.email, loginElements.password], loginConfig, true)) return;

    // Check if account exists in DB first
    const existsResp   = await fetch('/server/api/shared/check_email.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: loginElements.email.value.trim() }),
    });
    const { exists } = await existsResp.json();

    if (!exists) {
        loginElements.formMessage.style.color = 'red';
        loginElements.formMessage.textContent = 'Account does not exist.';
        return;
    }

    // Supabase sign-in
    const { data, error } = await supabase.auth.signInWithPassword({
        email:    loginElements.email.value.trim(),
        password: loginElements.password.value.trim(),
    });

    if (error) {
        loginElements.formMessage.style.color = 'red';
        loginElements.formMessage.textContent = error.message.toLowerCase().includes('not confirmed')
            ? 'Account not verified. Please check your email.'
            : 'Email or password is incorrect.';
        return;
    }

    // Server-side session setup + redirect
    const resp   = await fetch('/server/api/shared/signin_user.php', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ supabase_user_id: data.user.id }),
    });
    const result = await resp.json();

    if (!result.success) {
        loginElements.formMessage.style.color = 'red';
        loginElements.formMessage.textContent = result.message;
        return;
    }

    loginElements.formMessage.style.color = 'green';
    loginElements.formMessage.textContent = 'Login successful! Redirecting...';
    setTimeout(() => { window.location.href = result.redirect; }, 1000);
}


// ─────────────────────────────────────────────
// INITIALIZE — wire everything up
// ─────────────────────────────────────────────

function initialize() {
    // Modal controls
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // Auth toggle
    showSignupBtn?.addEventListener('click', showSignupView);
    showLoginBtn?.addEventListener('click',  showLoginView);
    switchToSignup?.addEventListener('click', e => { e.preventDefault(); showSignupView(); });

    // Signup flow
    setupIdUploadPreview();
    setupStepNavigation();
    setupRealtimeValidation();
    setupSignupSubmission();

    // Resend button
    formElements.resendBtn?.addEventListener('click', resendVerificationEmail);

    // Login form
    loginElements.form?.addEventListener('submit', handleLoginSubmit);

    // Start on login view
    showLoginView();
}

document.addEventListener('DOMContentLoaded', initialize);