import supabase from "../../../server/api/supabase.js";

// ───────────────────────────────────────────────────────────────
// 1. Navigation Logic – Panel Switching
// ───────────────────────────────────────────────────────────────
/**
 * Switches visibility between multi-step registration panels
 * @param {string} panelId - The ID of the panel to display
 */
function switchPanel(panelId) {
    const panelIds = ['selectId', 'personalDetails', 'createAcc'];
    const panels = panelIds.map(id => document.getElementById(id));

    panels.forEach(panel => {
        // Toggle 'hidden' class – show only the target panel
        panel.classList.toggle('hidden', panel.id !== panelId);
    });
}

// ───────────────────────────────────────────────────────────────
// 2. Centralized DOM References
// ───────────────────────────────────────────────────────────────
/**
 * Single source of truth for all important form elements.
 * Reduces document.getElementById calls and makes refactoring easier.
 */
const formElements = {
    // ── Select ID Panel ──
    selectIdNextBtn: document.getElementById('selectIdNextBtn'),
    idType: document.getElementById('idType'),
    idFile: document.getElementById('idFile'),
    ocrStatus: document.getElementById('ocrStatus'),
    idImagePreview: document.getElementById('idImagePreview'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),

    // ── Personal Details Panel ──
    firstName: document.getElementById('firstName'),
    middleName: document.getElementById('middleName'),
    lastName: document.getElementById('lastName'),
    suffix: document.getElementById('suffix'),
    sex: document.getElementById('sex'),
    contactNo: document.getElementById('contactNo'),
    address: document.getElementById('address'),
    personalDetailsNextBtn: document.getElementById('personalDetailsNextBtn'),

    // ── Create Account Panel ──
    createAccForm: document.getElementById('createAccForm'),
    email: document.getElementById('createAccEmail'),
    password: document.getElementById('password'),
    reTypePassword: document.getElementById('reTypePassword'),
    agreeCheckBox: document.getElementById('agreeCheckBox'),
    formMessage: document.getElementById('formMessage'),
    resendBtn: document.getElementById('resendEmailBtn'),

    // ── Back / Cancel Buttons ──
    personalDetailsBackBtn: document.getElementById('personalDetailsBackBtn'),
    selectIdBackBtn: document.getElementById('selectIdBackBtn'),
    createAccBackBtn: document.getElementById('createAccBackBtn'),

    // ── Submit Button ──
    createAccSubmitBtn: document.getElementById('createAccSubmitBtn')
};

// Store last successful OCR extraction (used during final submission)
let lastOcrMeta = null;
let lastOcrData = null;

