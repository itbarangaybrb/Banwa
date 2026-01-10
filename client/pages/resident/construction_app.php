<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';
include __DIR__ . '../../../../server/api/resident/submit_construction.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Permit Application</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="../../styles/resident/construction_app.css">
    <script type="module" src="../../scripts/resident/construction_app.js" defer></script>
</head>

<body>
    <?php
    $page_title = "Construction Application";
    include '_layout/nav.php';
    ?>


    <?php if (!empty($success_message) || !empty($error_message)): ?>
        <div id="formMessage" class="message <?php echo !empty($success_message) ? 'success' : 'error'; ?>">
            <?php echo !empty($success_message) ? $success_message : $error_message; ?>
        </div>

        <script>
            // Show the message immediately
            const formMessage = document.getElementById('formMessage');

            // Hide the message after 3 seconds (3000 ms)
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 2000);
        </script>
    <?php endif; ?>


    <section id="permits" class="sections">
        <div class="header-and-parag">
            <h4>Infrastructure</h4>
            <p>This form authorizes personnel to perform the requested infrastructure service at your address. </p>
        </div>

        <!-- ==================== Construction Form ==================== -->
        <div class="construction-container containers" id="construction">

            <form class="form" id="construction-form" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="POST" enctype="multipart/form-data">
                <div class="inputs-container">
                    <h6>Owner Information</h6>
                    <div class="label-and-input">
                        <label for="permit_no" class="required-field">Permit No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="permit_no" name="permit_no" value="<?php echo isset($_POST['permit_no']) ? htmlspecialchars($_POST['permit_no']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="homeowner_name" class="required-field">Homeowner Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="homeowner_name" name="homeowner_name" value="<?php echo isset($_POST['homeowner_name']) ? htmlspecialchars($_POST['homeowner_name']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="contractor_name" class="required-field">Contractor Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="contractor_name" name="contractor_name" value="<?php echo isset($_POST['contractor_name']) ? htmlspecialchars($_POST['contractor_name']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="address_of_construction" class="required-field">Address of Construction <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="address_of_construction" name="address_of_construction" rows="3"><?php echo isset($_POST['address_of_construction']) ? htmlspecialchars($_POST['address_of_construction']) : ''; ?></textarea>
                        <div class="error-msg"></div>
                    </div>


                    <h6>Construction Location Coordinates</h6>
                    <div class="label-and-input test">
                        <label for="latitude" class="required-field">Latitude <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="latitude" name="latitude" pattern="-?\d{1,2}\.\d{6,8}"
                            title="Enter latitude in decimal format (e.g., 14.617500)"
                            placeholder="e.g., 14.617500"
                            value="<?php echo isset($_POST['latitude']) ? htmlspecialchars($_POST['latitude']) : ''; ?>">
                        <small class="coord-help">Format: 14.617500 (decimal degrees)</small>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input test">
                        <label for="longitude" class="required-field">Longitude *</label>
                        <input type="text" id="longitude" name="longitude" pattern="-?\d{1,3}\.\d{6,8}"
                            title="Enter longitude in decimal format (e.g., 121.075600)"
                            placeholder="e.g., 121.075600"
                            value="<?php echo isset($_POST['longitude']) ? htmlspecialchars($_POST['longitude']) : ''; ?>">
                        <small class="coord-help">Format: 121.075600 (decimal degrees)</small>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <button type="button" class="map-btn" onclick="openMapPicker()">Pick Location on Map</button>
                        <div class="label-and-input" id="map-preview" style="margin-top: 10px; display: none;">
                            <p>Selected Location: <span id="selected-location">None</span></p>
                        </div>
                    </div>



                    <h6>Work Details</h6>
                    <div class="label-and-input">
                        <label for="nature_of_activity" class="required-field">Nature of Activity <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="nature_of_activity" name="nature_of_activity" rows="3"><?php echo isset($_POST['nature_of_activity']) ? htmlspecialchars($_POST['nature_of_activity']) : ''; ?></textarea>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="type_of_work" class="required-field">Type of Work <span style="color: #BB1B1B;">*</span></label>
                        <select id="type_of_work" name="type_of_work">
                            <option value="">Select Type of Work</option>
                            <option value="residential" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'residential') ? 'selected' : ''; ?>>Residential Construction</option>
                            <option value="commercial" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'commercial') ? 'selected' : ''; ?>>Commercial Construction</option>
                            <option value="renovation" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'renovation') ? 'selected' : ''; ?>>Renovation</option>
                            <option value="demolition" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'demolition') ? 'selected' : ''; ?>>Demolition</option>
                            <option value="addition" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'addition') ? 'selected' : ''; ?>>Addition</option>
                            <option value="repair" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'repair') ? 'selected' : ''; ?>>Repair</option>
                            <option value="other" <?php echo (isset($_POST['type_of_work']) && $_POST['type_of_work'] == 'other') ? 'selected' : ''; ?>>Other</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="details_of_work" class="required-field">Details of Work <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="details_of_work" name="details_of_work" rows="3"><?php echo isset($_POST['details_of_work']) ? htmlspecialchars($_POST['details_of_work']) : ''; ?></textarea>
                        <div class="error-msg"></div>
                    </div>




                    <h6>Project Timeline</h6>
                    <div class="label-and-input">
                        <label for="start_date" class="required-field">Start Date <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" id="start_date" name="start_date" value="<?php echo isset($_POST['start_date']) ? htmlspecialchars($_POST['start_date']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="end_date" class="required-field">End Date <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" id="end_date" name="end_date" value="<?php echo isset($_POST['end_date']) ? htmlspecialchars($_POST['end_date']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="num_of_workers" class="required-field">Number of Workers <span style="color: #BB1B1B;">*</span></label>
                        <input type="number" id="num_of_workers" name="num_of_workers" min="1" value="<?php echo isset($_POST['num_of_workers']) ? htmlspecialchars($_POST['num_of_workers']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="num_of_working_days" class="required-field">Number of Working Days <span style="color: #BB1B1B;">*</span></label>
                        <input type="number" id="num_of_working_days" name="num_of_working_days" min="1" value="<?php echo isset($_POST['num_of_working_days']) ? htmlspecialchars($_POST['num_of_working_days']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>



                    <h6>Payment Information</h6>
                    <div class="label-and-input">
                        <label for="fee_paid" class="required-field">Fee Paid (₱) <span style="color: #BB1B1B;">*</span></label>
                        <input type="number" id="fee_paid" name="fee_paid" step="0.01" min="0" value="<?php echo isset($_POST['fee_paid']) ? htmlspecialchars($_POST['fee_paid']) : ''; ?>">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="payment_type" class="required-field">Payment Type <span style="color: #BB1B1B;">*</span></label>
                        <select id="payment_type" name="payment_type">
                            <option value="">Select Payment Type</option>
                            <option value="cash" <?php echo (isset($_POST['payment_type']) && $_POST['payment_type'] == 'cash') ? 'selected' : ''; ?>>Cash</option>
                            <option value="check" <?php echo (isset($_POST['payment_type']) && $_POST['payment_type'] == 'check') ? 'selected' : ''; ?>>Check</option>
                            <option value="bank_transfer" <?php echo (isset($_POST['payment_type']) && $_POST['payment_type'] == 'bank_transfer') ? 'selected' : ''; ?>>Bank Transfer</option>
                            <option value="online" <?php echo (isset($_POST['payment_type']) && $_POST['payment_type'] == 'online') ? 'selected' : ''; ?>>Online Payment</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="payment_status" class="required-field">Payment Status <span style="color: #BB1B1B;">*</span></label>
                        <select id="payment_status" name="payment_status">
                            <option value="">Select Payment Status</option>
                            <option value="pending" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'pending') ? 'selected' : ''; ?>>Pending</option>
                            <option value="paid" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'paid') ? 'selected' : ''; ?>>Paid</option>
                            <option value="partial" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'partial') ? 'selected' : ''; ?>>Partial Payment</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>


                    <h6>Document Uploads</h6>
                    <div class="label-and-input">
                        <label for="blueprint_image" class="required-field">Blueprint/Plan Image <span style="color: #BB1B1B;">*</span></label>
                        <input type="file" id="blueprint_image" name="blueprint_image" accept="image/*,.pdf">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label for="additional_images">Additional Images/Documents</label>
                        <input type="file" id="additional_images" name="additional_images[]" accept="image/*,.pdf,.doc,.docx" multiple>
                        <div class="error-msg"></div>
                    </div>
                </div>

                <div class="buttons-container">
                    <!-- <button type="reset" class="submit-btn reset-btn">Clear Form</button> -->
                    <!-- <button type="submit" class="submit-btn">Submit Application</button> -->
                    <button type="button" id="constructionBackBtn">Back</button>
                    <button type="button" id="nextToWaiver">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== Waiver Form ==================== -->
        <div class="containers waiver-container hidden" id="waiver">
            <form class="form" id="waiverUtilitiesForm">
                <h6>Waiver</h6>

                <div id="waiverContent">
                    <p>I, <span id="waiverFullname"></span>, hereby certify that all information provided in this
                        Business Application Form is true and correct. I authorize the Barangay to verify the information
                        with the documents submitted.</p>
                    <p>I understand that any false declaration or withholding of relevant information may result in
                        the denial, revocation, or suspension of my business permit.</p>
                    <p> I agree that the Barangay shall not be held liable for any incorrect information or discrepancies
                        provided in this form and supporting documents.</p>
                </div>

                <div class="label-and-input">
                    <label for="agreeCheckBox">
                        <input type="checkbox" id="agreeCheckBox" name="agree">
                        I agree to the terms and conditions
                    </label>
                    <div class="error-msg"></div>
                </div>

                <div class="buttons-container">
                    <button type="button" id="waiverBackBtn">Back</button>
                    <button type="button" id="nextToSummary">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== Summary Form ==================== -->
        <div class="containers summary-container hidden" id="summary">
            <form class="form" id="summaryForm">
                <h6>Summary</h6>

                <div id="summaryContent">
                    <div class="summary-header-and-info">
                        <p>Construction Information</p>
                        <div class="summary-info">
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Owner Information</p>lorem
                        <div class="summary-info">
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                            <div><p>lorem:</p> <span id="lorem"></span></div>
                        </div>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" id="summaryBackBtn">Back</button>
                    <button type="submit" id="submitApplication">Submit Application</button>
                </div>
            </form>
        </div>
    </section>
</body>

</html>
<?php include '_layout/end.php'; ?>