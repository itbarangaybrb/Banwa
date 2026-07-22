import { addressCoordinates } from '../../../../server/api/resident/addresses.js';
import supabase from "../../../../server/api/supabase.js";
import { archiveRecord } from '../../utils/archives.js';
import { createPaginator } from '../../utils/pagination.js';
import { initSocket } from '../../utils/socket.js';

let applicationsPaginator;

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    /* Universal Popup Spacing */
    .swal2-popup {
        padding: 2rem 1.5rem !important; 
        border-radius: 15px !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Consistent Icon Margins for Success/Error/Warning */
    .swal2-icon {
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        border-width: 4px !important;
    }

    /* Standardized Titles */
    .swal2-title {
        color: #00247C !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        margin: 0.5rem 0 !important;
        padding: 0 !important;
    }

    /* Standardized Text Content */
    .swal2-html-container {
        margin: 1rem 0 !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }

    /* Button Spacing */
    .swal2-actions {
        margin-top: 1.5rem !important;
        margin-bottom: 0.5rem !important;
    }
`;
document.head.appendChild(swalStyle);

/**
 * Object containing predefined suspension reason templates.
 * Each key is a main reason, and its value is an array of detailed templates.
 * @type {Object<string, string[]>}
 */
// const reasonTemplates = {
//     "Violation of Terms of Service": [
//         "User submitted content that violates platform guidelines.",
//         "User repeatedly ignored community standards.",
//         "User posted prohibited or restricted material."
//     ],
//     "Fraudulent Activity": [
//         "User attempted to manipulate system records.",
//         "User provided falsified information during verification.",
//         "User engaged in deceptive financial activity."
//     ],
//     "Suspicious or Unusual Activity": [
//         "User exhibited irregular login or access patterns.",
//         "User performed actions that suggest account compromise.",
//         "User displayed behavior inconsistent with normal activity."
//     ],
//     "Harassment or Abuse": [
//         "User sent abusive or threatening messages.",
//         "User engaged in repeated harassment of another member.",
//         "User used offensive or discriminatory language."
//     ],
//     "Repeated Policy Violations": [
//         "User has repeatedly failed to comply with platform rules.",
//         "User ignored previous warnings regarding policy violations.",
//         "User continues prohibited activity despite sanctions."
//     ],
//     "Unauthorized Data Access or Misuse": [
//         "User accessed data they were not authorized to view.",
//         "User misused confidential or private information.",
//         "User attempted to bypass security controls."
//     ],
//     "Impersonation or Identity Misrepresentation": [
//         "User created an account pretending to be someone else.",
//         "User provided false identity information.",
//         "User impersonated staff or other members to deceive."
//     ],
//     "Failure to Meet Verification Requirements": [
//         "User did not submit required verification documents.",
//         "User provided incomplete or invalid verification information.",
//         "User failed to complete identity confirmation within the allowed period."
//     ]
// };

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

    function validateAddress(lotInput, streetInput, latId, lngId) {
        const lot = lotInput.value.trim();
        const street = streetInput.value.trim();

        if (!lot) { showError(lotInput, 'House No. is required'); return false; }
        if (!street || street === 'select') { showError(streetInput, 'Street is required'); return false; }

        const fullAddress = `${lot} ${street}`;
        const match = addressCoordinates.find(a => a.address === fullAddress);

        if (!match) {
            showError(streetInput, 'Street does not exist for this lot');
            return false;
        }

        clearError(lotInput);
        clearError(streetInput);

        const latEl = document.getElementById(latId);
        const lngEl = document.getElementById(lngId);
        if (latEl && lngEl) {
            latEl.value = match.lat.toFixed(6);
            lngEl.value = match.lng.toFixed(6);
        }

        return true;
    }

    return {
        text: validateText,
        email: validateEmail,
        password: validatePassword,
        matchPassword: validatePasswordMatches,
        select: validateSelect,
        address: validateAddress,
        clear: clearError
    };
})();

/**
 * Fetch all users from the server
 * Filters archived users
 * Dynamically renders user rows into the table body
 *
 * @async
 * @returns {Promise<void>}
 */
export async function fetchUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const resp = await fetch('/server/api/staff/superadmin/get_user_all.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        const users = await resp.json();
        // tbody.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No users found</td></tr>`;
            return;
        }

        const activeUsers = users.filter(user => !user.is_archived);

        if (activeUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No users found</td></tr>`;
            return;
        }

        // activeUsers.forEach(user => {
        //     const isSuspended = user.status === 'suspended';

        //     const suspendButton = isSuspended
        //         ? `<button class="buttons unsuspend-btn" data-id="${user.user_id}">Unsuspend</button>`
        //         : `<button class="buttons suspend-btn" data-id="${user.user_id}">Suspend</button>`;

        //     const tr = document.createElement('tr');
        //     tr.innerHTML = `
        //         <tr>${user.user_id}</td>
        //         <td>${user.full_name}</td>
        //         <td>${user.email}</td>
        //         <td>${user.lot_no || ''}</td>
        //         <td>${user.street || ''}</td>
        //         <td><span class="status-badge status-${user.status}">${user.status}</span></td>
        //         <td>${user.role_id}</td>
        //         <td>
        //             <div class="action-buttons">
        //                 <button class="buttons edit-btn"
        //                         data-modal="editModal"
        //                         data-id="${user.user_id}"
        //                         data-fullname="${user.full_name}"
        //                         data-email="${user.email}"
        //                         data-role="${user.role_id}"
        //                         data-status="${user.status}"
        //                         data-street="${user.street || ''}"
        //                         data-lotno="${user.lot_no || ''}">
        //                     Manage
        //                 </button>
        //             </div>
        //         </td>
        //     `;
        //     tbody.appendChild(tr);
        // });

        applicationsPaginator.load(activeUsers);

    } catch (err) {
        console.error('Failed to fetch users:', err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading users</td></tr>`;
    }
};

function renderTableRows(data) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(user => {
        const isSuspended = user.status === 'suspended';

        const suspendButton = isSuspended
            ? `<button class="buttons unsuspend-btn" data-id="${user.user_id}">Unsuspend</button>`
            : `<button class="buttons suspend-btn" data-id="${user.user_id}">Suspend</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.lot_no || ''}</td>
                <td>${user.street || ''}</td>
                <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                <td>${user.role_name}</td>
                <td>
                    <div class="action-buttons">
                        <button class="buttons edit-btn"
                                data-modal="editModal"
                                data-id="${user.user_id}"
                                data-fullname="${user.full_name}"
                                data-email="${user.email}"
                                data-role="${user.role_id}"
                                data-status="${user.status}"
                                data-street="${user.street || ''}"
                                data-lotno="${user.lot_no || ''}">
                            Manage
                        </button>
                    </div>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

/**
 * Unsuspends a user account after confirmation
 * @param {string} userId - ID of the user to unsuspend
 */
async function unsuspendUser(userId) {
    const confirmResult = await Swal.fire({
        title: 'Unsuspend this user?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, unsuspend',
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

    try {
        const response = await fetch("/server/api/staff/superadmin/unsuspend_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id: userId })
        });
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Failed to unsuspend");

        await Swal.fire({
            icon: 'success',
            title: 'User unsuspended',
            timer: 2000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            }
        });

        fetchUsers();
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            }
        });
    }
}