// ───────────────────────────────────────────────────────────────
// 3. Reusable Validation Utilities (IIFE Module)
// ───────────────────────────────────────────────────────────────
const validator = (() => {
    const getWrapper = el => el.closest('.label-and-input');
    const getErrorEl = el => getWrapper(el)?.querySelector('.error-msg');

    const showError = (el, message) => {
        const errorEl = getErrorEl(el);
        if (!errorEl) return;
        el.classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    };

    const clearError = (el) => {
        const errorEl = getErrorEl(el);
        if (!errorEl) return;
        el.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    };

    // ── Specific field validators ─────────────────────────────────
    function validateText(input, message, rules = {}) {
        if (!input) return true;
        let value = input.value.trim();
        if (rules.normalizeSpaces) value = value.replace(/\s+/g, ' ').trim();

        if (!value || value === 'select') {
            showError(input, message);
            return false;
        }

        if (rules.lettersOnly && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
            showError(input, rules.errorMessage || 'Only letters allowed');
            return false;
        }

        clearError(input);
        return true;
    }

    function validateNumber(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) return showError(input, message), false;
        if (!/^\d+$/.test(value)) return showError(input, rules.errorMessage || 'Only numbers allowed'), false;

        if (rules.minLength && value.length < rules.minLength) {
            showError(input, rules.errorMessage || `At least ${rules.minLength} digits required`);
            return false;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            showError(input, rules.errorMessage || `Max ${rules.maxLength} digits`);
            return false;
        }

        clearError(input);
        return true;
    }

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) return showError(input, message), false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            showError(input, 'Invalid email format');
            return false;
        }
        clearError(input);
        return true;
    }

    function validatePassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) return showError(input, message), false;
        if (value.length < 8 || value.length > 16) return showError(input, 'Password must be 8–16 characters'), false;
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            showError(input, 'Password must contain letters and numbers');
            return false;
        }
        clearError(input);
        return true;
    }

    function validatePasswordMatches(pwdInput, retypeInput) {
        const pwd = pwdInput.value.trim();
        const retype = retypeInput.value.trim();
        if (!retype) return showError(retypeInput, 'Please re-type password'), false;
        if (pwd !== retype) return showError(retypeInput, 'Passwords do not match'), false;
        clearError(retypeInput);
        return true;
    }

    function validateSelect(input, message) {
        if (!input) return true;
        const value = input.value?.trim();
        if (!value || value === 'select') {
            showError(input, message);
            return false;
        }
        clearError(input);
        return true;
    }

    function validateCheckbox(input, message) {
        if (!input.checked) {
            showError(input, message);
            return false;
        }
        clearError(input);
        return true;
    }

    function validateFile(input, message, options = {}) {
        if (!input || !input.files?.length) return showError(input, message), false;

        const file = input.files[0];
        if (options.accept?.length && !options.accept.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()))) {
            showError(input, options.errorMessage || `Allowed formats: ${options.accept.join(', ')}`);
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            showError(input, 'File size exceeds 5MB limit');
            return false;
        }

        clearError(input);
        return true;
    }

    return {
        text: validateText,
        number: validateNumber,
        email: validateEmail,
        password: validatePassword,
        matchPassword: validatePasswordMatches,
        select: validateSelect,
        checkbox: validateCheckbox,
        file: validateFile,
        clear: clearError
    };
})();

// ───────────────────────────────────────────────────────────────
// 4. Validation Rules per Field
// ───────────────────────────────────────────────────────────────
const validationConfig = [
    { el: formElements.firstName,      type: 'text',     message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true } },
    { el: formElements.lastName,       type: 'text',     message: 'Last name is required',  rules: { lettersOnly: true, normalizeSpaces: true } },
    { el: formElements.sex,            type: 'select',   message: 'Please select sex' },
    { el: formElements.contactNo,      type: 'number',   message: 'Contact number is required', rules: { minLength: 11, maxLength: 11 } },
    { el: formElements.address,        type: 'text',     message: 'Address is required' },
    { el: formElements.email,          type: 'email',    message: 'Email is required' },
    { el: formElements.password,       type: 'password', message: 'Password is required' },
    { el: formElements.reTypePassword, type: 'password', message: 'Please re-type password' },
    { el: formElements.agreeCheckBox,  type: 'checkbox', message: 'You must agree to the terms' },
    { el: formElements.idType,         type: 'select',   message: 'Please select ID type' },
    { el: formElements.idFile,         type: 'file',     message: 'Please upload ID document', rules: { accept: ['.jpg', '.png', '.pdf'] } }
];

// ───────────────────────────────────────────────────────────────
// 5. Field Validation Helper
// ───────────────────────────────────────────────────────────────
function validateField({ el, type, message, rules }) {
    if (!el) return true;

    switch (type) {
        case 'text':     return validator.text(el, message, rules);
        case 'number':   return validator.number(el, message, rules);
        case 'email':    return validator.email(el, message);
        case 'password': return validator.password(el, message);
        case 'select':   return validator.select(el, message);
        case 'checkbox': return validator.checkbox(el, message);
        case 'file':     return validator.file(el, message, rules);
        default:         return true;
    }
}

function validateStep(fields) {
    return fields.every(field => {
        const config = validationConfig.find(c => c.el === field);
        return config ? validateField(config) : true;
    });
}

