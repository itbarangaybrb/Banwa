<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Utilities Application</title>

    <link rel="stylesheet" href="../../styles/resident/utilities_app.css">
</head>

<body>
    <!-- 
        TODO: Front-end developer, will change
        this into modal once the designs is fully completed. 
      -->
    <?php
    $page_title = "Utilities Application";
    include '_layout/nav.php';
    ?>




    <section class="sections">
        <div class="header-and-parag">
            <h4>Utiliies Clearance</h4>
            <p>Select a size from the navigation menu to view product details.</p>
        </div>

        <!-- <div class="top">
                            <div class="back-icon">
                                <img src="../../img/arrow-left.svg" alt="">
                            </div>

                            <div class="header-and-text">
                                <h2>Utilities</h2>
                                <p>This form authorizes personnel to perform the requested utility service at your address. </p>
                            </div>
                        </div> -->

        <!-- ==================== Utiliies Form ==================== -->
        <div class="containers utilities-container" id="utilities">
            <!-- <div class="top">
                                <div class="indicator">
                                    <div class="circle">
                                        <h5 class="num">1</h5>
                                    </div>
                                    <div class="line">Application</div>
                                    <div class="circle">
                                        <h5 class="num">2</h5>
                                    </div>
                                    <div class="line">Authorization & Waiver</div>
                                    <div class="circle">
                                        <h5 class="num">3</h5>
                                    </div>
                                    <div class="line">Service Request Confirmation</div>
                                </div>

                                <div class="header-and-text">
                                    <h2>Application Details</h2>
                                    <p>All fields are required unless specified.</p>
                                </div>
                            </div> -->

            <form class="form" id="utilitiesForms">
                <h5>Owner Information</h5>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="requestDate">Request Date*</label>
                        <input type="date" name="requestDate" id="requestDate">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="dateOfWork">Date of Work*</label>
                        <input type="date" name="dateOfWork" id="dateOfWork">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="fullnameUtilities">Full Name*</label>
                        <input type="text" name="fullname" id="fullnameUtilities">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="contactNo">Contact No.*</label>
                        <input type="tel" name="contactNo" id="contactNo" maxlength="11" pattern="[0-9]{1,11}">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="address">Address*</label>
                        <input type="text" name="address" id="address">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="provider">Select Provider*</label>
                        <div class="select-and-icon">
                            <select name="provider" id="provider">
                                <option value="select">Select</option>
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
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="natureOfWork">Nature of Work*</label>
                        <div class="select-and-icon">
                            <select name="natureOfWork" id="natureOfWork">
                                <option value="select">Select</option>
                                <option value="New Installation">New Installation</option>
                                <option value="Repair/Maintenance">Repair/Maintenance</option>
                                <option value="Permanent Disconnection">Permanent Disconnection</option>
                                <option value="Reconnection">Reconnection</option>
                            </select>
                        </div>
                        <span class="error-msg"></span>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" id="utilitiesBackBtn">Back</button>
                    <button type="button" id="nextToWaiver">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== Waiver Form ==================== -->
        <div class="containers waiver-container hidden" id="waiver">
            <form class="form" id="waiverUtilitiesForm">
                <h5>Waiver</h5>

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
                <h5>Summary</h5>

                <div id="summaryContent">
                    <div class="summary-header-and-info">
                        <h6>Construction Information</h6>
                        <div class="summary-info">
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <h6>Owner Information</h6>lorem
                        <div class="summary-info">
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
                            <div><strong>lorem</strong> <span id="lorem"></span></div>
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

    <script type="module" src="../../scripts/resident/utilities_app.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>
<?php include '_layout/end.php'; ?>