import supabase from "../../../server/api/supabase.js";

// =========================
// Switch panel utility
// =========================
function switchPanel(panelId) {
    const panels = ['personalDetails', 'selectId', 'createAcc']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
}

function validation() {
    // =========================
    // Form elements
    // =========================
    const idType = document.getElementById('idType');
    const idFile = document.getElementById('idFile');

    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const lastName = document.getElementById('lastName');
    const suffix = document.getElementById('suffix');
    const sex = document.getElementById('sex');
    const contactNo = document.getElementById('contactNo');
    const address = document.getElementById('address');

    const email = document.getElementById('createAccEmail');
    const password = document.getElementById('password');
    const reTypePassword = document.getElementById('reTypePassword');
    const agreeCheckBox = document.getElementById('agreeCheckBox');

    // Show first panel
    switchPanel('personalDetails');

    // =========================
    // Validation inputs (text, select, checkbox, textarea)
    // =========================
    function validateInput(input, message) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        if (!errorEl) return true;

        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        const setError = (msg) => {
            input.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = msg;
        };

        const clearError = () => {
            input.classList.remove('error');
            errorEl.classList.remove('show');
            errorEl.textContent = '';
        };

        if ((input.type === 'checkbox' && !value) || (input.type === 'email' && !value) ||
            (!['checkbox', 'file', 'email'].includes(input.type) && (value === '' || value === 'select'))) {
            setError(message);
            return false;
        }

        if (input.type === 'file') {
            if (!input.files || input.files.length === 0) {
                setError(message);
                return false;
            }
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            for (let file of input.files) {
                if (!allowedTypes.includes(file.type)) {
                    setError('Invalid file type. Only JPG, PNG, PDF allowed');
                    return false;
                }
            }
        }

        clearError();
        return true;
    }

    // =========================
    // Attach events
    // =========================
    (() => {
        const inputs = [firstName, lastName, sex, address, agreeCheckBox, idType, idFile, password, reTypePassword, contactNo, email];

        inputs.forEach(input => {
            if (!input) return;
            const wrapper = input.closest('.label-and-input');
            const errorEl = wrapper?.querySelector('.error-msg');
            if (!errorEl) return;

            const setError = (msg) => {
                input.classList.add('error');
                errorEl.classList.add('show');
                errorEl.textContent = msg;
            };

            const clearError = () => {
                input.classList.remove('error');
                errorEl.classList.remove('show');
                errorEl.textContent = '';
            };

            // Clear error on input
            input.addEventListener('input', () => {
                if (input === contactNo) input.value = input.value.replace(/\D/g, '');
                clearError();
            });

            // Validate on blur
            input.addEventListener('blur', () => {
                if (input === password) {
                    const val = input.value.trim();
                    if (!val) setError('Password is required');
                    else if (val.length < 8 || val.length > 16) setError('Password should be 8-16 characters long');
                    else if (!/[A-Za-z]/.test(val) || !/[0-9]/.test(val)) setError('Password must contain letters and numbers');
                    else clearError();
                } else if (input === reTypePassword) {
                    const val = input.value.trim();
                    if (!val) setError('Please re-type your password');
                    else if (val !== password.value.trim()) setError('Passwords do not match');
                    else clearError();
                } else if (input === contactNo) {
                    const val = input.value.replace(/\D/g, '');
                    input.value = val;
                    if (!val) setError('Phone number is required');
                    else if (val.length !== 11) setError('Phone number must be 11 digits');
                    else clearError();
                } else if (input === email) {
                    const val = input.value.trim();
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!val) setError('Email is required');
                    else if (!emailPattern.test(val)) setError('Enter a valid email address');
                    else clearError();
                } else {
                    validateInput(input, 'This field is required');
                }
            });
        });
    })();



    // =========================
    // Navigation buttons
    // =========================
    document.getElementById('personalDetailsBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/Banwa/client/pages/auth/signin.php';
    });
    document.getElementById('selectIdBackBtn').addEventListener('click', () => switchPanel('personalDetails'));
    document.getElementById('createAccBackBtn').addEventListener('click', () => switchPanel('selectId'));

    // =========================
    // Personal Details 'Next' Button
    // =========================
    document.getElementById('personalDetailsNextBtn').addEventListener('click', function (e) {
        e.preventDefault();
        const validations = [
            validateInput(firstName, 'First name is required'),
            validateInput(lastName, 'Last name is required'),
            validateInput(sex, 'Sex is required'),
            validateInput(contactNo, 'Phone number is required'),
            validateInput(address, 'Address is required')
        ];

        if (validations.every(v => v)) switchPanel('selectId');
    });

    // =========================
    // Select ID 'Next' Button
    // =========================
    document.getElementById('selectIdNextBtn').addEventListener('click', () => {
        const validations = [
            validateInput(idType, 'Please select a type of ID'),
            validateInput(idFile, 'Please upload your ID file')
        ];
        // const isValidRadio = validateRadioGroup(idType, 'Please select a type of ID');
        // const isValidFile = validateFileInput(idFile, 'Please upload your ID file');

        if (validations.every(v => v)) switchPanel('createAcc');
    });


    // =========================
    // Create Account 'Submit' Button
    // =========================
    const formMessage = document.getElementById('formMessage');
    formMessage.style.display = 'none';
    const resendBtn = document.getElementById('resendEmailBtn');
    let allData = null;

    document.getElementById('createAccForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';

        const validations = [
            validateInput(password, 'Password is required'),
            validateInput(reTypePassword, 'Please re-type your password'),
            password.value !== reTypePassword.value ? (() => {
                const wrapper = reTypePassword.closest('.label-and-input');
                const errorEl = wrapper.querySelector('.error-msg');
                reTypePassword.classList.add('error');
                errorEl.classList.add('show');
                errorEl.textContent = 'Passwords do not match';
                return false;
            })() : true,
            validateInput(email, 'Email is required'),
            validateInput(agreeCheckBox, 'You must agree with the terms')
        ];


        if (!validations.every(v => v)) return;
        if (!confirm('Are you sure you want to submit this application?')) return;

        allData = {
            fullname: `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim(),
            sex: sex.value,
            contactNo: contactNo.value,
            address: address.value,
            idType: idType.value,
            email: email.value,
            password: password.value,
            agreeCheckBox: agreeCheckBox.checked
        };

        try {
            const respCheck = await fetch(`/Banwa/server/api/resident/check_email.php?email=${encodeURIComponent(allData.email)}`);
            const dbCheck = await respCheck.json();

            if (dbCheck.exists) {
                formMessage.style.display = 'block';
                formMessage.style.color = 'red';
                formMessage.textContent = 'An account with this email already exists.';
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
                    formMessage.style.display = 'block';
                    formMessage.style.color = 'red';
                    formMessage.textContent = 'An account with this email already exists.';
                    return;
                }
                throw error;
            } 

            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.innerHTML = `
            Account created successfully.<br>
            Please verify your email to activate your account.<br><br>
            If you don’t receive the email within 1–2 minutes:
            <br>
            1. Make sure the email address is correct<br>
            2. Check your Spam / Promotions folder<br>
            3. You can resend the verification email<br>
           
        `;

            resendBtn.classList.add('show');
            startResendCooldown();

        } catch (err) {
            // console.error('Error during signup:', err);
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'An error occurred. ' + (err.message || err);
        }
    });


    let resendCount = 0;
    const MAX_RESENDS = 3;

    function startResendCooldown() {
        const submitBtn = document.getElementById('createAccSubmitBtn');
        if (submitBtn) submitBtn.style.display = 'none';

        const btn = resendBtn;
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
                } else {
                    btn.remove();
                }
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', async () => {
        if (!allData || resendCount >= MAX_RESENDS) return;

        resendBtn.disabled = true;

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: allData.email,
            options: {
                emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php"
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

validation();