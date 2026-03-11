import { initSocket, sockets } from '../utils/socketUtils.js';

// =========================
// MODAL HANDLING 
// =========================
const editModal = document.getElementById('editModal');
const paymentModal = document.getElementById('paymentModal');
const remarksModal = document.getElementById('remarksModal');

const closeModalBtn = document.querySelector('.modal-close-btn');
const closePaymentModalBtn = document.querySelector('.payment-modal-close-btn');
const closeRemarksModalBtn = document.querySelector('.remarks-modal-close-btn');
const closeRemarksSecondaryBtn = document.querySelector('.remarks-close-btn-secondary');

const modalFormContent = document.getElementById('modal-form-content');
const paymentModalFormContent = document.getElementById('payment-modal-form-content');
const remarksContent = document.getElementById('remarks-content');

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

// =========================
// SWEETALERT2 GLOBAL CONFIG (BanwaSwal)
// =========================
// This is the global configuration for ALL SweetAlerts in this file.

const BanwaSwal = Swal.mixin({
    confirmButtonColor: '#00247C',
    confirmButtonText: 'OK',
    color: '#363636',
    customClass: {
        popup: 'modal-content',
        confirmButton: 'btn-proceed',
        title: 'swal-title',
        htmlContainer: 'swal-text'
    },
    // Force perfect centering + spacing for every alert
    didOpen: (popup) => {
        const container = popup.querySelector('.swal2-html-container');
        if (container) {
            container.style.textAlign = 'center';
            container.style.padding = '15px 30px';
            container.style.lineHeight = '1.65';
            container.style.marginBottom = '20px';
        }
    }
});
/**
 * Opens the edit modal for application modifications
 */
function openEditModal() { if (editModal) editModal.style.display = 'block'; }

/**
 * Closes the edit modal and clears any form content
 */
function closeEditModal() {
    if (editModal) {
        editModal.style.display = 'none';
        if (modalFormContent) modalFormContent.innerHTML = '';
    }
}

/**
 * Opens the payment modal for payment submissions
 */
function openPaymentModal() { if (paymentModal) paymentModal.style.display = 'block'; }

/**
 * Closes the payment modal and clears any form content
 */
function closePaymentModal() {
    if (paymentModal) {
        paymentModal.style.display = 'none';
        if (paymentModalFormContent) paymentModalFormContent.innerHTML = '';
    }
}

/**
 * Opens the remarks modal to display application feedback and comments
 * 
 * @param {string} text - The remarks text to display in the modal
 */
function openRemarksModal(text) {
    if (remarksModal && remarksContent) {
        remarksContent.innerText = text || "No remarks available.";
        remarksModal.style.display = 'block';
    }
}

/**
 * Closes the remarks modal
 */
function closeRemarksModal() {
    if (remarksModal) remarksModal.style.display = 'none';
}

// Event Listeners for Closing
if (closeModalBtn) closeModalBtn.onclick = closeEditModal;
if (closePaymentModalBtn) closePaymentModalBtn.onclick = closePaymentModal;
if (closeRemarksModalBtn) closeRemarksModalBtn.onclick = closeRemarksModal;
if (closeRemarksSecondaryBtn) closeRemarksSecondaryBtn.onclick = closeRemarksModal;

window.onclick = function (event) {
    if (event.target == editModal) closeEditModal();
    else if (event.target == paymentModal) closePaymentModal();
    else if (event.target == remarksModal) closeRemarksModal();
};

// =============================================
// NEW: TAB SYSTEM FOR SINGLE TABLE VIEW
// =============================================
let currentTab = 'applications';

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (!tabButtons.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentTab = btn.dataset.tab;
            loadCurrentTab();
        });
    });
}

async function loadCurrentTab() {
    const tableBody = document.getElementById('mainTableBody');
    const header = document.getElementById('tableHeader');

    if (!tableBody || !header) return;

    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 60px;">Loading...</td></tr>`;

    if (currentTab === 'applications') {
        header.innerHTML = `
            <tr>
                <th style="width: 20%;">Reference Number</th>
                <th style="width: 35%;">Details</th>
                <th style="width: 20%;">Status</th>
                <th style="width: 25%;">Action</th>
            </tr>
        `;
        await loadApplications();
    } else {
        header.innerHTML = `
            <tr>
                <th style="width: 20%;">Transaction ID</th>
                <th style="width: 35%;">Details</th>
                <th style="width: 20%;">Status</th>
                <th style="width: 25%;">Action</th>
            </tr>
        `;
        await loadPayments();
    }
}

