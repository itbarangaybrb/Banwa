
    // Configuration
    const API_URL = '../../scripts/business_staff/business_handler.php';
    // NOTE: Adjust this path to where your 'uploads' folder is located relative to this 'business.php' file.
    const UPLOADS_BASE_PATH = '../../scripts/business_staff/uploads/'; // <--- This must be correct 

    let applications = [];

    // ===================================
    // TAB SWITCHING
    // ===================================
    function switchTab(event, tabName) {
        event.preventDefault();
        
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        if (tabName === 'review') {
            loadReviewTable();
        } else if (tabName === 'approve') {
            loadApprovalTable();
        } else if (tabName === 'summary') {
            loadSummarySelect();
        }
    }

    // ===================================
    // FETCH APPLICATIONS FROM DATABASE
    // ===================================
    function loadApplicationsFromDB() {
        // Updated to return the Promise for better control of async operations
        return fetch(`${API_URL}?action=fetch`)
            .then(response => {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return response.json();
                } else {
                    // Throw an error if the response is not JSON
                    return response.text().then(text => {
                            console.error('Non-JSON Response:', text);
                            throw new Error('Server did not return JSON. Check PHP script for errors.');
                    });
                }
            })
            .then(data => {
                if (data.status === 'success') {
                    applications = data.data;
                } else {
                    showAlert('Error loading applications: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Failed to load applications from database. See console for details.', 'danger');
            });
    }

    // ===================================
    // LOAD REVIEW TABLE
    // ===================================
    function loadReviewTable() {
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Loading applications...</td></tr>';
        
        loadApplicationsFromDB().finally(() => { // Use finally to ensure we update the table regardless of success/fail
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            if (applications.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No applications found</td></tr>';
                return;
            }

            applications.forEach(app => {
                const row = document.createElement('tr');
                const ownerName = app.first_name + (app.middle_name ? ' ' + app.middle_name : '') + ' ' + app.last_name;
                row.innerHTML = `
                    <td>${app.id}</td>
                    <td>${app.business_name}</td>
                    <td>${ownerName}</td>
                    <td>${app.nature_of_business}</td>
                    <td>${app.application_date}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
    }

    // ===================================
    // LOAD APPROVAL TABLE
    // ===================================
    function loadApprovalTable() {
        document.getElementById('approvalTableBody').innerHTML = '<tr><td colspan="5" class="loading"><div class="spinner"></div>Loading applications...</td></tr>';

        loadApplicationsFromDB().finally(() => {
            const tbody = document.getElementById('approvalTableBody');
            tbody.innerHTML = '';
            
            if (applications.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;">No applications found</td></tr>';
                return;
            }

            applications.forEach(app => {
                const row = document.createElement('tr');
                const ownerName = app.first_name + (app.middle_name ? ' ' + app.middle_name : '') + ' ' + app.last_name;
                row.innerHTML = `
                    <td>${app.id}</td>
                    <td>${app.business_name}</td>
                    <td>${ownerName}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-success" onclick="openApproveModal(${app.id})">✅ Approve</button>
                            <button class="btn-danger" onclick="openDisapproveModal(${app.id})">❌ Disapprove</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
    }

    // ===================================
    // LOAD SUMMARY SELECT
    // ===================================
    function loadSummarySelect() {
        loadApplicationsFromDB().finally(() => {
            const select = document.getElementById('summaryApplicationSelect');
            select.innerHTML = '<option value="">Choose an application to view summary</option>';
            
            applications.forEach(app => {
                const option = document.createElement('option');
                option.value = app.id;
                option.textContent = `${app.id} - ${app.business_name}`;
                select.appendChild(option);
            });
            updateSummary(); // Call updateSummary to clear the output if nothing is selected
        });
    }

    // ===================================
    // VIEW DETAILS (MODIFIED to include comments & file link)
    // ===================================
    function viewDetails(appId) {
        const app = applications.find(a => a.id == appId);
        if (!app) return;

        const businessStatus = Array.isArray(app.business_status) ? app.business_status.join(', ') : 'Not specified';
        const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';
        
        // Build the uploaded file link HTML
        const fileUploadHtml = app.requirement_upload 
            ? `<a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" target="_blank">View Document (${app.requirement_upload})</a>` 
            : 'No file uploaded';

        // Build comments HTML
        let commentsHtml = '';
        if (app.status === 'Approved' && app.approval_comments) {
            commentsHtml = `<p><strong>Approval Comments:</strong> ${app.approval_comments}</p>`;
        } else if (app.status === 'Disapproved' && app.disapproval_reason) {
            commentsHtml = `<p><strong>Disapproval Reason:</strong> ${app.disapproval_reason}</p>`;
        }


        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="summary-card">
                <h3>📍 Business Information</h3>
                <p><strong>Application ID:</strong> ${app.id}</p>
                <p><strong>Business Name:</strong> ${app.business_name}</p>
                <p><strong>Type of Business:</strong> ${app.type_of_business}</p>
                <p><strong>Nature of Business:</strong> ${app.nature_of_business}</p>
                <p><strong>Business Address:</strong> ${app.address_of_business}</p>
                <p><strong>Business Status:</strong> ${businessStatus}</p>
                <p><strong>Business Telephone:</strong> ${app.telephone_no_business}</p>
                <p><strong>Email Address:</strong> ${app.email_address}</p>
            </div>

            <div class="summary-card">
                <h3>👤 Owner Information</h3>
                <p><strong>Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</p>
                <p><strong>Telephone:</strong> ${app.telephone_no_owner}</p>
                <p><strong>Address:</strong> ${app.address_owner}</p>
            </div>

            <div class="summary-card">
                <h3>🏢 Business Structure</h3>
                <p><strong>Structure Type:</strong> ${app.type_of_structure}</p>
                <p><strong>Number of Employees:</strong> ${app.no_of_employees}</p>
            </div>

            <div class="summary-card">
                <h3>📋 Requirements</h3>
                <p><strong>Submitted:</strong> ${requirementsList}</p>
                <p><strong>Uploaded File:</strong> ${fileUploadHtml}</p>
            </div>

            <div class="summary-card">
                <h3>📅 Application Details</h3>
                <p><strong>Application Date:</strong> ${app.application_date}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></p>
                ${commentsHtml}
            </div>
        `;
        openModal('detailsModal');
    }

    // ===================================
    // APPROVE/DISAPPROVE FUNCTIONS
    // ===================================
    function openApproveModal(appId) {
        document.getElementById('approveAppId').value = appId;
        document.getElementById('approveForm').reset();
        openModal('approveModal');
    }

    function openDisapproveModal(appId) {
        document.getElementById('disapproveAppId').value = appId;
        document.getElementById('disapproveForm').reset();
        openModal('disapproveModal');
    }

    function submitApproval(event) {
        event.preventDefault();
        
        const appId = document.getElementById('approveAppId').value;
        const comments = document.getElementById('approvalComments').value;
        
        const formData = new FormData();
        formData.append('action', 'approve');
        formData.append('id', appId);
        formData.append('approvalComments', comments);

        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal('approveModal');
                showAlert('Application approved successfully!', 'success');
                loadApplicationsFromDB();
                loadApprovalTable();
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to approve application', 'danger');
        });
    }

    function submitDisapproval(event) {
        event.preventDefault();
        
        const appId = document.getElementById('disapproveAppId').value;
        const reason = document.getElementById('disapprovalReason').value;
        
        const formData = new FormData();
        formData.append('action', 'disapprove');
        formData.append('id', appId);
        formData.append('disapprovalReason', reason);

        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal('disapproveModal');
                showAlert('Application disapproved successfully!', 'success');
                loadApplicationsFromDB();
                loadApprovalTable();
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to disapprove application', 'danger');
        });
    }

    // ===================================
    // CREATE APPLICATION
    // ===================================
    function createApplication(event) {
        event.preventDefault();
        
        const formData = new FormData(document.getElementById('createForm'));
        formData.append('action', 'create');

        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('createForm').reset();
                showAlert(`Business Application created successfully! ID: ${data.id}`, 'success');
                loadApplicationsFromDB();
            } else {
                showAlert('Error: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to create application', 'danger');
        });
    }

    // ===================================
    // UPDATE SUMMARY (MODIFIED to include comments & file link)
    // ===================================
    function updateSummary() {
        const appId = document.getElementById('summaryApplicationSelect').value;
        const summaryOutput = document.getElementById('summaryOutput');
        
        if (!appId) {
            summaryOutput.innerHTML = '';
            return;
        }
        
        const app = applications.find(a => a.id == appId);
        if (!app) return;

        const businessStatus = Array.isArray(app.business_status) ? app.business_status.join(', ') : 'Not specified';
        const requirementsList = Array.isArray(app.requirements) ? app.requirements.join(', ') : 'None';
        
        // Build the uploaded file link HTML
        const fileUploadHtml = app.requirement_upload 
            ? `<a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" target="_blank">View Document (${app.requirement_upload})</a>` 
            : 'No file uploaded';
        
        // Build comments HTML
        let commentsHtml = '';
        if (app.status === 'Approved' && app.approval_comments) {
            commentsHtml = `<p><strong>Approval Comments:</strong> ${app.approval_comments}</p>`;
        } else if (app.status === 'Disapproved' && app.disapproval_reason) {
            commentsHtml = `<p><strong>Disapproval Reason:</strong> ${app.disapproval_reason}</p>`;
        }


        summaryOutput.innerHTML = `
            <div class="summary-card">
                <h3>📄 Business Application Summary Report</h3>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>
            </div>

            <div class="summary-card">
                <h3>📍 Business Information</h3>
                <p><strong>Business Name:</strong> ${app.business_name}</p>
                <p><strong>Type of Business:</strong> ${app.type_of_business}</p>
                <p><strong>Nature of Business:</strong> ${app.nature_of_business}</p>
                <p><strong>Business Address:</strong> ${app.address_of_business}</p>
                <p><strong>Business Address Status:</strong> ${businessStatus}</p>
                <p><strong>Business Telephone:</strong> ${app.telephone_no_business}</p>
                <p><strong>Email Address:</strong> ${app.email_address}</p>
            </div>

            <div class="summary-card">
                <h3>👤 Owner Information</h3>
                <p><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</p>
                <p><strong>Owner Telephone:</strong> ${app.telephone_no_owner}</p>
                <p><strong>Owner Address:</strong> ${app.address_owner}</p>
            </div>

            <div class="summary-card">
                <h3>🏢 Business Structure & Operations</h3>
                <p><strong>Structure Type:</strong> ${app.type_of_structure}</p>
                <p><strong>Number of Employees:</strong> ${app.no_of_employees}</p>
            </div>

            <div class="summary-card">
                <h3>📋 Requirements Submitted</h3>
                <p><strong>Documents:</strong> ${requirementsList}</p>
                <p><strong>Uploaded File:</strong> ${fileUploadHtml}</p>
            </div>

            <div class="summary-card">
                <h3>📅 Application Status</h3>
                <p><strong>Submission Date:</strong> ${app.application_date}</p>
                <p><strong>Current Status:</strong> <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></p>
                ${commentsHtml}
            </div>

            <div class="button-group">
                <button class="btn-primary" onclick="printSummary()">🖨️ Print Summary</button>
                <button class="btn-secondary" onclick="downloadSummary(${app.id})">📥 Download</button>
            </div>
        `;
    }

    // ===================================
    // FILTER APPLICATIONS
    // ===================================
    function filterApplications() {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const tbody = document.getElementById('tableBody');
        
        tbody.innerHTML = '';
        
        const filtered = applications.filter(app => 
            app.business_name.toLowerCase().includes(searchInput) ||
            (app.first_name + ' ' + app.last_name).toLowerCase().includes(searchInput) ||
            app.id.toString().includes(searchInput)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No applications found</td></tr>';
            return;
        }

        filtered.forEach(app => {
            const row = document.createElement('tr');
            const ownerName = app.first_name + (app.middle_name ? ' ' + app.middle_name : '') + ' ' + app.last_name;
            row.innerHTML = `
                <td>${app.id}</td>
                <td>${app.business_name}</td>
                <td>${ownerName}</td>
                <td>${app.nature_of_business}</td>
                <td>${app.application_date}</td>
                <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-info" onclick="viewDetails(${app.id})">👁️ View</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // ===================================
    // MODAL FUNCTIONS
    // ===================================
    function openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // ===================================
    // ALERT FUNCTION
    // ===================================
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} active`;
        alertDiv.textContent = message;
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('active');
        }, 4000);
    }

    // ===================================
    // PRINT & DOWNLOAD (MODIFIED for Styled HTML/DOC)
    // ===================================
    function printSummary() {
        window.print();
    }

    function downloadSummary(appId) {
        const app = applications.find(a => a.id == appId);
        if (!app) return;

        // Prepare list data for HTML
        const businessStatus = Array.isArray(app.business_status) ? app.business_status.join(', ') : 'Not specified';
        const requirementsList = Array.isArray(app.requirements) ? app.requirements.join('</li><li>') : 'None';
        
        // Generate HTML for file upload link
        const fileUploadText = app.requirement_upload 
            ? `<li><strong>Uploaded File:</strong> <a href="${UPLOADS_BASE_PATH}${app.requirement_upload}" style="color:#007bff; text-decoration: none;">View Document (${app.requirement_upload})</a></li>`
            : '<li><strong>Uploaded File:</strong> No file uploaded</li>';
        
        // Generate HTML for comments
        let commentsHtml = '';
        if (app.status === 'Approved' && app.approval_comments) {
            commentsHtml = `<div class="comment-box approval"><h3>✅ Approval Comments</h3><p>${app.approval_comments}</p></div>`;
        } else if (app.status === 'Disapproved' && app.disapproval_reason) {
            commentsHtml = `<div class="comment-box disapproval"><h3>❌ Disapproval Reason</h3><p>${app.disapproval_reason}</p></div>`;
        }

        // Generate the full HTML content with embedded CSS for styling
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Business Application Summary Report - ${app.id}</title>
            <style>
                /* Define professional styles for Word to render */
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                h1 { color: #5B479B; border-bottom: 3px solid #826EEA; padding-bottom: 10px; font-size: 24pt; }
                h2 { color: #826EEA; margin-top: 30px; font-size: 16pt; }
                .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
                .info-list { list-style-type: none; padding: 0; }
                /* Creates alignment for key/value pairs */
                .info-list li { margin-bottom: 8px; }
                .info-list strong { display: inline-block; width: 180px; font-weight: bold; } 
                /* Status badge styling */
                .status-badge { background-color: ${app.status === 'Approved' ? '#d4edda' : app.status === 'Disapproved' ? '#f8d7da' : '#fff3cd'}; color: ${app.status === 'Approved' ? '#155724' : app.status === 'Disapproved' ? '#721c24' : '#856404'}; padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 10pt;}
                /* Comments Box Styling */
                .comment-box { margin-top: 20px; padding: 15px; border-radius: 5px; }
                .comment-box h3 { font-size: 12pt; }
                .comment-box.approval { border: 1px solid #c3e6cb; background-color: #d4edda; }
                .comment-box.disapproval { border: 1px solid #f5c6cb; background-color: #f8d7da; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Business Application Summary Report</h1>
                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Application ID:</strong> ${app.id}</p>

                <h2>📍 Business Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Business Name:</strong> ${app.business_name}</li>
                        <li><strong>Type of Business:</strong> ${app.type_of_business}</li>
                        <li><strong>Nature of Business:</strong> ${app.nature_of_business}</li>
                        <li><strong>Business Address:</strong> ${app.address_of_business}</li>
                        <li><strong>Business Address Status:</strong> ${businessStatus}</li>
                        <li><strong>Business Telephone:</strong> ${app.telephone_no_business}</li>
                        <li><strong>Email Address:</strong> ${app.email_address}</li>
                    </ul>
                </div>

                <h2>👤 Owner Information</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Owner Name:</strong> ${app.first_name} ${app.middle_name || ''} ${app.last_name}</li>
                        <li><strong>Owner Telephone:</strong> ${app.telephone_no_owner}</li>
                        <li><strong>Owner Address:</strong> ${app.address_owner}</li>
                    </ul>
                </div>

                <h2>🏢 Structure & Requirements</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Structure Type:</strong> ${app.type_of_structure}</li>
                        <li><strong>Number of Employees:</strong> ${app.no_of_employees}</li>
                        <li><strong>Required Documents:</strong> 
                            <ul style="padding-left: 20px; margin-top: 5px; list-style-type: disc;"><li>${requirementsList}</li></ul>
                        </li>
                        ${fileUploadText}
                    </ul>
                </div>

                <h2>📅 Application Status</h2>
                <div class="card">
                    <ul class="info-list">
                        <li><strong>Submission Date:</strong> ${app.application_date}</li>
                        <li><strong>Current Status:</strong> <span class="status-badge">${app.status}</span></li>
                    </ul>
                    ${commentsHtml}
                </div>
            </div>
        </body>
        </html>
                    `;

        // Use application/msword to force it to open in MS Word
        const blob = new Blob([htmlContent], { type: 'application/msword' }); 
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Business_Application_${app.id}_Summary.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // ===================================
    // CLOSE MODAL ON OUTSIDE CLICK
    // ===================================
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.classList.remove('active');
            }
        });
    }

    // ===================================
    // INITIALIZE ON LOAD
    // ===================================
    window.addEventListener('load', function() {
        loadReviewTable();
    });
