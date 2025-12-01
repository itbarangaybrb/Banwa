<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Utilities Application Management System</title>
	<link rel="stylesheet" href="../../../styles/staff/utilities_staff/utilities.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
	<!-- Sidebar -->
	<aside class="side_nav">
		<div class="nav_header">
			<div class="nav_logo">☰</div>
			<div class="logo_title">
				<img class="logo" src="../../../img/banwalogo.png" alt="BANWA Logo">
				<span class="company_name">BANWA</span>
			</div>
		</div>
		<ul class="nav_list">
			<div>
				<li>
					<a href="#" class="nav_select active" data-tab="review">
						<svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="nav_text">Review & Search</span>
					</a>
				</li>
				<li>
					<a href="#" class="nav_select" data-tab="create">
						<svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="nav_text">Create New</span>
					</a>
				</li>
				<li>
					<a href="#" class="nav_select" data-tab="process">
						<svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
						</svg>
						<span class="nav_text">Process & Assess</span>
					</a>
				</li>
				<li>
					<a href="#" class="nav_select" data-tab="summary">
						<svg class="nav_icon" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<polyline points="13 2 13 9 20 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="nav_text">Generate Summary</span>
					</a>
				</li>
			</div>
			<div>
				<li>
					<button class="nav_select_btn" id="userProfileBtn">
						<div class="user_image_container">
							<span class="user_avatar_sidebar">A</span>
						</div>
						<span class="nav_text">Profile</span>
					</button>
				</li>
			</div>
		</ul>
	</aside>

	<!-- Main Content -->
	<div class="main-wrapper">
		<header class="top-header">
			<div class="header-left">
				<h1>📋 Utilities Application Management System</h1>
			</div>
			<div class="header-right">
				<div class="user-greeting">
					<p class="username">Admin</p>
					<div class="user_image">
						<span class="user_avatar_header">A</span>
					</div>
				</div>
			</div>
		</header>

		<div class="content">
			<div id="alert-container"></div>

			<div id="review" class="tab-pane active">
				<h2>Review Utilities Applications</h2>
				<div class="search-box">
					<input type="text" id="searchInput" placeholder="Search..." onkeyup="filterApplications()">
				</div>
				<div class="table-responsive">
					<table id="applicationsTable">
						<thead>
							<tr>
								<th>ID</th>
								<th>Utility Name</th>
								<th>Owner</th>
								<th>Status</th>
								<th>Payment</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="tableBody">
							<tr><td colspan="6" class="loading"><div class="spinner"></div>Loading...</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div id="create" class="tab-pane">
				<h2>Create New Utilities Application</h2>
				<p class="form-description">Fill in the details to create a new utilities application</p>

				<form id="createForm" onsubmit="createApplication(event)">
					<div class="section-title">📍 Application Details</div>

					<div class="form-row">
						<div class="form-group">
							<label for="requestDate">Request Date</label>
							<input type="date" id="requestDate" name="requestDate" required>
							<div class="error-msg"></div>
						</div>

						<div class="form-group">
							<label for="dateOfWork">Date of Work</label>
							<input type="date" id="dateOfWork" name="dateOfWork" required>
							<div class="error-msg"></div>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="fullname">Fullname</label>
							<input type="text" id="fullname" name="fullname" required>
							<div class="error-msg"></div>
						</div>

						<div class="form-group">
							<label for="contactNo">Contact No.</label>
							<input type="tel" id="contactNo" name="contactNo" maxlength="11" pattern="[0-9]{1,11}" required>
							<div class="error-msg"></div>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="address">Address</label>
							<input type="text" id="address" name="address" required>
							<div class="error-msg"></div>
						</div>

						<div class="form-group">
							<label for="provider">Select Provider</label>
							<select id="provider" name="provider" required>
								<option value="">Select</option>
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
							<div class="error-msg"></div>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="natureOfWork">Nature of Work</label>
							<select id="natureOfWork" name="natureOfWork" required>
								<option value="">Select</option>
								<option value="New Installation">New Installation</option>
								<option value="Repair/Maintenance">Repair/Maintenance</option>
								<option value="Permanent Disconnection">Permanent Disconnection</option>
								<option value="Reconnection">Reconnection</option>
							</select>
							<div class="error-msg"></div>
						</div>
					</div>

					<div class="button-group">
						<button type="submit" class="btn-primary">✅ Create Application</button>
						<button type="reset" class="btn-secondary">🔄 Clear Form</button>
					</div>
				</form>
			</div>

			<div id="process" class="tab-pane">
				<h2>Process Applications</h2>
				<p class="form-description">Assess fees, send for payment, or issue final approval.</p>
                
				<div class="table-responsive">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Utility Name</th>
								<th>Current Status</th>
								<th>Payment Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="processTableBody">
							<tr><td colspan="5" class="loading"><div class="spinner"></div>Loading...</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div id="summary" class="tab-pane">
				<h2>Generate Summary</h2>
				<div class="form-group">
					<select id="summaryApplicationSelect" onchange="updateSummary()"></select>
				</div>
				<div id="summaryOutput"></div>
			</div>
			<div id="detailsModal" class="modal">
				<div class="modal-content">
					<div class="modal-header">
						<h2>Application Details</h2>
						<button class="close-btn" onclick="closeModal('detailsModal')">&times;</button>
					</div>
					<div id="modalBody"></div>
				</div>
			</div>

			<div id="updateModal" class="modal">
				<div class="modal-content">
					<div class="modal-header">
						<h2>⚙️ Update Application Status</h2>
						<button class="close-btn" onclick="closeModal('updateModal')">&times;</button>
					</div>
					<form id="updateForm" onsubmit="submitUpdate(event)">
						<input type="hidden" id="updateAppId" name="id">
                        
						<div class="form-group">
							<label>Current Status:</label>
							<input type="text" id="displayCurrentStatus" readonly style="background:#eee; color:#555;">
						</div>

						<div class="form-group">
							<label for="newStatus">New Status *</label>
							<select id="newStatus" name="newStatus" required onchange="toggleAmountField()">
								<option value="" disabled selected>Select Action...</option>
								<option value="Pre-Approved">Pre-Approved</option>
								<option value="Additional Requirements">Additional Requirements</option>
								<option value="For Payment">For Payment (Assessment)</option>
								<option value="Approved">Approved (Final)</option>
								<option value="Disapproved">Disapproved</option>
								<option value="Cancelled">Cancelled</option>
							</select>
						</div>

						<div class="form-group hidden" id="amountFieldGroup">
							<label for="assessmentAmount">Assessment Amount (PHP) *</label>
							<input type="number" step="0.01" id="assessmentAmount" name="assessmentAmount" placeholder="0.00">
							<small style="color: #666;">Enter the total amount the applicant needs to pay.</small>
						</div>

						<div class="form-group">
							<label for="updateComments">Remarks / Comments *</label>
							<textarea id="updateComments" name="updateComments" required placeholder="Enter instructions, reasons, or notes..."></textarea>
						</div>

						<div class="button-group">
							<button type="submit" class="btn-primary">💾 Update Status</button>
							<button type="button" class="btn-secondary" onclick="closeModal('updateModal')">Cancel</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
	<script src="../../../scripts/staff/utilities_staff/utilities.js"></script>
</body>
</html>