/**
 * Fetches application data and opens the edit modal with a simplified form
 * Supports Business, Construction, Utilities, and Incident Reports application types
 * 
 * @param {string} appId The ID of the application to edit
 * @param {string} appType The type of application (e.g., 'Business')
 */
async function openEditModalFor(appId, appType) {
    if (!modalFormContent) return;

    modalFormContent.innerHTML = '<p>Loading application data...</p>';
    openEditModal();

    try {
        let endpoint = '';
        let formGenerator = null;

        switch (appType) {
            case 'Business':
                endpoint = `/server/api/resident/get_business_application.php?id=${appId}`;
                formGenerator = generateBusinessFormHtml;
                break;

            case 'Construction':
                endpoint = `/server/api/resident/get_construction_application.php?id=${appId}`;
                formGenerator = generateConstructionFormHtml;
                break;

            case 'Utilities':
                endpoint = `/server/api/resident/get_utilities_application.php?id=${appId}`;
                formGenerator = generateUtilitiesFormHtml;
                break;

            case 'Incident Reports':
                endpoint = `/server/api/resident/get_incident_report.php?id=${appId}`;
                formGenerator = generateIncidentReportFormHtml;
                break;

            default:
                throw new Error(`Editing for application type '${appType}' is not implemented.`);
        }

        const response = await fetch(endpoint);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch application data.');
        }

        const appData = result.data;

        modalFormContent.innerHTML = formGenerator(appData);

        const editForm = document.getElementById('simple-edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (event) =>
                handleSubmitChanges(event, appData.id, appType)
            );
        }

        const cancelBtn = document.getElementById('modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeEditModal);
        }

    } catch (error) {
        console.error('Error opening edit modal:', error);
        modalFormContent.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
}

/**
 * Fetches application data and opens the payment modal with the payment form
 * Currently supports Business applications with extensibility for other types
 * 
 * @param {string} appId The ID of the application for which to submit payment
 * @param {string} appType The type of application (e.g., 'Business')
 * @param {string} appPurpose The purpose of the payment, typically the appType
 */
async function openPaymentModalFor(appId, appType, appPurpose) {
    if (!paymentModalFormContent) return;

    paymentModalFormContent.innerHTML = '<p>Loading payment form...</p>';
    openPaymentModal();

    try {
        let appDetailsResponse;
        if (appType === 'Business') {
            appDetailsResponse = await fetch(`/server/api/resident/get_business_application.php?id=${appId}`);
        } else if (appType === 'Construction') {
            appDetailsResponse = await fetch(`/server/api/resident/get_construction_application.php?id=${appId}`);
        } else {
            throw new Error(`Payment submission for application type '${appType}' is not fully implemented.`);
        }

        const appDetailsResult = await appDetailsResponse.json();

        if (!appDetailsResult.success) {
            throw new Error(appDetailsResult.error || 'Failed to fetch application details for payment.');
        }

        const appData = appDetailsResult.data;
        paymentModalFormContent.innerHTML = generatePaymentFormHtml(appData, appPurpose);

        const paymentMethodSelect = document.getElementById('paymentMethod');
        const orNumberGroup = document.getElementById('orNumberGroup');
        const paymentInstructions = document.getElementById('paymentInstructions');
        const paymentForm = document.getElementById('payment-submission-form');

        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', () => {
                updatePaymentInstructions(paymentMethodSelect.value, orNumberGroup, paymentInstructions);
            });
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
 * Dynamically updates payment instructions and OR number visibility based on payment method
 * Also controls the visibility of the main payment details section
 * 
 * @param {string} method The selected payment method
 * @param {HTMLElement} orNumberGroup The OR number input group element
 * @param {HTMLElement} instructionsElement The element to display instructions
 */
