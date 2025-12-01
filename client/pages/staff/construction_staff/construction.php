<?php include __DIR__ . '/../../../scripts/staff/construction_staff/construction_handler.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Application Management System</title>
    <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
<div class="container">
    <h1>Construction Permit Records</h1>

    <?php if (isset($_GET['success']) && $_GET['success'] === 'updated'): ?>
        <div class="message success">Record updated successfully!</div>
    <?php endif; ?>

    <?php if (!empty($error_message)): ?>
        <div class="message error"><?= htmlspecialchars($error_message) ?></div>
    <?php endif; ?>

    <form class="controls">
        <input type="text" name="search" placeholder="Type to search instantly..." 
               value="<?= htmlspecialchars($search) ?>" id="searchInput" autocomplete="off">
        <button type="button" id="searchButton">Search</button>
    </form>

    <div class="table-container">
        <table>
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
                        <td class="actions">
                            <button class="action-btn view-btn" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openView(this)">View</button>
                            <button class="action-btn edit-btn" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openEdit(this)">Edit</button>
                        </td>
                    </tr>
                <?php endwhile; endif; ?>
            </tbody>
        </table>
</div>

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

<script src="../../../scripts/staff/construction_staff/construction.js"></script>
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