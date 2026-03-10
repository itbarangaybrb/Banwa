<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /client/pages/auth/signin.php");
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

        <div class="containers construction-container" id="owner">
            <form class="form" id="constructionForm">
                <h6>Owner Information</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label class="label" for="firstName">First Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="firstName" name="firstName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="middleName">Middle Name <i>(Optional)</i></label>
                        <input type="text" id="middleName" name="middleName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="lastName">Last Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="lastName" name="lastName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="suffix">Suffix <i>(Optional)</i></label>
                        <input type="text" id="suffix" name="suffix">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="contactNoOwner">Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="contactNoOwner" name="contactNoOwner" maxlength="11" pattern="[0-9]{1,11}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="addressOwner">Full Address <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="addressOwner" name="addressOwner">
                        <div class="error-msg"></div>
                    </div>
                </div>
                <div class="buttons-container">
                    <button type="button" id="ownerBackBtn">Back</button>
                    <button type="button" id="nextToConstruction">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== Construction Form ==================== -->
        <div class="construction-container containers hidden" id="construction">
            <form class="form" id="constructionForm">
                <h6>Construction Information</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label class="label" for="natureOfActivity">What kind of work will be done? <span style="color: #BB1B1B;">*</span></label>
                        <select name="natureOfActivity" id="natureOfActivity">
                            <option value="" disabled selected>Select</option>
                            <option value="Demolition">Demolition</option>
                            <option value="Major Construction">Major Construction</option>
                            <option value="Minor Construction">Minor Construction</option>
                            <option value="Repairs">Repairs</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="typeOfWork" class="required-field">Type of Construction Work <span style="color: #BB1B1B;">*</span></label>
                        <select id="typeOfWork" name="typeOfWork">
                            <option value="">Select Type of Work</option>
                            <option value="residential">Residential (House)</option>
                            <option value="commercial">Commercial (Business)</option>
                            <option value="renovation">Renovation / Remodeling</option>
                            <option value="demolition">Demolition</option>
                            <option value="addition">Extension / Additional Structure</option>
                            <option value="repair">Repair</option>
                            <option value="other">Other (Please specify)</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <!-- <div class="label-and-input">
                        <label for="natureOfActivity" class="required-field">Nature of Activity <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="natureOfActivity" name="natureOfActivity" rows="3"></textarea>
                        <div class="error-msg"></div>
                    </div> -->

                    <div class="label-and-input">
                        <label for="detailsOfWork" class="required-field">Please describe the work to be done <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="detailsOfWork" name="detailsOfWork" rows="3"></textarea>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="startDate" class="required-field">Expected Start Date <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" id="startDate" name="startDate">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="endDate" class="required-field">Expected Completion Date <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" id="endDate" name="endDate">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="numberOfWorkingDays" class="required-field">Estimated Number of Working Days <i>(Read only)</i></label>
                        <input type="tel" id="numberOfWorkingDays" name="numberOfWorkingDays" maxlength="2" pattern="[0-9]{1,2}" readonly>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="numberOfWorkers" class="required-field">How Many Workers Will Be Involved? <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="numberOfWorkers" name="numberOfWorkers" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="contractorName">Name of Contractor <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="contractorName" name="contractorName">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="contractorContactNumber">Contractor's Mobile or Landline Number <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="contractorContactNumber" name="contractorContactNumber" maxlength="11" pattern="[0-9]{1,11}">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="applicationMethod">How will you submit this application? <span style="color: #BB1B1B;">*</span></label>
                        <select name="applicationMethod" id="applicationMethod">
                            <option value="" disabled selected>Select</option>
                            <option value="Online">Online</option>
                            <option value="In Person">In Person</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="constructionLotNo">House no. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="constructionLotNo" id="constructionLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="constructionStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="constructionStreet" id="constructionStreet">
                            <option value="" disabled selected>Select</option>
                            <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City </option>
                            <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City </option>
                            <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City </option>
                            <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City </option>
                            <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City </option>
                            <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City </option>
                            <option value="Milkyway Dr">Milky Way Drive, Blue Ridge B, Quezon City </option>
                            <option value="Moonlight Loop">Moonlight Loop, Blue Ridge B, Quezon City</option>
                            <option value="Promenade Ln">Promenade Lane, Blue Ridge B, Quezon City </option>
                            <option value="Rajah Matanda Street">Rajah Matanda Street, Blue Ridge B, Quezon City </option>
                            <option value="Riverview Dr">Riverview Drive, Blue Ridge B, Quezon City </option>
                            <option value="Starline Rd">Starline Road, Blue Ridge B, Quezon City </option>
                            <option value="Twin Peaks Dr">Twin Peaks Drive, Blue Ridge B, Quezon City </option>
                            <option value="Union Lane">Union Lane, Blue Ridge B, Quezon City </option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <input type="hidden" id="latitude2" name="latitude2" pattern="-?\d{1,2}\.\d{6,8}"
                        title="Enter latitude in decimal format (e.g., 14.617500)"
                        placeholder="e.g., 14.617500"
                        value="<?php echo isset($_POST['latitude2']) ? htmlspecialchars($_POST['latitude2']) : ''; ?>">
                    <input type="hidden" id="longitude2" name="longitude2" pattern="-?\d{1,3}\.\d{6,8}"
                        title="Enter longitude in decimal format (e.g., 121.075600)"
                        placeholder="e.g., 121.075600"
                        value="<?php echo isset($_POST['longitude2']) ? htmlspecialchars($_POST['longitude2']) : ''; ?>">
                    <div class="label-and-input">
                        <button type="button" class="map-btn" data-target="2">Pick Location on Map</button>
                        <div class="map-preview" id="map-preview-2" style="margin-top: 10px; display: none;"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="requirementUpload" class="required-field">Building Plan or Blueprint <span style="color: #BB1B1B;">*</span></label>
                        <input type="file" id="requirementUpload" name="requirementUpload[]" accept="image/*,.pdf" multiple>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label for="additionalFiles">Additional Images/Documents</label>
                        <input type="file" id="additionalFiles" name="additionalFiles[]" accept="image/*,.pdf,.doc,.docx" multiple>
                        <div class="error-msg"></div>
                    </div>

                </div>

                <div class="buttons-container">
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
                        the denial, revocation, or suspension of my Business Clearance.</p>
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
                <h6>Summary of Application</h6>

                <div id="summaryContent">
                    <div class="summary-header-and-info">
                        <p>Construction Information</p>
                        <div class="summary-info">
                            <div>
                                <p>Type of Work:</p> <span id="sumTypeOfConstruction"></span>
                            </div>
                            <div>
                                <p>Nature of Activity:</p> <span id="sumNatureOfActivity"></span>
                            </div>
                            <div>
                                <p>Details of Work:</p> <span id="sumDetailsOfWork"></span>
                            </div>
                            <div>
                                <p>Start Date:</p> <span id="sumStartDate"></span>
                            </div>
                            <div>
                                <p>End Date:</p> <span id="sumEndDate"></span>
                            </div>
                            <div>
                                <p>Number of Working Days:</p> <span id="sumNumberOfWorkingDays"></span>
                            </div>
                            <div>
                                <p>Number of Workers:</p> <span id="sumNumberOfWorkers"></span>
                            </div>
                            <div>
                                <p>Contractor Name:</p> <span id="sumContractorName"></span>
                            </div>
                            <div>
                                <p>Contractor Contact No.:</p> <span id="sumContractorContactNumber"></span>
                            </div>
                            <div>
                                <p>Application Method:</p> <span id="sumApplicationMethod"></span>
                            </div>
                            <div>
                                <p>Address of Construction:</p> <span id="sumAddressConstruction"></span>
                            </div>
                            <div>
                                <p>Requirements Upload:</p> <span id="sumRequirementUpload"></span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Owner Information</p>
                        <div class="summary-info">
                            <div>
                                <p>Name:</p> <span id="sumFullname"></span>
                            </div>
                            <div>
                                <p>Telephone:</p> <span id="sumContactNoOwner"></span>
                            </div>
                            <div>
                                <p>Address:</p> <span id="sumAddressOwner"></span>
                            </div>
                            <div>
                                <p>Agreed to Terms:</p> <span id="sumAgreed"></span>
                            </div>
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

    <?php include '_layout/end.php'; ?>
</body>

</html>