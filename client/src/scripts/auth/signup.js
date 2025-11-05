// Helper: hide all panels and show only the requested one (use .visible class)
function showOnly(panelId) {
    const panels = ['signupForm', 'verificationPanel', 'createAccountPanel', 'idVerificationPanel', 'personalDetailsPanel'];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('visible', id === panelId);
    });
}

// Switch from signup form to verification panel (validates first)
function showVerification() {
    const mobile = document.getElementById('mobile');
    const agree = document.getElementById('agree');
    if (!mobile.checkValidity()) { mobile.reportValidity(); return; }
    if (!agree.checked) { agree.focus(); return; }
    showOnly('verificationPanel');
    // hide the small sub-header when on verification panel
    const sub = document.querySelector('.sub-header');
    if (sub) sub.style.display = 'none';
    setTimeout(() => { const first = document.querySelectorAll('#codeInputs input')[0]; if (first) first.focus(); }, 50);
}

function showSignup() {
    // show only signup and reset verification inputs
    showOnly('signupForm');
    document.querySelectorAll('#codeInputs input').forEach(i => i.value = '');
    // restore the sub-header on signup
    const sub2 = document.querySelector('.sub-header');
    if (sub2) sub2.style.display = '';
    setTimeout(() => { const m = document.getElementById('mobile'); if (m) m.focus(); }, 50);
}

// wire up code input behavior and confirm button
(function () {
    const inputs = () => Array.from(document.querySelectorAll('#codeInputs input'));
    const confirmBtn = document.getElementById('confirmBtn');
    if (!confirmBtn) return; // nothing to wire if panel not added

    function updateConfirm() {
        const filled = inputs().every(i => i.value.trim() !== '');
        confirmBtn.disabled = !filled;
        confirmBtn.style.opacity = filled ? '1' : '0.7';
    }

    // delegate events since inputs may be hidden initially
    document.addEventListener('input', (e) => {
        if (e.target.matches('#codeInputs input')) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
            const all = inputs();
            const idx = all.indexOf(e.target);
            if (e.target.value && idx < all.length - 1) all[idx + 1].focus();
            updateConfirm();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!e.target.matches('#codeInputs input')) return;
        const all = inputs();
        const idx = all.indexOf(e.target);
        if (e.key === 'Backspace' && !e.target.value && idx > 0) { all[idx - 1].focus(); }
        if (e.key === 'ArrowLeft' && idx > 0) { all[idx - 1].focus(); }
        if (e.key === 'ArrowRight' && idx < all.length - 1) { all[idx + 1].focus(); }
    });

    confirmBtn.addEventListener('click', () => {
        if (confirmBtn.disabled) return;
        const code = inputs().map(i => i.value).join('');
        // For now we'll treat any 6-digit code as valid and proceed to Create Account panel
        if (inputs().length === 6 && code.length === 6) {
            showCreateAccount();
        } else {
            alert('Please enter the 6-digit verification code');
        }
    });

    // initialize state
    updateConfirm();
})();

function showCreateAccount() {
    showOnly('createAccountPanel');
    setTimeout(() => { const u = document.getElementById('username'); if (u) u.focus(); }, 50);
}

function showIDPanel() {
    showOnly('idVerificationPanel');
    setTimeout(() => { const f = document.getElementById('idFile'); if (f) f.focus(); }, 50);
}

// handle ID panel next
// document.addEventListener('DOMContentLoaded', () => {
//     const idNext = document.getElementById('idNextBtn');
//     if (!idNext) return;
//     idNext.addEventListener('click', () => {
//         const chosen = document.querySelector('input[name="idtype"]:checked');
//         const file = document.getElementById('idFile');
//         if (!chosen) { alert('Please select an ID type'); return; }
//         if (!file.files || file.files.length === 0) { alert('Please upload a proof of identification'); file.focus(); return; }
//         // proceed to personal details step
//         showPersonalDetails();
//     });
// });

