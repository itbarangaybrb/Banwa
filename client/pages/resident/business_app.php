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
    <title>Business Application</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <link rel="stylesheet" href="../../styles/resident/business_app.css">
</head>


<body>
    <?php
    $page_title = "Business Application";
    include '_layout/nav.php';
    ?>


    <section class="sections">
        <div class="header-and-parag">
            <h4>Business Clearance</h4>
            <p>This form authorizes personnel to perform the requested business service at your address. </p>
        </div>

        <!-- ==================== Owner Form ==================== -->
        <div class="containers owner-container" id="owner">
            <form class="form" id="ownerform">
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
                        <label class="label" for="lotNo">Lot No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="lotNo" id="lotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="street">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="street" id="street">
                            <option value="" disabled selected>Select</option>
                            <option value="Comets Loop">Comets Loop, Blue Ridge B, Quezon City </option>
                            <option value="Colonel Bonny Serrano Ave.">Colonel Bonny Serrano Ave., Blue Ridge B, Quezon City </option>
                            <option value="Crest line St">Crest Line Street, Blue Ridge B, Quezon City </option>
                            <option value="Evening Glow Rd">Evening Glow Road, Blue Ridge B, Quezon City </option>
                            <option value="Highland Dr">Highland Drive, Blue Ridge B, Quezon City </option>
                            <option value="Hillside Dr">Hillside Drive, Blue Ridge B, Quezon City </option>
                            <option value="Milky Way Dr">Milky Way Drive, Blue Ridge B, Quezon City </option>
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
                    <input type="hidden" id="latitude1" name="latitude" pattern="-?\d{1,2}\.\d{6,8}"
                        title="Enter latitude in decimal format (e.g., 14.617500)"
                        placeholder="e.g., 14.617500"
                        value="<?php echo isset($_POST['latitude1']) ? htmlspecialchars($_POST['latitude']) : ''; ?>">
                    <input type="hidden" id="longitude1" name="longitude" pattern="-?\d{1,3}\.\d{6,8}"
                        title="Enter longitude in decimal format (e.g., 121.075600)"
                        placeholder="e.g., 121.075600"
                        value="<?php echo isset($_POST['longitude1']) ? htmlspecialchars($_POST['longitude']) : ''; ?>">

                    <!-- <div class="label-and-input">
                        <button type="button" class="map-btn" data-target="1">Pick Location on Map</button>
                        <div class="map-preview" id="map-preview-1" style="margin-top: 10px; display: none;"></div>
                    </div> -->

                    <div class="label-and-input">
                        <input type="date" id="applicationDate" name="applicationDate" hidden readonly>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" id="ownerBackBtn">Back</button>
                    <button type="button" id="nextToBusiness">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== Business Form ==================== -->
        <div class="containers business-container hidden" id="business">
            <form class="form" id="certificationForm">
                <div class="inputs-container">
                    <h6>Business Information</h6>
                    <div class="label-and-input">
                        <label class="label" for="businessName">Business Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="businessName" name="businessName">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label">What is your type of business? <span style="color: #BB1B1B;">*</span></label>
                        <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship"> Single Proprietorship</label>
                        <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                        <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="natureOfBusinessSelect">What kind of business do you have? <span style="color: #BB1B1B;">*</span></label>
                        <select name="natureOfBusiness" id="natureOfBusinessSelect">
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
                    <div class="label-and-input">
                        <label class="label" for="natureOfBusinessSpecify">Please describe your business <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label">Do you own, rent, or lease your business location? <span style="color: #BB1B1B;">*</span></label>
                        <label><input type="radio" name="businessStatus" value="Owned"> Owned</label>
                        <label><input type="radio" name="businessStatus" value="Leased"> Leased</label>
                        <label><input type="radio" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                        <label><input type="radio" name="businessStatus" value="Others"> Others</label>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="contactNoBusiness">Landline/Phone No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="contactNoBusiness" name="contactNoBusiness" maxlength="11" pattern="[0-9]{1,11}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="emailAddress">Email Address <span style="color: #BB1B1B;">*</span></label>
                        <input type="email" id="emailAddress" name="emailAddress">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="noOfEmployees">How many employees do you have? <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="noOfEmployees" name="noOfEmployees" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="businessLotNo">Lot no. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="businessLotNo" id="businessLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="businessStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="businessStreet" id="businessStreet">
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
                        <label class="label" for="typeOfStructureSelect">What kind of structure is the business in? <span style="color: #BB1B1B;">*</span></label>
                        <select id="typeOfStructureSelect" name="typeOfStructureSelect">
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
                    <div class="label-and-input">
                        <label class="label" for="typeOfStructureSpecify">Please describe the structure <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" name="typeOfStructureSpecify" id="typeOfStructureSpecify">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="natureOfApplication">What is your application for? <span style="color: #BB1B1B;">*</span></label>
                        <select name="natureOfApplication" id="natureOfApplication">
                            <option value="" disabled selected>Select</option>
                            <option value="New">New</option>
                            <option value="Renew">Renew</option>
                            <option value="Closure">Closure</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input" id="requirementsSection">
                        <label class="label">Requirements (Photocopy Only) <span style="color: #BB1B1B;">*</span></label>
                        <label><input type="checkbox" name="requirements" value="SEC"> SEC (Securities and Exchange Commission) Registration</label>
                        <label><input type="checkbox" name="requirements" value="DTI"> DTI (Department of Trade and Industry) Registration</label>
                        <label><input type="checkbox" name="requirements" value="TCT"> TCT (Transfer Certificate of Title)</label>
                        <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                        <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="requirementUpload">Attachment/s <span style="color: #BB1B1B;">*</span></label>
                        <input type="file" id="requirementUpload" name="requirementUpload[]" multiple accept=".pdf,.jpg,.jpeg,.png"><!-- accept multiple file types -->
                        <div class="error-msg"></div>
                    </div>
                </div>

                <!-- NEW: OCR Document Verification Section -->
                <div class="label-and-input verification-container" id="verificationSection" style="display:none; margin-top:20px; padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                    <label class="label" style="margin-bottom:12px; display:block;">
                        📋 OCR Document Verification
                    </label>
                    <div id="verificationResults" style="margin-bottom:15px; line-height:1.6;"></div>

                    <button type="button" id="verifyDocumentsBtn" class="btn-secondary" style="width:100%; padding:12px;">
                        Re-Verify Documents with OCR
                    </button>

                    <small style="color:#64748b; font-size:0.85em; margin-top:10px; display:block;">
                        Auto-checks 1 second after upload. Business name is also cross-checked in the documents.
                    </small>
                </div>

                <div class="buttons-container">
                    <button type="button" id="businessBackBtn">Back</button>
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
                <h6>Summary of Application</h6>

                <div id="summaryContent">
                    <div class="summary-header-and-info">
                        <p>Business Information</p>
                        <div class="summary-info">
                            <div>
                                <p>Business Name:</p> <span id="sumBusinessName"></span>
                            </div>
                            <div>
                                <p>Type of Business:</p> <span id="sumTypeOfBusiness"></span>
                            </div>
                            <div>
                                <p>Nature of Business:</p> <span id="sumNatureOfBusiness"></span>
                            </div>
                            <div>
                                <p>Business Status:</p> <span id="sumBusinessStatus"></span>
                            </div>
                            <div>
                                <p>Address of Business:</p> <span id="sumAddressOfBusiness"></span>
                            </div>
                            <div>
                                <p>Business Telephone:</p> <span id="sumContactNoBusiness"></span>
                            </div>
                            <div>
                                <p>Email:</p> <span id="sumEmail"></span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Owner Information</p>
                        <div class="summary-info">
                            <div>
                                <p>Owner Name:</p> <span id="sumFullname"></span>
                            </div>
                            <div>
                                <p>Owner Telephone:</p> <span id="sumContactNoOwner"></span>
                            </div>
                            <div>
                                <p>Owner Address:</p> <span id="sumAddressOwner"></span>
                            </div>
                            <div>
                                <p>Structure Type:</p> <span id="sumStructureType"></span>
                            </div>
                            <div>
                                <p>Requirements:</p> <span id="sumRequirements"></span>
                            </div>
                            <div>
                                <p>No. of Employees:</p> <span id="sumEmployees"></span>
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


    <script type="module" src="../../scripts/resident/business_app.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <?php include '_layout/end.php'; ?>
</body>

</html>