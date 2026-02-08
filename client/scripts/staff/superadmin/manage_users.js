import supabase from "../../../../server/api/supabase.js";

function hideModal(modal) {
    modal.classList.remove('active');
}

function showModal(modal) {
    modal.classList.add('active');
}

// create account modal
const createModal = document.getElementById('createModal');
const createBtn = document.getElementById('createBtn');
const cancelBtn = document.getElementById('cancelBtn');

createBtn.addEventListener('click', () => {
    showModal(createModal);
});

cancelBtn.addEventListener('click', () => {
    hideModal(createModal);
});


/**
 * Fetches all user data from the server and populates the users table
 * Only retrieves and displays data; does not autofill any form fields
 */
document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('usersTableBody');

    try {
        const resp = await fetch('/Banwa/server/api/staff/superadmin/get_user_all.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        const users = await resp.json();

        // Clear table first
        tbody.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">No users found</td></tr>`;
            return;
        }

        // Loop through each user and append a row
        users.forEach(user => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.role_id}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch user data for autofill:', err);
        tbody.innerHTML = `<tr><td colspan="5">Error loading users</td></tr>`;
    }
});


const fe = {
    role: document.getElementById('role'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    retypePassword: document.getElementById('retypePassword'),
    formMessage: document.getElementById('formMessage'),
    createForm: document.getElementById('createForm')
}

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

    return {
        email: validateEmail,
        password: validatePassword,
        matchPassword: validatePasswordMatches,
        select: validateSelect,
        clear: clearError
    };
})();

const validationConfig = [
    { el: fe.role, type: 'select', message: 'Please select role' },
    { el: fe.email, type: 'email', message: 'Please enter email address' },
    { el: fe.password, type: 'password', message: 'Please enter password' },
    { el: fe.retypePassword, type: 'password', message: 'Please enter re-type password' },
];

function validateField(config) {
    if (!config || !config.el) return false;

    const { el, type, message } = config;

    switch (type) {
        case 'email': return validator.email(el, message);
        case 'select': return validator.select(el, message);
        case 'password': return validator.password(el, message);
        default: return false;
    }
}

function realtimeValidation() {
    validationConfig.forEach(config => {
        const { el } = config;
        if (!el) return;
        const targets = [el];
        targets.forEach(target => {
            target.addEventListener('blur', () => validateField(config));
            target.addEventListener('input', () => validator.clear(target));
        });
    });

    fe.retypePassword?.addEventListener('blur', () => validator.matchPassword(fe.password, fe.retypePassword));
    fe.retypePassword?.addEventListener('input', () => validator.clear(fe.retypePassword));
}

function validateStep(fields) {
    return fields.map(f => validateField(validationConfig.find(c => c.el === f))).every(v => v);
}

let isSubmitting = false;

function registration() {
    fe.formMessage.style.display = 'none';

    fe.createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        fe.formMessage.textContent = '';

        const fields = [
            fe.role,
            fe.email,
            fe.password,
            fe.retypePassword
        ];

        if (!validateStep(fields) ||
            !validator.matchPassword(fe.password, fe.retypePassword)) {
            isSubmitting = false;
            return;
        }

        if (!confirm('Are you sure you want to register this account?')) {
            isSubmitting = false;
            return;
        }

        const ad = {
            role: fe.role.value,
            email: fe.email.value,
            password: fe.password.value
        };

        try {
            const respCheck = await fetch(
                '/Banwa/server/api/shared/check_email.php',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: ad.email })
                }
            );

            const dbCheck = await respCheck.json();
            if (dbCheck.exists) {
                fe.formMessage.style.display = 'block';
                fe.formMessage.style.color = 'red';
                fe.formMessage.textContent =
                    'An account with this email already exists.';
                return;
            }

            const { error } = await supabase.auth.signUp({
                email: ad.email,
                password: ad.password,
                options: {
                    data: { role: ad.role },
                    emailRedirectTo:
                        "http://localhost:8080/Banwa/client/pages/auth/confirm_verification.php"
                }
            });

            if (error) {
                fe.formMessage.style.display = 'block';
                fe.formMessage.style.color = 'red';
                fe.formMessage.textContent = error.message;
                return;
            }

            fe.formMessage.style.display = 'block';
            fe.formMessage.style.color = 'green';
            fe.formMessage.innerHTML = `
                Account created successfully.<br>
                Please verify your email to activate the account.
            `;

        } catch (err) {
            fe.formMessage.style.display = 'block';
            fe.formMessage.style.color = 'red';
            fe.formMessage.textContent =
                'An error occurred. ' + (err.message || err);
        } finally {
            isSubmitting = false;
        }
    });
}

function initialize() {
    realtimeValidation();
    registration();
}

document.addEventListener('DOMContentLoaded', initialize);