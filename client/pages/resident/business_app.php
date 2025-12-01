<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Application</title>

    <link rel="stylesheet" href="../../styles/resident/business_app.css">
</head>
<!-- Remember to make it the same with the Staff Side For Application Creation Part
     as well as the connection to the DB -->
<?php 
$page_title = "Business Application";
include '_layout/nav.php';
?>
<body>
    <main>
         <div class="content_wrapper">
    <div class="content-section active" id="default">
        <h2>Business Clearance Application</h2>
        <p>Please fill out the form below to apply for a Business Clearance.</p>
        <section class="sections">
            <div class="containers">

                <div class="business-report" id="business">
                    <h1>Certification of Information</h1>
                    <p>This form authorizes personnel to perform the requested utility service at your address.</p>

                    <form id="certificationForm" method="post">
                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="businessName">Business Name</label>
                                <input type="text" id="businessName" name="businessName">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label>Type of Business</label>
                                <label><input type="radio" name="typeOfBusiness" value="Single Proprietorship"> Single Proprietorship</label>
                                <label><input type="radio" name="typeOfBusiness" value="Partnership"> Partnership</label>
                                <label><input type="radio" name="typeOfBusiness" value="Corporation"> Corporation</label>
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="natureOfBusinessSelect">Nature of Business</label>
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
                                <label for="natureOfBusinessSpecify">Specify Details (if Others)</label>
                                <input type="text" id="natureOfBusinessSpecify" name="natureOfBusinessSpecify">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="addressOfBusiness">Address of Business</label>
                                <input type="text" name="addressOfBusiness" id="addressOfBusiness">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label>Status of business address</label>
                                <label><input type="checkbox" name="businessStatus" value="Owned"> Owned</label>
                                <label><input type="checkbox" name="businessStatus" value="Leased"> Leased</label>
                                <label><input type="checkbox" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                                <label><input type="checkbox" name="businessStatus" value="Others"> Others</label>
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="telephoneNoBusiness">Business Telephone</label>
                                <input type="tel" id="telephoneNoBusiness" name="telephoneNoBusiness" maxlength="11" pattern="[0-9]{1,11}">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="emailAddress">Email Address</label>
                                <input type="email" id="emailAddress" name="emailAddress">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="firstName">Owner First Name</label>
                                <input type="text" id="firstName" name="firstName">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="middleName">Owner Middle Name</label>
                                <input type="text" id="middleName" name="middleName">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="lastName">Owner Last Name</label>
                                <input type="text" id="lastName" name="lastName">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="telephoneNoOwner">Owner Telephone</label>
                                <input type="tel" id="telephoneNoOwner" name="telephoneNoOwner" maxlength="11" pattern="[0-9]{1,11}">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="addressOwner">Owner Address</label>
                                <input type="text" id="addressOwner" name="addressOwner">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="typeOfStructureSelect">Structure Type</label>
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
                                <label for="typeOfStructureSpecify">Specify Details (if Others)</label>
                                <input type="text" name="typeOfStructureSpecify" id="typeOfStructureSpecify">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label>Requirements (Photocopy Only)</label>
                                <label><input type="checkbox" name="requirements" value="SEC"> SEC</label>
                                <label><input type="checkbox" name="requirements" value="DTI"> DTI</label>
                                <label><input type="checkbox" name="requirements" value="TCT"> TCT</label>
                                <label><input type="checkbox" name="requirements" value="Lease Contract"> Lease Contract</label>
                                <label><input type="checkbox" name="requirements" value="Previous Business Permit"> Previous Business Permit</label>
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="requirementUpload">Upload Document</label>
                                <input type="file" id="requirementUpload" name="requirementUpload" accept=".pdf,.jpg,.jpeg,.png">
                                <div class="error-msg"></div>
                            </div>

                            <div class="label-and-input">
                                <label for="noOfEmployees">Number of Employees</label>
                                <input type="tel" id="noOfEmployees" name="noOfEmployees" maxlength="2" pattern="[0-9]{1,2}">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="button" id="nextToWaiver">Next</button>
                        <button type="button" id="utilitiesBackBtn">Back</button>
                    </form>

                </div>
                <!-- ==================== Waiver Form ==================== -->
                <div class="waiver-container hidden" id="waiver">
                    <form id="waiverUtilitiesForm">
                        <h3>Waiver</h3>

                        <div id="waiverContent">
                            <p>
                                I, <span id="waiverFullname"></span>, hereby certify that all information provided in this
                                Business Application Form is true and correct. I authorize the Barangay to verify the information
                                with the documents submitted.
                            </p>

                            <p>
                                I understand that any false declaration or withholding of relevant information may result in
                                the denial, revocation, or suspension of my business permit.
                            </p>

                            <p>
                                I agree that the Barangay shall not be held liable for any incorrect information or discrepancies
                                provided in this form and supporting documents.
                            </p>
                        </div>

                        <div class="label-and-input">
                            <label for="agreeCheckBox">
                                <input type="checkbox" id="agreeCheckBox" name="agree">
                                I agree to the terms and conditions
                            </label>
                            <div class="error-msg"></div>
                        </div>

                        <button type="button" id="nextToSummary">Next</button>
                        <button type="button" id="waiverBackBtn">Back</button>
                    </form>
                </div>

                <!-- ==================== Summary ==================== -->
                <div class="summary-container hidden" id="summary">
                    <form id="summaryForm">
                        <h3>Summary</h3>

                        <div id="summaryContent">
                            <p><strong>Business Name:</strong> <span id="sumBusinessName"></span></p>
                            <p><strong>Type of Business:</strong> <span id="sumTypeOfBusiness"></span></p>
                            <p><strong>Nature of Business:</strong> <span id="sumNatureOfBusiness"></span></p>
                            <p><strong>Nature of Business:</strong> <span id="sumAddressOfBusiness"></span></p>
                            <p><strong>Business Telephone:</strong> <span id="sumTelephoneBusiness"></span></p>
                            <p><strong>Email:</strong> <span id="sumEmail"></span></p>
                            <p><strong>Owner Name:</strong> <span id="sumFullname"></span></p>
                            <p><strong>Owner Telephone:</strong> <span id="sumTelephoneOwner"></span></p>
                            <p><strong>Owner Address:</strong> <span id="sumAddressOwner"></span></p>
                            <p><strong>Structure Type:</strong> <span id="sumStructureType"></span></p>
                            <p><strong>Requirements:</strong> <span id="sumRequirements"></span></p>
                            <p><strong>No. of Employees:</strong> <span id="sumEmployees"></span></p>
                            <p><strong>Agreed to Terms:</strong> <span id="sumAgreed"></span></p>
                        </div>

                        <button type="submit" id="submitApplication">Submit Application</button>
                        <button type="button" id="summaryBackBtn">Back</button>
                    </form>
                </div>

            </div>
        </section>
    </main>
    </div>

</body>
<script src="../../scripts/resident/business_app.js"></script>
</html>
<?php include '_layout/end.php'; ?>