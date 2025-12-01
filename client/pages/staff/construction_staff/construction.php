<?php include __DIR__ . '/../../../scripts/staff/construction_staff/construction_handler.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Application Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/business_staff/business.css">
    <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="../../../styles/resident/construction_app.css">
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
                <h1>Construction Application Management System</h1>
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
            <div id="alert-container">
                <?php
                // Show flash messages based on query params or handler errors
                if (isset($_GET['success'])) {
                    if ($_GET['success'] === 'created') {
                        echo '<div class="message success">Record created successfully!</div>';
                    } elseif ($_GET['success'] === 'updated') {
                        echo '<div class="message success">Record updated successfully!</div>';
                    }
                }

                if (isset($_GET['error'])) {
                    echo '<div class="message error">' . htmlspecialchars($_GET['error']) . '</div>';
                }

                if (!empty($error_message)) {
                    echo '<div class="message error">' . htmlspecialchars($error_message) . '</div>';
                }
                ?>
            </div>

            <div id="review" class="tab-pane active">
                <h2>Construction Permit Records</h2>
                <?php if (isset($_GET['success']) && $_GET['success'] === 'updated'): ?>
                    <div class="message success">Record updated successfully!</div>
                <?php endif; ?>

                <?php if (!empty($error_message)): ?>
                    <div class="message error"><?= htmlspecialchars($error_message) ?></div>
                <?php endif; ?>

                <div class="search-box">
                    <input type="text" id="searchInput" name="search" placeholder="Search..." autocomplete="off">
                </div>

                <div class="table-responsive">
                    <table id="applicationsTable">
                        <thead>
                            <tr>
                                <th onclick="sortTable('permit_no')">Permit No. <?= getSortIcon('permit_no') ?></th>
                                <th onclick="sortTable('homeowner_name')">Homeowner <?= getSortIcon('homeowner_name') ?></th>
                                <th onclick="sortTable('contractor_name')">Contractor <?= getSortIcon('contractor_name') ?></th>
                                <th>Address</th>
                                <th>Type of Work</th>
                                <th onclick="sortTable('start_date')">Start Date <?= getSortIcon('start_date') ?></th>
                                <th>Workers/Days</th>
                                <th onclick="sortTable('fee_paid')">Fee <?= getSortIcon('fee_paid') ?></th>
                                <th onclick="sortTable('payment_status')">Status <?= getSortIcon('payment_status') ?></th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if ($result->rowCount() === 0): ?>
                                <tr><td colspan="10" class="no-data">No records found.</td></tr>
                            <?php else: while($row = $result->fetch(PDO::FETCH_ASSOC)): ?>
                                <tr>
                                    <td><?= htmlspecialchars($row['permit_no']) ?></td>
                                    <td><?= htmlspecialchars($row['homeowner_name']) ?></td>
                                    <td><?= htmlspecialchars($row['contractor_name']) ?></td>
                                    <td class="address-cell"><?= htmlspecialchars($row['address_of_construction']) ?></td>
                                    <td><?= htmlspecialchars($row['type_of_work']) ?></td>
                                    <td><?= htmlspecialchars($row['start_date']) ?></td>
                                    <td><?= (int)$row['num_of_workers'] ?> / <?= (int)$row['num_of_working_days'] ?></td>
                                    <td>₱<?= number_format((float)$row['fee_paid'], 2) ?></td>
                                    <td><span class="status-badge status-<?= strtolower($row['payment_status']) ?>"><?= htmlspecialchars($row['payment_status']) ?></span></td>
                                    <td class="action-buttons">
                                        <button class="btn-info" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openView(this)">View</button>
                                        <button class="btn-success" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openEdit(this)">Edit</button>
                                    </td>
                                </tr>
                            <?php endwhile; endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="create" class="tab-pane">
                <h2>Create New Permit</h2>
                <p class="form-description">Create a new construction permit record.</p>

                <div class="construction-form">
                    <h3>Construction Permit Application Form</h3>

                    <form id="construction-form-staff" action="construction.php" method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="action" value="create">

                        <h3>Owner & Project Information</h3>

                        <div class="label-and-input">
                            <label for="permit_no" class="required-field">Permit No. *</label>
                            <input type="text" id="permit_no" name="permit_no" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="homeowner_name" class="required-field">Homeowner Name *</label>
                            <input type="text" id="homeowner_name" name="homeowner_name" required>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="contractor_name" class="required-field">Contractor Name</label>
                            <input type="text" id="contractor_name" name="contractor_name">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="address_of_construction" class="required-field">Address of Construction *</label>
                            <textarea id="address_of_construction" name="address_of_construction" rows="3" required></textarea>
                            <div class="error-msg"></div>
                        </div>

                        <h3>Construction Location Coordinates</h3>

                        <div class="label-and-input">
                            <label for="latitude" class="required-field">Latitude *</label>
                            <input type="text" id="latitude" name="latitude" placeholder="e.g., 14.617500">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="longitude" class="required-field">Longitude *</label>
                            <input type="text" id="longitude" name="longitude" placeholder="e.g., 121.075600">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <button type="button" class="map-btn" onclick="openMapPicker()">Pick Location on Map</button>
                            <div class="label-and-input" id="map-preview" style="margin-top: 10px; display: none;">
                                <p>Selected Location: <span id="selected-location">None</span></p>
                            </div>
                        </div>

                        <h3>Work Details</h3>

                        <div class="label-and-input">
                            <label for="nature_of_activity" class="required-field">Nature of Activity *</label>
                            <textarea id="nature_of_activity" name="nature_of_activity" rows="3"></textarea>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="type_of_work" class="required-field">Type of Work *</label>
                            <select id="type_of_work" name="type_of_work">
                                <option value="">Select Type of Work</option>
                                <option value="residential">Residential Construction</option>
                                <option value="commercial">Commercial Construction</option>
                                <option value="renovation">Renovation</option>
                                <option value="demolition">Demolition</option>
                                <option value="addition">Addition</option>
                                <option value="repair">Repair</option>
                                <option value="other">Other</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="details_of_work" class="required-field">Details of Work *</label>
                            <textarea id="details_of_work" name="details_of_work" rows="3"></textarea>
                            <div class="error-msg"></div>
                        </div>

                        <h3>Project Timeline</h3>

                        <div class="label-and-input">
                            <label for="start_date" class="required-field">Start Date *</label>
                            <input type="date" id="start_date" name="start_date">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="end_date" class="required-field">End Date *</label>
                            <input type="date" id="end_date" name="end_date">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="num_of_workers" class="required-field">Number of Workers *</label>
                            <input type="number" id="num_of_workers" name="num_of_workers" min="1">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="num_of_working_days" class="required-field">Number of Working Days *</label>
                            <input type="number" id="num_of_working_days" name="num_of_working_days" min="1">
                            <div class="error-msg"></div>
                        </div>

                        <h3>Payment Information</h3>

                        <div class="label-and-input">
                            <label for="fee_paid" class="required-field">Fee Paid (₱) *</label>
                            <input type="number" id="fee_paid" name="fee_paid" step="0.01" min="0">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="payment_type" class="required-field">Payment Type *</label>
                            <select id="payment_type" name="payment_type">
                                <option value="">Select Payment Type</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="online">Online Payment</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="payment_status" class="required-field">Payment Status *</label>
                            <select id="payment_status" name="payment_status">
                                <option value="">Select Payment Status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial Payment</option>
                            </select>
                            <div class="error-msg"></div>
                        </div>

                        <h3>Document Uploads</h3>

                        <div class="label-and-input">
                            <label for="blueprint_image" class="required-field">Blueprint/Plan Image *</label>
                            <input type="file" id="blueprint_image" name="blueprint_image" accept="image/*,.pdf">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="additional_images">Additional Images/Documents</label>
                            <input type="file" id="additional_images" name="additional_images[]" accept="image/*,.pdf,.doc,.docx" multiple>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <button type="submit" class="submit-btn">Submit Application</button>
                            <button type="reset" class="submit-btn reset-btn">Clear Form</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="process" class="tab-pane">
                <h2>Process Applications</h2>
                <p class="form-description">Assess fees, send for payment, or issue final approval.</p>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Homeowner</th>
                                <th>Contractor</th>
                                <th>Current Status</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="processTableBody">
                            <tr><td colspan="6" class="loading"><div class="spinner"></div>Loading...</td></tr>
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

            <!-- Existing modals (view/edit) -->
            <div class="modal" id="viewModal">
                <div class="modal-content large">
                    <span class="close-x" onclick="closeView()">&times;</span>
                    <h3>Permit Details</h3>
                    <div class="details-grid">
                        <div class="details-section">
                            <h4>Basic Information</h4>
                            <p><strong>Permit No:</strong> <span id="viewPermitNo">N/A</span></p>
                            <p><strong>Homeowner:</strong> <span id="viewHomeowner">N/A</span></p>
                            <p><strong>Contractor:</strong> <span id="viewContractor">N/A</span></p>
                            <p><strong>Address:</strong> <span id="viewAddress">N/A</span></p>
                        </div>
                        <div class="details-section">
                            <h4>Work Details</h4>
                            <p><strong>Nature of Activity:</strong> <span id="viewNature">N/A</span></p>
                            <p><strong>Type of Work:</strong> <span id="viewWorkType">N/A</span></p>
                            <p><strong>Details of Work:</strong> <span id="viewWorkDetails">N/A</span></p>
                        </div>
                        <div class="details-section">
                            <h4>Project Timeline</h4>
                            <p><strong>Start Date:</strong> <span id="viewStartDate">N/A</span></p>
                            <p><strong>End Date:</strong> <span id="viewEndDate">N/A</span></p>
                            <p><strong>Workers:</strong> <span id="viewWorkers">0</span></p>
                            <p><strong>Working Days:</strong> <span id="viewWorkingDays">0</span></p>
                        </div>
                        <div class="details-section">
                            <h4>Payment Information</h4>
                            <p><strong>Fee Paid:</strong> <span id="viewFee">₱0.00</span></p>
                            <p><strong>Payment Type:</strong> <span id="viewPaymentType">N/A</span></p>
                            <p><strong>Payment Status:</strong> <span id="viewPaymentStatus">N/A</span></p>
                        </div>
                        <div class="details-section">
                            <h4>Approval Details</h4>
                            <p><strong>Approved By:</strong> <span id="viewApprovedBy">N/A</span></p>
                            <p><strong>Noted By:</strong> <span id="viewNotedBy">N/A</span></p>
                            <p><strong>Remarks:</strong> <span id="viewRemarks">N/A</span></p>
                        </div>
                        <div class="details-section">
                            <h4>Attachments</h4>
                            <p><strong>Blueprint:</strong> <span id="viewBlueprint">No blueprint uploaded</span></p>
                            <p><strong>Additional Files:</strong> <span id="viewAdditionalFiles">No additional files uploaded</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal" id="editModal">
                <div class="modal-content large">
                    <span class="close-x" onclick="closeEdit()">&times;</span>
                    <h3>Edit Record</h3>
                    <form method="post" enctype="multipart/form-data" action="construction.php">
                        <input type="hidden" name="action" value="update">
                        <input type="hidden" name="construction_id" id="f_construction_id">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Permit No.</label>
                                <input type="text" name="permit_no" id="f_permit_no" required>
                            </div>
                            <div class="form-group">
                                <label>Homeowner Name</label>
                                <input type="text" name="homeowner_name" id="f_homeowner_name" required>
                            </div>
                            <div class="form-group">
                                <label>Contractor Name</label>
                                <input type="text" name="contractor_name" id="f_contractor_name">
                            </div>
                            <div class="form-group full-width">
                                <label>Address of Construction</label>
                                <textarea name="address_of_construction" id="f_address_of_construction" required rows="3"></textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>Nature of Activity</label>
                                <textarea name="nature_of_activity" id="f_nature_of_activity" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Type of Work</label>
                                <input type="text" name="type_of_work" id="f_type_of_work">
                            </div>
                            <div class="form-group full-width">
                                <label>Details of Work</label>
                                <textarea name="details_of_work" id="f_details_of_work" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="date" name="start_date" id="f_start_date">
                            </div>
                            <div class="form-group">
                                <label>End Date</label>
                                <input type="date" name="end_date" id="f_end_date">
                            </div>
                            <div class="form-group">
                                <label>Number of Workers</label>
                                <input type="number" name="num_of_workers" id="f_num_of_workers" min="0">
                            </div>
                            <div class="form-group">
                                <label>Working Days</label>
                                <input type="number" name="num_of_working_days" id="f_num_of_working_days" min="0">
                            </div>
                            <div class="form-group">
                                <label>Fee Paid (₱)</label>
                                <input type="number" step="0.01" name="fee_paid" id="f_fee_paid" min="0">
                            </div>
                            <div class="form-group">
                                <label>Payment Type</label>
                                <input type="text" name="payment_type" id="f_payment_type">
                            </div>
                            <div class="form-group">
                                <label>Payment Status</label>
                                <select name="payment_status" id="f_payment_status">
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Approved By</label>
                                <input type="text" name="approved_by" id="f_approved_by">
                            </div>
                            <div class="form-group">
                                <label>Noted By</label>
                                <input type="text" name="noted_by" id="f_noted_by">
                            </div>
                            <div class="form-group full-width">
                                <label>Remarks</label>
                                <textarea name="remarks" id="f_remarks" rows="3"></textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>Blueprint Image</label>
                                <input type="file" name="blueprint_image" accept="image/*,.pdf">
                                <input type="hidden" name="existing_blueprint" id="f_existing_blueprint">
                                <div id="current-blueprint" class="file-preview"></div>
                            </div>
                            <div class="form-group full-width">
                                <label>Additional Images</label>
                                <input type="file" name="additional_images[]" multiple accept="image/*,.pdf,.doc,.docx">
                                <input type="hidden" name="existing_additional" id="f_existing_additional">
                                <div id="current-additional" class="file-preview"></div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="save-btn">Save Changes</button>
                            <button type="button" class="cancel-btn" onclick="closeEdit()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <script src="../../../scripts/staff/construction_staff/construction.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="../../../scripts/resident/construction_app.js" defer></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var flash = document.querySelector('#alert-container .message');
            if (flash) {
                setTimeout(function () {
                    flash.style.transition = 'opacity 0.4s ease';
                    flash.style.opacity = '0';
                    setTimeout(function () { if (flash && flash.parentNode) flash.parentNode.removeChild(flash); }, 500);
                }, 5000);
            }
        });
    </script>
</body>
</html>

<?php
function getSortIcon($column) {
    global $sort, $order;
    if ($sort === $column) {
        return $order === 'ASC' ? '↑' : '↓';
    }
    return '↕';
}
?>