// ───────────────────────────────────────────────────────────────
// 6. Real-time & Blur Validation Setup
// ───────────────────────────────────────────────────────────────
function setupRealtimeValidation() {
    validationConfig.forEach(({ el, type }) => {
        if (!el) return;

        // Clear error when user starts typing/changing
        el.addEventListener('input', () => validator.clear(el));

        // Validate when user leaves the field
        el.addEventListener('blur', () => validateField(validationConfig.find(c => c.el === el)));
    });

    // Special handling: phone number → digits only
    formElements.contactNo?.addEventListener('input', () => {
        formElements.contactNo.value = formElements.contactNo.value.replace(/\D/g, '');
        validator.clear(formElements.contactNo);
    });

    // Re-type password match check
    const retype = formElements.reTypePassword;
    retype?.addEventListener('input', () => validator.clear(retype));
    retype?.addEventListener('blur', () => validator.matchPassword(formElements.password, retype));
}

// ───────────────────────────────────────────────────────────────
// 7. ID Upload + OCR Processing
// ───────────────────────────────────────────────────────────────
formElements.idFile.addEventListener('change', function () {
    const file = this.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = e => {
        if (formElements.idImagePreview) formElements.idImagePreview.src = e.target.result;
        if (formElements.imagePreviewContainer) formElements.imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Auto-trigger OCR when file is selected
    processOCR();
});

/**
 * Sends uploaded ID to backend for OCR processing and fingerprint verification
 * Updates UI and enables Next button only on success
 */
async function processOCR() {
    if (!formElements.idFile.files?.[0] || !formElements.idType.value) {
        formElements.ocrStatus.textContent = "Select ID type and upload document first.";
        formElements.ocrStatus.className = 'ocr-status-error';
        formElements.ocrStatus.style.display = 'block';
        return;
    }

    // ── Loading / Processing UI ───────────────────────────────────
    formElements.selectIdNextBtn.disabled = true;
    formElements.selectIdNextBtn.textContent = "Processing...";

    formElements.ocrStatus.className = 'ocr-status-processing';
    formElements.ocrStatus.style.display = 'block';
    formElements.ocrStatus.innerHTML = `
        <div class="progress-container"><div class="progress-bar"></div></div>
        <div style="text-align:center; font-weight:bold; margin-top:8px;">
            Verifying document...
        </div>
    `;

    const formData = new FormData();
    formData.append('file', formElements.idFile.files[0]);
    formData.append('idType', formElements.idType.value);

    // Enable debug mode on localhost
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        formData.append('debug', '1');
    }

    try {
        const response = await fetch('/server/api/auth/ocr_process.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result?.success) {
            throw new Error(result.error || 'OCR processing failed');
        }

        const data = result.data || {};
        const meta = result.meta || {};
        const hits = meta.hits_map?.[formElements.idType.value] || 0;
        const fieldsCount = meta.fields_count ?? Object.values(data).filter(v => !!v?.trim()).length;

        // Basic quality gate: must match type and extract reasonable data
        if (hits < 1 && fieldsCount < 2) {
            formElements.ocrStatus.className = 'ocr-status-error';
            formElements.ocrStatus.textContent = `Selected ID type (${formElements.idType.value}) not recognized. Try another document or proceed manually.`;
            formElements.selectIdNextBtn.textContent = "Retry Verification";
            formElements.selectIdNextBtn.onclick = () => location.reload();
            return;
        }

        // Auto-fill personal details from OCR
        formElements.firstName.value = data.firstName || '';
        formElements.middleName.value = data.middleName || '';
        formElements.lastName.value = data.lastName || '';
        formElements.address.value = data.address || '';

        lastOcrData = data;
        lastOcrMeta = meta;

        // Success UI
        const detected = meta.detected_type || 'Document';
        formElements.ocrStatus.className = 'ocr-status-success';
        formElements.ocrStatus.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <i class="fa fa-check-circle"></i>
                <span>Verified: <strong>${detected}</strong></span>
            </div>
        `;

        // Enable next step
        formElements.selectIdNextBtn.disabled = false;
        formElements.selectIdNextBtn.textContent = "Next: Personal Details";
        formElements.selectIdNextBtn.onclick = () => {
            switchPanel('personalDetails');
            resetVerifyButton(); // restore original behavior if user goes back
        };

    } catch (err) {
        console.error("OCR process failed:", err);
        formElements.ocrStatus.className = 'ocr-status-error';
        formElements.ocrStatus.textContent = err.message.includes('offline')
            ? "Server unavailable. You can proceed manually."
            : "Verification failed. Try again or proceed manually.";

        formElements.selectIdNextBtn.disabled = false;
        formElements.selectIdNextBtn.textContent = "Proceed Manually";
        formElements.selectIdNextBtn.onclick = () => switchPanel('personalDetails');
    }
}

/** Resets "Next" button back to OCR trigger mode */
function resetVerifyButton() {
    formElements.selectIdNextBtn.textContent = "Verify ID";
    formElements.selectIdNextBtn.onclick = processOCR;
}

// ───────────────────────────────────────────────────────────────
// 8. Navigation Button Handlers
// ───────────────────────────────────────────────────────────────
function setupNavigationButtons() {
    // Back to login
    formElements.selectIdBackBtn?.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/client/pages/auth/signin.php';
    });

    // Back one step
    formElements.personalDetailsBackBtn?.addEventListener('click', () => switchPanel('selectId'));
    formElements.createAccBackBtn?.addEventListener('click', () => switchPanel('personalDetails'));

    // Verify ID → triggers OCR
    formElements.selectIdNextBtn?.addEventListener('click', () => {
        if (validateStep([formElements.idType, formElements.idFile])) {
            processOCR();
        }
    });

    // Personal details → create account
    formElements.personalDetailsNextBtn?.addEventListener('click', () => {
        const fields = [
            formElements.firstName,
            formElements.lastName,
            formElements.sex,
            formElements.contactNo,
            formElements.address
        ];
        if (validateStep(fields)) switchPanel('createAcc');
    });
}

// ───────────────────────────────────────────────────────────────
// 9. Final Account Creation + Email Resend Logic
// ───────────────────────────────────────────────────────────────
let signupData = null;
let resendCount = 0;
const MAX_RESENDS = 3;

function startResendCooldown() {
    formElements.createAccSubmitBtn?.style.setProperty('display', 'none');

    const btn = formElements.resendBtn;
    btn.disabled = true;
    let seconds = 90;

    const tick = () => {
        btn.textContent = `Resend available in ${seconds}s`;
        if (--seconds <= 0) {
            clearInterval(interval);
            if (resendCount < MAX_RESENDS) {
                btn.disabled = false;
                btn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`;
            } else {
                btn.remove();
            }
        }
    };

    tick();
    const interval = setInterval(tick, 1000);
}

