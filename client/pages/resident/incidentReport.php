<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /client/index.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Report Application</title>
    
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="../../styles/resident/incidentReport.css">

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

</head>

<body>
    <?php
    $page_title = "Incident Report Application";
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

                    <div class="label-and-input full-span">
                        <label class="label" for="rpAddress">Complete Address <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="rpAddress" name="rpAddress" rows="2" placeholder="Unit/House No., Street, Barangay, City/Municipality, Province"></textarea>
                        <div class="error-msg"></div>
                    </div>
                    <!-- NO LATITUDE/LONGITUDE FOR REPORTING PERSON -->
                    <div class="label-and-input">
                        <label class="label" for="rpContact">Mobile Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
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

                <div class="checkbox-group" style="margin-bottom: 20px;">
                    <label for="victimSameAsRP">
                        <input type="checkbox" id="victimSameAsRP">
                        Victim is the same as the Reporting Person
                    </label>
                </div>

                <div class="inputs-container" id="victimDetailsContainer">
                    <div class="label-and-input">
                        <label class="label" for="vicFullName">Full Name <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="vicFullName" name="vicFullName" placeholder="Full Name">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input full-span">
                        <label class="label" for="vicAddress">Complete Address <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="vicAddress" name="vicAddress" rows="2" placeholder="Unit/House No., Street, Barangay, City/Municipality, Province"></textarea>
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="vicContact">Mobile Phone or Landline Number <span style="color: #BB1B1B;">*</span></label>
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
                    <div class="label-and-input full-span">
                        <label class="label" for="susAddress">Complete Address (if known)</label>
                        <textarea id="susAddress" name="susAddress" rows="2" placeholder="Unit/House No., Street, Barangay, City/Municipality, Province"></textarea>
                        <div class="error-msg"></div>
                    </div>
                    <div class="label-and-input">
                        <label class="label" for="susContact">Mobile Phone or Landline Number (if known)</label>
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
                            <option value="Other">Other</option>
                        </select>
                        <div class="error-msg"></div>
                    </div>

                    <div id="otherSpecifyContainer" class="label-and-input">
                        <label class="label" for="otherIncidentType">Please specify other incident type <span style="color: #BB1B1B;">*</span></label>
                        <input type="text" id="otherIncidentType" name="otherIncidentType">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input">
                        <label class="label" for="incidentTimestamp">Date and Time of Incident <span style="color: #BB1B1B;">*</span></label>
                        <input type="datetime-local" id="incidentTimestamp" name="incidentTimestamp">
                        <div class="error-msg"></div>
                    </div>

                    <div class="label-and-input full-span">
                        <label class="label" for="incidentAddress">Incident Location (Complete Address) <span style="color: #BB1B1B;">*</span></label>
                        <textarea id="incidentAddress" name="incidentAddress" rows="2" placeholder="Unit/House No., Street, Barangay, City/Municipality, Province"></textarea>
                        <div class="error-msg"></div>
                    </div>
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
    <!-- <section id="reportOutput" class="hidden">
        <h2>Report Generated Successfully!</h2>
        <p>Click the button below to download the report file.</p>
        <button id="downloadBtn">Download Report (.doc)</button>
    </section> -->

    <script type="module" src="../../scripts/resident/incidentReport.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <?php include '_layout/end.php'; ?>
</body>

</html>