function updatePaymentInstructions(method, orNumberGroup, instructionsElement) {
    if (!orNumberGroup || !instructionsElement) return;

    const paymentDetailsSection = document.getElementById('paymentDetailsSection');
    if (!paymentDetailsSection) return;

    orNumberGroup.style.display = 'none';
    orNumberGroup.querySelector('input').removeAttribute('required');
    instructionsElement.innerHTML = '';

    if (method) {
        paymentDetailsSection.style.display = 'block';
    } else {
        paymentDetailsSection.style.display = 'none';
        return;
    }

    switch (method) {
        case 'GCash/QR':
            instructionsElement.innerHTML = `
                <p><strong>GCash Payment:</strong></p>
                <ul style="    list-style-type: none; display: block; margin-inline: auto; width: max-content; margin-bottom: 32px;">
                    <img src="/client/img/gcash-qr.png" alt="GCash QR Code" style="width: 60%; display: block; margin-inline: auto;">
                    <li>1. Send amount to Official Number: <strong>09919926620</strong>.</li>
                    <li>2. Use <strong>Business Name</strong> as the "Message".</li>
                    <li>3. Save the Screenshot/Reference No. for validation.</li>
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
 * Generates the HTML for the payment submission form
 * 
 * @param {object} appData The application data for which payment is being submitted
 * @param {string} appPurpose The purpose of the payment (e.g., 'Business', 'Construction', 'Utilities')
 * @returns {string} The HTML string for the form
 */
function generatePaymentFormHtml(appData, appPurpose) {
    const amountDue = appData.amount_due ? parseFloat(appData.amount_due).toFixed(2) : '0.00';
    const purposeOptions = {
        'Business': 'Business Clearance Fee',
        'Construction': 'Construction Clearance Fee',
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

            <div class="form-group" id="paymentInstructions"></div>

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
 * Generates the HTML for the simplified business application edit form
 * 
 * @param {object} data The application data
 * @returns {string} The HTML string for the form
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
 * Generates the HTML for the simplified construction application edit form
 * 
 * @param {object} data The construction application data
 * @returns {string} The HTML string for the form
 */
function generateConstructionFormHtml(data) {
    const ownerName = `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}`.trim();

    return `
        <form id="simple-edit-form">
            <h2>Edit Construction Application</h2>
            
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
                <label for="addressOfConstruction">Construction Address</label>
                <textarea id="addressOfConstruction" name="addressOfConstruction">${data.construction_address || ''}</textarea>
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
 * Generates the HTML for the simplified utility application edit form
 * 
 * @param {object} data The application data
 * @returns {string} The HTML string for the form
 */
function generateUtilitiesFormHtml(data) {
    const ownerName = `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}`.trim();
    document.getElementById('provider').value = data.provider || '';

    return `
        <form id="simple-edit-form">
            <h2>Edit Utility Application</h2>
            
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
                <label for="provider">Provider</label>
                <select name="provider" id="provider">
                    <option value="" disabled>Select</option>
                    <option value="Meralco">Meralco</option>
                    <option value="Manila Water">Manila Water</option>
                    <option value="Globe">Globe</option>
                    <option value="Smart">Smart</option>
                    <option value="PLDT">PLDT</option>
                    <option value="Bayantel">Bayantel</option>
                    <option value="Sky Cable">Sky Cable</option>
                    <option value="Destiny">Destiny</option>
                    <option value="Cignal">Cignal</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="addressOfUtility">Utility Address</label>
                <textarea id="addressOfUtility" name="addressOfUtility">${data.address_of_utility || ''}</textarea>
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
 * Generates the HTML for the simplified incident report edit form
 * 
 * @param {object} data The incident report data
 * @returns {string} The HTML string for the form
 */
function generateIncidentReportFormHtml(data) {
    // Use the actual field names from your database
    const reporterName = data.rp_full_name || '';
    const incidentType = data.incident_type || '';
    const incidentLocation = data.incident_location || '';
    const incidentDescription = data.description || '';

    return `
        <form id="simple-edit-form">
            <h2>Edit Incident Report</h2>
            
            <div class="form-group remarks">
                <label>Remarks from Staff:</label>
                <p>${data.approval_comments || 'No comments provided.'}</p>
            </div>

            <input type="hidden" name="application_id" value="${data.id}">

            <div class="form-group">
                <label for="reporterName">Reporter Name</label>
                <input type="text" id="reporterName" name="reporterName" value="${reporterName}" readonly disabled>
            </div>

            <div class="form-group">
                <label for="incidentType">Incident Type</label>
                <input type="text" id="incidentType" name="incidentType" value="${incidentType}">
            </div>
            
            <div class="form-group">
                <label for="incidentLocation">Incident Location</label>
                <textarea id="incidentLocation" name="incidentLocation">${incidentLocation}</textarea>
            </div>
            
            <div class="form-group">
                <label for="incidentDescription">Incident Description</label>
                <textarea id="incidentDescription" name="incidentDescription">${incidentDescription}</textarea>
            </div>
            
            <div class="form-group">
                <label for="requirementUpload">Upload New/Corrected Document/Photo</label>
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
 * Sends a WebSocket notification when an application is edited
 * 
 * Maps the application type to the appropriate WebSocket channel and broadcasts
 * the update to all connected clients (like staff dashboards) for real-time refresh.
 * 
 * @param {string} appType - Type of application (Business, Construction, Utilities, Incident Reports)
 * @param {string} appId - ID of the updated application
 * @param {string} [action='update'] - Action performed (default: 'update')
 * 
 * @returns {void}
 * 
 * @example
 * sendWebSocketUpdate('Business', 'APP-123', 'edit');
 */
function sendWebSocketUpdate(appType, appId, action = 'update') {
    try {
        let socketType = '';
        let messageType = '';

        // Map application type to socket type
        switch (appType) {
            case 'Business':
                socketType = 'business_applications';
                messageType = 'business_applications_update';
                break;
            case 'Construction':
                socketType = 'construction_applications';
                messageType = 'construction_applications_update';
                break;
            case 'Utilities':
                socketType = 'utility_applications';
                messageType = 'utility_applications_update';
                break;

            // for now as temporary only
            case 'Incident Reports':
                socketType = 'incident_reports';
                messageType = 'incident_reports_update';
                break;

            default:
                console.log(`No socket mapping for application type: ${appType}`);
                return;
        }

        // Check if socket exists and is open
        if (sockets && sockets[socketType] && sockets[socketType].readyState === WebSocket.OPEN) {
            sockets[socketType].send(JSON.stringify({
                type: messageType,
                action: action,
                application_id: appId,
                timestamp: new Date().toISOString()
            }));
            console.log(`WebSocket update sent for ${appType} application ${appId}`);
        } else {
            console.log(`WebSocket ${socketType} not connected or not initialized`);
        }
    } catch (error) {
        console.error('Error sending WebSocket update:', error);
    }
}

/**
 * Handles the submission of the simplified edit form
 * Only submits fields that were actually changed to avoid overwriting with null values
 * 
 * @param {Event} event The form submission event
 * @param {string} appId The ID of the application being updated
 * @param {string} appType The type of application being updated
 */
async function handleSubmitChanges(event, appId, appType) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);

        let getEndpoint = '';
        let updateEndpoint = '';
        let keyMap = {};

        switch (appType) {
            case 'Business':
                getEndpoint = `/server/api/resident/get_business_application.php?id=${appId}`;
                updateEndpoint = `/server/handlers/staff/business/business_handler.php`;
                keyMap = {
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
                    'latitude': 'latitude2',
                    'longitude': 'longitude2'
                };
                break;

            case 'Construction':
                getEndpoint = `/server/api/resident/get_construction_application.php?id=${appId}`;
                updateEndpoint = `/server/handlers/staff/construction/construction_handler.php`;
                keyMap = {
                    'first_name': 'firstName',
                    'middle_name': 'middleName',
                    'last_name': 'lastName',
                    'application_date': 'applicationDate',
                    'latitude': 'latitude2',
                    'longitude': 'longitude2'
                };
                break;

            case 'Utilities':
                getEndpoint = `/server/api/resident/get_utilities_application.php?id=${appId}`;
                updateEndpoint = `/server/handlers/staff/utility/utility_handler.php`;
                keyMap = {
                    'first_name': 'firstName',
                    'middle_name': 'middleName',
                    'last_name': 'lastName',
                    'application_date': 'applicationDate'
                };
                break;

            case 'Incident Reports':
                getEndpoint = `/server/api/resident/get_incident_report.php?id=${appId}`;
                updateEndpoint = `/server/handlers/staff/incident_report/ir_handler.php`;
                keyMap = {
                    'rp_full_name': 'rpFullName',
                    'application_date': 'applicationDate'
                };
                break;

            default:
                throw new Error(`Update for application type '${appType}' is not supported.`);
        }

        // Get original data
        const response = await fetch(getEndpoint);
        const result = await response.json();
        if (!result.success) {
            throw new Error('Could not retrieve original data for update.');
        }

        const originalData = result.data;
        const finalFormData = new FormData();

        // Track what fields were actually changed
        const changedFields = new Set();

        // Compare form data with original data to find changes
        for (const [key, value] of formData.entries()) {
            const originalKey = getOriginalKey(key, keyMap);
            if (originalKey && originalData.hasOwnProperty(originalKey)) {
                const originalValue = originalData[originalKey];
                const newValue = value.toString().trim();

                // Check if value has changed
                if (originalValue !== newValue &&
                    (!originalValue || originalValue.toString().trim() !== newValue)) {
                    changedFields.add(key);
                    finalFormData.append(key, value);
                }
            } else {
                // Field doesn't exist in original data or doesn't need mapping
                changedFields.add(key);
                finalFormData.append(key, value);
            }
        }

        // Always include essential fields
        finalFormData.set('action', 'update');
        finalFormData.set('application_id', appId);
        finalFormData.set('supabase_user_id', originalData.supabase_user_id);

        // Handle file uploads
        const fileInput = form.querySelector('#requirementUpload');
        if (fileInput && fileInput.files.length > 0) {
            changedFields.add('requirementUpload');
            finalFormData.set('requirementUpload', fileInput.files[0]);
        }

        // // If nothing changed, inform the user
        // if (changedFields.size === 0) {
        //     throw new Error('No changes detected. Please modify at least one field before submitting.');
        // }

        // // Debug: Log what's being sent
        // console.log('Changed fields:', Array.from(changedFields));
        // console.log('FormData entries:');
        // for (const [key, value] of finalFormData.entries()) {
        //     console.log(`${key}:`, value);
        // }

        const updateResponse = await fetch(updateEndpoint, {
            method: 'POST',
            body: finalFormData
        });

        const updateResult = await updateResponse.json();
        if (updateResult.status !== 'success') {
            throw new Error(updateResult.message || 'Update failed.');
        }

        sendWebSocketUpdate(appType, appId, 'edit');

        // SUCCESS ALERT - Using global BanwaSwal (centered + proper spacing)
        await BanwaSwal.fire({
            icon: 'success',
            title: 'Success!',
            html: 'Application updated successfully.'
        });

        closeEditModal();
        loadApplications();

    } catch (error) {
        console.error('Update error:', error);
        // ERROR ALERT - Using global BanwaSwal (centered + proper spacing)
        BanwaSwal.fire({
            icon: 'error',
            title: 'Update Failed',
            html: `An error occurred:<br><br><strong>${error.message}</strong>`
        });
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Changes';
    }
}

