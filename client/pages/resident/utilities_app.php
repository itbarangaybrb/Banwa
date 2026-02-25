<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

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
    <title>Utilities Application</title>

    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

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
            <h4>Utilies Clearance</h4>
            <p>Select a size from the navigation menu to view product details.</p>
        </div>

        <!-- ==================== owner Form ==================== -->
        <div class="containers utilities-container" id="owner">
            <form class="form" id="ownerForms">
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
                        <label class="label" for="contactNoOwner">Landline/Phone No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" id="contactNoOwner" name="contactNoOwner" maxlength="11" pattern="[0-9]{1,11}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="lotNo">Lot no. <span style="color: #BB1B1B;">*</span></label>
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
                </div>

                <div class="buttons-container">
                    <button type="button" id="ownerBackBtn">Back</button>
                    <button type="button" id="nextToUtilities">Next</button>
                </div>
            </form>
        </div>


        <!-- ==================== Utiliies Form ==================== -->
        <div class="containers utilities-container hidden" id="utilities">
            <form class="form" id="utilitiesForms">
                <h6>Utilities Information</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label for="requestDate">When is the request date? <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" name="requestDate" id="requestDate">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="dateOfWork">When will the work be done? <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" name="dateOfWork" id="dateOfWork">
                        <span class="error-msg"></span>
                    </div>
                    <div class="label-and-input">
                        <label for="natureOfWork">Nature of the work? (What kind of work will be done?) <span style="color: #BB1B1B;">*</span></label>
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
                    <div class="label-and-input">
                        <label for="provider">Which provider? <span style="color: #BB1B1B;">*</span></label>
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
                        <label class="label" for="utilityLotNo">Lot no. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="utilityLotNo" id="utilityLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="utilityStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="utilityStreet" id="utilityStreet">
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
                <h6>Waiver</h6>

                <div id="waiverContent">
                    <p>By checking the box below, I hereby authorize <span id="waiverFullname"></span> to conduct work within my residence.
                        <br>
                        <br>
                        It is our responsibility to ensure that proper identification are presented by the work personnel and that adequate safety and security precautions are observed while they are within our premises. I relieve the Barangay of any obligation and liability regarding any untoward incident and quality of work rendered.
                        <br>
                        <br>
                        In my absence, I hereby authorize the above-named company to conduct work within my residence.
                        <br>
                        <br>
                        I further understand that NO PERMIT, NO WORK will be strictly implemented by the Barangay.
                    </p>
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
                        <p>Utilities Information</p>
                        <div class="summary-info">
                            <div>
                                <p>Request Date:</p> <span id="sumReqDate"></span>
                            </div>
                            <div>
                                <p>Date of Work:</p> <span id="sumDateOfWork"></span>
                            </div>
                            <div>
                                <p>Nature of Work:</p> <span id="sumNatureOfWork"></span>
                            </div>
                            <div>
                                <p>Provider:</p> <span id="sumProvider"></span>
                            </div>
                            <div>
                                <p>Address:</p> <span id="sumAddressOfUtility"></span>
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

    <script type="module" src="../../scripts/resident/utilities_app.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <?php include '_layout/end.php'; ?>
</body>

</html>