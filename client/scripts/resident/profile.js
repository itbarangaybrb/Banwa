import supabase from '../../../server/api/supabase.js'

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

        if (value === '') {
            input.classList.add('error');
            errorEl.textContent = message;
            return false;
        } else {
            errorEl.textContent = '';
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

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
    // Autofill the Management Account form inputs
    // =========================
    // async function loadUserData() {
    //     try {
    //         const res = await fetch('/Banwa/server/api/resident/get_user.php', {
    //             credentials: 'include'
    //         });
    //         const data = await res.json();

    //         if (data.error) {
    //             console.error(data.error);
    //             return;
    //         }

    //         document.getElementById('firstName').value = data.first_name || '';
    //         document.getElementById('middleName').value = data.middle_name || '';
    //         document.getElementById('lastName').value = data.last_name || '';
    //         document.getElementById('suffix').value = data.suffix || '';
    //         document.getElementById('contactNo').value = data.contact_no || '';
    //         document.getElementById('address').value = data.address || '';

    //         captureOriginalData(); // for cancel functionality

    //     } catch (err) {
    //         console.error('Failed to load user data:', err);
    //     }
    // }

    // Call after validation() has initialized inputs
    // loadUserData();

    // =========================
    // Change Password: Read only the input
    // =========================
    function setChangePassReadonly(state) {
        currentPassword.readOnly = state;
        newPassword.readOnly = state;
        reTypeNewPassword.readOnly = state;
    }

    // =========================
    // Change Password: Show "Save" and "Cancel" after "Edit" click
    // =========================
    function toggleChangePassButtons(mode) {
        const btnEdit = document.getElementById('changePassEditBtn');
        const btnSave = document.getElementById('saveNewPass');
        const btnCancel = document.getElementById('changePassCancelBtn');

        if (mode === "view") {
            btnEdit.style.display = "block";
            btnSave.style.display = "none";
            btnCancel.style.display = "none";
        }

        if (mode === "edit") {
            btnEdit.style.display = "none";
            btnSave.style.display = "block";
            btnCancel.style.display = "block";
        }
    }

    setChangePassReadonly(true);
    toggleChangePassButtons("view");

    // =========================
    // Change Password: Remember the original if "Cancel" click
    // =========================
    let originalPassData = {};

    function captureOriginalPassData() {
        originalPassData = {
            current: currentPassword.value,
            newPass: newPassword.value,
            retype: reTypeNewPassword.value
        };
    }

    // =========================
    // Change Password: Clear validations if "Cancel" click
    // =========================
    function clearChangePassErrors() {
        [currentPassword, newPassword, reTypeNewPassword].forEach(input => {
            input.classList.remove('error');
            input.closest('.label-and-input').querySelector('.error-msg').textContent = "";
        });
    }

    // =========================
    // Change Password: "Edit" click
    // =========================
    document.getElementById('changePassEditBtn').addEventListener('click', (e) => {
        e.preventDefault();
        captureOriginalPassData();
        setChangePassReadonly(false);
        toggleChangePassButtons("edit");
        disablePanelSwitch(true);
    });

    // =========================
    // Change Password: "Cancel" click
    // =========================
    document.getElementById('changePassCancelBtn').addEventListener('click', (e) => {
        e.preventDefault();

        if (
            currentPassword.value === originalPassData.current &&
            newPassword.value === originalPassData.newPass &&
            reTypeNewPassword.value === originalPassData.retype
        ) {
            clearChangePassErrors();
            setChangePassReadonly(true);
            toggleChangePassButtons("view");
            disablePanelSwitch(false);
            return;
        }

        if (confirm("Discard changes?")) {
            currentPassword.value = originalPassData.current;
            newPassword.value = originalPassData.newPass;
            reTypeNewPassword.value = originalPassData.retype;
        }

        clearChangePassErrors();
        setChangePassReadonly(true);
        toggleChangePassButtons("view");
        disablePanelSwitch(false);
    });


    // =========================
    // Change Password: "Save" click
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

                setChangePassReadonly(true);
                toggleChangePassButtons("view");
                captureOriginalPassData();
                disablePanelSwitch(false);

                console.log('Updated user data:', data);

                // TODO: Back-end developer, these are the data to be sent to db.
                // add here if necessary...
            }
        }

    }, { once: true });


    // =========================
    // Manage Account: Read only the input
    // =========================
    function setManageAccReadonly(state) {
        [firstName, middleName, lastName, suffix, contactNo, address].forEach(i => {
            i.readOnly = state;
        });
    }

    // =========================
    // Manage Account: Show "Save" and "Cancel" after "Edit" click
    // =========================
    function toggleManageButtons(mode) {
        const btnEdit = document.getElementById('manageAccEditBtn');
        const btnSave = document.getElementById('saveNewAccDetails');
        const btnCancel = document.getElementById('manageAccCancelBtn');

        if (mode === "view") {
            btnEdit.style.display = "inline-block";
            btnSave.style.display = "none";
            btnCancel.style.display = "none";
        }

        if (mode === "edit") {
            btnEdit.style.display = "none";
            btnSave.style.display = "inline-block";
            btnCancel.style.display = "inline-block";
        }
    }

    setManageAccReadonly(true);
    toggleManageButtons("view");

    // =========================
    // Manage Account: Remember the original if "Cancel" click
    // =========================
    let originalManageData = {};

    function captureOriginalData() {
        originalManageData = {
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            suffix: suffix.value,
            contactNo: contactNo.value,
            address: address.value,
        };
    }

    // =========================
    // Manage Account: Check if there has change
    // =========================
    function hasChanges() {
        return (
            firstName.value !== originalManageData.firstName ||
            middleName.value !== originalManageData.middleName ||
            lastName.value !== originalManageData.lastName ||
            suffix.value !== originalManageData.suffix ||
            contactNo.value !== originalManageData.contactNo ||
            address.value !== originalManageData.address
        );
    }

    // =====================================
    // Manage Account: "Edit" click
    // =====================================
    document.getElementById('manageAccEditBtn').addEventListener('click', (e) => {
        e.preventDefault();

        captureOriginalData();
        setManageAccReadonly(false);
        toggleManageButtons("edit");
        disablePanelSwitch(true);
    });

    // =====================================
    // Manage Account: Clear Validations if "Cancel" click
    // =====================================
    function clearManageAccErrors() {
        const inputs = [firstName, middleName, lastName, suffix, contactNo, address];

        inputs.forEach(input => {
            input.classList.remove('error');
            const wrapper = input.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            errorEl.textContent = '';
        });
    }

    // =====================================
    // Manage Account: "Cancel" click
    // =====================================
    document.getElementById('manageAccCancelBtn').addEventListener('click', (e) => {
        e.preventDefault();

        // If no changes, simply reset UI
        if (!hasChanges()) {
            clearManageAccErrors();
            setManageAccReadonly(true);
            toggleManageButtons("view");
            disablePanelSwitch(false);
            return;
        }

        // If there are changes, confirm discard
        if (confirm("You made changes. Discard them?")) {
            // Restore original values
            firstName.value = originalManageData.firstName;
            middleName.value = originalManageData.middleName;
            lastName.value = originalManageData.lastName;
            suffix.value = originalManageData.suffix;
            contactNo.value = originalManageData.contactNo;
            address.value = originalManageData.address;
        }

        clearManageAccErrors();
        setManageAccReadonly(true);
        toggleManageButtons("view");
        disablePanelSwitch(false);
    });

    // =====================================
    // Manage Account: "Save" click
    // =====================================
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

        if (!validations.every(v => v)) return;

        if (!confirm('Save changes?')) return;

        const manageAccAllData = {
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            suffix: suffix.value,
            contactNo: contactNo.value,
            address: address.value,
        };

        fetch('submit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manageAccAllData)
        })
            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => console.error(err));

        alert('Account details updated.');

        setManageAccReadonly(true);
        captureOriginalData();
        toggleManageButtons("view");
        disablePanelSwitch(false);
    });


    // =========================
    // Change Password Panel Button
    // =========================
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        switchPanel('changePass')
    });

    // =========================
    // Manage Account Panel Button
    // =========================
    document.getElementById('manageAccountBtn').addEventListener('click', () => {
        switchPanel('manageAcc')
    });

    // =========================
    // Disable panesl if "Edit" click
    // =========================
    function disablePanelSwitch(state) {
        const btnChange = document.getElementById('changePasswordBtn');
        const btnManage = document.getElementById('manageAccountBtn');

        btnChange.disabled = state;
        btnManage.disabled = state;

        btnChange.style.pointerEvents = state ? "none" : "auto";
        btnManage.style.pointerEvents = state ? "none" : "auto";
        // =========================
        // Logout button event listener
        // =========================
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                // Confirm with the user before logging out
                if (!confirm("Are you sure you want to log out?")) {
                    return;
                }

                // Call Supabase sign-out
                const { error: supabaseError } = await supabase.auth.signOut();
                if (supabaseError) {
                    console.error("Supabase sign-out error:", supabaseError.message);
                    alert("Failed to log out from Supabase. Please try again.");
                    return;
                }

                // Make a POST request to the server to sign out the user session
                try {
                    const response = await fetch('/Banwa/server/api/resident/signout_user.php', {
                        method: 'POST'
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    // Redirect to the sign-in page after successful logout
                    window.location.href = "/Banwa/client/pages/auth/signin.php";

                } catch (fetchError) {
                    console.error("Server sign-out error:", fetchError);
                    alert("Failed to log out from the server. Please try again.");
                }
            });
        }
    }
}

validation();