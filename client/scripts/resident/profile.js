import supabase from '../../../server/api/supabase.js'


function validation() {
    // =========================
    // Change password form elements
    // =========================
    // Panel switch helper (used by other resident scripts) - map logical ids to actual DOM ids
    function switchPanel(panelId) {
        const mapping = {
            changePass: 'changePasswordForm',
            manageAcc: 'manageAccountForm'
        };
        const targetId = mapping[panelId] || panelId;
        const panels = Array.from(document.querySelectorAll('.form-card'));
        panels.forEach(p => {
            if (p.id === targetId) p.classList.add('active');
            else p.classList.remove('active');
        });
        window.scrollTo(0, 0);
    }
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
    function getWrapper(el) {
        if (!el) return null;
        return el.closest('.label-and-input') || el.closest('.form-group') || el.closest('.input-with-icon') || el.parentElement || null;
    }

    function getErrorElFrom(el) {
        const wrapper = getWrapper(el);
        if (!wrapper) return null;
        return wrapper.querySelector('.error-msg');
    }

    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = getWrapper(input);
        const errorEl = getErrorElFrom(input);
        const value = (input && input.value) ? input.value.trim() : '';

        if (value === '') {
            if (input) input.classList.add('error');
            if (errorEl) errorEl.textContent = message;
            return false;
        } else {
            if (errorEl) errorEl.textContent = '';
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

        if (input) input.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
        return true;
    }

    // =========================
    // Real-time validation of Change Password
    // =========================
    (() => {
        const inputs = [currentPassword, newPassword, reTypeNewPassword];
        const reTypeWrapper = getWrapper(reTypeNewPassword);
        const reTypeErrorEl = getErrorElFrom(reTypeNewPassword);

        inputs.filter(Boolean).forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);

                // New password rules
                if (input === newPassword) {
                    const wrapper = getWrapper(newPassword);
                    const errorEl = getErrorElFrom(newPassword);

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
                    const wrapper = getWrapper(currentPassword);
                    const errorEl = getErrorElFrom(currentPassword);

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

        manageInputs.filter(Boolean).forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);

                // Extra validation for contact number
                if (input === contactNo) {
                    const wrapper = getWrapper(contactNo);
                    const errorEl = getErrorElFrom(contactNo);
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

    // Injected: working loadUserData and application summary functions
    async function loadUserData() {
        try {
            const res = await fetch('/Banwa/server/api/resident/get_user.php', { credentials: 'include' });
            const data = await res.json();
            if (data.error) { console.error(data.error); return; }

            firstName.value = data.first_name || '';
            middleName.value = data.middle_name || '';
            lastName.value = data.last_name || '';
            suffix.value = data.suffix || '';
            contactNo.value = data.contact_no || '';
            address.value = data.address || '';
            const emailEl = document.getElementById('email');
            if (emailEl) emailEl.value = data.email || '';

            const avatar = document.getElementById('profileAvatar');
            // Update visible full name in profile header (prefer separate fields, fallback to full_name)
            const fullNameEl = document.getElementById('userFullName');
            let full = '';
            const parts = [data.first_name, data.middle_name, data.last_name].filter(Boolean);
            if (parts.length) full = parts.join(' ').trim();
            else if (data.full_name) full = (data.full_name || '').trim();

            if (fullNameEl) fullNameEl.textContent = full || fullNameEl.textContent;

            // Member since
            const memberSinceEl = document.getElementById('memberSince');
            if (memberSinceEl) {
                if (data.member_since) memberSinceEl.textContent = data.member_since;
            }

            if (avatar) {
                // derive two-letter initials: prefer First + Last, else first two letters of first, else fallback from full_name
                function getInitialsFromParts(first, middle, last, fullNameFallback) {
                    if (first && last) return (first[0] + last[0]).toUpperCase();
                    if (first && first.length >= 2) return first.slice(0,2).toUpperCase();
                    if (fullNameFallback) {
                        const toks = fullNameFallback.split(/\s+/).filter(Boolean);
                        if (toks.length >= 2) return (toks[0][0] + toks[1][0]).toUpperCase();
                        if (toks.length === 1 && toks[0].length >= 2) return toks[0].slice(0,2).toUpperCase();
                    }
                    return 'U';
                }

                const initials = getInitialsFromParts(data.first_name, data.middle_name, data.last_name, data.full_name);
                avatar.textContent = initials;

                // compute color hash for background based on the visible full name or fallback
                try {
                    const nameForColor = full || data.full_name || data.first_name || data.last_name || 'User';
                    let hash = 0;
                    for (let i = 0; i < nameForColor.length; i++) hash = nameForColor.charCodeAt(i) + ((hash << 5) - hash);
                    const hue = Math.abs(hash) % 360;
                    const bg = `hsl(${hue} 70% 45%)`;
                    avatar.style.background = bg;
                    avatar.classList.add('colored', 'avatar-animated');
                    // ensure text contrast: light text for dark bg
                    avatar.style.color = '#ffffff';
                    // remove animation class after it ends
                    setTimeout(() => avatar.classList.remove('avatar-animated'), 500);
                } catch (e) { console.warn('avatar color calc failed', e); }
            }

            captureOriginalData();
        } catch (err) { console.error('Failed to load user data:', err); }
    }

    async function loadApplicationSummary() {
        try {
            const res = await fetch('/Banwa/server/api/resident/get_applications.php', { credentials: 'include' });
            const json = await res.json();
            if (json.error) return;
            const apps = json.applications || [];
            const total = apps.length;
            const approved = apps.filter(a => a.status && a.status.toLowerCase() === 'approved').length;
            const pending = apps.filter(a => a.status && ['pending','in progress','new'].includes(a.status.toLowerCase())).length;
            const rejected = apps.filter(a => a.status && a.status.toLowerCase() === 'rejected').length;

            const elTotal = document.querySelector('.stat-item[data-key="applications"] .stat-number');
            const elApproved = document.querySelector('.stat-item[data-key="approved"] .stat-number');
            const elPending = document.querySelector('.stat-item[data-key="pending"] .stat-number');
            const elRejected = document.querySelector('.stat-item[data-key="rejected"] .stat-number');
            if (elTotal) elTotal.textContent = total;
            if (elApproved) elApproved.textContent = approved;
            if (elPending) elPending.textContent = pending;
            if (elRejected) elRejected.textContent = rejected;
        } catch (err) { console.error('Failed to load applications summary', err); }
    }

    // Run after init
    loadUserData();
    loadApplicationSummary();

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
            if (btnSave) btnSave.disabled = true;
            btnCancel.style.display = "none";
            if (btnCancel) btnCancel.disabled = true;
        }

        if (mode === "edit") {
            btnEdit.style.display = "none";
            btnSave.style.display = "block";
            if (btnSave) btnSave.disabled = false;
            btnCancel.style.display = "block";
            if (btnCancel) btnCancel.disabled = false;
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
            if (!input) return;
            input.classList.remove('error');
            const err = getErrorElFrom(input);
            if (err) err.textContent = "";
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

        const newPassWrapper = getWrapper(newPassword);
        const newPassError = getErrorElFrom(newPassword);

        if (newPassword.value.length < 8 || newPassword.value.length > 16) {
            newPassword.classList.add('error');
            newPassError.textContent = 'Password should be 8-16 characters long';
            validations.push(false);
        } else if (!/[A-Za-z]/.test(newPassword.value) || !/[0-9]/.test(newPassword.value)) {
            newPassword.classList.add('error');
            newPassError.textContent = 'Password must contain letters and numbers';
            validations.push(false);
        }

        const reTypeWrapper = getWrapper(reTypeNewPassword);
        const reTypeError = getErrorElFrom(reTypeNewPassword);
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
            if (btnSave) btnSave.disabled = true;
            btnCancel.style.display = "none";
            if (btnCancel) btnCancel.disabled = true;
        }

        if (mode === "edit") {
            btnEdit.style.display = "none";
            btnSave.style.display = "inline-block";
            if (btnSave) btnSave.disabled = false;
            btnCancel.style.display = "inline-block";
            if (btnCancel) btnCancel.disabled = false;
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
            if (!input) return;
            input.classList.remove('error');
            const errorEl = getErrorElFrom(input);
            if (errorEl) errorEl.textContent = '';
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

        (async () => {
            try {
                const resp = await fetch('/Banwa/server/api/resident/update_user.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(manageAccAllData)
                });
                const json = await resp.json();
                if (json.success) {
                    const saveBtn = document.getElementById('saveNewAccDetails');
                    saveBtn.textContent = 'Saved';
                    setTimeout(() => saveBtn.textContent = 'Save Changes', 1500);
                    setManageAccReadonly(true);
                    captureOriginalData();
                    toggleManageButtons("view");
                    disablePanelSwitch(false);
                    // refresh overview if needed
                    loadApplicationSummary();
                } else {
                    alert('Failed to save: ' + (json.error || 'Unknown'));
                }
            } catch (err) {
                console.error(err);
                alert('Failed to save account details.');
            }
        })();
    });


    // =========================
    // Change Password Panel Button
    // =========================
    const changePasswordBtnEl = document.getElementById('changePasswordBtn');
    if (changePasswordBtnEl) changePasswordBtnEl.addEventListener('click', () => switchPanel('changePass'));

    // =========================
    // Manage Account Panel Button
    // =========================
    const manageAccountBtnEl = document.getElementById('manageAccountBtn');
    if (manageAccountBtnEl) manageAccountBtnEl.addEventListener('click', () => switchPanel('manageAcc'));

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
                    const response = await fetch('/Banwa/server/api/shared/signout_user.php', {
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