document.addEventListener('DOMContentLoaded', () => {
    const idNext = document.getElementById('idNextBtn');
    const idFile = document.getElementById('idFile');
    const idErrorType = document.getElementById('idTypeErr');
    const idErrorFile = document.getElementById('idFileErr');
    const idRadios = document.querySelectorAll('input[name="idtype"]');

    if (!idNext) return;

    idRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (idErrorType && document.querySelector('input[name="idtype"]:checked')) {
                idErrorType.textContent = '';
            }
        });
    });

    idFile.addEventListener('change', () => {
        if (idErrorFile && idFile.files.length > 0) {
            idErrorFile.textContent = '';
        }
    });

    idNext.addEventListener('click', () => {
        const chosen = document.querySelector('input[name="idtype"]:checked');

        // Clear previous errors
        if (idErrorType) idErrorType.textContent = '';
        if (idErrorFile) idErrorFile.textContent = '';

        let isValid = true;

        // Validate ID type selection
        if (!chosen) {
            if (idErrorType) idErrorType.textContent = 'Please select an ID type';
            isValid = false;
        }

        // Validate file upload
        if (!idFile.files || idFile.files.length === 0) {
            if (idErrorFile) idErrorFile.textContent = 'Please upload a proof of identification';
            isValid = false;
        }

        if (!isValid) return;

        // Proceed to personal details step
        showPersonalDetails();
    });
});


// add scroll shadow handlers for all panel-scrollable elements
document.addEventListener('DOMContentLoaded', () => {
    const scrollables = Array.from(document.querySelectorAll('.panel-scrollable'));
    function updateShadows(el) {
        if (!el) return;
        const top = el.scrollTop > 4;
        const bottom = (el.scrollHeight - el.clientHeight - el.scrollTop) > 4;
        el.classList.toggle('shadow-top', top);
        el.classList.toggle('shadow-bottom', bottom);
    }
    scrollables.forEach(el => {
        // initialize when visible
        el.addEventListener('scroll', () => updateShadows(el));
        // also update after transitions: when element becomes visible, ensure shadows correct
        const obs = new MutationObserver(() => updateShadows(el));
        obs.observe(el, { attributes: true, attributeFilter: ['class'] });
        // initial call
        updateShadows(el);
    });
});

// handle create account next button (basic client-side validation)
// document.addEventListener('DOMContentLoaded', () => {
//     const createNext = document.getElementById('createNextBtn');
//     if (!createNext) return;
//     createNext.addEventListener('click', () => {
//         const user = document.getElementById('username');
//         const pass = document.getElementById('password');
//         const confirm = document.getElementById('confirmPassword');
//         if (!user.value.trim()) { user.focus(); return; }
//         if (pass.value.length < 8 || pass.value.length > 16) { alert('Password must be 8-16 characters'); pass.focus(); return; }
//         if (!/[A-Za-z]/.test(pass.value) || !/[0-9]/.test(pass.value)) { alert('Password must contain letters and numbers'); pass.focus(); return; }
//         if (pass.value !== confirm.value) { alert('Passwords do not match'); confirm.focus(); return; }
//         // proceed to ID selection panel
//         showIDPanel();
//     });
// });

