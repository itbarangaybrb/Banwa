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
    const idType = document.getElementsByName('idType');
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
    // Validation inputs (GENERIC)
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg') || input.nextElementSibling;
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = message;
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        if (rules.minLength && value.length < rules.minLength) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = `Minimum ${rules.minLength} characters required`;
            return false;
        }

        input.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
        return true;
    }

    // Validate a radio group
    function validateRadioGroup(radios, message) {
        const anyChecked = Array.from(radios).some(r => r.checked);

        // Find wrapper for first radio to show error
        const wrapper = radios[0]?.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');

        if (!anyChecked) {
            if (errorEl) errorEl.textContent = message;
            return false;
        }

        if (errorEl) errorEl.textContent = '';
        return true;
    }

    // Validate file input
    function validateFileInput(input, message = 'File is required') {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');

        if (!input.files || input.files.length === 0) {
            if (errorEl) errorEl.textContent = message;
            input.classList.add('error');
            return false;
        }

        if (errorEl) errorEl.textContent = '';
        input.classList.remove('error');
        return true;
    }


    function checkPasswordMatch() {
        const wrapper = reTypePassword.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        const value = reTypePassword.value.trim();

        if (value === '') {
            reTypePassword.classList.add('error');
            if (errorEl) errorEl.textContent = 'Please re-type your password';
            return false;
        }

        if (value !== password.value) {
            reTypePassword.classList.add('error');
            if (errorEl) errorEl.textContent = 'Passwords do not match';
            return false;
        }

        reTypePassword.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
        return true;
    }


    // =========================
    // Specialized Phone Validations
    // =========================
    function phoneValidation() {
        const wrapper = contactNo.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        let value = contactNo.value.replace(/\D/g, '');
        contactNo.value = value;

        if (value.length === 0) {
            contactNo.classList.add('error');
            errorEl.textContent = 'Phone number is required';
        } else if (value.length < 11) {
            contactNo.classList.add('error');
            errorEl.textContent = 'Phone number must be 11 digits';
        } else if (value.length > 11) {
            contactNo.classList.add('error');
            errorEl.textContent = 'Phone number must be 11 digits only';
        } else {
            contactNo.classList.remove('error');
            errorEl.textContent = '';
        }
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
        } else if (!emailPattern.test(value)) {
            email.classList.add('error');
            errorEl.textContent = 'Enter a valid email address';
        } else {
            email.classList.remove('error');
            errorEl.textContent = '';
        }
    }

    // =========================
    // Specialized Password Validations
    // =========================
    function passwordValidation() {
        const wrapper = password.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        const value = password.value;

        if (value.trim() === '') {
            password.classList.add('error');
            if (errorEl) errorEl.textContent = 'Password is required';
            return false;
        }

        if (value.length < 8 || value.length > 16) {
            password.classList.add('error');
            if (errorEl) errorEl.textContent = 'Password should be 8-16 characters long';
            return false;
        }

        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            password.classList.add('error');
            if (errorEl) errorEl.textContent = 'Password must contain letters and numbers';
            return false;
        }

        password.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
        return true;
    }

    // =========================
    // Real-time validation setup (single IIFE)
    // =========================
    (() => {
        const inputs = [firstName, middleName, lastName, suffix, sex, contactNo, address, email, password, reTypePassword, agreeCheckBox, idFile];

        inputs.forEach(input => {
            if (!input) return;

            if (input === contactNo) {
                input.addEventListener('input', phoneValidation);
            } else if (input === email) {
                input.addEventListener('input', emailValidation);
            } else if (input === password) {
                input.addEventListener('input', () => passwordValidation());
            } else if (input === reTypePassword) {
                input.addEventListener('input', () => checkPasswordMatch());
            } else if (input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'file') {
                input.addEventListener('change', () => validateInput(input));
            } else {
                input.addEventListener('input', () => validateInput(input));
            }
        });

        // Radio group
        Array.from(idType).forEach(radio => {
            radio.addEventListener('change', () => validateRadioGroup(idType, 'Please select a type of ID'));
        });
    })();

    // =========================
    // Navigation buttons
    // =========================
    document.getElementById('selectIdBackBtn').addEventListener('click', () => switchPanel('personalDetails'));
    document.getElementById('createAccBackBtn').addEventListener('click', () => switchPanel('selectId'));

    // =========================
    // Personal Details 'Next' Button
    // =========================
    document.getElementById('personalDetailsNextBtn').addEventListener('click', function (e) {
        e.preventDefault();
        const validations = [
            validateInput(firstName, 'First name is required'),
            validateInput(middleName, 'Middle name is required'),
            validateInput(lastName, 'Last name is required'),
            validateInput(suffix, 'Suffix is required'),
            validateInput(sex, 'Sex is required'),
            validateInput(contactNo, 'Phone number is required', { pattern: /^[0-9]{11}$/, maxLength: 11, errorMessage: 'Phone number must be numeric, max 11 digits' }),
            validateInput(address, 'Address is required')
        ];

        if (validations.every(v => v)) switchPanel('selectId');
    });

    // =========================
    // Select ID 'Next' Button
    // =========================
    document.getElementById('selectIdNextBtn').addEventListener('click', () => {
        const isValidRadio = validateRadioGroup(idType, 'Please select a type of ID');
        const isValidFile = validateFileInput(idFile, 'Please upload your ID file');

        if (isValidRadio && isValidFile) switchPanel('createAcc');
    });


    // =========================
    // Personal Details 'Sbumit' Button
    // =========================
    const formMessage = document.getElementById('formMessage');

    document.getElementById('createAccForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';

        const validations = [
            passwordValidation(),
            checkPasswordMatch(),
            validateInput(contactNo, 'Phone number is required', { pattern: /^[0-9]{11}$/, maxLength: 11 }),
            validateInput(email, 'Email is required', { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }),
            validateInput(agreeCheckBox, 'You must agree with the terms')
        ];

        if (!validations.every(v => v)) return;

        if (!confirm('Are you sure you want to submit this application?')) return;

        const allData = {
            fullname: `${firstName.value} ${middleName.value} ${lastName.value} ${suffix.value}`.trim(),
            sex: sex.value,
            contactNo: contactNo.value,
            address: address.value,
            idType: Array.from(idType).find(r => r.checked)?.value || '',
            email: email.value,
            password: password.value,
            agreeCheckBox: agreeCheckBox.checked
        };

        try {
            const { data, error } = await supabase.auth.signUp({
                email: allData.email,
                password: allData.password,
                options: {
                    data: {
                        fullname,
                        sex,
                        contactNo,
                        address,
                        idType,
                        email,
                        agreeCheckBox
                    },
                    emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/signin.html",
                },
            });

            if (error) {
                console.error('Supabase signup error:', error.message);
                formMessage.style.color = 'red';
                formMessage.textContent = `Signup failed: ${error.message}`;
                return;
            }

            // =============================
            // Insert user into your custom DB
            // =============================
            // try {
            //     const response = await fetch('/server/api/resident/insert_user.php', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify(allData)
            //     });

            //     const result = await response.json();

            //     if (!result.success) {
            //         console.error('Custom DB insert error:', result.message);
            //         formMessage.style.color = 'red';
            //         formMessage.textContent = 'Signup succeeded in Supabase but failed in custom DB.';
            //         return;
            //     }

            // } catch (err) {
            //     console.error('Custom DB AJAX error:', err);
            //     formMessage.style.color = 'red';
            //     formMessage.textContent = 'Signup succeeded in Supabase but custom DB server failed.';
            //     return;
            // }

            console.log('User created successfully:', data.user);
            formMessage.style.color = 'green';
            formMessage.textContent = 'Application submitted successfully! Please check your email to verify your account.';

        } catch (err) {
            console.error('Unexpected error:', err);
            formMessage.style.color = 'red';
            formMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
    });

}

validation();