async function resendVerificationEmail() {
    if (!signupData || resendCount >= MAX_RESENDS) return;

    formElements.resendBtn.disabled = true;

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupData.email,
        options: { emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php" }
    });

    if (error) {
        formElements.formMessage.style.color = 'red';
        formElements.formMessage.textContent = 'Failed to resend email. Try again later.';
        formElements.resendBtn.disabled = false;
        return;
    }

    resendCount++;
    formElements.formMessage.style.color = 'green';
    formElements.formMessage.textContent = `Email resent (${resendCount}/${MAX_RESENDS}). Check inbox/spam.`;
    startResendCooldown();
}

function setupAccountSubmission() {
    formElements.formMessage.style.display = 'none';
    formElements.resendBtn.addEventListener('click', resendVerificationEmail);

    formElements.createAccForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const required = [formElements.email, formElements.password, formElements.reTypePassword, formElements.agreeCheckBox];
        if (!validateStep(required) || !validator.matchPassword(formElements.password, formElements.reTypePassword)) {
            return;
        }

        if (!(await showSubmitConfirmation())) return;

        signupData = {
            fullname: [formElements.firstName.value, formElements.middleName.value, formElements.lastName.value, formElements.suffix.value]
                .filter(Boolean).join(' ').trim(),
            sex: formElements.sex.value,
            contactNo: formElements.contactNo.value,
            address: formElements.address.value,
            idType: formElements.idType.value,
            email: formElements.email.value.trim(),
            password: formElements.password.value,
            agreeCheckBox: formElements.agreeCheckBox.checked,
            ocrMeta: lastOcrMeta,
            ocrData: lastOcrData
        };

        try {
            // Prevent duplicate signups
            const checkRes = await fetch('/server/api/shared/check_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: signupData.email })
            });
            const { exists } = await checkRes.json();

            if (exists) {
                formElements.formMessage.style.display = 'block';
                formElements.formMessage.style.color = 'red';
                formElements.formMessage.textContent = 'Email already registered.';
                return;
            }

            // Supabase signup
            const { data, error } = await supabase.auth.signUp({
                email: signupData.email,
                password: signupData.password,
                options: {
                    data: signupData,
                    emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php"
                }
            });

            if (error) throw error;

            // Success feedback
            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'green';
            formElements.formMessage.innerHTML = `
                Account created successfully.<br>
                Please check your email to verify your account.<br><br>
                <strong>Tips if email is missing:</strong><br>
                • Confirm email address is correct<br>
                • Check spam / promotions folder<br>
                • You can resend the email below
            `;

            formElements.resendBtn.classList.add('show');
            startResendCooldown();

            // Fire-and-forget: send OCR data to backend for verification & DB update
            (async () => {
                try {
                    const userId = data?.user?.id;
                    if (!userId) return;

                    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
                    const payload = {
                        supabase_user_id: userId,
                        email: signupData.email,
                        ocrMeta: signupData.ocrMeta,
                        ocrData: signupData.ocrData,
                        debug: isLocal
                    };

                    const resp = await fetch('/server/api/shared/verify_ocr.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const verifyResult = await resp.json();
                    console.log('OCR verification result:', verifyResult);

                    if (verifyResult.success) {
                        let msg = '<br><small>Identity verification processed.';
                        if (verifyResult.verified) msg += ' Verified automatically.</small>';
                        else if (verifyResult.reasons?.length) msg += ` Issues: ${verifyResult.reasons.join(', ')}</small>`;
                        formElements.formMessage.innerHTML += msg;
                    }
                } catch (err) {
                    console.warn('OCR post-verification failed', err);
                }
            })();

        } catch (err) {
            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'red';
            formElements.formMessage.textContent = err.message?.includes('already')
                ? 'Account with this email already exists.'
                : 'An error occurred during registration.';
            console.error('Signup failed:', err);
        }
    });
}

