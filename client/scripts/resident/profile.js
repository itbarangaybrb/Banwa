import supabase from '../../configs/auth/supabase.js'

// =========================
// Function: Hide/Show Panels
// =========================
function switchPanel(panelId) {
    // =========================
    // Panels elements
    // =========================
    const changePass = document.getElementById('changePass');
    const manageAcc = document.getElementById('manageAcc');

    const panels = [changePass, manageAcc];
    panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== panelId);
    });
}


function validation() {
    // =========================
    // Change password form elements
    // =========================
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const reTypeNewPassword = document.getElementById('reTypeNewPassword');

    // =========================
    // Manage account form elements
    // =========================
    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const lastName = document.getElementById('lastName');
    const suffix = document.getElementById('suffix');
    const contactNo = document.getElementById('contactNo');
    const address = document.getElementById('address');


    // Show panel by default
    switchPanel('changePass');

    // =========================
    // Function: Validate single input
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = input.value.trim();

        // Required check
        if (value === '') {
            input.classList.add('error');
            errorEl.textContent = message;
            return false;
        } else {
            errorEl.textContent = '';
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        // Max length validation
        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        // Passed validation
        input.classList.remove('error');
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Real-time validation of Change Password
    // =========================
    (() => {
        const inputs = [currentPassword, newPassword, reTypeNewPassword];
        const reTypeWrapper = reTypeNewPassword.closest('.label-and-input');
        const reTypeErrorEl = reTypeWrapper.querySelector('.error-msg');

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);

                // New password rules
                if (input === newPassword) {
                    const wrapper = newPassword.closest('.label-and-input');
                    const errorEl = wrapper.querySelector('.error-msg');

                    if (input.value.length < 8 || input.value.length > 16) {
                        input.classList.add('error');
                        errorEl.textContent = 'Password should be 8-16 characters long';
                    } else if (!/[A-Za-z]/.test(input.value) || !/[0-9]/.test(input.value)) {
                        input.classList.add('error');
                        errorEl.textContent = 'Password must contain letters and numbers';
                    } else {
                        input.classList.remove('error');
                        errorEl.textContent = '';
                    }
                }

                // Real-time retype password match
                if (reTypeNewPassword.value && reTypeNewPassword.value !== newPassword.value) {
                    reTypeNewPassword.classList.add('error');
                    reTypeErrorEl.textContent = 'Passwords do not match';
                } else if (reTypeNewPassword.value === newPassword.value) {
                    reTypeNewPassword.classList.remove('error');
                    reTypeErrorEl.textContent = '';
                }

                if (input === currentPassword) {
                    const wrapper = currentPassword.closest('.label-and-input');
                    const errorEl = wrapper.querySelector('.error-msg');

                    if (input.value === '') {
                        input.classList.add('error');
                        errorEl.textContent = 'Current password is required';
                    } else {
                        input.classList.remove('error');
                        errorEl.textContent = '';
                    }
                }
            });
        });
    })();

    // =========================
    // Real-time validation for Manage Account
    // =========================
    (() => {
        const manageInputs = [firstName, middleName, lastName, suffix, contactNo, address];

        manageInputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);

                // Extra validation for contact number
                if (input === contactNo) {
                    const wrapper = contactNo.closest('.label-and-input');
                    const errorEl = wrapper.querySelector('.error-msg');
                    const value = input.value.trim();

                    contactNo.value = value.replace(/[^0-9]/g, '');

                    if (value === '') {
                        contactNo.classList.add('error');
                        errorEl.textContent = 'Contact number is required';
                    } else if (!/^[0-9]+$/.test(value)) {
                        contactNo.classList.add('error');
                        errorEl.textContent = 'Contact number must be numeric';
                    } else if (value.length !== 11) {
                        contactNo.classList.add('error');
                        errorEl.textContent = 'Contact number must be exactly 11 digits';
                    } else {
                        contactNo.classList.remove('error');
                        errorEl.textContent = '';
                    }
                }
            });
        });
    })();


    // =========================
    // Change password "Save"
    // =========================
    document.getElementById('changePassForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const validations = [
            validateInput(currentPassword, 'Current password is required'),
            validateInput(newPassword, 'New password is required'),
            validateInput(reTypeNewPassword, 'Re-type password is required')
        ];

        const newPassWrapper = newPassword.closest('.label-and-input');
        const newPassError = newPassWrapper.querySelector('.error-msg');

        if (newPassword.value.length < 8 || newPassword.value.length > 16) {
            newPassword.classList.add('error');
            newPassError.textContent = 'Password should be 8-16 characters long';
            validations.push(false);
        } else if (!/[A-Za-z]/.test(newPassword.value) || !/[0-9]/.test(newPassword.value)) {
            newPassword.classList.add('error');
            newPassError.textContent = 'Password must contain letters and numbers';
            validations.push(false);
        }

        const reTypeWrapper = reTypeNewPassword.closest('.label-and-input');
        const reTypeError = reTypeWrapper.querySelector('.error-msg');
        if (reTypeNewPassword.value !== newPassword.value) {
            reTypeNewPassword.classList.add('error');
            reTypeError.textContent = 'Passwords do not match';
            validations.push(false);
        }

        if (validations.every(v => v)) {
            if (!confirm('Are you sure you want to change your password?')) return;

            // Update password via Supabase
            const { data, error } = await supabase.auth.updateUser({
                // TODO: Front-end dev will add for current password/email/number
                // still undecided ...
                // i used password only - jep

                password: newPassword.value
            });

            if (error) {
                alert('Failed to update password: ' + error.message);
            } else {
                alert('Password updated successfully!');
                console.log('Updated user data:', data);

                // TODO: Back-end developer, these are the data to be sent to db.
                // add here if necessary...
            }
        }

    });

    // =========================
    // Manage account "Save"
    // =========================
    document.getElementById('mngAccForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const validations = [
            validateInput(firstName, 'First name is required'),
            validateInput(middleName, 'Middle name is required'),
            validateInput(lastName, 'Last name is required'),
            validateInput(suffix, 'Suffix is required'),
            validateInput(contactNo, 'Contact no. is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Contact number must be numeric, max 11 digits'
            }),
            validateInput(address, 'Address is required'),
        ];

        if (validations.every(v => v)) {
            if (confirm('Are you sure you want to submit this application?')) {
                const manageAccAllData = {
                    firstName: firstName.value,
                    middleName: middleName.value,
                    lastName: lastName.value,
                    suffix: suffix.value,
                    contactNo: contactNo.value,
                    address: address.value,
                };

                // TODO: Back-end developer, these are the data to be sent to db.
                // add here if necessary...

                console.log('Final Submission Data:', manageAccAllData);
                alert('Application submitted successfully!');
            }
        }
    });

    // =========================
    // Change Password Panel Button
    // =========================
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        switchPanel('changePass')
    });

    // =========================
    // Change Password Panel Button
    // =========================
    document.getElementById('manageAccountBtn').addEventListener('click', () => {
        switchPanel('manageAcc')
    });
}

validation();