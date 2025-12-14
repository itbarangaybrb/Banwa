
// =================================================================
// MODAL HANDLING
// =================================================================
const editModal = document.getElementById('editModal');
const closeModalBtn = document.querySelector('.modal-close-btn');
const modalFormContent = document.getElementById('modal-form-content');

function openModal() {
    if (editModal) editModal.style.display = 'block';
}

function closeModal() {
    if (editModal) {
        editModal.style.display = 'none';
        if(modalFormContent) modalFormContent.innerHTML = ''; // Clear content
    }
}

// Close modal event listeners
if(closeModalBtn) {
    closeModalBtn.onclick = closeModal;
}

window.onclick = function(event) {
    if (event.target == editModal) {
        closeModal();
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
    openModal();

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
            cancelBtn.addEventListener('click', closeModal);
        }

    } catch (error) {
        console.error('Error opening edit modal:', error);
        modalFormContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
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
        closeModal();
        loadApplications(); // Refresh the list

    } catch (error) {
        console.error('Error submitting changes:', error);
        alert(`Error: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Changes';
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
                const editButton = app.status && app.status.toLowerCase() === 'additional requirements'
                    ? `<button class="edit-action-btn" data-app-id="${app.id}" data-app-type="${app.type}">Edit Application</button>`
                    : '';

                div.innerHTML = `
                    <h3>${fullname}</h3>
                    <p>Status: ${app.status || 'Pending'}</p>
                    <p>Submitted: ${app.request_date || 'N/A'}</p>
                    <p>Type: ${applicationType}</p>
                    ${remarks}
                    <div class="card-actions">${editButton}</div>
                `;
                
                container.appendChild(div);

                if (editButton) {
                    const button = div.querySelector('.edit-action-btn');
                    if (button) {
                        button.addEventListener('click', (e) => {
                            const appId = e.target.getAttribute('data-app-id');
                            const appType = e.target.getAttribute('data-app-type');
                            openEditModalFor(appId, appType);
                        });
                    }
                }
            });

    } catch (err) {
        console.error('Error loading applications:', err);
        document.getElementById('applicationStatus').innerText = 'Failed to load applications.';
    }
}

document.addEventListener('DOMContentLoaded', loadApplications);