// ───────────────────────────────────────────────────────────────
// 10. Custom Submit Confirmation Modal
// ───────────────────────────────────────────────────────────────
/**
 * Shows custom confirmation modal (or falls back to native confirm)
 * @returns {Promise<boolean>}
 */
function showSubmitConfirmation() {
    const modal = document.getElementById('submitConfirmModal');
    if (!modal) {
        return Promise.resolve(confirm('Are you sure you want to submit this application?'));
    }

    const backdrop = modal.querySelector('.modal-backdrop');
    const btnCancel = modal.querySelector('.btn-cancel');
    const btnConfirm = modal.querySelector('.btn-confirm');

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    return new Promise(resolve => {
        const close = (value) => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.removeEventListener('keydown', trapFocus);
            backdrop.removeEventListener('click', backdropClick);
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
            resolve(value);
        };

        const onCancel = () => close(false);
        const onConfirm = () => close(true);
        const backdropClick = e => { if (e.target === backdrop) close(false); };

        function trapFocus(e) {
            if (e.key === 'Escape') return close(false);
            if (e.key !== 'Tab') return;

            const focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
                .filter(el => el.offsetParent !== null && !el.disabled);

            if (!focusable.length) return;

            const current = document.activeElement;
            const index = focusable.indexOf(current);

            if (e.shiftKey) {
                if (index <= 0) {
                    focusable[focusable.length - 1].focus();
                    e.preventDefault();
                }
            } else {
                if (index >= focusable.length - 1 || index === -1) {
                    focusable[0].focus();
                    e.preventDefault();
                }
            }
        }

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        backdrop.addEventListener('click', backdropClick);
        document.addEventListener('keydown', trapFocus);

        (btnCancel || btnConfirm)?.focus();
    });
}

// ───────────────────────────────────────────────────────────────
// 11. Initialization
// ───────────────────────────────────────────────────────────────
function initialize() {
    // Start on first step
    switchPanel('selectId');

    setupRealtimeValidation();
    setupNavigationButtons();
    setupAccountSubmission();
}

document.addEventListener('DOMContentLoaded', initialize);