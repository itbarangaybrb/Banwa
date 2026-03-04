<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';
if ($_SESSION['role_id'] != 8) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Report</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="../../styles/resident/incidentReport.css">
</head>

<body>
    <?php
    $page_title = "Incident Report";
    include '_layout/nav.php';
    ?>

    <section class="sections" id="permits">
        <div class="header-and-parag">
            <h4>Incident Report</h4>
            <p>Report any incident that occurred within the barangay. Fill out all required fields accurately.</p>
        </div>

        <?php if (!empty($success_message) || !empty($error_message)): ?>
            <div id="formMessage" class="message <?php echo !empty($success_message) ? 'success' : 'error'; ?>">
                <?php echo !empty($success_message) ? $success_message : $error_message; ?>
            </div>

            <script>
                const formMessage = document.getElementById('formMessage');
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 2000);
            </script>
        <?php endif; ?>

        <!-- ==================== PANEL 1: Reporting Person ==================== -->
        <div class="containers incident-container" id="reportingPerson">
            <form class="form" id="reportingPersonForm">
                <h6>1. Reporting Person</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label class="label" for="rpFullName">Full Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="rpFullName" name="rpFullName" placeholder="Last, First, Middle Name">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="rpLotNo">Lot No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="rpLotNo" id="rpLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="rpStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="rpStreet" id="rpStreet">
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
                    <!-- NO LATITUDE/LONGITUDE FOR REPORTING PERSON -->
                    <div class="label-and-input">
                        <label class="label" for="rpContact">Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="rpContact" name="rpContact" maxlength="11" pattern="[0-9]{1,11}" placeholder="e.g., 09XXXXXXXXX">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="rpRelationship">Relationship to Victim (if applicable)</label>
                        <input type="text" id="rpRelationship" name="rpRelationship" placeholder="e.g., Self, Neighbor, Friend">
                        <div class="error-msg"></div>
                    </div>
                </div>
                <div class="buttons-container">
                    <button type="button" id="reportingPersonBackBtn">Back</button>
                    <button type="button" id="nextToVictim">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== PANEL 2: Victim Details ==================== -->
        <div class="containers incident-container hidden" id="victimDetails">
            <form class="form" id="victimDetailsForm">
                <h6>2. Victim / Complainant Details</h6>
                <div class="inputs-container" id="victimDetailsContainer">
                    <div class="checkbox-group">
                        <label for="victimSameAsRP">
                            <input type="checkbox" id="victimSameAsRP">
                            Victim is the same as the Reporting Person
                        </label>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="vicFullName">Full Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="vicFullName" name="vicFullName" placeholder="Full Name">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicLotNo">Lot No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="vicLotNo" id="vicLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicStreet">Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="vicStreet" id="vicStreet">
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
                    <!-- NO LATITUDE/LONGITUDE FOR VICTIM -->
                    <div class="label-and-input">
                        <label class="label" for="vicContact">Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="vicContact" name="vicContact" maxlength="11" pattern="[0-9]{1,11}" placeholder="e.g., 09XXXXXXXXX">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicCitizenship">Citizenship <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="vicCitizenship" name="vicCitizenship" placeholder="e.g., Filipino">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicGender">Gender <span style="color: #BB1B1B;">*</span></label>
                        <select id="vicGender" name="vicGender">
                            <option value="" disabled selected>Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicDOB">Date of Birth <span style="color: #BB1B1B;">*</span></label>
                        <input type="date" id="vicDOB" name="vicDOB">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="vicOccupation">Occupation <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="vicOccupation" name="vicOccupation" placeholder="Occupation">
                        <div class="error-msg"></div>
                    </div>
                </div>
                <div class="buttons-container">
                    <button type="button" id="victimBackBtn">Back</button>
                    <button type="button" id="nextToSuspect">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== PANEL 3: Suspect Details ==================== -->
        <div class="containers incident-container hidden" id="suspectDetails">
            <form class="form" id="suspectDetailsForm">
                <h6>3. Suspect / Respondent Details</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label class="label" for="susFullName">Full Name (if known)</label>
                        <input type="text" id="susFullName" name="susFullName" placeholder="Full Name">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="susLotNo">Lot No. (if known)</label>
                        <input type="tel" name="susLotNo" id="susLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="susStreet">Street Name (if known)</label>
                        <select name="susStreet" id="susStreet">
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
                    <!-- NO LATITUDE/LONGITUDE FOR SUSPECT -->
                    <div class="label-and-input">
                        <label class="label" for="susContact">Phone or Landline Number (if known)</label>
                        <input type="text" id="susContact" name="susContact" maxlength="11" pattern="[0-9]{1,11}" placeholder="Contact Number">
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="susGender">Gender</label>
                        <select id="susGender" name="susGender">
                            <option value="" disabled selected>Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input full-span">
                        <label class="label" for="susDescription">Physical Description and Affiliations <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="susDescription" name="susDescription" rows="3" placeholder="Describe clothing, height, distinguishing features (tattoos, scars), etc."></textarea>
                        <div class="error-msg"></div>
                    </div>
                </div>
                <div class="buttons-container">
                    <button type="button" id="suspectBackBtn">Back</button>
                    <button type="button" id="nextToWitnesses">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== PANEL 4: Witnesses ==================== -->
        <div class="containers incident-container hidden" id="witnessesSection">
            <form class="form" id="witnessesForm">
                <h6>4. Witnesses (If Any)</h6>
                <div class="inputs-container">
                    <div id="witnessesContainer">
                        <!-- Dynamic witness inputs will be added here by JavaScript -->
                    </div>
                    <button type="button" id="addWitnessBtn">Add Witness</button>
                </div>
                <div class="buttons-container">
                    <button type="button" id="witnessesBackBtn">Back</button>
                    <button type="button" id="nextToIncident">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== PANEL 5: Incident Details ==================== -->
        <div class="containers incident-container hidden" id="incidentDetails">
            <form class="form" id="incidentDetailsForm">
                <h6>5. Incident Details</h6>
                <div class="inputs-container">
                    <div class="label-and-input">
                        <label class="label" for="incidentType">Incident Type <span style="color: #BB1B1B;">*</span></label>
                        <select id="incidentType" name="incidentType">
                            <option value="" disabled selected>Select Type</option>
                            <option value="Property/Civil Disputes">Property/Civil Disputes</option>
                            <option value="Minor Offenses Against Persons/Safety">Minor Offenses Against Persons/Safety</option>
                            <option value="Minor Offenses Against Honor/Property">Minor Offenses Against Honor/Property</option>
                            <option value="Violence Against Woman and their Children">Violence Against Woman and their Children</option>
                            <option value="Serious Crime">Serious Crime</option>
                            <option value="Public Safety and Emergencies">Public Safety and Emergencies</option>
                            <option value="Ordinance Violations">Ordinance Violations</option>
                            <option value="other">Other</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div id="otherSpecifyContainer" class="label-and-input hidden">
                        <label class="label" for="otherIncidentType">Please specify other incident type <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="otherIncidentType" name="otherIncidentType">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="incidentTimestamp">Date and Time of Incident <span style="color: #BB1B1B;">*</span></label>
                        <input type="datetime-local" id="incidentTimestamp" name="incidentTimestamp">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="incidentLotNo">Incident Location - Lot No. <span style="color: #BB1B1B;">*</span></label>
                        <input type="tel" name="incidentLotNo" id="incidentLotNo" maxlength="2" pattern="[0-9]{1,2}">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="incidentStreet">Incident Location - Street Name <span style="color: #BB1B1B;">*</span></label>
                        <select name="incidentStreet" id="incidentStreet">
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
                    <!-- ONLY INCIDENT HAS LATITUDE/LONGITUDE -->
                    <input type="hidden" id="incidentLatitude" name="incidentLatitude" pattern="-?\d{1,2}\.\d{6,8}"
                        title="Enter latitude in decimal format (e.g., 14.617500)"
                        placeholder="e.g., 14.617500"
                        value="<?php echo isset($_POST['incidentLatitude']) ? htmlspecialchars($_POST['incidentLatitude']) : ''; ?>">
                    <input type="hidden" id="incidentLongitude" name="incidentLongitude" pattern="-?\d{1,3}\.\d{6,8}"
                        title="Enter longitude in decimal format (e.g., 121.075600)"
                        placeholder="e.g., 121.075600"
                        value="<?php echo isset($_POST['incidentLongitude']) ? htmlspecialchars($_POST['incidentLongitude']) : ''; ?>">
                    <div class="label-and-input">
                        <button type="button" class="map-btn" data-target="incident">Pick Location on Map</button>
                        <div class="map-preview" id="map-preview-incident" style="margin-top: 10px; display: none;"></div>
                    </div>

                    <div class="label-and-input full-span">
                        <label class="label" for="description">Please describe what happened <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="description" name="description" rows="4"></textarea>
                        <div class="error-msg"></div>
                    </div>
                </div>
                <div class="buttons-container">
                    <button type="button" id="incidentBackBtn">Back</button>
                    <button type="button" id="nextToSummary">Next</button>
                </div>
            </form>
        </div>

        <!-- ==================== PANEL 6: Summary ==================== -->
        <div class="containers incident-container hidden" id="summary">
            <form class="form" id="summaryForm">
                <h6>Summary of Report</h6>
                <div id="summaryContent">
                    <div class="summary-header-and-info">
                        <p>Reporting Person</p>
                        <div class="summary-info">
                            <div>
                                <p>Name:</p> <span id="sumRpFullName"></span>
                            </div>
                            <div>
                                <p>Address:</p> <span id="sumRpAddress"></span>
                            </div>
                            <div>
                                <p>Contact:</p> <span id="sumRpContact"></span>
                            </div>
                            <div>
                                <p>Relationship to Victim:</p> <span id="sumRpRelationship"></span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Victim Details</p>
                        <div class="summary-info">
                            <div>
                                <p>Name:</p> <span id="sumVicFullName"></span>
                            </div>
                            <div>
                                <p>Address:</p> <span id="sumVicAddress"></span>
                            </div>
                            <div>
                                <p>Contact:</p> <span id="sumVicContact"></span>
                            </div>
                            <div>
                                <p>Citizenship:</p> <span id="sumVicCitizenship"></span>
                            </div>
                            <div>
                                <p>Gender:</p> <span id="sumVicGender"></span>
                            </div>
                            <div>
                                <p>Date of Birth:</p> <span id="sumVicDOB"></span>
                            </div>
                            <div>
                                <p>Occupation:</p> <span id="sumVicOccupation"></span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Suspect Details</p>
                        <div class="summary-info">
                            <div>
                                <p>Name:</p> <span id="sumSusFullName"></span>
                            </div>
                            <div>
                                <p>Address:</p> <span id="sumSusAddress"></span>
                            </div>
                            <div>
                                <p>Contact:</p> <span id="sumSusContact"></span>
                            </div>
                            <div>
                                <p>Gender:</p> <span id="sumSusGender"></span>
                            </div>
                            <div>
                                <p>Description:</p> <span id="sumSusDescription"></span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-header-and-info">
                        <p>Incident Details</p>
                        <div class="summary-info">
                            <div>
                                <p>Type:</p> <span id="sumIncidentType"></span>
                            </div>
                            <div>
                                <p>Date & Time:</p> <span id="sumIncidentTimestamp"></span>
                            </div>
                            <div>
                                <p>Location:</p> <span id="sumIncidentLocation"></span>
                            </div>
                            <div>
                                <p>Coordinates:</p> <span id="sumIncidentCoordinates"></span>
                            </div>
                            <div>
                                <p>Description:</p> <span id="sumDescription"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="buttons-container">
                    <button type="button" id="summaryBackBtn">Back</button>
                    <button type="submit" id="submitReport">Submit Report</button>
                </div>
            </form>
        </div>
    </section>

    <!-- Report Output Section (hidden by default) -->
    <section id="reportOutput" class="hidden">
        <h2>Report Generated Successfully!</h2>
        <p>Click the button below to download the report file.</p>
        <button id="downloadBtn">Download Report (.doc)</button>
    </section>

    <?php include '_layout/end.php'; ?>
    <script type="module" src="../../scripts/resident/incidentReport.js"></script>
</body>

</html>