document.addEventListener('DOMContentLoaded', () => {
    const createNextBtn = document.getElementById('createNextBtn');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (!createNextBtn) return;

    function validateInput(input, message) {
        const errorEl = input.parentElement.querySelector('.err-msg');
        if (!input.value.trim()) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = message;
            return false;
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.textContent = '';
            return true;
        }
    }

    // Real-time validation for all fields
    [username, password, confirmPassword].forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input, 'This field is required');

            // Real-time password rules
            if (input === password && input.value) {
                const errorEl = input.parentElement.querySelector('.err-msg');
                if (input.value.length < 8 || input.value.length > 16) {
                    input.classList.add('error');
                    if (errorEl) errorEl.textContent = 'Password should be 8-16 characters long';
                } else if (!/[A-Za-z]/.test(input.value) || !/[0-9]/.test(input.value)) {
                    input.classList.add('error');
                    if (errorEl) errorEl.textContent = 'Password must contain letters and numbers';
                } else {
                    input.classList.remove('error');
                    if (errorEl) errorEl.textContent = '';
                }
            }

            // Real-time confirm password match
            if (input === confirmPassword || input === password) {
                const errorEl = confirmPassword.parentElement.querySelector('.err-msg');
                if (confirmPassword.value && confirmPassword.value !== password.value) {
                    confirmPassword.classList.add('error');
                    if (errorEl) errorEl.textContent = 'Passwords do not match';
                } else if (confirmPassword.value === password.value) {
                    confirmPassword.classList.remove('error');
                    if (errorEl) errorEl.textContent = '';
                }
            }
        });
    });

    createNextBtn.addEventListener('click', () => {
        const usernameValid = validateInput(username, 'Username is required');
        const passwordValid = validateInput(password, 'Password is required');
        const confirmPasswordValid = validateInput(confirmPassword, 'Please confirm your password');

        let isValid = usernameValid && passwordValid && confirmPasswordValid;

        // Check password rules
        if (password.value) {
            if (password.value.length < 8 || password.value.length > 16) {
                const errorEl = password.parentElement.querySelector('.err-msg');
                password.classList.add('error');
                if (errorEl) errorEl.textContent = 'Password should be 8-16 characters long';
                isValid = false;
            } else if (!/[A-Za-z]/.test(password.value) || !/[0-9]/.test(password.value)) {
                const errorEl = password.parentElement.querySelector('.err-msg');
                password.classList.add('error');
                if (errorEl) errorEl.textContent = 'Password must contain letters and numbers';
                isValid = false;
            } else {
                const errorEl = password.parentElement.querySelector('.err-msg');
                password.classList.remove('error');
                if (errorEl) errorEl.textContent = '';
            }
        }

        // Check password match
        if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
            const errorEl = confirmPassword.parentElement.querySelector('.err-msg');
            confirmPassword.classList.add('error');
            if (errorEl) errorEl.textContent = 'Passwords do not match';
            isValid = false;
        }

        if (!isValid) return;

        // All valid: proceed
        showIDPanel();
    });
});


// show personal details panel (final step)
function showPersonalDetails() {
    showOnly('personalDetailsPanel');
    setTimeout(() => { const f = document.getElementById('firstName'); if (f) f.focus(); }, 50);
}



// wire personal details form submit
document.addEventListener('DOMContentLoaded', () => {
    // const personalForm = document.getElementById('personalDetailsForm');
    // if(!personalForm) return;
    // personalForm.addEventListener('submit', (e)=>{
    //     e.preventDefault();
    //     // basic validation
    //     const first = document.getElementById('firstName');
    //     const last = document.getElementById('lastName');
    //     const sex = document.getElementById('sex');
    //     if(!first.value.trim()){ first.focus(); return; }
    //     if(!last.value.trim()){ last.focus(); return; }
    //     if(!sex.value){ sex.focus(); return; }
    //     // All good for now — replace with server upload/submit
    //     alert('Registration submitted.\nName: ' + first.value + ' ' + (document.getElementById('middleName').value||'') + ' ' + last.value + '\nID submitted previously.');
    //     // Optionally redirect to login page
    //     // location.href = 'loginform.html';
    // });


    const personalDetailsForm = document.getElementById('personalDetailsForm');
    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const lastName = document.getElementById('lastName');
    const sex = document.getElementById('sex');
    const address = document.getElementById('address');

    // Helper function for validation
    function validateInput(input, message = 'This field is required') {
        const errorEl = input.parentElement.querySelector('.err-msg');
        if (input.value.trim() === '' || input.value === 'select') {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = message;
            return false;
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.textContent = '';
            return true;
        }
    }

    // Real-time validation
    [firstName, middleName, lastName, suffix, sex, address].forEach((input) => {
        input.addEventListener('input', () => validateInput(input));
    });

    // Form submission
    personalDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstValid = validateInput(firstName, 'First name is required');
        const middleValid = validateInput(middleName, 'Middle name is required');
        const lastValid = validateInput(lastName, 'Last name is required');
        const sexValid = validateInput(sex, 'Please select your sex');
        const addressValid = validateInput(address, 'Address is required');
        const isValid = firstValid && middleValid && lastValid && sexValid && addressValid;

        if (!isValid) return;

        // Success
        console.log('signup success:', {
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            sex: sex.value,
            address: address.value
        });

        window.location.href = '/client/src/pages/auth/signin.php';
    });
});
