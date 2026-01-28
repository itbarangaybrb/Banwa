<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Signup</title>

    <link rel="stylesheet" href="../../styles/auth/signup1.css">
</head>

<body>
    <main>
        <section class="sections">
            <div class="containers">
                <!-- ==================== Pre-verify Form ==================== -->
                <!-- <div class="pre-verify-container" id="preVerify">
                    <form action="" id="preVerifyForm">
                        <h3>Verification</h3>
                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="email">Email</label>
                                <input type="email" name="email" id="email" />
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <div class="buttons-container">
                            <button type="submit" id="preVerifyNoBtn">Verify Number</button>
                            <div class="label-and-input">
                                <label>
                                    <input type="checkbox" id="agreeCheckBox"> I confirm that I have read and accept the <a href="#">terms and conditions</a> and <a href="#">privacy policy</a>.
                                </label>
                                <div class="error-msg"></div>
                            </div>
                        </div>
                    </form>
                </div> -->

                <!-- ==================== Verify-OTP Form ==================== -->
                <!-- <div class="verify-otp-container hidden" id="verifyOtp">
                    <form action="" id="verifyOtpForm">
                        <h3>Confirmation</h3>
                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="verificationCode">Verification Code</label>
                                <input type="tel" name="verificationCode" id="verificationCode" maxlength="6" pattern="[0-9]{1,6}" />
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="button" id="verifyOtpBtn">Confirm</button>
                    </form>
                </div> -->


                <div class="panel left-panel">
                    <img src="../../img/banwalogo.png" alt="Banwa logo">
                </div>

                <div class="panel right-panel">
                    <!-- ==================== Personal Details Form ==================== -->
                    <div class="select-id-container" id="selectId">
                        <form class="form" id="selectIdForm">
                            <h5>Identity Verification</h5>
                            <p>Please upload a valid ID to autofill your information.</p>

                            <div class="inputs-container">
                                <div class="label-and-input" id="idTypeWrapper">
                                    <label>Type of ID <span style="color: #BB1B1B;">*</span></label>
                                    <select name="idType" id="idType" required>
                                        <option value="" disabled selected>Select ID Type</option>
                                        <option value="National">National ID (PhilSys)</option>
                                        <option value="Quezon">Quezon City ID</option>
                                        <option value="Postal">Postal ID</option>
                                        <option value="Passport">Philippine Passport</option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>

                                <div class="label-and-input" id="idFileWrapper">
                                    <label for="idFile">
                                        Upload ID File <span style="color: #BB1B1B;">*</span><br>
                                        <i>(Clear image of the front of your ID)</i>
                                    </label>
                                    <input id="idFile" name="idFile" type="file" accept="image/png, image/jpeg, image/jpg" required />
                                    <div id="imagePreviewContainer" style="margin-top: 10px; display: none;">
                                        <img id="idImagePreview" src="#" alt="ID Preview" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;">
                                    </div>
                                    <div class="error-msg"></div>
                                </div>

                                <div id="ocrStatus" style="display:none; color: #00247C; font-weight: bold; font-size: 14px;">
                                    Processing ID... Please wait.
                                </div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="selectIdBackBtn">Back</button>
                                <button type="button" id="selectIdNextBtn">Next</button>
                            </div>
                        </form>
                    </div>

                    <div class="personal-details-container hidden" id="personalDetails">
                        <form class="form" id="personalDetailsForm">
                            <h5>Personal Information</h5>
                            <div class="inputs-container">
                                <!-- <div class="label-and-input">
                                        <label for="extractedText">Extracted ID Data (Reference)</label>
                                        <textarea id="extractedText" rows="4" readonly style="color: #555; font-size: 12px;"></textarea>
                                    </div> -->

                                <div class="label-and-input">
                                    <label for="firstName">First name <span style="color: #BB1B1B;">*</span></label>
                                    <input id="firstName" name="firstName" type="text" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="middleName">Middle name <i>(Optional)</i></label>
                                    <input id="middleName" name="middleName" type="text">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="lastName">Last name <span style="color: #BB1B1B;">*</span></label>
                                    <input id="lastName" name="lastName" type="text" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="suffix">Suffix <i>(Optional)</i></span></label>
                                    <input id="suffix" name="suffix" type="text" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="sex">Sex <span style="color: #BB1B1B;">*</span></label>
                                    <select id="sex" name="sex" required>
                                        <option value="">Select</option>
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="contactNo">Contact no. <span style="color: #BB1B1B;">*</span></label>
                                    <input type="tel" id="contactNo" name="contactNo" maxlength="11" pattern="[0-9]{1,11}" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="address">Address</label>
                                    <textarea id="address" name="address"></textarea>
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="personalDetailsBackBtn">Back</button>
                                <button type="button" id="personalDetailsNextBtn">Next</button>
                            </div>
                        </form>
                    </div>

                    <!-- ==================== Create Account Form ==================== -->
                    <div class="create-account-container hidden" id="createAcc">
                        <form class="form" id="createAccForm">
                            <h5>Create Account</h5>

                            <span id="formMessage"></span>

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="createAccEmail">Email <span style="color: #BB1B1B;">*</span></label>
                                    <input type="email" name="createAccEmail" id="createAccEmail" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="password">Password <span style="color: #BB1B1B;">*</span></label>
                                    <input type="password" name="password" id="password" autocomplete="false" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="reTypePassword">Re-type password <span style="color: #BB1B1B;">*</span></label>
                                    <input type="password" name="reTypePassword" id="reTypePassword" autocomplete="false" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label>
                                        <input type="checkbox" id="agreeCheckBox" required> I confirm that I have read and accept the <a href="#">terms and conditions</a> and <a href="#">privacy policy</a>.
                                    </label>
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="createAccBackBtn">Back</button>
                                <button type="submit" id="createAccSubmitBtn">Submit</button>
                                <button type="button" id="resendEmailBtn">Resend verification email</button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </section>
    </main>

    <!-- Submit Confirmation Modal (moved here so designers can style it) -->
    <div id="submitConfirmModal" aria-hidden="true" class="modal-hidden">
        <div class="modal-backdrop" role="dialog" aria-modal="true">
            <div class="modal-box" role="document">
                <div class="modal-title">Submit Application</div>
                <div class="modal-body">Are you sure you want to submit this application? This will create your account and send a verification email.</div>
                <div class="modal-actions">
                    <button class="btn btn-cancel">Cancel</button>
                    <button class="btn btn-confirm">Submit</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal styles moved to ../../styles/auth/signup1.css -->

    <script type="module" src="../../scripts/auth/signup1.js"></script>
</body>

</html>