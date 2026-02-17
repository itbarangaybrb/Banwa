import supabase from "../../../../server/api/supabase.js";

/**
 * Handles opening and closing of modals
 * @param {Event} e - Click event
 */
document.addEventListener('click', (e) => {
    const modalId = e.target.dataset.modal;
    if (modalId) document.getElementById(modalId)?.classList.add('active');

    if (e.target.classList.contains('cancel-btn')) {
        const modal = e.target.closest('.modal');
        modal?.classList.remove('active');

        const form = modal?.querySelector('form');
        if (form) {
            form.reset();

            // Clear validation states
            form.querySelectorAll('input, select, textarea').forEach(input => {
                validator.clear(input);
            });
        }
    }

});

/**
 * Fetches all users and populates the table
 * Does not autofill form fields
 */
let isRefreshing = false;
setInterval(() => {
    if (isRefreshing) return;

    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    fetchUsers().finally(finish); // call your existing fetch function

}, 5000);

async function fetchUsers() {
    const tbody = document.getElementById('usersTableBody');

    try {
        const resp = await fetch('/Banwa/server/api/staff/superadmin/get_user_all.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        const users = await resp.json();
        tbody.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No users found</td></tr>`;
            return;
        }

        // Filter out archived users
        const activeUsers = users.filter(user => !user.is_archived);

        if (activeUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No users found</td></tr>`;
            return;
        }

        activeUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>lorem ipsum</td>
                <td>${user.role_id}</td>
                <td>
                    <div class="action-buttons">
                        <button class="buttons edit-btn"
                                data-modal="editModal"
                                data-id="${user.user_id}"
                                data-fullname="${user.full_name}"
                                data-email="${user.email}"
                                data-role="${user.role_id}">
                            Edit
                        </button>
                        <button class="buttons delete-btn"
                                data-id="${user.user_id}">
                            Archive
                        </button>
                        <button class="buttons suspend-btn">Suspend</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch users:', err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading users</td></tr>`;
    }
};

document.addEventListener('DOMContentLoaded', fetchUsers);

/**
 * Handles edit button click to populate edit form
 * @param {Event} e - Click event
 */
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('edit-btn')) return;

    const btn = e.target;

    document.getElementById('editModal').classList.add('active');

    const form = document.getElementById('editForm');

    form.querySelector('[name="editFullName"]').value = btn.dataset.fullname || '';
    form.querySelector('[name="editEmail"]').value = btn.dataset.email || '';
    form.querySelector('[name="editRole"]').value = btn.dataset.role || '';

    form.dataset.userId = btn.dataset.id;
});


/**
 * Validator for form input fields
 * Provides text, email, password, select, and matchPassword validation
 */
const validator = (() => {
    function getWrapper(el) { return el.closest('.label-and-input'); }
    function getErrorEl(el) { return getWrapper(el)?.querySelector('.error-msg'); }
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
        if (!passwordInput || !reTypeInput) return true;
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
        text: validateText,
        email: validateEmail,
        password: validatePassword,
        matchPassword: validatePasswordMatches,
        select: validateSelect,
        clear: clearError
    };
})();

/**
 * Generates validation configuration for a form
 * @param {HTMLFormElement} form - Form element
 * @returns {Array} Validation configuration array
 */
function createValidationConfig(form) {
    const config = [];
    form.querySelectorAll('.label-and-input').forEach(wrapper => {
        const input = wrapper.querySelector('input, select, textarea');
        if (!input) return;

        const name = input.name;
        switch (name) {
            // Create form fields
            case 'fullName':
                config.push({ el: input, type: 'text', message: 'Please enter full name' });
                break;
            case 'role':
                config.push({ el: input, type: 'select', message: 'Please select role' });
                break;
            case 'email':
                config.push({ el: input, type: 'email', message: 'Please enter email address' });
                break;
            case 'password':
                config.push({ el: input, type: 'password', message: 'Please enter password' });
                break;
            case 'retypePassword':
                config.push({ el: input, type: 'password', message: 'Please re-type password' });
                break;

            // Edit form fields
            case 'editFullName':
                config.push({ el: input, type: 'text', message: 'Please enter full name' });
                break;
            case 'editEmail':
                config.push({ el: input, type: 'email', message: 'Please enter email address' });
                break;
            case 'editRole':
                config.push({ el: input, type: 'select', message: 'Please select role' });
                break;

            default:
                break;
        }
    });
    return config;
}

/**
 * Validates a single field based on its configuration
 * @param {Object} config - Validation configuration object
 * @returns {boolean} True if valid, false otherwise
 */
