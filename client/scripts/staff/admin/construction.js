function decodeRow(el) {
    return JSON.parse(atob(el.getAttribute('data-row')));
}

function openView(btn) {
    const data = decodeRow(btn);
    
    updateViewField('viewPermitNo', data.permit_no);
    updateViewField('viewHomeowner', data.homeowner_name);
    updateViewField('viewContractor', data.contractor_name);
    updateViewField('viewAddress', data.address_of_construction);
    updateViewField('viewNature', data.nature_of_activity);
    updateViewField('viewWorkType', data.type_of_work);
    updateViewField('viewWorkDetails', data.details_of_work);
    updateViewField('viewStartDate', data.start_date);
    updateViewField('viewEndDate', data.end_date);
    updateViewField('viewWorkers', data.num_of_workers);
    updateViewField('viewWorkingDays', data.num_of_working_days);
    updateViewField('viewFee', data.fee_paid ? `₱${parseFloat(data.fee_paid).toFixed(2)}` : null);
    updateViewField('viewPaymentType', data.payment_type);
    updateViewField('viewApprovedBy', data.approved_by);
    updateViewField('viewNotedBy', data.noted_by);
    updateViewField('viewRemarks', data.remarks);
    
    const paymentStatusElem = document.getElementById('viewPaymentStatus');
    if (paymentStatusElem) {
        paymentStatusElem.innerHTML = data.payment_status ? 
            `<span class="status-badge status-${data.payment_status.toLowerCase()}">${data.payment_status}</span>` : 
            'N/A';
    }
    
    updateFileAttachments(data);
    
    document.getElementById('viewModal').style.display = 'block';
}

function updateViewField(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || 'N/A';
    }
}

function updateFileAttachments(data) {
    const blueprintElem = document.getElementById('viewBlueprint');
    const additionalElem = document.getElementById('viewAdditionalFiles');
    
    if (blueprintElem) {
        blueprintElem.innerHTML = data.blueprint_image_path ? 
            `<a href="${data.blueprint_image_path}" target="_blank">View File</a>` : 
            'No blueprint uploaded';
    }
    
    if (additionalElem && data.additional_images) {
        const files = data.additional_images.split(',');
        additionalElem.innerHTML = files.map((file, index) => 
            `<p style="margin-left: 20px;">• <a href="${file}" target="_blank">File ${index + 1}</a></p>`
        ).join('');
    } else if (additionalElem) {
        additionalElem.innerHTML = 'No additional files uploaded';
    }
}

function openEdit(el) {
    const data = decodeRow(el);
    console.log('Payment Status from data:', data.payment_status); // Debug line
    
    document.getElementById('f_construction_id').value = data.construction_id || '';
    document.getElementById('f_permit_no').value = data.permit_no || '';
    document.getElementById('f_homeowner_name').value = data.homeowner_name || '';
    document.getElementById('f_contractor_name').value = data.contractor_name || '';
    document.getElementById('f_address_of_construction').value = data.address_of_construction || '';
    document.getElementById('f_nature_of_activity').value = data.nature_of_activity || '';
    document.getElementById('f_type_of_work').value = data.type_of_work || '';
    document.getElementById('f_details_of_work').value = data.details_of_work || '';
    document.getElementById('f_start_date').value = data.start_date || '';
    document.getElementById('f_end_date').value = data.end_date || '';
    document.getElementById('f_num_of_workers').value = data.num_of_workers || '';
    document.getElementById('f_num_of_working_days').value = data.num_of_working_days || '';
    document.getElementById('f_fee_paid').value = data.fee_paid || '';
    document.getElementById('f_payment_type').value = data.payment_type || '';
    document.getElementById('f_payment_status').value = data.payment_status || '';
    document.getElementById('f_approved_by').value = data.approved_by || '';
    document.getElementById('f_noted_by').value = data.noted_by || '';
    document.getElementById('f_remarks').value = data.remarks || '';
    document.getElementById('f_existing_blueprint').value = data.blueprint_image_path || '';
    document.getElementById('f_existing_additional').value = data.additional_images || '';
    
    console.log('Payment Status field value:', document.getElementById('f_payment_status').value); // Debug line
    
    const blueprintPreview = document.getElementById('current-blueprint');
    const additionalPreview = document.getElementById('current-additional');
    
    if (blueprintPreview) {
        blueprintPreview.innerHTML = data.blueprint_image_path ? 
            `<strong>Current:</strong> <a href="${data.blueprint_image_path}" target="_blank">${data.blueprint_image_path.split('/').pop()}</a>` : 
            '<em>No blueprint uploaded</em>';
    }
    
    if (additionalPreview) {
        if (data.additional_images) {
            const files = data.additional_images.split(',');
            additionalPreview.innerHTML = `<strong>Current files (${files.length}):</strong><br>` + 
                files.map(file => `<a href="${file}" target="_blank">${file.split('/').pop()}</a>`).join('<br>');
        } else {
            additionalPreview.innerHTML = '<em>No additional files uploaded</em>';
        }
    }
    
    document.getElementById('editModal').style.display = 'block';
}

function closeView() { 
    document.getElementById('viewModal').style.display = 'none'; 
}

function closeEdit() { 
    document.getElementById('editModal').style.display = 'none'; 
}

function sortTable(column) {
    const url = new URL(window.location.href);
    const currentSort = url.searchParams.get('sort');
    const currentOrder = url.searchParams.get('order');
    
    let newOrder = 'ASC';
    if (currentSort === column && currentOrder === 'ASC') {
        newOrder = 'DESC';
    }
    
    url.searchParams.set('sort', column);
    url.searchParams.set('order', newOrder);
    window.location.href = url.toString();
}

function initializeAutoSearch() {
    const searchInput = document.querySelector('input[name="search"]');
    const searchButton = document.querySelector('button[type="button"]');
    const tableBody = document.querySelector('tbody');
    let searchTimeout;

    if (searchInput && tableBody) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                performAjaxSearch(searchTerm, tableBody);
            }, 300);
        });

        if (searchButton) {
            searchButton.addEventListener('click', function(e) {
                e.preventDefault();
                const searchTerm = searchInput.value.trim();
                performAjaxSearch(searchTerm, tableBody);
            });
        }

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                const searchTerm = searchInput.value.trim();
                performAjaxSearch(searchTerm, tableBody);
            }
        });
    }
}

function performAjaxSearch(searchTerm, tableBody) {
    tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Searching...</td></tr>';
    
    const formData = new FormData();
    formData.append('ajax_search', 'true');
    formData.append('search', searchTerm);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', window.location.href, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            tableBody.innerHTML = xhr.responseText;
        } else {
            tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Error loading results</td></tr>';
        }
    };
    
    xhr.onerror = function() {
        tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Connection error</td></tr>';
    };
    
    xhr.send(formData);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAutoSearch();
});

window.onclick = function(event) {
    const viewModal = document.getElementById('viewModal');
    const editModal = document.getElementById('editModal');
    
    if (event.target === viewModal) closeView();
    if (event.target === editModal) closeEdit();
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeView();
        closeEdit();
    }
});