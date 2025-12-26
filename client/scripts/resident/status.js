
// =================================================================
// MODAL HANDLING
// =================================================================
const editModal = document.getElementById('editModal');
const paymentModal = document.getElementById('paymentModal'); // New payment modal
const closeModalBtn = document.querySelector('.modal-close-btn'); // For edit modal
const closePaymentModalBtn = document.querySelector('.payment-modal-close-btn'); // For payment modal
const modalFormContent = document.getElementById('modal-form-content'); // For edit modal
const paymentModalFormContent = document.getElementById('payment-modal-form-content'); // For payment modal

function openEditModal() {
    if (editModal) editModal.style.display = 'block';
}

function closeEditModal() {
    if (editModal) {
        editModal.style.display = 'none';
        if(modalFormContent) modalFormContent.innerHTML = ''; // Clear content
    }
}

function openPaymentModal() {
    if (paymentModal) paymentModal.style.display = 'block';
}

function closePaymentModal() {
    if (paymentModal) {
        paymentModal.style.display = 'none';
        if(paymentModalFormContent) paymentModalFormContent.innerHTML = ''; // Clear content
    }
}

// Close modal event listeners
if(closeModalBtn) {
    closeModalBtn.onclick = closeEditModal; // Changed to closeEditModal
}

if(closePaymentModalBtn) {
    closePaymentModalBtn.onclick = closePaymentModal;
}

window.onclick = function(event) {
    if (event.target == editModal) {
        closeEditModal();
    } else if (event.target == paymentModal) { // Handle closing payment modal
        closePaymentModal();
    }
};

// =================================================================
// EDIT FORM HANDLING
// =================================================================

/**
 * Fetches application data and opens the edit modal with a simplified form.
 * @param {string} appId The ID of the application to edit.
 * @param {string} appType The type of application (e.g., 'Business').
 */
