import supabase from "/Banwa/server/api/supabase.js";

// Modal Management
const modal = document.getElementById('signupModal');
const getStartedBtn = document.getElementById('getStartedBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Progress steps
const steps = document.querySelectorAll('.step');
const panels = {
    selectId: document.getElementById('selectId'),
    personalDetails: document.getElementById('personalDetails'),
    createAcc: document.getElementById('createAcc')
};

// Current step tracker
let currentStep = 1;

// Open modal
getStartedBtn.addEventListener('click', () => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    switchPanel('selectId'); // Start at step 1
    updateProgress(1);
});

// Close modal
function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Update progress steps
function updateProgress(step) {
    currentStep = step;
    steps.forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');

        if (stepNum === step) {
            stepEl.classList.add('active');
        } else if (stepNum < step) {
            stepEl.classList.add('completed');
        }
    });
}

// Switch between panels
function switchPanel(panelId) {
    // Hide all panels
    Object.values(panels).forEach(panel => {
        panel.classList.add('hidden');
    });

    // Show selected panel
    panels[panelId].classList.remove('hidden');

    // Update progress based on panel
    switch (panelId) {
        case 'selectId':
            updateProgress(1);
            break;
        case 'personalDetails':
            updateProgress(2);
            break;
        case 'createAcc':
            updateProgress(3);
            break;
    }
}

// =========================
// Form Elements
// =========================
const formElements = {
    // Panel 1: Select ID
    selectIdNextBtn: document.getElementById('selectIdNextBtn'),
    idType: document.getElementById('idType'),
    idFile: document.getElementById('idFile'),
    ocrStatus: document.getElementById('ocrStatus'),
    idImagePreview: document.getElementById('idImagePreview'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),

    // Panel 2: Personal Details
    firstName: document.getElementById('firstName'),
    middleName: document.getElementById('middleName'),
    lastName: document.getElementById('lastName'),
    suffix: document.getElementById('suffix'),
    sex: document.getElementById('sex'),
    contactNo: document.getElementById('contactNo'),
    address: document.getElementById('address'),
    personalDetailsNextBtn: document.getElementById('personalDetailsNextBtn'),

    // Panel 3: Create Account
    createAccForm: document.getElementById('createAccForm'),
    email: document.getElementById('createAccEmail'),
    password: document.getElementById('password'),
    reTypePassword: document.getElementById('reTypePassword'),
    agreeCheckBox: document.getElementById('agreeCheckBox'),
    formMessage: document.getElementById('formMessage'),
    resendBtn: document.getElementById('resendEmailBtn'),

    // Navigation Back Buttons
    personalDetailsBackBtn: document.getElementById('personalDetailsBackBtn'),
    selectIdBackBtn: document.getElementById('selectIdBackBtn'),
    createAccBackBtn: document.getElementById('createAccBackBtn'),

    // Submit Button
    createAccSubmitBtn: document.getElementById('createAccSubmitBtn')
};

// Last OCR results
let lastOcrMeta = null;
let lastOcrData = null;

