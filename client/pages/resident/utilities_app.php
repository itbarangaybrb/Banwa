<?php
require_once __DIR__ . '/../../../server/api/resident/check_session.php';
?>

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
    <?php
    $page_title = "Utilities Application";
    include '_layout/nav.php';
    ?>

    <main>
        <div class="content_wrapper">
            <div class="content-section active" id="default">
                <h2>Utiliies Clearance</h2>
                <p>Select a size from the navigation menu to view product details.</p>
                <div id="utilitiesStatus"></div>

                <section class="sections">
                    <div class="containers">

                        <!-- <div class="top">
                            <div class="back-icon">
                                <img src="../../img/arrow-left.svg" alt="">
                            </div>

                            <div class="header-and-text">
                                <h2>Utilities</h2>
                                <p>This form authorizes personnel to perform the requested utility service at your address. </p>
                            </div>
                        </div> -->

                        <!-- ==================== Utiliies Form ==================== -->
                        <div class="utilities-container" id="utilities">
                            <!-- <div class="top">
                                <div class="indicator">
                                    <div class="circle">
                                        <h5 class="num">1</h5>
                                    </div>
                                    <div class="line">Application</div>
                                    <div class="circle">
                                        <h5 class="num">2</h5>
                                    </div>
                                    <div class="line">Authorization & Waiver</div>
                                    <div class="circle">
                                        <h5 class="num">3</h5>
                                    </div>
                                    <div class="line">Service Request Confirmation</div>
                                </div>

                                <div class="header-and-text">
                                    <h2>Application Details</h2>
                                    <p>All fields are required unless specified.</p>
                                </div>
                            </div> -->

                            <form class="form" id="utilitiesForms">
                                <h1>Application Details</h1>
                                <p>All fields are required unless specified.</p>
                                <div class="inputs-container">
                                    <div class="label-and-input">
                                        <label for="requestDate">Request date</label>
                                        <input type="date" name="requestDate" id="requestDate">
                                        <span class="error-msg"></span>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="dateOfWork">Date of work</label>
                                        <input type="date" name="dateOfWork" id="dateOfWork">
                                        <span class="error-msg"></span>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="fullnameUtilities">Fullname</label>
                                        <input type="text" name="fullname" id="fullnameUtilities">
                                        <span class="error-msg"></span>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="contactNo">Contact no.</label>
                                        <input type="tel" name="contactNo" id="contactNo" maxlength="11" pattern="[0-9]{1,11}">
                                        <span class="error-msg"></span>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="address">Address</label>
                                        <input type="text" name="address" id="address">
                                        <span class="error-msg"></span>
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
                                        <span class="error-msg"></span>
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
                                        <span class="error-msg"></span>
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
                                <h3>Authorization & Waiver</h3>
                                <p>Please read and accept the terms to continue.</p>

                                <div id="waiverContent">
                                    <p>By checking the box below, I hereby authorize <span id="waiverFullname"></span> to allow personnel from the above-named company to conduct work within my residence.</p>
                                    <p>It is our responsibility to ensure that proper identification is presented by the work personnel and that adequate safety and security precautions are observed while they are within our premises. I relieve the Barangay of any obligation and liability regarding any untoward incident and quality of work rendered.</p>
                                    <p>I further understand that NO PERMIT, NO WORK will be strictly implemented by the Barangay.</p>
                                </div>

                                <div class="label-and-input">
                                    <label for="agreeCheckBox">
                                        <input type="checkbox" name="agree" id="agreeCheckBox">
                                        I have read, understood, and agree to the Authorization and Waiver.
                                    </label>
                                    <span class="error-msg"></span>
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
                                <h3>Confirm your information</h3>
                                <p>Please review all the information carefully before submitting</p>

                                <div id="summaryContent">
                                    <h4>Request Details</h4>
                                    <div class="row">
                                        <div><strong>Request date</strong> <span id="sumRequestDate">test</span></div>
                                        <div><strong>Date of work</strong> <span id="sumDateOfWork">test</span></div>
                                    </div>
                                    <div class="row">
                                        <div><strong>Control no.</strong> <span id="sumProvider"></span></div>
                                        <div><strong>Provider:</strong> <span id="sumProvider"></span></div>
                                    </div>
                                    <div class="divider"></div>
                                    <h4>Confirm your information</h4>
                                    <div class="row">
                                        <div><strong>Fullname</strong> <span id="sumFullname"></span></div>
                                        <div><strong>Contact no.</strong> <span id="sumContactNo"></span></div>
                                    </div>
                                    <div><strong>Full address</strong> <span id="sumAddress"></span></div>
                                    <div><strong>Nature of work</strong> <span id="sumNatureOfWork"></span></div>
                                    <div><strong>Agreed to terms</strong> <span id="sumAgreed"></span></div>
                                </div>

                                <div class="buttons-container">
                                    <button type="button" id="summaryBackBtn">Back</button>
                                    <button type="submit" id="submitApplication">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </main>

    <script src="../../scripts/resident/utilities_app.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>
<?php include '_layout/end.php'; ?>