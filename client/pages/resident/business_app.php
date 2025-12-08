<?php
require_once __DIR__ . '/../../../server/api/resident/check_session.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Application</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="../../styles/resident/business_app.css">
</head>


<body>
    <?php
    $page_title = "Business Application";
    include '_layout/nav.php';
    ?>
    <main>
        <div class="content_wrapper">
            <div class="content-section active" id="default">
                
                <section class="sections">
                    <h2>Business Clearance</h2>
                    <p>This form authorizes personnel to perform the requested utility service at your address. </p>
                    
                    <!-- ==================== Owner Form ==================== -->
                    <div class="containers owner-container" id="owner">
                        <form class="form" id="ownerform">
                            <div class="inputs-container">
                                <h3>Owner Information</h3>
                                <div class="label-and-input">
                                    <label class="label" for="firstName">First Name</label>
                                    <input type="text" id="firstName" name="firstName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="middleName">Middle Name</label>
                                    <input type="text" id="middleName" name="middleName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="lastName">Last Name</label>
                                    <input type="text" id="lastName" name="lastName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="suffix">Suffix</label>
                                    <input type="text" id="suffix" name="suffix">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="contactNoOwner">Landline/phone no.</label>
                                    <input type="tel" id="contactNoOwner" name="contactNoOwner" maxlength="11" pattern="[0-9]{1,11}">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="lotNo">Lot no.</label>
                                    <input type="tel" name="lotNo" id="lotNo" maxlength="2" pattern="[0-9]{1,2}">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="street">Street</label>
                                    <select name="street" id="street">
                                        <option value="" disabled selected>Select</option>
                                        <option value="Comets Loop, Blue Ridge B, Quezon City">Comets Loop, Blue Ridge B, Quezon City </option>
                                        <option value="Crest Line Street, Blue Ridge B, Quezon City">Crest Line Street, Blue Ridge B, Quezon City </option>
                                        <option value="Evening Glow Road, Blue Ridge B, Quezon City">Evening Glow Road, Blue Ridge B, Quezon City </option>
                                        <option value="Highland Drive, Blue Ridge B, Quezon City">Highland Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Hillside Drive, Blue Ridge B, Quezon City">Hillside Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Milky Way Drive, Blue Ridge B, Quezon City">Milky Way Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Moonlight Loop, Blue Ridge B, Quezon City">Moonlight Loop, Blue Ridge B, Quezon City</option>
                                        <option value="Promenade Lane, Blue Ridge B, Quezon City">Promenade Lane, Blue Ridge B, Quezon City </option>
                                        <option value="Rajah Matanda Street, Blue Ridge B, Quezon City">Rajah Matanda Street, Blue Ridge B, Quezon City </option>
                                        <option value="Twin Peaks Drive, Blue Ridge B, Quezon City">Twin Peaks Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Union Lane, Blue Ridge B, Quezon City">Union Lane, Blue Ridge B, Quezon City </option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="applicationDate">Application Date</label>
                                    <input type="date" id="applicationDate" name="applicationDate" readonly>
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
                                <h3>Business Information</h3>
                                <div class="label-and-input">
                                    <label class="label" for="businessName">Name</label>
                                    <input type="text" id="businessName" name="businessName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label">Type of Business</label>
                                    <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship"> Single Proprietorship</label>
                                    <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                                    <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="natureOfBusinessSelect">Nature of Business</label>
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
                                    <label class="label" for="natureOfBusinessSpecify">Specify Details</label>
                                    <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label">Status of business address</label>
                                    <label><input type="radio" name="businessStatus" value="Owned"> Owned</label>
                                    <label><input type="radio" name="businessStatus" value="Leased"> Leased</label>
                                    <label><input type="radio" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                                    <label><input type="radio" name="businessStatus" value="Others"> Others</label>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="contactNoBusiness">Landline/phone no.</label>
                                    <input type="tel" id="contactNoBusiness" name="contactNoBusiness" maxlength="11" pattern="[0-9]{1,11}">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="emailAddress">Email Address</label>
                                    <input type="email" id="emailAddress" name="emailAddress">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="noOfEmployees">Number of Employees</label>
                                    <input type="tel" id="noOfEmployees" name="noOfEmployees" maxlength="2" pattern="[0-9]{1,2}">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="businessLotNo">Lot no.</label>
                                    <input type="tel" name="businessLotNo" id="businessLotNo" maxlength="2" pattern="[0-9]{1,2}">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="businessStreet">Street</label>
                                    <select name="businessStreet" id="businessStreet">
                                        <option value="" disabled selected>Select</option>
                                        <option value="Comets Loop, Blue Ridge B, Quezon City">Comets Loop, Blue Ridge B, Quezon City </option>
                                        <option value="Crest Line Street, Blue Ridge B, Quezon City">Crest Line Street, Blue Ridge B, Quezon City </option>
                                        <option value="Evening Glow Road, Blue Ridge B, Quezon City">Evening Glow Road, Blue Ridge B, Quezon City </option>
                                        <option value="Highland Drive, Blue Ridge B, Quezon City">Highland Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Hillside Drive, Blue Ridge B, Quezon City">Hillside Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Milky Way Drive, Blue Ridge B, Quezon City">Milky Way Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Moonlight Loop, Blue Ridge B, Quezon City">Moonlight Loop, Blue Ridge B, Quezon City</option>
                                        <option value="Promenade Lane, Blue Ridge B, Quezon City">Promenade Lane, Blue Ridge B, Quezon City </option>
                                        <option value="Rajah Matanda Street, Blue Ridge B, Quezon City">Rajah Matanda Street, Blue Ridge B, Quezon City </option>
                                        <option value="Twin Peaks Drive, Blue Ridge B, Quezon City">Twin Peaks Drive, Blue Ridge B, Quezon City </option>
                                        <option value="Union Lane, Blue Ridge B, Quezon City">Union Lane, Blue Ridge B, Quezon City </option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="typeOfStructureSelect">Structure Type</label>
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
                                    <label class="label" for="typeOfStructureSpecify">Specify Details (if Others)</label>
                                    <input type="text" name="typeOfStructureSpecify" id="typeOfStructureSpecify">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="natureOfApplication">Nature of application</label>
                                    <select name="natureOfApplication" id="natureOfApplication">
                                        <option value="" disabled selected>Select</option>
                                        <option value="New">New</option>
                                        <option value="Renew">Renew</option>
                                        <option value="Closure">Closure</option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input" id="requirementsSection">
                                    <label class="label">Requirements (Photocopy Only)</label>
                                    <label><input type="checkbox" name="requirements" value="SEC"> SEC</label>
                                    <label><input type="checkbox" name="requirements" value="DTI"> DTI</label>
                                    <label><input type="checkbox" name="requirements" value="TCT"> TCT</label>
                                    <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                                    <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label class="label" for="requirementUpload">Upload Document</label>
                                    <input type="file" id="requirementUpload" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png">
                                    <div class="error-msg"></div>
                                </div>
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
                            <h3>Waiver</h3>

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
                            <h3>Summary</h3>

                            <div id="summaryContent">
                                <div><strong>Business Name:</strong> <span id="sumBusinessName"></span></div>
                                <div><strong>Type of Business:</strong> <span id="sumTypeOfBusiness"></span></div>
                                <div><strong>Nature of Business:</strong> <span id="sumNatureOfBusiness"></span></div>
                                <div><strong>Business Status:</strong> <span id="sumBusinessStatus"></span></div>
                                <div><strong>Address of Business:</strong> <span id="sumAddressOfBusiness"></span></div>
                                <div><strong>Business Telephone:</strong> <span id="sumContactNoBusiness"></span></div>
                                <div><strong>Email:</strong> <span id="sumEmail"></span></div>
                                <div><strong>Owner Name:</strong> <span id="sumFullname"></span></div>
                                <div><strong>Owner Telephone:</strong> <span id="sumContactNoOwner"></span></div>
                                <div><strong>Owner Address:</strong> <span id="sumAddressOwner"></span></div>
                                <div><strong>Structure Type:</strong> <span id="sumStructureType"></span></div>
                                <div><strong>Requirements:</strong> <span id="sumRequirements"></span></div>
                                <div><strong>No. of Employees:</strong> <span id="sumEmployees"></span></div>
                                <div><strong>Agreed to Terms:</strong> <span id="sumAgreed"></span></div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="summaryBackBtn">Back</button>
                                <button type="submit" id="submitApplication">Submit Application</button>
                            </div>
                        </form>
                    </div>
                </section>
                <!-- </div>
        </div> -->
    </main>

    <script type="module" src="../../scripts/resident/business_app.js"></script>
</body>

</html>

<?php include '_layout/end.php'; ?>