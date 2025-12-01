<?php
include __DIR__ . '../../../../server/api/resident/submit_construction.php';
$page_title = "Construction Application";
include '_layout/nav.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Permit Application</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="../../styles/resident/construction_app.css">
    <script src="../../scripts/resident/construction_app.js" defer></script>

</head>

<body>
    <!-- <nav class="side_nav">
        <div class="nav_header">
            <div class="logo_title">
                <div class="nav_logo">C</div>
                <div class="company_name">ConstructPro</div>
            </div>
        </div>

        <div class="nav_list">
            <ul class="nav_list1">
                <li><a href="#dashboard" class="nav_select active">
                        <span class="nav_icon"></span>
                        <span class="nav_text">Dashboard</span>
                    </a></li>
                <li><a href="#permits" class="nav_select">
                        <span class="nav_icon"></span>
                        <span class="nav_text">Permit Applications</span>
                    </a></li>
                <li><a href="#projects" class="nav_select">
                        <span class="nav_icon"></span>
                        <span class="nav_text">Applications</span>
                    </a></li>
                <li><a href="#reports" class="nav_select">
                        <span class="nav_icon"></span>
                        <span class="nav_text">Profile</span>
                    </a></li>
            </ul>

            <ul class="nav_list2">
                <li><a href="#settings" class="nav_select">
                        <span class="nav_icon">⚙️</span>
                        <span class="nav_text">Settings</span>
                    </a></li>
                <li><a href="#help" class="nav_select">
                        <span class="nav_icon">❓</span>
                        <span class="nav_text">Help & Support</span>
                    </a></li>
            </ul>
        </div>
    </nav>

    <header>
        <div class="head_space">
            <div class="logo_container">
                <div class="time_date" id="currentDateTime"></div>
            </div>
        </div>

        <div class="user_profile">
            <div class="username">Welcome, User</div>
            <div class="user_image">
                <span>👤</span>
            </div>
        </div>
    </header> -->

    <main class="content">
        <div class="content_wrapper">
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

            <section id="permits" class="content-section active">
                <div class="construction-form">
                    <h2>Construction Permit Application Form</h2>
                    <p>Please fill out all required fields.</p>

                    <form id="construction-form" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="POST" enctype="multipart/form-data">


                        <h3>Owner & Project Information</h3>

                        <div class="label-and-input">
                            <label for="permit_no" class="required-field">Permit No. *</label>
                            <input type="text" id="permit_no" name="permit_no" value="<?php echo isset($_POST['permit_no']) ? htmlspecialchars($_POST['permit_no']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="homeowner_name" class="required-field">Homeowner Name *</label>
                            <input type="text" id="homeowner_name" name="homeowner_name" value="<?php echo isset($_POST['homeowner_name']) ? htmlspecialchars($_POST['homeowner_name']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="contractor_name" class="required-field">Contractor Name *</label>
                            <input type="text" id="contractor_name" name="contractor_name" value="<?php echo isset($_POST['contractor_name']) ? htmlspecialchars($_POST['contractor_name']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="address_of_construction" class="required-field">Address of Construction *</label>
                            <textarea id="address_of_construction" name="address_of_construction" rows="3"><?php echo isset($_POST['address_of_construction']) ? htmlspecialchars($_POST['address_of_construction']) : ''; ?></textarea>
                            <div class="error-msg"></div>
                        </div>


                        <h3>Construction Location Coordinates</h3>


                        <div class="label-and-input">
                            <label for="latitude" class="required-field">Latitude *</label>
                            <input type="text" id="latitude" name="latitude" pattern="-?\d{1,2}\.\d{6,8}"
                                title="Enter latitude in decimal format (e.g., 14.617500)"
                                placeholder="e.g., 14.617500"
                                value="<?php echo isset($_POST['latitude']) ? htmlspecialchars($_POST['latitude']) : ''; ?>">
                            <small class="coord-help">Format: 14.617500 (decimal degrees)</small>
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
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



                        <h3>Work Details</h3>


                        <div class="label-and-input">
                            <label for="nature_of_activity" class="required-field">Nature of Activity *</label>
                            <textarea id="nature_of_activity" name="nature_of_activity" rows="3"><?php echo isset($_POST['nature_of_activity']) ? htmlspecialchars($_POST['nature_of_activity']) : ''; ?></textarea>
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="type_of_work" class="required-field">Type of Work *</label>
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
                            <label for="details_of_work" class="required-field">Details of Work *</label>
                            <textarea id="details_of_work" name="details_of_work" rows="3"><?php echo isset($_POST['details_of_work']) ? htmlspecialchars($_POST['details_of_work']) : ''; ?></textarea>
                            <div class="error-msg"></div>
                        </div>



                        <div class="label-and-input">
                            <h3>Project Timeline</h3>
                        </div>

                        <div class="label-and-input">
                            <label for="start_date" class="required-field">Start Date *</label>
                            <input type="date" id="start_date" name="start_date" value="<?php echo isset($_POST['start_date']) ? htmlspecialchars($_POST['start_date']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="end_date" class="required-field">End Date *</label>
                            <input type="date" id="end_date" name="end_date" value="<?php echo isset($_POST['end_date']) ? htmlspecialchars($_POST['end_date']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>

                        <div class="label-and-input">
                            <label for="num_of_workers" class="required-field">Number of Workers *</label>
                            <input type="number" id="num_of_workers" name="num_of_workers" min="1" value="<?php echo isset($_POST['num_of_workers']) ? htmlspecialchars($_POST['num_of_workers']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="num_of_working_days" class="required-field">Number of Working Days *</label>
                            <input type="number" id="num_of_working_days" name="num_of_working_days" min="1" value="<?php echo isset($_POST['num_of_working_days']) ? htmlspecialchars($_POST['num_of_working_days']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>



                        <h3>Payment Information</h3>

                        <div class="label-and-input">
                            <label for="fee_paid" class="required-field">Fee Paid (₱) *</label>
                            <input type="number" id="fee_paid" name="fee_paid" step="0.01" min="0" value="<?php echo isset($_POST['fee_paid']) ? htmlspecialchars($_POST['fee_paid']) : ''; ?>">
                            <div class="error-msg"></div>
                        </div>
                        <div class="label-and-input">
                            <label for="payment_type" class="required-field">Payment Type *</label>
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
                            <label for="payment_status" class="required-field">Payment Status *</label>
                            <select id="payment_status" name="payment_status">
                                <option value="">Select Payment Status</option>
                                <option value="pending" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'pending') ? 'selected' : ''; ?>>Pending</option>
                                <option value="paid" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'paid') ? 'selected' : ''; ?>>Paid</option>
                                <option value="partial" <?php echo (isset($_POST['payment_status']) && $_POST['payment_status'] == 'partial') ? 'selected' : ''; ?>>Partial Payment</option>
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
            </section>

            <!-- <section id="dashboard" class="content-section">
                <h2>Dashboard</h2>
                <p>Welcome to your construction management dashboard.</p>
            </section> -->
        </div>
    </main>
</body>

</html>
<?php include '_layout/end.php'; ?>