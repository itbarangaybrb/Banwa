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
            errorEl.classList.add('show');
            errorEl.textContent = message;
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            errorEl.classList.add('error');
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            errorEl.classList.add('show');
            return false;
        }

        if (rules.minLength && value.length < rules.minLength) {
            input.classList.add('error');
            errorEl.textContent = `Minimum ${rules.minLength} characters required`;
            errorEl.classList.add('show');

            return false;
        }

        input.classList.remove('error');
        errorEl.classList.add('show');
        errorEl.textContent = '';
        return true;
    }

    // Validate a radio group
    function validateRadioGroup(radios, message) {
        const anyChecked = Array.from(radios).some(r => r.checked);

        // Find wrapper for first radio to show error
        const wrapper = radios[0]?.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');

        if (!anyChecked) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            return false;
        }

        errorEl.textContent = '';
        errorEl.classList.add('show');
        return true;
    }

    // Validate file input
    function validateFileInput(input, message = 'File is required') {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');

        if (!input.files || input.files.length === 0) {
            errorEl.textContent = message;
            input.classList.add('error');
            errorEl.classList.add('show');

            return false;
        }

        errorEl.textContent = '';
        errorEl.classList.remove('show');
        input.classList.remove('error');
        return true;
    }


    function checkPasswordMatch() {
        const wrapper = reTypePassword.closest('.label-and-input');
        const errorEl = wrapper?.querySelector('.error-msg');
        const value = reTypePassword.value.trim();

        if (value === '') {
            reTypePassword.classList.add('error');
            errorEl.textContent = 'Please re-type your password';
            errorEl.classList.add('show');
            return false;
        }

        if (value !== password.value) {
            reTypePassword.classList.add('error');
            errorEl.textContent = 'Passwords do not match';
            errorEl.classList.add('show');
            return false;
        }

        reTypePassword.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
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
            errorEl.classList.add('show');
            errorEl.textContent = 'Phone number is required';
        } else if (value.length < 11) {
            contactNo.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Phone number must be 11 digits';
        } else if (value.length > 11) {
            contactNo.classList.add('error');
            errorEl.classList.add('show');
            errorEl.textContent = 'Phone number must be 11 digits only';
        } else {
            contactNo.classList.remove('error');
            errorEl.classList.remove('show');
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
            errorEl.classList.add('show');
        } else if (!emailPattern.test(value)) {
            email.classList.add('error');
            errorEl.textContent = 'Enter a valid email address';
            errorEl.classList.add('show');
        } else {
            email.classList.remove('error');
            errorEl.textContent = '';
            errorEl.classList.remove('show');
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
            errorEl.textContent = 'Password is required';
            errorEl.classList.add('show');
            return false;
        }

        if (value.length < 8 || value.length > 16) {
            password.classList.add('error');
            errorEl.textContent = 'Password should be 8-16 characters long';
            errorEl.classList.add('show');
            return false;
        }

        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            password.classList.add('error');
            errorEl.textContent = 'Password must contain letters and numbers';
            errorEl.classList.add('show');
            return false;
        }

        password.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        return true;
    }

    // =========================
    // Real-time validation setup (single IIFE)
    // =========================
    (() => {
        const inputs = [firstName, lastName, sex, contactNo, address, email, password, reTypePassword, agreeCheckBox, idFile];

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
            // validateInput(middleName, 'Middle name is required'),
            validateInput(lastName, 'Last name is required'),
            // validateInput(suffix, 'Suffix is required'),
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
            // validateInput(contactNo, 'Phone number is required', { pattern: /^[0-9]{11}$/, maxLength: 11 }),
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
            // =========================
            // Supabase Signup
            // =========================
            const { data, error } = await supabase.auth.signUp({
                email: allData.email,
                password: allData.password,
                options: {
                    data: {
                        fullname: allData.fullname,
                        sex: allData.sex,
                        contactNo: allData.contactNo,
                        address: allData.address,
                        idType: allData.idType,
                        email: allData.email,
                        agreeCheckBox: allData.agreeCheckBox
                    },
                    emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/signin.php",
                },
            });

            if (error) throw error;

            const supabaseUserId = data.user.id;

            // =========================
            // Insert into Custom DB
            // =========================
            const response = await fetch('/Banwa/server/api/resident/signup_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...allData, user_id: supabaseUserId })
            });

            const result = await response.json();

            if (!result.success) {
                formMessage.style.color = 'red';
                // I will change this later -jep
                // This is only a test
                formMessage.textContent = result.message;
                return;
            }

            // Success
            formMessage.style.color = 'green';
            formMessage.textContent = 'Application submitted successfully! Please check your email to verify your account.';
            console.log('User created successfully:', data.user);

        } catch (err) {
            console.error('Error during signup:', err);
            formMessage.style.color = 'red';
            formMessage.textContent = 'An error occurred. ' + (err.message || err);
        }
    });

}

validation();
