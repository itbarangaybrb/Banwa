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
                <h2>Business Application</h2>
                <p>This form authorizes personnel to perform the requested utility service at your address. </p>
                <section class="sections">
                    <div class="containers">

                        <!-- ==================== Business Form ==================== -->
                        <div class="business-container" id="business">
                            <form class="form" id="certificationForm">
                                <h1>Certification of Information</h1>
                                <p>This form authorizes personnel to perform the requested utility service at your address.</p>
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
                                        <label for="natureOfBusinessSpecify">Specify Details</label>
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
                                        <label><input type="radio" name="businessStatus" value="Owned"> Owned</label>
                                        <label><input type="radio" name="businessStatus" value="Leased"> Leased</label>
                                        <label><input type="radio" name="businessStatus" value="Rent-Free"> Rent-Free</label>
                                        <label><input type="radio" name="businessStatus" value="Others"> Others</label>
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
                                    <div class="label-and-input">
                                        <label for="applicationDate">Application Date</label>
                                        <input type="date" id="applicationDate" name="applicationDate" readonly>
                                    </div>
                                </div>

                                <div class="buttons-container">
                                    <button type="button" id="utilitiesBackBtn">Back</button>
                                    <button type="button" id="nextToWaiver">Next</button>
                                </div>
                            </form>
                        </div>

                        <!-- ==================== Waiver Form ==================== -->
                        <div class="waiver-container hidden" id="waiver">
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

                        <!-- ==================== Summary ==================== -->
                        <div class="summary-container hidden" id="summary">
                            <form class="form" id="summaryForm">
                                <h3>Summary</h3>

                                <div id="summaryContent">
                                    <div><strong>Business Name:</strong> <span id="sumBusinessName"></span></div>
                                    <div><strong>Type of Business:</strong> <span id="sumTypeOfBusiness"></span></div>
                                    <div><strong>Nature of Business:</strong> <span id="sumNatureOfBusiness"></span></div>

                                    <div><strong>Business Status:</strong> <span id="sumBusinessStatus"></span></div>

                                    <div><strong>Address of Business:</strong> <span id="sumAddressOfBusiness"></span></div>
                                    <div><strong>Business Telephone:</strong> <span id="sumTelephoneBusiness"></span></div>
                                    <div><strong>Email:</strong> <span id="sumEmail"></span></div>
                                    <div><strong>Owner Name:</strong> <span id="sumFullname"></span></div>
                                    <div><strong>Owner Telephone:</strong> <span id="sumTelephoneOwner"></span></div>
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
                    </div>
                </section>
            </div>
        </div>
    </main>

</body>
<script src="../../scripts/resident/business_app.js"></script>

</html>