async function openEditModalFor(appId, appType) {
    if (!modalFormContent) return;

    modalFormContent.innerHTML = '<p>Loading application data...</p>';
    openEditModal(); // Use specific open function

    try {
        // We only have the business endpoint for now, so we hardcode it.
        // In the future, this could be dynamic based on appType.
        if (appType !== 'Business') {
            throw new Error(`Editing for application type '${appType}' is not implemented yet.`);
        }

        const response = await fetch(`/Banwa/server/api/resident/get_business_application.php?id=${appId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        const appData = result.data;
        
        // Use a function to generate the form HTML
        modalFormContent.innerHTML = generateBusinessFormHtml(appData);

        // Attach event listeners to the new form buttons
        const editForm = document.getElementById('simple-edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (event) => handleSubmitChanges(event, appData.id));
        }
        const cancelBtn = document.getElementById('modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeEditModal); // Changed to closeEditModal
        }

    } catch (error) {
        console.error('Error opening edit modal:', error);
        modalFormContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// =================================================================
// PAYMENT FORM HANDLING (NEW)
// =================================================================

/**
 * Fetches application data and opens the payment modal with the payment form.
 * @param {string} appId The ID of the application for which to submit payment.
 * @param {string} appType The type of application (e.g., 'Business').
 * @param {string} appPurpose The purpose of the payment, typically the appType.
 */
async function openPaymentModalFor(appId, appType, appPurpose) {
    if (!paymentModalFormContent) return;

    paymentModalFormContent.innerHTML = '<p>Loading payment form...</p>';
    openPaymentModal(); // Use specific open function

    try {
        // Fetch application details to get amount due, etc.
        // For now, we hardcode business application fetching
        let appDetailsResponse;
        if (appType === 'Business') {
            appDetailsResponse = await fetch(`/Banwa/server/api/resident/get_business_application.php?id=${appId}`);
        } else {
            // Placeholder for other app types if they get payment functionality
            throw new Error(`Payment submission for application type '${appType}' is not fully implemented.`);
        }
        
        const appDetailsResult = await appDetailsResponse.json();

        if (!appDetailsResult.success) {
            throw new Error(appDetailsResult.error || 'Failed to fetch application details for payment.');
        }

        const appData = appDetailsResult.data;
        
        // Use a function to generate the payment form HTML
        paymentModalFormContent.innerHTML = generatePaymentFormHtml(appData, appPurpose);

        // Attach event listeners for dynamic instructions and form submission
        const paymentMethodSelect = document.getElementById('paymentMethod');
        const orNumberGroup = document.getElementById('orNumberGroup');
        const paymentInstructions = document.getElementById('paymentInstructions');
        const paymentForm = document.getElementById('payment-submission-form');

        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', () => {
                updatePaymentInstructions(paymentMethodSelect.value, orNumberGroup, paymentInstructions);
            });
            // Trigger initial display
            updatePaymentInstructions(paymentMethodSelect.value, orNumberGroup, paymentInstructions);
        }

        if (paymentForm) {
            paymentForm.addEventListener('submit', (event) => handleSubmitPayment(event, appId));
        }

        const cancelBtn = document.getElementById('payment-modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closePaymentModal);
        }

    } catch (error) {
        console.error('Error opening payment modal:', error);
        paymentModalFormContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

/**
 * Dynamically updates payment instructions and OR number visibility based on payment method.
 * Also controls the visibility of the main payment details section.
 * @param {string} method The selected payment method.
 * @param {HTMLElement} orNumberGroup The OR number input group element.
 * @param {HTMLElement} instructionsElement The element to display instructions.
 */
function updatePaymentInstructions(method, orNumberGroup, instructionsElement) {
    if (!orNumberGroup || !instructionsElement) return;

    const paymentDetailsSection = document.getElementById('paymentDetailsSection');
    if (!paymentDetailsSection) return;

    // Initially hide OR number field and clear instructions
    orNumberGroup.style.display = 'none';
    orNumberGroup.querySelector('input').removeAttribute('required');
    instructionsElement.innerHTML = ''; // Clear previous instructions

    // Show/hide the entire payment details section based on whether a method is selected
    if (method) {
        paymentDetailsSection.style.display = 'block';
    } else {
        paymentDetailsSection.style.display = 'none';
        return; // No method selected, so no specific instructions or OR logic
    }

    switch (method) {
        case 'GCash/QR':
            instructionsElement.innerHTML = `
                <p><strong>GCash Payment:</strong></p>
                <ul>
                    <li>Send amount to Official Number: <strong>09XX-XXX-XXXX</strong>.</li>
                    <li>Use <strong>Business Name</strong> as the "Message".</li>
                    <li>Save the Screenshot/Reference No. for validation.</li>
                </ul>
            `;
            break;
        case 'Cash (Over-the-Counter)':
            orNumberGroup.style.display = 'block';
            orNumberGroup.querySelector('input').setAttribute('required', 'required');
            instructionsElement.innerHTML = `
                <p><strong>Cash Payment:</strong></p>
                <ul>
                    <li>Proceed to <strong>Window 3 (Treasury Office)</strong>.</li>
                    <li>Present your Assessment Form.</li>
                    <li>Wait for your Official Receipt (OR).</li>
                </ul>
            `;
            break;
        case 'LandBank':
            orNumberGroup.style.display = 'block';
            orNumberGroup.querySelector('input').setAttribute('required', 'required');
            instructionsElement.innerHTML = `
                <p><strong>Landbank Online:</strong></p>
                <ul>
                    <li>Account Name: <strong>Municipality Treasury</strong></li>
                    <li>Account No: <strong>1234-5678-90</strong></li>
                    <li>Upload proof of transfer via portal or present printed copy.</li>
                </ul>
            `;
            break;
        default:
            instructionsElement.innerHTML = '<p>Please select a payment method.</p>';
    }
}


/**
 * Generates the HTML for the payment submission form.
 * @param {object} appData The application data for which payment is being submitted.
 * @param {string} appPurpose The purpose of the payment (e.g., 'Business', 'Construction', 'Utilities').
 * @returns {string} The HTML string for the form.
 */
function generatePaymentFormHtml(appData, appPurpose) {
    const amountDue = appData.amount_due ? parseFloat(appData.amount_due).toFixed(2) : '0.00';
    const purposeOptions = {
        'Business': 'Business Clearance Fee',
        'Construction': 'Construction Clearance Fee',
        // 'Utilities': 'Utility Service Fee',
        // Add more as needed
    };
    const paymentPurposeText = purposeOptions[appPurpose] || 'General Payment';

    return `
        <form id="payment-submission-form" enctype="multipart/form-data">
            <h2>Payment Submission</h2>
            <p>Application ID: <strong>${appData.id}</strong></p>
            <p>Amount Due: ₱<strong>${amountDue}</strong></p>
            
            <input type="hidden" name="application_id" value="${appData.id}">
            <input type="hidden" name="payment_purpose_app_type" value="${appPurpose}">

            <div class="form-group">
                <label for="paymentPurpose">Payment Purpose</label>
                <select id="paymentPurpose" name="paymentPurpose" disabled>
                    <option value="${appPurpose}">${paymentPurposeText}</option>
                </select>
            </div>

            <div class="form-group">
                <label for="paymentMethod">Payment Method <span class="required">*</span></label>
                <select id="paymentMethod" name="paymentMethod" required>
                    <option value="">Select Method</option>
                    <option value="GCash/QR">GCash/QR</option>
                    <option value="Cash (Over-the-Counter)">Cash (Over-the-Counter)</option>
                    <option value="LandBank">LandBank</option>
                </select>
            </div>

            <div class="form-group" id="paymentInstructions">
                <!-- Dynamic payment instructions will be loaded here -->
            </div>

            <div id="paymentDetailsSection" style="display: none;">
                <div class="form-group">
                    <label for="amountPaid">Amount Paid <span class="required">*</span></label>
                    <input type="number" id="amountPaid" name="amountPaid" step="0.01" min="0" value="${amountDue}" required>
                </div>

                <div class="form-group">
                    <label for="dateOfPayment">Date of Payment <span class="required">*</span></label>
                    <input type="date" id="dateOfPayment" name="dateOfPayment" required>
                </div>

                <div class="form-group" id="orNumberGroup" style="display: none;">
                    <label for="orNumber">Official Receipt (OR) Number</label>
                    <input type="text" id="orNumber" name="orNumber">
                    <small>This is the number printed on your official receipt.</small>
                </div>

                <div class="form-group">
                    <label for="proofOfPayment">Proof of Payment <span class="required">*</span></label>
                    <input type="file" id="proofOfPayment" name="proofOfPayment" accept=".jpg,.jpeg,.png,.pdf" required>
                    <small>Upload a clear photo or scanned copy of the deposit slip, transfer receipt, or official receipt (Max File Size: 5MB).</small>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" id="payment-modal-cancel-btn" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Submit Payment</button>
            </div>
        </form>
    `;
}

/**
 * Generates the HTML for the simplified business application edit form.
 * @param {object} data The application data.
 * @returns {string} The HTML string for the form.
 */
function generateBusinessFormHtml(data) {
    const ownerName = `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim();

    return `
        <form id="simple-edit-form">
            <h2>Edit Business Application</h2>
            
            <div class="form-group remarks">
                <label>Remarks from Staff:</label>
                <p>${data.approval_comments || 'No comments provided.'}</p>
            </div>

            <input type="hidden" name="application_id" value="${data.id}">

            <div class="form-group">
                <label for="ownerName">Owner Name</label>
                <input type="text" id="ownerName" name="ownerName" value="${ownerName}" readonly disabled>
            </div>

            <div class="form-group">
                <label for="businessName">Business Name</label>
                <input type="text" id="businessName" name="businessName" value="${data.business_name || ''}">
            </div>
            
            <div class="form-group">
                <label for="addressOfBusiness">Business Address</label>
                <textarea id="addressOfBusiness" name="addressOfBusiness">${data.address_of_business || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="requirementUpload">Upload New/Corrected Document</label>
                <input type="file" id="requirementUpload" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png">
                <small>If you upload a new file, it will replace the old one.</small>
            </div>

            <div class="form-actions">
                <button type="button" id="modal-cancel-btn" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Submit Changes</button>
            </div>
        </form>
    `;
}

/**
 * Handles the submission of the simplified edit form.
 * @param {Event} event The form submission event.
 * @param {string} appId The ID of the application being updated.
 */
async function handleSubmitChanges(event, appId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);
        
        // We need to fetch the original record to get all fields for the update,
        // as the simple form doesn't contain all of them.
        const response = await fetch(`/Banwa/server/api/resident/get_business_application.php?id=${appId}`);
        const result = await response.json();
        if (!result.success) throw new Error('Could not retrieve original data for update.');
        const originalData = result.data;
        
        // Create a complete FormData object for the backend handler
        const finalFormData = new FormData();

        // Map snake_case keys from originalData to camelCase keys for the backend
        const keyMap = {
            'type_of_business': 'typeOfBusiness',
            'nature_of_business': 'natureOfBusiness',
            'nature_of_business_specify': 'natureOfBusinessSpecify',
            'telephone_no_business': 'contactNoBusiness',
            'email_address': 'emailAddress',
            'first_name': 'firstName',
            'middle_name': 'middleName',
            'last_name': 'lastName',
            'telephone_no_owner': 'contactNoOwner',
            'type_of_structure': 'typeOfStructureSelect',
            'type_of_structure_specify': 'typeOfStructureSpecify',
            'no_of_employees': 'noOfEmployees',
            'application_date': 'applicationDate',
            // Add latitude and longitude mapping for backend's expected 'latitude2', 'longitude2'
            'latitude': 'latitude2',
            'longitude': 'longitude2'
        };

        for (const key in originalData) {
            const mappedKey = keyMap[key] || key;
            if (originalData[key] !== null && originalData[key] !== undefined) {
                // Special handling for array fields that should be JSON strings for PHP
                if (mappedKey === 'businessStatus' || mappedKey === 'requirements') {
                    if (Array.isArray(originalData[key])) {
                        finalFormData.append(mappedKey, JSON.stringify(originalData[key]));
                    } else if (typeof originalData[key] === 'string') {
                        // If it's already a string, assume it's JSON and append as is
                        finalFormData.append(mappedKey, originalData[key]);
                    } else {
                        // Fallback for other types
                        finalFormData.append(mappedKey, originalData[key]);
                    }
                } else {
                    finalFormData.append(mappedKey, originalData[key]);
                }
            }
        }
        
        // Handle address_owner split
        if (originalData.address_owner) {
            const ownerAddressParts = (originalData.address_owner || '').split(' ');
            const ownerLotNo = ownerAddressParts.shift() || '';
            const ownerStreet = ownerAddressParts.join(' ') || '';
            finalFormData.set('lotNo', ownerLotNo);
            finalFormData.set('street', ownerStreet);
        }

        // Overwrite with the fields from our simple form
        finalFormData.set('businessName', formData.get('businessName'));
        
        // The address needs to be split back into lot and street for the handler
        const fullAddress = formData.get('addressOfBusiness');
        const addressParts = (fullAddress || '').split(' ');
        const lotNo = addressParts.shift() || '';
        const street = addressParts.join(' ') || '';
        finalFormData.set('businessLotNo', lotNo);
        finalFormData.set('businessStreet', street);
        
        // Handle the file if it was changed
        const fileInput = form.querySelector('#requirementUpload');
        if (fileInput.files.length > 0) {
            finalFormData.set('requirementUpload', fileInput.files[0]);
        } else {
            // The handler might expect the field to be present, so we remove it
            // if no new file is there, to avoid overwriting with nothing.
             finalFormData.delete('requirementUpload');
        }

        // Add the required action for the handler
        finalFormData.set('action', 'update');
        finalFormData.set('application_id', appId);
        // Supabase ID is also required by the handler
        // This is a bit of a workaround since we don't have it on the client
        // We rely on the backend to re-verify ownership.
        finalFormData.set('supabase_user_id', originalData.supabase_user_id);


        // Send to the backend
        const updateResponse = await fetch('/Banwa/client/scripts/staff/business_staff/business_handler.php', {
            method: 'POST',
            body: finalFormData
        });

        const updateResult = await updateResponse.json();

        if (updateResult.status !== 'success') {
            throw new Error(updateResult.message || 'Failed to update application.');
        }

        alert('Application updated successfully!');
        closeEditModal();
        loadApplications(); // Refresh the list

    } catch (error) {
        console.error('Error submitting changes:', error);
        alert(`Error: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Changes';
    }
}


/**
 * Handles the submission of the payment form.
 * @param {Event} event The form submission event.
 * @param {string} appId The ID of the application for which payment is being submitted.
 */
async function handleSubmitPayment(event, appId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);
        
        // Append application ID to form data
        formData.append('application_id', appId);

        const response = await fetch('/Banwa/server/api/resident/submit_payment.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to submit payment details.');
        }

        alert('Payment details submitted successfully! Your payment is now Pending Verification.');
        closePaymentModal();
        loadApplications(); // Refresh the application list

    } catch (error) {
        console.error('Error submitting payment:', error);
        alert(`Error: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment';
    }
}


// =================================================================
// LOAD APPLICATIONS LIST
// =================================================================
async function loadApplications() {
    try {
        const res = await fetch('/Banwa/server/api/resident/get_applications.php');
        const data = await res.json();

        const container = document.getElementById('applicationStatus');
        container.innerHTML = '';

        if (data.error) {
            container.innerText = data.error;
            return;
        }

        if (!data.success || !Array.isArray(data.applications) || data.applications.length === 0) {
            container.innerText = 'No applications found.';
            return;
        }

    data.applications
            .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)) // newest first
            .forEach(app => {
                const div = document.createElement('div');
                div.className = 'application-card';

                const remarks = app.approval_comments && app.approval_comments.trim() !== ''
                    ? `<p>Remarks: ${app.approval_comments}</p>`
                    : '';
                const middle_initial_part = app.middle_name ? ` ${app.middle_name}` : '';
                const fullname = `${app.first_name}${middle_initial_part} ${app.last_name}` || "No Name";
                const applicationType = app.type || "N/A";
                const actionButtons = [];
                if (app.status && app.status.toLowerCase() === 'additional requirements') {
                    actionButtons.push(`<button class="edit-action-btn" data-app-id="${app.id}" data-app-type="${app.type}">Edit Application</button>`);
                }
                if (app.status && app.status.toLowerCase() === 'for payment') {
                    actionButtons.push(`<button class="payment-action-btn" data-app-id="${app.id}" data-app-type="${app.type}" data-app-purpose="${app.type}">Submit Payment</button>`);
                }

                div.innerHTML = `
                    <h3>${fullname}</h3>
                    <p>Status: ${app.status || 'Pending'}</p>
                    <p>Submitted: ${app.request_date || 'N/A'}</p>
                    <p>Type: ${applicationType}</p>
                    ${remarks}
                    <div class="card-actions">${actionButtons.join('')}</div>
                `;
                
                container.appendChild(div);

                const editButtonElement = div.querySelector('.edit-action-btn');
                if (editButtonElement) {
                    editButtonElement.addEventListener('click', (e) => {
                        const appId = e.target.getAttribute('data-app-id');
                        const appType = e.target.getAttribute('data-app-type');
                        openEditModalFor(appId, appType);
                    });
                }

                const paymentButtonElement = div.querySelector('.payment-action-btn');
                if (paymentButtonElement) {
                    paymentButtonElement.addEventListener('click', (e) => {
                        const appId = e.target.getAttribute('data-app-id');
                        const appType = e.target.getAttribute('data-app-type'); // e.g., 'Business'
                        const appPurpose = e.target.getAttribute('data-app-purpose'); // e.g., 'Business'
                        openPaymentModalFor(appId, appType, appPurpose);
                    });
                }
            });

    } catch (err) {
        console.error('Error loading applications:', err);
        document.getElementById('applicationStatus').innerText = 'Failed to load applications.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadApplications();
    loadPayments(); // Call the new loadPayments function
});