// =========================
// Validator Module
// =========================
const validator = (() => {
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el).querySelector('.error-msg'); }
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

    function validateText(input, message, rules = {}) {
        if (!input) return true;
        let value = input.value.trim();
        if (rules.normalizeSpaces) value = value.replace(/\s+/g, ' ').trim();
        if (!value || value === 'select') { showError(input, message); return false; }
        if (rules.lettersOnly && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
            showError(input, rules.errorMessage || 'Only letters allowed'); return false;
        }
        clearError(input); return true;
    }

    function validateNumber(input, message, rules = {}) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, message); return false; }
        if (!/^\d+$/.test(value)) { showError(input, rules.errorMessage || 'Only numbers allowed'); return false; }
        if (rules.minLength && value.length < rules.minLength) { showError(input, rules.errorMessage || `At least ${rules.minLength} digits required`); return false; }
        if (rules.maxLength && value.length > rules.maxLength) { showError(input, rules.errorMessage || `Max ${rules.maxLength} digits`); return false; }
        clearError(input); return true;
    }

    function validateEmail(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, message); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(input, 'Invalid email'); return false; }
        clearError(input); return true;
    }

    function validatePassword(input, message) {
        if (!input) return true;
        const value = input.value.trim();
        if (!value) { showError(input, message); return false; }
        if (value.length < 8 || value.length > 16) { showError(input, 'Password 8–16 chars'); return false; }
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must have letters & numbers'); return false; }
        clearError(input); return true;
    }

    function validatePasswordMatches(passwordInput, reTypeInput) {
        const password = passwordInput.value.trim();
        const reType = reTypeInput.value.trim();
        if (!reType) { showError(reTypeInput, 'Re-type password'); return false; }
        if (password !== reType) { showError(reTypeInput, 'Passwords do not match'); return false; }
        clearError(reTypeInput); return true;
    }

    function validateSelect(input, message) {
        if (!input) return true;
        const value = input.value;
        if (!value || value === '') { showError(input, message); return false; }
        clearError(input); return true;
    }

    function validateCheckbox(input, message) {
        if (!input.checked) { showError(input, message); return false; }
        clearError(input); return true;
    }

    function validateFile(input, message, options = {}) {
        if (!input || input.files.length === 0) { showError(input, message); return false; }
        const file = input.files[0];
        if (options.accept?.length && !options.accept.some(a => file.name.toLowerCase().endsWith(a.toLowerCase()))) {
            showError(input, options.errorMessage || `Allowed: ${options.accept.join(', ')}`); return false;
        }
        if (file.size > 5 * 1024 * 1024) { showError(input, 'File > 5MB'); return false; }
        clearError(input); return true;
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

// =========================
// Validation Config
// =========================
const validationConfig = [
    { el: formElements.firstName, type: 'text', message: 'First name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.lastName, type: 'text', message: 'Last name is required', rules: { lettersOnly: true, normalizeSpaces: true, errorMessage: 'Only letters are allowed' } },
    { el: formElements.sex, type: 'select', message: 'Please select sex' },
    { el: formElements.contactNo, type: 'number', message: 'Contact no. is required', rules: { minLength: 7, maxLength: 11, errorMessage: 'Contact no. must be exactly 11 digits' } },
    { el: formElements.email, type: 'email', message: 'Email is required' },
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
        case 'email': return validator.email(el, message);
        case 'file': return validator.file(el, message, rules);
        case 'checkbox': return validator.checkbox(el, message);
        case 'select': return validator.select(el, message);
        case 'password': return validator.password(el, message);
    }
}

function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
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

    formElements.reTypePassword?.addEventListener('blur', () => validator.matchPassword(formElements.password, formElements.reTypePassword));
    formElements.reTypePassword?.addEventListener('input', () => validator.clear(formElements.reTypePassword));

    formElements.contactNo?.addEventListener('input', () => {
        formElements.contactNo.value = formElements.contactNo.value.replace(/\D/g, '');
        validator.clear(formElements.contactNo);
    });
}

// =========================
// OCR / ID Preview Logic
// =========================
formElements.idFile?.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (formElements.idImagePreview) formElements.idImagePreview.src = e.target.result;
            if (formElements.imagePreviewContainer) formElements.imagePreviewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
        processOCR();
    }
});

