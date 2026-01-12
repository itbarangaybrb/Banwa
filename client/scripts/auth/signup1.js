import supabase from "../../../server/api/supabase.js";

// =========================
// 1. Navigation Logic
// =========================
function switchPanel(panelId) {
    const panels = ['selectId', 'personalDetails', 'createAcc'];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(panelId);
    if (target) {
        target.classList.remove('hidden');
    } else {
        console.error(`Panel with ID "${panelId}" not found.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchPanel('selectId');

    // --- FORM ELEMENTS ---
    // Panel 1: Select ID
    const selectIdNextBtn = document.getElementById('selectIdNextBtn');
    const idType = document.getElementById('idType');
    const idFile = document.getElementById('idFile');
    const ocrStatus = document.getElementById('ocrStatus');
    const idImagePreview = document.getElementById('idImagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    // Panel 2: Personal Details
    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const lastName = document.getElementById('lastName');
    const suffix = document.getElementById('suffix'); // Optional if exists in HTML
    const sex = document.getElementById('sex');
    const contactNo = document.getElementById('contactNo');
    const address = document.getElementById('address');
    const personalDetailsNextBtn = document.getElementById('personalDetailsNextBtn');

    // Panel 3: Create Account
    const createAccForm = document.getElementById('createAccForm');
    const email = document.getElementById('createAccEmail');
    const password = document.getElementById('password');
    const reTypePassword = document.getElementById('reTypePassword');
    const agreeCheckBox = document.getElementById('agreeCheckBox');
    const formMessage = document.getElementById('formMessage');
    const resendBtn = document.getElementById('resendEmailBtn');

    // =========================
    // 2. Validation Helper
    // =========================
    function validateInput(input, message) {
        if (!input) return false;
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        
        let isValid = true;

        if (input.type === 'checkbox') {
            isValid = input.checked;
        } else {
            isValid = input.value.trim() !== '';
        }

        if (!isValid) {
            input.classList.add('error');
            if (errorEl) {
                errorEl.classList.add('show');
                errorEl.textContent = message;
            }
            return false;
        }

        // Clear error if valid
        input.classList.remove('error');
        if (errorEl) errorEl.classList.remove('show');
        return true;
    }

    // =========================
    // 3. ID Preview Logic
    // =========================
    if (idFile) {
        idFile.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (idImagePreview) idImagePreview.setAttribute('src', e.target.result);
                    if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // =========================
    // 4. OCR / Backend Integration
    // =========================
    async function processOCR() {
        if (!idFile.files[0] || !idType.value) return;

        // Visual Feedback: Disable button and show status
        selectIdNextBtn.disabled = true;
        selectIdNextBtn.classList.add('scanning-btn'); // Add CSS class
        selectIdNextBtn.textContent = "Scanning...";
        
        ocrStatus.style.display = 'block';
        ocrStatus.style.color = '#00247C';
        ocrStatus.textContent = "Analyzing ID... please wait.";

        const formData = new FormData();
        formData.append('file', idFile.files[0]);
        formData.append('idType', idType.value);

        try {
            const response = await fetch('http://127.0.0.1:5000/process_ocr', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success && result.data) {
                const d = result.data;
                if (d.firstName) firstName.value = d.firstName;
                if (d.lastName) lastName.value = d.lastName;
                if (d.middleName) middleName.value = d.middleName;
                if (d.address) address.value = d.address;
                
                ocrStatus.style.color = 'green';
                ocrStatus.textContent = "Scan complete! Details auto-filled.";
            } else {
                ocrStatus.style.color = 'red';
                ocrStatus.textContent = "Could not read ID automatically.";
            }
        } catch (error) {
            console.error("OCR Error:", error);
            ocrStatus.style.color = 'red';
            ocrStatus.textContent = "Scanner offline. Please enter manually.";
        } finally {
            // Re-enable button and move to next panel regardless of result
            selectIdNextBtn.disabled = false;
            selectIdNextBtn.classList.remove('scanning-btn');
            selectIdNextBtn.textContent = "Next";
            switchPanel('personalDetails');
        }
    }

    // =========================
    // 5. Navigation Event Listeners
    // =========================

    // --- STEP 1: SELECT ID ---
    selectIdNextBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const v1 = validateInput(idType, "Please select ID type");
        const v2 = validateInput(idFile, "Please upload ID file");

        if (v1 && v2) {
            processOCR();
        }
    });

    // --- STEP 2: PERSONAL DETAILS ---
    document.getElementById('personalDetailsBackBtn')?.addEventListener('click', () => {
        switchPanel('selectId');
    });

    personalDetailsNextBtn?.addEventListener('click', (e) => {
        e.preventDefault();

        // Clean Address
        if (address && address.value) {
            address.value = address.value
                .replace(/Last Name, First Name\.?/gi, "")
                .replace(/^[,\.\s]+/, "")
                .trim();
        }

        // Validate all required fields
        const validations = [
            validateInput(firstName, 'First name is required'),
            validateInput(lastName, 'Last name is required'),
            validateInput(sex, 'Sex is required'),
            validateInput(contactNo, 'Phone number is required'),
            validateInput(address, 'Address is required')
        ];

        // Only proceed if EVERY validation is true
        if (validations.every(v => v === true)) {
            switchPanel('createAcc');
        }
    });

    // --- STEP 3: CREATE ACCOUNT ---
    document.getElementById('createAccBackBtn')?.addEventListener('click', () => {
        switchPanel('personalDetails');
    });

    // =========================
    // 6. Final Form Submission
    // =========================
    let allData = null;

    createAccForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.style.display = 'none';
        
        // 1. Basic Validations
        const validations = [
            validateInput(email, 'Email is required'),
            validateInput(password, 'Password is required'),
            validateInput(reTypePassword, 'Please re-type password'),
            validateInput(agreeCheckBox, 'You must agree to terms')
        ];

        // 2. Password Match Check
        if (password.value !== reTypePassword.value) {
            const wrapper = reTypePassword.closest('.label-and-input');
            const errorEl = wrapper?.querySelector('.error-msg');
            reTypePassword.classList.add('error');
            if(errorEl) {
                errorEl.classList.add('show');
                errorEl.textContent = 'Passwords do not match';
            }
            return;
        }

        if (!validations.every(v => v === true)) return;
        if (!confirm('Are you sure you want to submit this application?')) return;

        // 3. Prepare Data
        allData = {
            fullname: `${firstName.value} ${middleName.value || ''} ${lastName.value} ${suffix?.value || ''}`.trim(),
            sex: sex.value,
            contactNo: contactNo.value,
            address: address.value,
            idType: idType.value,
            email: email.value,
            password: password.value
        };

        try {
            // 4. Check if Email Exists (PHP Backend)
            const respCheck = await fetch(`/Banwa/server/api/resident/check_email.php?email=${encodeURIComponent(allData.email)}`);
            const dbCheck = await respCheck.json();

            if (dbCheck.exists) {
                formMessage.style.display = 'block';
                formMessage.style.color = 'red';
                formMessage.textContent = 'An account with this email already exists.';
                return;
            }

            // 5. Sign Up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: allData.email,
                password: allData.password,
                options: {
                    data: allData,
                    emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php",
                },
            });

            if (error) throw error;

            // 6. Success State
            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.innerHTML = `
                Account created successfully.<br>
                Please verify your email to activate your account.<br>
                Check your Spam / Promotions folder if not received.
            `;

            // Enable Resend Button Logic
            if(resendBtn) {
                resendBtn.classList.add('show'); // Ensure you have CSS to show this
                startResendCooldown();
            }
            
            // Hide submit button to prevent double submission
            const submitBtn = document.getElementById('createAccSubmitBtn');
            if(submitBtn) submitBtn.style.display = 'none';

        } catch (err) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'Error: ' + (err.message || err);
        }
    });

    // =========================
    // 7. Resend Logic
    // =========================
    let resendCount = 0;
    const MAX_RESENDS = 3;

    function startResendCooldown() {
        if (!resendBtn) return;
        resendBtn.disabled = true;
        let countdown = 60; // 60 seconds cooldown
        
        const interval = setInterval(() => {
            resendBtn.textContent = `Resend available in ${countdown}s`;
            countdown--;
            
            if (countdown < 0) {
                clearInterval(interval);
                if (resendCount < MAX_RESENDS) {
                    resendBtn.disabled = false;
                    resendBtn.textContent = `Resend Verification Email (${resendCount}/${MAX_RESENDS})`;
                } else {
                    resendBtn.textContent = "Max resend attempts reached";
                }
            }
        }, 1000);
    }

    resendBtn?.addEventListener('click', async () => {
        if (!allData || resendCount >= MAX_RESENDS) return;

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: allData.email,
            options: {
                emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php"
            }
        });

        if (error) {
            formMessage.style.color = 'red';
            formMessage.textContent = 'Failed to resend email. Try again later.';
        } else {
            resendCount++;
            formMessage.style.color = 'green';
            formMessage.textContent = `Email resent! (${resendCount}/${MAX_RESENDS})`;
            startResendCooldown();
        }
    });
});