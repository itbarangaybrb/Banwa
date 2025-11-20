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
    <p id="userStatus"></p>
    <button id="signoutBtn">Logout</button>

    <main>
        <section class="sections">
            <div class="containers">

                <!-- ==================== Utiliies Form ==================== -->
                <div class="utilities-container" id="utilities">
                    <form action="" class="forms" id="utilitiesForms">
                        <h3>Utilities Application</h3>

                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="requestDate">Request date</label>
                                <input type="date" name="requestDate" id="requestDate">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="dateOfWork">Date of work</label>
                                <input type="date" name="dateOfWork" id="dateOfWork">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="fullnameUtilities">Fullname</label>
                                <input type="text" name="fullname" id="fullnameUtilities">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="contactNo">Contact no.</label>
                                <input type="tel" name="contactNo" id="contactNo" maxlength="11" pattern="[0-9]{1,11}">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="address">Address</label>
                                <input type="text" name="address" id="address">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="provider">Select Provider</label>
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
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="natureOfWork">Nature of work to be done</label>
                                <div class="select-and-icon">
                                    <select name="natureOfWork" id="natureOfWork">
                                        <option value="select">Select</option>
                                        <option value="New Installation">New Installation</option>
                                        <option value="Repair/Maintenance">Repair/Maintenance</option>
                                        <option value="Permanent Disconnection">Permanent Disconnection</option>
                                        <option value="Reconnection">Reconnection</option>
                                    </select>
                                </div>
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="button" id="nextToWaiver">Next</button>
                        <button type="button" id="utilitiesBackBtn">Back</button>
                    </form>
                </div>

                <!-- ==================== Waiver Form ==================== -->
                <div class="waiver-container hidden" id="waiver">
                    <form action="" id="waiverUtilitiesForm">
                        <h3>Waiver</h3>

                        <div id="waiverContent">
                            <p id="waiverP1">By checking the box below, I hereby authorize <span id="waiverFullname"></span> to allow personnel from the above-named company to conduct work within my residence.</p>
                            <p>It is our responsibility to ensure that proper identification is presented by the work personnel and that adequate safety and security precautions are observed while they are within our premises. I relieve the Barangay of any obligation and liability regarding any untoward incident and quality of work rendered.</p>
                            <p>I further understand that NO PERMIT, NO WORK will be strictly implemented by the Barangay.</p>
                        </div>

                        <div class="label-and-input">
                            <label for="agreeCheckBox">
                                <input type="checkbox" name="agree" id="agreeCheckBox">
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
                    <form class="forms" id="summaryForm">
                        <h3>Summary</h3>
                        <div id="summaryContent">
                            <p><strong>Request date:</strong> <span id="sumRequestDate"></span></p>
                            <p><strong>Date of work:</strong> <span id="sumDateOfWork"></span></p>
                            <p><strong>Fullname:</strong> <span id="sumFullname"></span></p>
                            <p><strong>Contact no.:</strong> <span id="sumContactNo"></span></p>
                            <p><strong>Address:</strong> <span id="sumAddress"></span></p>
                            <p><strong>Provider:</strong> <span id="sumProvider"></span></p>
                            <p><strong>Nature of work:</strong> <span id="sumNatureOfWork"></span></p>
                            <p><strong>Agreed to terms:</strong> <span id="sumAgreed"></span></p>
                        </div>

                        <button type="submit" id="submitApplication">Submit Application</button>
                        <button type="button" id="summaryBackBtn">Back</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <script src="../../scripts/resident/utilities_app.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>