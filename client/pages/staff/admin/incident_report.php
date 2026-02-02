<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Report Page</title>
    <!-- Normalize CSS for consistent base styling across browsers -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
    <link rel="stylesheet" href="../../styles/admin/incidents_report.css">
</head>
<body>

    <header>
        <h1>Incident Report Submission</h1>
        <p>Please fill out all mandatory fields accurately.</p>
    </header>
    <main>
        <section id="report-form">
            <h2>Submit a New Incident Report</h2>
            <form id="incidentForm">
                
                <!-- START SECTION 1: REPORTING PERSON -->
                <h3>1. Reporting Person</h3>
                <label for="rpFullName">Full Name:</label>
                <input type="text" id="rpFullName" name="rpFullName" required placeholder="Last, First, Middle Name">
                
                <label for="rpAddress">Current Address:</label>
                <input type="text" id="rpAddress" name="rpAddress" required>
                
                <label for="rpContact">Contact Number:</label>
                <input type="text" id="rpContact" name="rpContact" required>
                
                <label for="rpRelationship">Relationship to Victim (if applicable):</label>
                <input type="text" id="rpRelationship" name="rpRelationship" placeholder="e.g., Self, Neighbor, Friend">

                <hr>

                <!-- START SECTION 2: VICTIM / COMPLAINANT DETAILS -->
                <h3>2. Victim / Complainant Details</h3>
                
                <div class="checkbox-group">
                    <label for="victimSameAsRP">
                        Victim is the same as the Reporting Person
                    </label>
                    <input type="checkbox" id="victimSameAsRP">
                </div>

                <div id="victimDetailsContainer" class="details-container">
                    <div class="form-group"><label for="vicFullName">Full Name:</label><input type="text" id="vicFullName" name="vicFullName" placeholder="Full Name"></div>
                    <div class="form-group"><label for="vicAddress">Current Address:</label><input type="text" id="vicAddress" name="vicAddress" placeholder="Address"></div>
                    <div class="form-group"><label for="vicContact">Contact Number:</label><input type="text" id="vicContact" name="vicContact" placeholder="Contact Number"></div>
                    <div class="form-group"><label for="vicCitizenship">Citizenship:</label><input type="text" id="vicCitizenship" name="vicCitizenship" placeholder="e.g., Filipino"></div>
                    <div class="form-group"><label for="vicGender">Gender:</label>
                        <select id="vicGender" name="vicGender">
                            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group"><label for="vicDOB">Date of Birth:</label><input type="date" id="vicDOB" name="vicDOB"></div>
                    <div class="form-group"><label for="vicOccupation">Occupation:</label><input type="text" id="vicOccupation" name="vicOccupation" placeholder="Occupation"></div>
                </div>

                <hr>

                <!-- START SECTION 3: SUSPECT / RESPONDENT DETAILS -->
                <h3>3. Suspect / Respondent Details</h3>
                <div class="details-container">
                    <div class="form-group"><label for="susFullName">Full Name (if known):</label><input type="text" id="susFullName" name="susFullName" placeholder="Full Name"></div>
                    <div class="form-group"><label for="susAddress">Current Address:</label><input type="text" id="susAddress" name="susAddress" placeholder="Address"></div>
                    <div class="form-group"><label for="susContact">Contact Number (if known):</label><input type="text" id="susContact" name="susContact" placeholder="Contact Number"></div>
                    <div class="form-group"><label for="susGender">Gender:</label>
                        <select id="susGender" name="susGender">
                            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group full-span">
                        <label for="susDescription">Physical Description and Affiliations:</label>
                        <textarea id="susDescription" name="susDescription" rows="3" placeholder="Describe clothing, height, distinguishing features (tattoos, scars), etc."></textarea>
                    </div>
                </div>

                <hr>

                <!-- START SECTION 4: WITNESSES (DYNAMIC) -->
                <h3>4. Witnesses (If Any)</h3>
                <div id="witnessesContainer">
                    <!-- Dynamic witness inputs will be added here by JavaScript -->
                </div>
                <button type="button" id="addWitnessBtn">Add Witness</button>

                <hr>

                <!-- START SECTION 5: INCIDENT DETAILS -->
                <h3>5. Incident Details</h3>
                <label for="incidentType">Incident Type:</label>
                <select id="incidentType" name="incidentType" required>
                    <option value="">Select Type</option>
                    <option value="Property/Civil Disputes">Property/Civil Disputes</option>
                    <option value="Minor Offenses Against Persons/Safety">Minor Offenses Against Persons/Safety</option>
                    <option value="Minor Offenses Against Honor/Property">Minor Offenses Against Honor/Property</option>
                    <option value="Violence Against Woman and their Children">Violence Against Woman and their Children</option>
                    <option value="Serious Crime">Serious Crime</option>
                    <option value="Public Safety and Emergencies">Public Safety and Emergencies</option>
                    <option value="Ordinance Violations">Ordinance Violations</option>
                    <option value="other">Other</option>
                </select>

                <div id="otherSpecifyContainer" class="hidden">
                    <label for="otherIncidentType">Please specify other incident type:</label>
                    <input type="text" id="otherIncidentType" name="otherIncidentType">
                </div>
                
                <label for="incidentTimestamp">Date and Time of Incident:</label>
                <input type="datetime-local" id="incidentTimestamp" name="incidentTimestamp" required>

                <label for="dateReported">Date and Time of Report:</label>
                <!-- This field is auto-populated by JS and is read-only -->
                <input type="text" id="dateReported" name="dateReported" class="read-only-field" readonly>

                <label for="description">Narrative/Description:</label>
                <textarea id="description" name="description" rows="4" required></textarea>

                <button type="submit">Submit Report</button>
            </form>
        </section>

        <!-- START REPORT OUTPUT SECTION -->
        <section id="reportOutput" class="hidden">
            <h2>Report Generated Successfully!</h2>
            <p>Click the button below to download the report file. It will open in Microsoft Word or a similar program.</p>
            <button id="downloadBtn">Download Report (.doc)</button>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 Incident Reporting System</p>
    </footer>
</body>
<script src="../../scripts/admin/incidents_report.js"></script>
</html>