<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Application Management System</title>
    <link rel="stylesheet" href="../../styles/business_staff/business.css">

</head>
<body>
    <div class="container">
        <header>
            <h1>📋 Business Application Management System</h1>
            <p>Manage business applications with database integration</p>
        </header>

        <div class="nav-tabs">
            <button class="tab-button active" onclick="switchTab(event, 'review')">📊 Review</button>
            <button class="tab-button" onclick="switchTab(event, 'create')">➕ Create New</button>
            <button class="tab-button" onclick="switchTab(event, 'approve')">✅ Approve/Disapprove</button>
            <button class="tab-button" onclick="switchTab(event, 'summary')">📝 Generate Summary</button>
        </div>

        <div class="content">
            <div id="alert-container"></div>

            <div id="review" class="tab-pane active">
                <h2>Review Business Applications</h2>
                <p class="form-description">View and search through all submitted business applications</p>
                
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Search by business name or owner name..." onkeyup="filterApplications()">
                    <button class="btn-secondary" onclick="filterApplications()">🔍 Search</button>
                </div>

                <div class="table-responsive">
                    <table id="applicationsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Business Name</th>
                                <th>Owner Name</th>
                                <th>Nature of Business</th>
                                <th>Application Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <tr><td colspan="7" class="loading"><div class="spinner"></div>Loading applications...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="create" class="tab-pane">
                <h2>Create New Business Application</h2>
                <p class="form-description">Fill in the details to create a new business application</p>
                
                <form id="createForm" onsubmit="createApplication(event)">
                    <div class="section-title">📍 Business Information</div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="businessName">Business Name *</label>
                            <input type="text" id="businessName" name="businessName" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Type of Business *</label>
                        <div class="radio-group">
                            <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship" required> Single Proprietorship</label>
                            <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                            <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="natureOfBusinessSelect">Nature of Business *</label>
                            <select name="natureOfBusiness" id="natureOfBusinessSelect" required>
                                <option value="" disabled selected>Select</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Retailing">Retailing</option>
                                <option value="Services">Services</option>
                                <option value="Rentals">Rentals</option>
                                <option value="Wholesale/Repacking">Wholesale/Repacking</option>
                                <option value="Others">Others</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="natureOfBusinessSpecify">Specify Details (if Others)</label>
                            <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify">
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressOfBusiness">Address of Business *</label>
                            <input type="text" name="addressOfBusiness" id="addressOfBusiness" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Status of Business Address *</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="businessStatus" value="Owned"> Owned</label>
                            <label><input type="checkbox" name="businessStatus" value="Leased"> Leased</label>
                            <label><input type="checkbox" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                            <label><input type="checkbox" name="businessStatus" value="Others"> Others</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telephoneNoBusiness">Business Telephone *</label>
                            <input type="tel" id="telephoneNoBusiness" name="telephoneNoBusiness" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="emailAddress">Email Address *</label>
                            <input type="email" id="emailAddress" name="emailAddress" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">👤 Owner Information</div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">Owner First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="middleName">Owner Middle Name</label>
                            <input type="text" id="middleName" name="middleName">
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="lastName">Owner Last Name *</label>
                            <input type="text" id="lastName" name="lastName" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telephoneNoOwner">Owner Telephone *</label>
                            <input type="tel" id="telephoneNoOwner" name="telephoneNoOwner" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressOwner">Owner Address *</label>
                            <input type="text" id="addressOwner" name="addressOwner" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">🏢 Business Structure</div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="typeOfStructureSelect">Structure Type *</label>
                            <select id="typeOfStructureSelect" name="typeOfStructureSelect" required>
                                <option value="" disabled selected>Select Structure Type</option>
                                <option value="Residence">Residence</option>
                                <option value="Store">Store</option>
                                <option value="Office">Office</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Factory">Factory</option>
                                <option value="Others">Others</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="form-group">
                            <label for="typeOfStructureSpecify">Specify Details (if Others)</label>
                            <input type="text" name="typeOfStructureSpecify" id="typeOfStructureSpecify">
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="noOfEmployees">Number of Employees *</label>
                            <input type="number" id="noOfEmployees" name="noOfEmployees" min="0" max="99" required>
                            <div class="error-msg"></div>
                        </div>
                    </div>

                    <div class="section-title">📋 Requirements (Photocopy Only)</div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="requirements" value="SEC"> SEC</label>
                            <label><input type="checkbox" name="requirements" value="DTI"> DTI</label>
                            <label><input type="checkbox" name="requirements" value="TCT"> TCT</label>
                            <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                            <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                        </div>
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="requirementUpload">Upload Document</label>
                        <input type="file" id="requirementUpload" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png">
                        <div class="error-msg"></div>
                    </div>

                    <div class="form-group">
                        <label for="applicationDate">Application Date *</label>
                        <input type="date" id="applicationDate" name="applicationDate" required>
                        <div class="error-msg"></div>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-primary">✅ Create Application</button>
                        <button type="reset" class="btn-secondary">🔄 Clear Form</button>
                    </div>
                </form>
            </div>

            <div id="approve" class="tab-pane">
                <h2>Approve or Disapprove Applications</h2>
                <p class="form-description">Review pending applications and take action</p>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Business Name</th>
                                <th>Owner Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="approvalTableBody">
                            <tr><td colspan="5" class="loading"><div class="spinner"></div>Loading applications...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="summary" class="tab-pane">
                <h2>Generate Business Application Summary</h2>
                <p class="form-description">Select an application to view its detailed summary</p>
                
                <div class="form-group">
                    <label for="summaryApplicationSelect">Select Application *</label>
                    <select id="summaryApplicationSelect" onchange="updateSummary()">
                        <option value="">Choose an application to view summary</option>
                    </select>
                </div>

                <div id="summaryOutput"></div>
            </div>
        </div>
    </div>

    <div id="detailsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Business Application Details</h2>
                <button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
            </div>
            <div id="modalBody"></div>
        </div>
    </div>

    <div id="approveModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Approve Application</h2>
                <button class="close-btn" onclick="closeModal('approveModal')">&times;</button>
            </div>
            <form id="approveForm" onsubmit="submitApproval(event)">
                <input type="hidden" id="approveAppId" name="id">
                <div class="form-group">
                    <label for="approvalComments">Comments *</label>
                    <textarea id="approvalComments" name="approvalComments" required></textarea>
                </div>
                <div class="button-group">
                    <button type="submit" class="btn-success">✅ Approve</button>
                    <button type="button" class="btn-secondary" onclick="closeModal('approveModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div id="disapproveModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Disapprove Application</h2>
                <button class="close-btn" onclick="closeModal('disapproveModal')">&times;</button>
            </div>
            <form id="disapproveForm" onsubmit="submitDisapproval(event)">
                <input type="hidden" id="disapproveAppId" name="id">
                <div class="form-group">
                    <label for="disapprovalReason">Reason for Disapproval *</label>
                    <textarea id="disapprovalReason" name="disapprovalReason" required></textarea>
                </div>
                <div class="button-group">
                    <button type="submit" class="btn-danger">❌ Disapprove</button>
                    <button type="button" class="btn-secondary" onclick="closeModal('disapproveModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../../scripts/business_staff/business.js"></script>

</body>
</html>

