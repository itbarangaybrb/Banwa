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

                <div class="container-1">
                    <div class="panel left-panel">
                        <img src="../../img/banwalogo.png" alt="Banwa logo">
                    </div>

                    <div class="panel right-panel">
                        <!-- ==================== Personal Details Form ==================== -->
                        <div class="personal-details-container" id="personalDetails">
                            <form class="form" id="personalDetailsForm">
                                <h3>Personal Information</h3>
                                <div class="inputs-container">
                                    <div class="label-and-input">
                                        <label for="firstName">First name</label>
                                        <input id="firstName" name="firstName" type="text">
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="middleName">Middle name <i>(Optional)</i></label>
                                        <input id="middleName" name="middleName" type="text">
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="lastName">Last name</label>
                                        <input id="lastName" name="lastName" type="text">
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="suffix">Suffix <i>(Optional)</i></label>
                                        <input id="suffix" name="suffix" type="text">
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="sex">Sex</label>
                                        <select id="sex" name="sex">
                                            <option value="">Select</option>
                                            <option value="female">Female</option>
                                            <option value="male">Male</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="contactNo">Contact no.</label>
                                        <input type="tel" id="contactNo" name="contactNo" maxlength="11" pattern="[0-9]{1,11}">
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="address">
                                            Address
                                            <br>
                                            <i>(Lot no. Street name ...)</i>
                                        </label>
                                        <textarea id="address" name="address"></textarea>
                                        <div class="error-msg"></div>
                                    </div>
                                </div>

                                <button type="button" id="personalDetailsNextBtn">Next</button>
                            </form>
                        </div>

                        <!-- ==================== Select ID Form ==================== -->
                        <div class="select-id-container hidden" id="selectId">
                            <form class="form" id="selectIdForm">
                                <h3>Selection ID</h3>
                                <div class="inputs-container">
                                    <div class="label-and-input" id="idTypeWrapper">
                                        <label>Types of ID</label>
                                        <label><input type="radio" name="idType" value="National"> National ID</label>
                                        <label><input type="radio" name="idType" value="Quezon"> Quezon City ID</label>
                                        <label><input type="radio" name="idType" value="Postal"> Postal ID</label>
                                        <label><input type="radio" name="idType" value="Passport"> Philippine Passport</label>
                                        <div class="error-msg"></div>
                                    </div>

                                    <div class="label-and-input" id="idFileWrapper">
                                        <label for="idFile">Upload ID File</label>
                                        <input id="idFile" name="idFile" type="file" accept="image/*,application/pdf" />
                                        <div class="error-msg"></div>
                                    </div>
                                </div>

                                <div class="buttons-container">
                                    <button type="button" id="selectIdBackBtn">Back</button>
                                    <button type="button" id="selectIdNextBtn">Next</button>
                                </div>
                            </form>
                        </div>

                        <!-- ==================== Create Account Form ==================== -->
                        <div class="create-account-container hidden" id="createAcc">
                            <form class="form" id="createAccForm">
                                <h3>Create Account</h3>

                                <span id="formMessage" style="display:block; color:red; margin-bottom:10px;"></span>

                                <div class="inputs-container">
                                    <div class="label-and-input">
                                        <label for="createAccEmail">Email</label>
                                        <input type="email" name="createAccEmail" id="createAccEmail" />
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="password">Password</label>
                                        <input type="password" name="password" id="password" autocomplete="false" />
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label for="reTypePassword">Re-type password</label>
                                        <input type="password" name="reTypePassword" id="reTypePassword" autocomplete="false" />
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="label-and-input">
                                        <label>
                                            <input type="checkbox" id="agreeCheckBox"> I confirm that I have read and accept the <a href="#">terms and conditions</a> and <a href="#">privacy policy</a>.
                                        </label>
                                        <div class="error-msg"></div>
                                    </div>
                                </div>

                                <div class="buttons-container">
                                    <button type="button" id="createAccBackBtn">Back</button>
                                    <button type="submit" id="createAccNextBtn">Submit</button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/auth/signup1.js"></script>
</body>

</html>