function validateField(config) {
    if (!config || !config.el) return false;
    const { el, type, message } = config;
    switch (type) {
        case 'text': return validator.text(el, message);
        case 'email': return validator.email(el, message);
        case 'select': return validator.select(el, message);
        case 'password': return validator.password(el, message);
        default: return true;
    }
}

/**
 * Validates all fields in a step
 * @param {Array} fields - Array of input elements
 * @param {Array} config - Validation configuration array
 * @returns {boolean} True if all fields are valid
 */
function validateStep(fields, config) {
    return fields.map(f => validateField(config.find(c => c.el === f))).every(v => v);
}

/**
 * Adds real-time validation event listeners to fields
 * @param {Array} config - Validation configuration array
 */
function realtimeValidation(config) {
    config.forEach(({ el }) => {
        if (!el) return;
        el.addEventListener('blur', () => validateField(config.find(c => c.el === el)));
        el.addEventListener('input', () => validator.clear(el));
    });

    const password = config.find(c => c.el.name === 'password')?.el;
    const retype = config.find(c => c.el.name === 'retypePassword')?.el;

    if (password && retype) {
        retype.addEventListener('blur', () => validator.matchPassword(password, retype));
        retype.addEventListener('input', () => validator.clear(retype));
    }
}

/**
 * Initializes a form with validation and submit handling
 * @param {HTMLFormElement} form - Form element
 * @param {Function} submitCallback - Callback to handle form submission
 */
function initializeForm(form, submitCallback) {
    const config = createValidationConfig(form);
    realtimeValidation(config);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fields = config.map(c => c.el);

        let valid = validateStep(fields, config);

        const password = config.find(c => c.el.name === 'password')?.el;
        const retype = config.find(c => c.el.name === 'retypePassword')?.el;
        if (password && retype) valid = valid && validator.matchPassword(password, retype);

        if (!valid) return;

        if (submitCallback) await submitCallback(form, fields);
    });
}

/**
 * Handles submission of create user form
 * Checks email uniqueness and signs up user via Supabase
 * @param {HTMLFormElement} form - Create form element
 */
async function handleCreateFormSubmit(form) {
    const formMessage = form.querySelector('#formMessage');
    if (formMessage) { formMessage.style.display = 'none'; }

    const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to create this account.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, create it',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-popup',
            title: 'swal-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    });

    if (!confirmResult.isConfirmed) return;

    const fullName = form.querySelector('[name="fullName"]').value.trim();
    const role = form.querySelector('[name="role"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;


    try {
        // Check email exists
        const respCheck = await fetch('/Banwa/server/api/shared/check_email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const dbCheck = await respCheck.json();
        if (dbCheck.exists) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent = 'An account with this email already exists.';
            return;
        }

        // Supabase signup
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    fullname: fullName,
                    role: role
                },
                emailRedirectTo: "http://localhost:8080/Banwa/client/pages/auth/confirm_verification_superadmin.php"
            }
        });

        if (error) throw error;

        form.closest('.modal')?.classList.remove('active');

        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Account created! Verify email to activate.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showClass: { popup: '' },
            hideClass: { popup: '' }
        });

        form.reset();
    } catch (err) {
        formMessage.style.display = 'block';
        formMessage.style.color = 'red';
        formMessage.textContent = 'An error occurred. ' + (err.message || err);
    }
}

/**
 * Handles submission of update user form
 * Sends updated user data to the server
 * @param {HTMLFormElement} form - Edit form element
 */
async function handleUpdateFormSubmit(form) {
    const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to update this account.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-popup',
            title: 'swal-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    });

    if (!confirmResult.isConfirmed) return;

    const payload = {
        user_id: form.dataset.userId,
        full_name: form.querySelector('[name="editFullName"]').value.trim(),
        email: form.querySelector('[name="editEmail"]').value.trim(),
        role_id: form.querySelector('[name="editRole"]').value.trim()
    };

    try {
        const resp = await fetch('/Banwa/server/api/staff/superadmin/update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const result = await resp.json();

        if (!resp.ok || result.error) {
            throw new Error(result.error || 'Failed to update user');
        }

        form.closest('.modal')?.classList.remove('active');

        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Account updated!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showClass: {
                popup: ''
            },
            hideClass: {
                popup: ''
            }
        });
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'Update failed.'
        });
    }
}

/**
 * Automatically initializes create and edit forms and table search on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('createForm');
    if (createForm) initializeForm(createForm, handleCreateFormSubmit);

    const editForm = document.getElementById('editForm');
    if (editForm) initializeForm(editForm, handleUpdateFormSubmit);
});
