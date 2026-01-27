import supabase from "../../../server/api/supabase.js";

// =========================
// 1. Navigation Logic
// =========================
function switchPanel(panelId) {
    const panels = ['personalDetails', 'selectId', 'createAcc']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
}

// =========================
// 2. Form Elements
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

// =========================
// 3. Validator Module
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
        const value = input.value.trim();
        if (!value || value === 'select') { showError(input, message); return false; }
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
// 4. Validation Config
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
// 5. Validate Field Helper
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

// =========================
// 6. Real-time Validation
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

function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

// =========================
// 7. OCR / ID Preview Logic
// =========================
formElements.idFile.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (formElements.idImagePreview) formElements.idImagePreview.src = e.target.result;
            if (formElements.imagePreviewContainer) formElements.imagePreviewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
        processOCR(); // <-- triggers OCR immediately
    }
});

async function processOCR() {
    // 1. Initial Validation
    if (!formElements.idFile.files[0] || !formElements.idType.value) {
        formElements.ocrStatus.textContent = "Please select an ID type and upload a photo.";
        formElements.ocrStatus.className = 'ocr-status-error';
        formElements.ocrStatus.style.display = 'block';
        return;
    }

    // 2. Loading State
    formElements.selectIdNextBtn.disabled = true;
    formElements.selectIdNextBtn.textContent = "Verifying...";
    formElements.ocrStatus.className = 'ocr-status-processing';
    formElements.ocrStatus.style.display = 'block';
    formElements.ocrStatus.textContent = "Checking ID fingerprints...";

    const formData = new FormData();
    formData.append('file', formElements.idFile.files[0]);
    formData.append('idType', formElements.idType.value);

    try {
        const response = await fetch('http://127.0.0.1:5000/process_ocr', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            const d = result.data;
            // Populate the next panel's fields
            formElements.firstName.value = d.firstName || "";
            formElements.lastName.value = d.lastName || "";
            formElements.address.value = d.address || "";

            // Show Success UI
            const detected = result.meta?.detected_type || "Document";
            formElements.ocrStatus.className = 'ocr-status-success';
            formElements.ocrStatus.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa fa-check-circle"></i>
                    <span>Verified: <strong>${detected}</strong></span>
                </div>
            `;

            // THE FIX: Transition the button to "Next Step" mode
            formElements.selectIdNextBtn.disabled = false;
            formElements.selectIdNextBtn.textContent = "Next: Personal Details";
            
            // Change the click event so it switches panels instead of running OCR again
            formElements.selectIdNextBtn.onclick = () => {
                switchPanel('personalDetails');
                // Reset button for next time (in case they come back)
                resetVerifyButton(); 
            };
        } else {
            // Error handling (mismatch, blur, etc.)
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

    console.log("Full Backend Response:", result); // Look at 'meta' and 'data' here
}

// Helper to reset the button back to OCR mode if the user changes their selection
function resetVerifyButton() {
    formElements.selectIdNextBtn.textContent = "Verify ID";
    formElements.selectIdNextBtn.onclick = processOCR;
}

// =========================
// 8. Navigation Buttons
// =========================
function setupNavigationButtons() {
    formElements.selectIdBackBtn?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/Banwa/client/pages/auth/signin.php'; });
    formElements.personalDetailsBackBtn?.addEventListener('click', () => switchPanel('selectId'));
    formElements.createAccBackBtn?.addEventListener('click', () => switchPanel('personalDetails'));

    formElements.selectIdNextBtn?.addEventListener('click', async () => {
        const stepFields = [formElements.idType, formElements.idFile];
        if (validateStep(stepFields)) {
            await processOCR();
            switchPanel('personalDetails');
        }

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
// 9. Account Submission & Resend
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
        if (!validateStep(stepFields) ||
            !validator.matchPassword(formElements.password, formElements.reTypePassword)) {
            return;
        }
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
                options: { data: allData, emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php" }
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
// 10. Initialize
// =========================
function initialize() {
    switchPanel('selectId');
    setupRealtimeValidation();
    setupNavigationButtons();
    setupAccountSubmission();
}

document.addEventListener('DOMContentLoaded', initialize);