// =================================================================
// LOAD PAYMENTS HISTORY
// =================================================================
async function loadPayments() {
    try {
        const res = await fetch('/Banwa/server/api/resident/get_payment.php');
        const data = await res.json();

        const container = document.getElementById('paymentHistoryList'); // Assuming this container exists in HTML
        if (!container) {
            console.warn('Payment history container #paymentHistoryList not found.');
            return;
        }
        container.innerHTML = ''; // Clear previous content

        if (data.error) {
            container.innerText = data.error;
            return;
        }

        if (!data.success || !Array.isArray(data.payments) || data.payments.length === 0) {
            container.innerText = 'No payment history found.';
            return;
        }

        data.payments
            .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)) // newest first
            .forEach(payment => {
                const div = document.createElement('div');
                div.className = 'payment-card'; // Use a new class for styling payments

                const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                div.innerHTML = `
                    <h3>Payment for ${payment.type || 'N/A'}</h3>
                    <p>Amount: ₱${parseFloat(payment.amount).toFixed(2)}</p>
                    <p>Date: ${paymentDate}</p>
                    <p>Status: ${payment.status || 'Pending'}</p>
                    <p>Reference No.: ${payment.reference_number || 'N/A'}</p>
                    <p>Transaction ID: ${payment.id}</p>
                `;
                
                container.appendChild(div);
            });

    } catch (err) {
        console.error('Error loading payment history:', err);
        const container = document.getElementById('paymentHistoryList');
        if (container) {
            container.innerText = 'Failed to load payment history.';
        }
    }
}