/**
 * Helper function to get original database key from form field name
 * @param {string} formKey - Form field name
 * @param {Object} keyMap - Mapping object
 * @returns {string|null} Original database key
 */
function getOriginalKey(formKey, keyMap) {
    // Check if formKey maps directly to an original key
    for (const [originalKey, mappedKey] of Object.entries(keyMap)) {
        if (mappedKey === formKey) {
            return originalKey;
        }
    }

    // Check if formKey exists as-is in the keyMap values
    if (Object.values(keyMap).includes(formKey)) {
        // Find the corresponding key
        return Object.keys(keyMap).find(key => keyMap[key] === formKey);
    }

    return formKey; // Return as-is if no mapping found
}

/**
 * Handles the submission of the payment form
 * Validates payment details and submits to the server for processing
 * 
 * @param {Event} event The form submission event
 * @param {string} appId The ID of the application for which payment is being submitted
 */
async function handleSubmitPayment(event, appId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);
        formData.append('application_id', appId);

        const response = await fetch('/server/api/resident/submit_payment.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to submit payment details.');
        }

        // SUCCESS ALERT - Using global BanwaSwal (centered + proper spacing)
        await BanwaSwal.fire({
            icon: 'success',
            title: 'Payment Submitted!',
            html: 'Payment details submitted successfully!<br><br>Your payment is now <strong>Pending Verification</strong>.'
        });
        closePaymentModal();
        loadApplications();

    } catch (error) {
        console.error('Error submitting payment:', error);
        // ERROR ALERT - Using global BanwaSwal (centered + proper spacing)
        BanwaSwal.fire({
            icon: 'error',
            title: 'Submission Failed',
            html: `Failed to submit payment:<br><br><strong>${error.message}</strong>`
        });
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment';
    }
}