async function processOCR() {
    if (!formElements.idFile.files[0] || !formElements.idType.value) {
        formElements.ocrStatus.textContent = "Please select an ID type and upload a photo.";
        formElements.ocrStatus.className = 'ocr-status-error';
        formElements.ocrStatus.style.display = 'block';
        return;
    }

    formElements.selectIdNextBtn.disabled = true;
    formElements.selectIdNextBtn.textContent = "Processing...";

    formElements.ocrStatus.className = 'ocr-status-processing';
    formElements.ocrStatus.style.display = 'block';

    formElements.ocrStatus.innerHTML = `
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        <div style="text-align: center; font-weight: bold; margin-top: 8px;">
            Checking ID fingerprints...
        </div>
    `;

    const formData = new FormData();
    formData.append('file', formElements.idFile.files[0]);
    formData.append('idType', formElements.idType.value);
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) formData.append('debug', '1');

    let result = null;
    try {
        const response = await fetch('/Banwa/server/api/auth/ocr_process.php', {
            method: 'POST',
            body: formData
        });
        result = await response.json();

        if (result && result.success) {
            const d = result.data || {};
            const hitsMap = result.meta?.hits_map || {};
            let fieldsCount = (typeof result.meta?.fields_count === 'number') ? result.meta.fields_count : 0;
            if (!fieldsCount) {
                fieldsCount = Object.values(d).filter(v => v && String(v).trim().length > 0).length;
            }
            const selectedType = formElements.idType.value;
            const selectedHits = hitsMap[selectedType] || 0;

            if (selectedHits < 1 && fieldsCount < 2) {
                formElements.ocrStatus.className = 'ocr-status-error';
                formElements.ocrStatus.textContent = `Selected ID type (${selectedType}) not confidently detected. Please upload the correct ID or proceed manually.`;
                formElements.selectIdNextBtn.disabled = false;
                formElements.selectIdNextBtn.textContent = "Retry Verification";
                formElements.selectIdNextBtn.onclick = () => window.location.reload();
                return;
            }

            formElements.firstName.value = d.firstName || "";
            formElements.middleName.value = d.middleName || "";
            formElements.lastName.value = d.lastName || "";
            formElements.address.value = d.address || "";

            lastOcrData = d;
            lastOcrMeta = result.meta || null;

            const detected = result.meta?.detected_type || "Document";
            formElements.ocrStatus.className = 'ocr-status-success';
            formElements.ocrStatus.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa fa-check-circle"></i>
                    <span>Verified: <strong>${detected}</strong></span>
                </div>
            `;

            formElements.selectIdNextBtn.disabled = false;
            formElements.selectIdNextBtn.textContent = "Next: Personal Details";
            formElements.selectIdNextBtn.onclick = () => {
                switchPanel('personalDetails');
                resetVerifyButton();
            };
        } else {
            formElements.ocrStatus.className = 'ocr-status-error';
            formElements.ocrStatus.textContent = result.error || "Verification failed.";
            formElements.selectIdNextBtn.disabled = false;
            formElements.selectIdNextBtn.textContent = "Retry Verification";
        }
    } catch (error) {
        console.error("OCR Error:", error);
        formElements.ocrStatus.className = 'ocr-status-error';
        formElements.ocrStatus.textContent = "Server offline. You can proceed manually.";
        formElements.selectIdNextBtn.disabled = false;
        formElements.selectIdNextBtn.textContent = "Proceed Manually";
        formElements.selectIdNextBtn.onclick = () => switchPanel('personalDetails');
    }
}

function resetVerifyButton() {
    formElements.selectIdNextBtn.textContent = "Verify ID";
    formElements.selectIdNextBtn.onclick = processOCR;
}

// =========================
// Navigation Buttons
// =========================
function setupNavigationButtons() {
    formElements.selectIdBackBtn?.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Are you sure you want to go back? Your progress will be lost.')) {
            closeModal();
        }
    });

    formElements.personalDetailsBackBtn?.addEventListener('click', () => switchPanel('selectId'));
    formElements.createAccBackBtn?.addEventListener('click', () => switchPanel('personalDetails'));

    formElements.selectIdNextBtn?.addEventListener('click', async () => {
        const stepFields = [formElements.idType, formElements.idFile];
        if (!validateStep(stepFields)) return;
        await processOCR();
    });

    formElements.personalDetailsNextBtn?.addEventListener('click', () => {
        const stepFields = [
            formElements.firstName,
            formElements.lastName,
            formElements.sex,
            formElements.contactNo,
            formElements.address
        ];
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
            if (resendCount < MAX_RESENDS) {
                btn.disabled = false;
                btn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`;
            }
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
        options: { emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php" }
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

function showSubmitConfirmation() {
    const modal = document.getElementById('submitConfirmModal');
    if (!modal) {
        return Promise.resolve(confirm('Are you sure you want to submit this application?'));
    }

    const backdrop = modal.querySelector('.modal-backdrop');
    const btnCancel = modal.querySelector('.btn-cancel');
    const btnConfirm = modal.querySelector('.btn-confirm');

    let resolvePromise;
    const p = new Promise(res => { resolvePromise = res; });

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    const firstFocusable = btnCancel || btnConfirm;
    firstFocusable && firstFocusable.focus();

    function handleKey(e) {
        if (e.key === 'Escape') {
            close(false);
        }
    }

    function close(val) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', handleKey);
        backdrop.removeEventListener('click', backdropClick);
        btnCancel.removeEventListener('click', onCancel);
        btnConfirm.removeEventListener('click', onConfirm);
        resolvePromise(val);
    }

    function onCancel() { close(false); }
    function onConfirm() { close(true); }
    function backdropClick(e) { if (e.target === backdrop) close(false); }

    document.addEventListener('keydown', handleKey);
    backdrop.addEventListener('click', backdropClick);
    btnCancel.addEventListener('click', onCancel);
    btnConfirm.addEventListener('click', onConfirm);

    return p;
}

function setupAccountSubmission() {
    formElements.formMessage.style.display = 'none';
    formElements.createAccForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formElements.formMessage.textContent = '';
        const stepFields = [formElements.password, formElements.reTypePassword, formElements.email, formElements.agreeCheckBox];
        if (!validateStep(stepFields) ||
            !validator.matchPassword(formElements.password, formElements.reTypePassword)) {
            return;
        }

        const confirmed = await showSubmitConfirmation();
        if (!confirmed) return;

        allData = {
            fullname: `${formElements.firstName.value} ${formElements.middleName.value} ${formElements.lastName.value} ${formElements.suffix.value}`.trim(),
            sex: formElements.sex.value,
            contactNo: formElements.contactNo.value,
            address: formElements.address.value,
            idType: formElements.idType.value,
            email: formElements.email.value,
            password: formElements.password.value,
            agreeCheckBox: formElements.agreeCheckBox.checked,
            ocrMeta: lastOcrMeta,
            ocrData: lastOcrData
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
                options: { data: allData, emailRedirectTo: "http://localhost:8080/client/pages/auth/confirm_verification.php" }
            });

            if (error) {
                formElements.formMessage.style.display = 'block';
                formElements.formMessage.style.color = 'red';
                if (error.message.toLowerCase().includes('already')) {
                    formElements.formMessage.textContent = 'An account with this email already exists.';
                } else {
                    formElements.formMessage.textContent = 'An error occurred: ' + error.message;
                }
                return;
            }

            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'green';
            formElements.formMessage.innerHTML = `
                Account created successfully.<br>
                Please verify your email to activate your account.<br><br>
                If you don't receive the email within 1-2 minutes:
                <br>
                1. Make sure the email address is correct<br>
                2. Check your Spam / Promotions folder<br>
                3. You can resend the verification email
            `;

            formElements.resendBtn.classList.add('show');
            startResendCooldown();

            (async () => {
                try {
                    const supabaseUserId = data?.user?.id || data?.user?.user_metadata?.id || null;
                    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
                    const payload = {
                        supabase_user_id: supabaseUserId,
                        email: allData.email,
                        ocrMeta: allData.ocrMeta,
                        ocrData: allData.ocrData,
                        debug: isLocal
                    };
                    const resp = await fetch('/Banwa/server/api/shared/verify_ocr.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const verifyResult = await resp.json();
                    console.log('verify_ocr result', verifyResult);
                    if (verifyResult.debug_info) console.error('verify_ocr debug:', verifyResult.debug_info);
                    if (verifyResult.success && verifyResult.verified) {
                        formElements.formMessage.innerHTML += '<br><small>Identity verification applied automatically.</small>';
                    } else if (verifyResult.success && !verifyResult.verified) {
                        formElements.formMessage.innerHTML += `<br><small>OCR verification recorded (issues: ${verifyResult.reasons.join(', ') || 'none'}).</small>`;
                    }
                } catch (err) {
                    console.warn('verify_ocr call failed', err);
                }
            })();

        } catch (err) {
            formElements.formMessage.style.display = 'block';
            formElements.formMessage.style.color = 'red';
            formElements.formMessage.textContent = 'An error occurred. ' + (err.message || err);
        }
    });
}

// =========================
// Initialize
// =========================
function initialize() {
    switchPanel('selectId');
    setupRealtimeValidation();
    setupNavigationButtons();
    setupAccountSubmission();
}

document.addEventListener('DOMContentLoaded', initialize);