/**
 * Initializes suspend reason templates.
 * Populates the reasonTemplates container with buttons for the selected reason.
 * Clicking a button fills the suspendReasonDetails textarea with the corresponding template.
 */
// function initializeSuspendTemplates() {
//     const select = document.getElementById('suspendReason');
//     const textarea = document.getElementById('suspendReasonDetails');
//     const container = document.getElementById('reasonTemplates');

//     if (!select || !textarea || !container) return;

//     select.addEventListener('change', () => {
//         const selected = select.value;
//         container.innerHTML = '';

//         if (!reasonTemplates[selected]) return;

//         reasonTemplates[selected].forEach(template => {
//             const btn = document.createElement('button');
//             btn.type = 'button';
//             btn.classList.add('buttons', 'reason-btn');
//             btn.textContent = template;

//             btn.addEventListener('click', () => {
//                 textarea.value = template;
//                 validator.clear(textarea);
//             });

//             container.appendChild(btn);
//         });
//     });
// }

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
            case 'street':
                config.push({
                    el: input,
                    type: 'select',
                    message: 'Please select street',
                    conditional: () => {
                        const roleEl = form.querySelector('[name="role"]') ?? form.querySelector('[name="editRole"]');
                        return roleEl?.value === '1';
                    }
                });
                break;
            case 'lotNo':
                config.push({
                    el: input,
                    type: 'text',
                    message: 'House No. is required',
                    conditional: () => {
                        const roleEl = form.querySelector('[name="role"]');
                        return roleEl?.value === '1';
                    }
                });
                break;
            case 'editLotNo':
                config.push({
                    el: input,
                    type: 'text',
                    message: 'House No. is required',
                    conditional: () => {
                        const roleEl = form.querySelector('[name="editRole"]');
                        return roleEl?.value === '1';
                    }
                });
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

            // Suspend form fields
            case 'suspendReason':
                config.push({ el: input, type: 'select', message: 'Please select a reason' });
                break;
            case 'suspendReasonDetails':
                config.push({ el: input, type: 'text', message: 'Please provide details', rules: { normalizeSpaces: true } });
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
    if (config.conditional && !config.conditional()) return true;
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

    const lotNo = config.find(c => c.el.name === 'lotNo')?.el;
    const street = config.find(c => c.el.name === 'street' && c.el.closest('#createForm'))?.el;
    if (lotNo && street) {
        [lotNo, street].forEach(el => {
            el.addEventListener('blur', () => {
                const roleEl = document.getElementById('role');
                if (roleEl?.value === '1' && lotNo.value && street.value) {
                    validator.address(lotNo, street, 'latitude', 'longitude');
                }
            });
            el.addEventListener('input', () => validator.clear(el));
        });
    }

    const editLotNo = config.find(c => c.el.name === 'editLotNo')?.el;
    const editStreet = config.find(c => c.el.name === 'street' && c.el.closest('#editForm'))?.el;
    if (editLotNo && editStreet) {
        [editLotNo, editStreet].forEach(el => {
            el.addEventListener('blur', () => {
                const roleEl = document.getElementById('editRole');
                if (roleEl?.value === '1' && editLotNo.value && editStreet.value) {
                    validator.address(editLotNo, editStreet, 'editLatitude', 'editLongitude');
                }
            });
            el.addEventListener('input', () => validator.clear(el));
        });
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

    const roleEl = form.querySelector('[name="role"]');
    if (roleEl?.value === '1') {
        const lotEl = form.querySelector('[name="lotNo"]');
        const streetEl = form.querySelector('[name="street"]');
        if (!validator.address(lotEl, streetEl, 'latitude', 'longitude')) return;
    }

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
    const street = form.querySelector('[name="street"]').value;
    const lotNo = form.querySelector('[name="lotNo"]').value;
    const latitude = form.querySelector('[name="latitude"]').value;
    const longitude = form.querySelector('[name="longitude"]').value;

    try {
        const respCheck = await fetch('/server/api/shared/check_email.php', {
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

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    fullname: fullName,
                    role: role,
                    street: street,
                    lot_no: lotNo,
                    latitude: latitude,
                    longitude: longitude
                },
                emailRedirectTo: "https://banwa-2ujo.onrender.com/client/pages/auth/confirm_verification_superadmin.php"
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
    const roleEl = form.querySelector('[name="editRole"]');
    const lotEl = form.querySelector('[name="editLotNo"]');
    const streetEl = form.querySelector('[name="street"]');
    if (!validator.address(lotEl, streetEl, 'editLatitude', 'editLongitude')) return;


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
        role_id: parseInt(form.querySelector('[name="editRole"]').value),
        street: form.querySelector('[name="street"]').value.trim(),
        lot_no: form.querySelector('[name="editLotNo"]').value.trim(),
        latitude: document.getElementById('editLatitude').value.trim(),
        longitude: document.getElementById('editLongitude').value.trim()
    };

    try {
        const resp = await fetch('/server/api/staff/superadmin/update_user.php', {
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

        fetchUsers();
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'Update failed.'
        });
    }
}

/**
 * Handles submission of the suspend user form.
 * Validates inputs, shows confirmation dialog, sends suspend request to the server,
 * and provides success/error feedback using SweetAlert2.
 * @async
 * @param {HTMLFormElement} form - The suspend form element being submitted
 */
// async function handleSuspendFormSubmit(form) {
//     const userId = form.dataset.userId;

//     if (!userId || userId === 'undefined') {
//         console.error('Invalid userId:', userId);
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'User ID is missing. Please try again.',
//             buttonsStyling: false,
//             customClass: {
//                 popup: 'swal-popup',
//                 title: 'swal-title',
//                 confirmButton: 'swal-confirm-btn',
//                 cancelButton: 'swal-cancel-btn'
//             }
//         });
//         return;
//     }

//     const reasonInput = form.querySelector('[name="suspendReason"]');
//     const detailsInput = form.querySelector('[name="suspendReasonDetails"]');

//     if (!validator.select(reasonInput, 'Please select a reason')) return;

//     const confirmResult = await Swal.fire({
//         title: 'Are you sure?',
//         text: 'You are about to suspend this account.',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonText: 'Yes, suspend it',
//         cancelButtonText: 'Cancel',
//         buttonsStyling: false,
//         customClass: {
//             popup: 'swal-popup',
//             title: 'swal-title',
//             confirmButton: 'swal-confirm-btn',
//             cancelButton: 'swal-cancel-btn'
//         }
//     });

//     if (!confirmResult.isConfirmed) return;

//     try {
//         const payload = {
//             user_id: userId,
//             reason: reasonInput.value.trim(),
//             details: detailsInput.value.trim()
//         };

//         const resp = await fetch('/server/api/staff/superadmin/suspend_user.php', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             credentials: 'include',
//             body: JSON.stringify(payload)
//         });

//         if (!resp.ok) throw new Error('Request failed');

//         const result = await resp.json();
//         if (!result.success) throw new Error(result.message || 'Failed to suspend');

//         form.closest('.modal')?.classList.remove('active');
//         form.reset();

//         validator.clear(reasonInput);
//         validator.clear(detailsInput);

//         delete form.dataset.userId;

//         await Swal.fire({
//             toast: true,
//             position: 'top-end',
//             icon: 'success',
//             title: 'User suspended!',
//             showConfirmButton: false,
//             timer: 3000,
//             timerProgressBar: true,
//             buttonsStyling: false,
//             customClass: {
//                 popup: 'swal-popup',
//                 title: 'swal-title',
//                 confirmButton: 'swal-confirm-btn',
//                 cancelButton: 'swal-cancel-btn'
//             }
//         });

//         fetchUsers();
//     } catch (err) {
//         console.error('Error in suspend:', err);
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: err.message || 'Failed to suspend user',
//             buttonsStyling: false,
//             customClass: {
//                 popup: 'swal-popup',
//                 title: 'swal-title',
//                 confirmButton: 'swal-confirm-btn',
//                 cancelButton: 'swal-cancel-btn'
//             }
//         });
//     }
// }

/**
 * Handles all click interactions in the user management interface.
 * Manages modal toggling, form cancellation, and user action buttons.
 * 
 * - Modal triggers: Opens modals via data-modal attributes
 * - Cancel buttons: Closes modals and resets forms with validation clearing
 * - Edit buttons: Populates and opens the edit modal with user data
 * - Suspend buttons: Opens suspend modal for setting suspension period
 * - Unsuspend buttons: Directly unsuspends the user
 * - Archive buttons: Directly archives the user
 * - Back button: Returns from suspend modal to edit modal
 * 
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

            form.querySelectorAll('input, select, textarea').forEach(input => {
                validator.clear(input);
            });
        }
    }

    if (e.target.classList.contains('edit-btn')) {
        const btn = e.target;

        document.getElementById('editModal').classList.add('active');

        const form = document.getElementById('editForm');
        form.querySelector('[name="editFullName"]').value = btn.dataset.fullname || '';
        form.querySelector('[name="editEmail"]').value = btn.dataset.email || '';

        let roleValue = btn.dataset.role;

        const roleMap = {
            'Resident': '1',
            'Super Admin': '2',
            'Business staff': '4',
            'Construction staff': '5',
            'Utility staff': '6',
            'Finance staff': '7'
        };

        if (roleMap[roleValue]) {
            roleValue = roleMap[roleValue];
        }

        form.querySelector('[name="editRole"]').value = roleValue || '';
        form.querySelector('[name="street"]').value = btn.dataset.street || '';
        form.querySelector('[name="editLotNo"]').value = btn.dataset.lotno || '';

        form.dataset.userId = btn.dataset.id;

        // const isSuspended = btn.dataset.status === 'suspended';
        // const suspendBtn = document.getElementById('editSuspendBtn');
        // const unsuspendBtn = document.getElementById('editUnsuspendBtn');

        // suspendBtn.dataset.id = btn.dataset.id;
        // unsuspendBtn.dataset.id = btn.dataset.id;
        // suspendBtn.style.display = isSuspended ? 'none' : '';
        // unsuspendBtn.style.display = isSuspended ? '' : 'none';

        document.getElementById('editArchiveBtn').dataset.id = btn.dataset.id;
    }

    // if (e.target.classList.contains('suspend-btn')) {
    //     if (e.target.type === 'submit' || e.target.closest('#suspendForm')) return;

    //     const userId = e.target.dataset.id;

    //     const form = document.getElementById('suspendForm');
    //     if (!form) return;

    //     if (!userId || userId === 'undefined') {
    //         console.error('Invalid userId in click handler:', userId);
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Error',
    //             text: 'Invalid user ID. Please try again.',
    //             buttonsStyling: false,
    //             customClass: {
    //                 popup: 'swal-popup',
    //                 title: 'swal-title',
    //                 confirmButton: 'swal-confirm-btn',
    //                 cancelButton: 'swal-cancel-btn'
    //             }
    //         });
    //         return;
    //     }

    //     form.dataset.userId = userId;
    //     form.reset();

    //     const reasonInput = form.querySelector('[name="suspendReason"]');
    //     const detailsInput = form.querySelector('[name="suspendReasonDetails"]');
    //     if (reasonInput) validator.clear(reasonInput);
    //     if (detailsInput) validator.clear(detailsInput);

    //     document.getElementById('editModal')?.classList.remove('active');
    //     form.closest('.modal')?.classList.add('active');
    // }

    // Handle unsuspend button clicks
    // if (e.target.classList.contains('unsuspend-btn')) {
    //     const userId = e.target.dataset.id;
    //     document.getElementById('editModal')?.classList.remove('active');
    //     unsuspendUser(userId);
    // }

    // Handle archive button clicks
    if (e.target.id === 'editArchiveBtn') {
        const userId = e.target.dataset.id;
        document.getElementById('editModal')?.classList.remove('active');

        Swal.fire({
            title: 'Are you sure?',
            text: 'This user will be archived.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, archive it',
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await archiveRecord('Users', userId);
                fetchUsers();
            }
        });
    }

    // if (e.target.id === 'suspendBackBtn') {
    //     document.getElementById('suspendModal').classList.remove('active');
    //     document.getElementById('editModal').classList.add('active');
    // }
});

/**
 * Initialize WebSocket connection and form handlers on page load.
 * Sets up real-time updates for user list changes and initializes
 * all forms with validation and submission handlers.
 */
document.addEventListener('DOMContentLoaded', () => {
    applicationsPaginator = createPaginator({
        containerId: 'usersPagination',
        pageSize: 10,
        windowSize: 5
    }).onPage((pageItems) => {
        renderTableRows(pageItems);
    });

    initSocket("main", "https://banwa-ws.onrender.com", (data) => {
        switch (data.type) {
            case "users_update":
                fetchUsers();
                break;
        }
    });

    fetchUsers();

    const createForm = document.getElementById('createForm');
    if (createForm) initializeForm(createForm, handleCreateFormSubmit);

    const editForm = document.getElementById('editForm');
    if (editForm) initializeForm(editForm, handleUpdateFormSubmit);

    // const suspendForm = document.getElementById('suspendForm');
    // if (suspendForm) {
    //     initializeForm(suspendForm, handleSuspendFormSubmit);
    //     initializeSuspendTemplates();
    // }
});