/**
 * Loads and displays the resident's applications in a table format
 * Handles status-based action buttons and remarks display
 * Sorts applications by most recent status update or request date
 */
async function loadApplications() {
    const tableBody = document.getElementById('mainTableBody');
    if (!tableBody) return;

    try {
        const res = await fetch('/server/api/resident/get_applications.php');
        const data = await res.json();

        tableBody.innerHTML = '';

        if (data.error) {
            tableBody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">${data.error}</td></tr>`;
            return;
        }

        if (!data.success || !Array.isArray(data.applications) || data.applications.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">You have no active applications.</td></tr>`;
            return;
        }

        data.applications
            .sort((a, b) => {
                const dateA = new Date(a.application_date || a.created_at || a.updated_at);
                const dateB = new Date(b.application_date || b.created_at || b.updated_at);
                return dateB - dateA;
            })
            .forEach(app => {
                const tr = document.createElement('tr');

                let displayDate = 'N/A';
                if (app.updated_at) {
                    displayDate = new Date(app.updated_at).toLocaleString();
                } else if (app.created_at) {
                    displayDate = new Date(app.created_at).toLocaleString();
                } else if (app.request_date) {
                    displayDate = new Date(app.request_date).toLocaleString();
                }

                const appType = app.type || "Application";
                const businessName = app.business_name ? `<div class="detail-info">Business: ${app.business_name}</div>` : '';
                const ownerName = `<div class="detail-info">Owner: ${app.first_name} ${app.last_name}</div>`;

                const statusText = app.status || 'Pending';
                let statusClass = 'pending';
                if (statusText.toLowerCase().includes('approved')) statusClass = 'success';
                if (statusText.toLowerCase().includes('disapproved')) statusClass = 'rejected';

                let remarksBtn = '<span class="detail-info" style="font-style:italic; margin-top:5px; display:block;">No remarks</span>';

                if (app.approval_comments && app.approval_comments.trim() !== '') {
                    const safeRemarks = app.approval_comments.replace(/"/g, '&quot;');

                    remarksBtn = `
                        <button class="validation-btn view-remarks-btn" data-remarks="${safeRemarks}">
                            View Remarks
                        </button>
                        <span class="validation-hint">Click for details</span>
                    `;
                }

                let actionButtonsHtml = '';
                // Check if status is 'additional requirements' - show edit button
                if (app.status && app.status.toLowerCase() === 'additional requirements') {
                    actionButtonsHtml += `<button class="main-action-btn edit-action-btn" data-app-id="${app.id}" data-app-type="${app.type}">Edit Application</button>`;
                }

                // Check if status is 'for payment' AND no payment has been submitted yet
                if (app.status && app.status.toLowerCase() === 'for payment') {
                    // Check if payment has already been submitted
                    const hasPayment = app.has_payment === true || app.payment_status === 'pending' || app.payment_status === 'verified';

                    if (!hasPayment) {
                        actionButtonsHtml += `<button class="main-action-btn pay payment-action-btn" data-app-id="${app.id}" data-app-type="${app.type}" data-app-purpose="${app.type}">Submit Payment</button>`;
                    } else {
                        // Show a disabled state or different message if payment already submitted
                        actionButtonsHtml += '<span class="detail-info payment-submitted">Payment Submitted - Pending Verification</span>';
                    }
                }

                if (!actionButtonsHtml) actionButtonsHtml = '<span class="detail-info">Processing...</span>';

                tr.innerHTML = `
                    <td>
                        <span class="ref-id">${app.id}</span>
                        <div style="margin-top: 10px;">
                            <span class="date-label">Date Filed:</span>
                            <span class="date-filed">${displayDate}</span>
                        </div>
                    </td>
                    <td>
                        <span class="detail-title">${appType}</span>
                        ${businessName}
                        ${ownerName}
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        ${remarksBtn}
                    </td>
                    <td>
                        <div class="action-btn-group">
                            ${actionButtonsHtml}
                        </div>
                    </td>
                `;

                tableBody.appendChild(tr);

                const remarksButton = tr.querySelector('.view-remarks-btn');
                if (remarksButton) {
                    remarksButton.addEventListener('click', (e) => {
                        const comments = e.target.getAttribute('data-remarks');
                        openRemarksModal(comments);
                    });
                }

                const editBtn = tr.querySelector('.edit-action-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        const appId = e.target.getAttribute('data-app-id');
                        const appType = e.target.getAttribute('data-app-type');
                        openEditModalFor(appId, appType);
                    });
                }

                const payBtn = tr.querySelector('.payment-action-btn');
                if (payBtn) {
                    payBtn.addEventListener('click', (e) => {
                        const appId = e.target.getAttribute('data-app-id');
                        const appType = e.target.getAttribute('data-app-type');
                        const appPurpose = e.target.getAttribute('data-app-purpose');
                        openPaymentModalFor(appId, appType, appPurpose);
                    });
                }
            });

    } catch (err) {
        console.error('Error loading applications:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Failed to load applications.</td></tr>`;
    }
}

/**
 * Loads and displays the resident's payment history in a table format
 * Shows payment details, status, and reference information
 * Sorts payments by most recent payment date
 */
async function loadPayments() {
    const tableBody = document.getElementById('mainTableBody');
    if (!tableBody) return;

    try {
        const res = await fetch('/server/api/resident/get_payment.php');
        const data = await res.json();

        tableBody.innerHTML = '';

        if (data.error) {
            tableBody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">${data.error}</td></tr>`;
            return;
        }

        if (!data.success || !Array.isArray(data.payments) || data.payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No payment history found.</td></tr>`;
            return;
        }

        data.payments
            .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
            .forEach(payment => {
                const tr = document.createElement('tr');

                const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                let statusClass = 'pending';
                if (payment.status === 'Verified') statusClass = 'success';

                tr.innerHTML = `
                    <td>
                        <span class="ref-id">${payment.id}</span>
                        <div style="margin-top: 10px;">
                            <span class="date-label">Paid On:</span>
                            <span class="date-filed">${paymentDate}</span>
                        </div>
                    </td>
                    <td>
                        <span class="detail-title">${payment.type || 'Payment'}</span>
                        <div class="detail-info">Amount: ₱${parseFloat(payment.amount).toFixed(2)}</div>
                        <div class="detail-info">Ref: ${payment.reference_number || 'N/A'}</div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${payment.status || 'Pending'}</span>
                    </td>
                    <td>
                        <div class="action-btn-group">
                            <button class="main-action-btn" style="background-color: #17a2b8;">View Receipt</button>
                        </div>
                    </td>
                `;

                tableBody.appendChild(tr);
            });

    } catch (err) {
        console.error('Error loading payment history:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Failed to load history.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadCurrentTab();        // loads "Applications" tab by default
});



/**
 * Checks for updates on resident applications by fetching data from the server
 * Compares the current status of each application with the last known status
 * Triggers notifications and updates the UI if a status change is detected
*/
let lastStatuses = {};
async function checkStatusUpdates() {
    try {
        const res = await fetch('/server/api/resident/get_applications.php');
        const data = await res.json();

        if (data.success && Array.isArray(data.applications)) {
            data.applications.forEach(app => {
                const key = `${app.type}_${app.id}`;
                const prevStatus = lastStatuses[key];
                const currentStatus = app.status || 'Pending';

                if (prevStatus && prevStatus !== currentStatus) {
                    showStatusNotification(app.id, app.type, currentStatus);
                    loadApplications();
                }

                lastStatuses[key] = currentStatus;
            });
        }
    } catch (err) {
        console.error('Error checking status updates:', err);
    }
}

/**
 * Displays a browser notification when an application's status changes
 * Requests notification permission if not already granted
 * Uses a service worker to show the notification with relevant application details
 */
function showStatusNotification(appId, appType, newStatus) {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
        return;
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Application Status Updated", {
                body: `${appType} application ID ${appId} is now "${newStatus}"`,
                icon: "/client/img/banwalogo.png",
                data: { url: "/client/pages/resident/status.php" }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sockets["construction_applications"]) {
        initSocket("construction_applications", "ws://localhost:8081", data => {
            if (data.type === "construction_applications_update") {
                loadApplications();
                checkStatusUpdates();
            }
        });
    }

    if (!sockets["business_applications"]) {
        initSocket("business_applications", "ws://localhost:8081", data => {
            if (data.type === "business_applications_update") {
                loadApplications();
                checkStatusUpdates();
            }
        });
    }

    if (!sockets["utility_applications"]) {
        initSocket("utility_applications", "ws://localhost:8081", data => {
            if (data.type === "utility_applications_update") {
                loadApplications();
                checkStatusUpdates();
            }
        });
    }

    checkStatusUpdates(); // Initial load
});
