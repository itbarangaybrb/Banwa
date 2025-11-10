<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>BANWA Sign Up</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../styles/auth/signup.css">
</head>

<body>
    <div class="container">
        <div class="left-panel">
            <div class="logo-circle">
                <img src="../../img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
            </div>
        </div>
        <div class="right-panel">
            <div class="top-buttons">
                <a class="top-pill" href="./signin.php">Login</a>
                <a class="top-pill active" href="./signup.php" aria-current="page">Sign Up</a>
            </div>
            <h2 class="welcome-header">Welcome to BANWA</h2>
            <div class="sub-header">Signup with Mobile Number</div>

            <form id="signupForm" class="signup-form panel visible" onsubmit="event.preventDefault(); showVerification();">
                <div>
                    <label for="mobile">Mobile Number</label>
                    <div class="input-group">
                        <div class="cc">+63</div>
                        <div class="phone-input">
                            <input id="mobile" name="mobile" type="tel" placeholder="9XXXXXXXX" pattern="[0-9]{9}" required>
                        </div>
                    </div>
                </div>

                <div class="terms">
                    <input id="agree" name="agree" type="checkbox" required>
                    <div class="terms-text">I confirm that I have read and accept the <a href="#">terms and conditions</a> and <a href="#">privacy policy</a>.</div>
                </div>

                <div>
                    <button type="submit" class="next-btn">Next</button>
                </div>
            </form>

            <!-- Verification panel (hidden initially) -->
            <div id="verificationPanel" class="panel">
                <div class="panel-top">
                    <button id="backToSignup" onclick="showSignup()" class="back-btn" aria-label="Back">&#x2039;</button>
                    <div>
                        <div class="verify-heading">Verification Code</div>
                        <div class="verify-sub">We have sent the verification code to your mobile number</div>
                    </div>
                </div>

                <div class="code-inputs" id="codeInputs">
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                    <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
                </div>

                <div class="muted-small">Didn't receive it? <a href="#">Resend</a></div>

                <div>
                    <button id="confirmBtn" class="next-btn">Confirm</button>
                </div>
            </div>

            <!-- Create account panel (hidden) -->
            <div id="createAccountPanel" class="panel panel-scrollable">
                <div class="panel-top">
                    <button onclick="showVerification()" class="back-btn" aria-label="Back">&#x2039;</button>
                    <div>
                        <div class="verify-heading">Create your account</div>
                    </div>
                </div>

                <form id="createAccountForm">
                    <div>
                        <label for="username">Username</label>
                        <input id="username" name="username" type="text">
                        <div class="err-msg" id="errMsg"></div>
                    </div>
                    <div>
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password">
                        <div class="err-msg" id="errMsg"></div>
                    </div>
                    <div>
                        <label for="confirmPassword">Confirm Password</label>
                        <input id="confirmPassword" name="confirmPassword" type="password">
                        <div class="err-msg" id="errMsg"></div>
                    </div>

                    <div class="password-hints">
                        <label><span style="width:12px;height:12px;border-radius:50%;background:#e6e9ee;display:inline-block;margin-right:8px"></span> Password is 8-16 characters long</label>
                        <label><span style="width:12px;height:12px;border-radius:50%;background:#e6e9ee;display:inline-block;margin-right:8px"></span> Password consist of both letters and numbers</label>
                    </div>

                    <div style="margin-top:6px">
                        <button type="button" id="createNextBtn" class="next-btn">Next</button>
                    </div>
                </form>
            </div>

            <!-- ID selection / upload panel (hidden) -->
            <div id="idVerificationPanel" class="panel panel-scrollable">
                <div class="panel-top">
                    <button onclick="showCreateAccount()" class="back-btn" aria-label="Back">&#x2039;</button>
                    <div>
                        <div class="verify-heading">Select an ID</div>
                    </div>
                </div>

                <div style="margin-bottom:14px">
                    <div class="id-list">
                        <label class="id-item">
                            <div class="id-left"><span class="id-icon"></span><span>National ID</span></div>
                            <input type="radio" name="idtype" value="national">
                        </label>
                        <label class="id-item">
                            <div class="id-left"><span class="id-icon"></span><span>Quezon City ID</span></div>
                            <input type="radio" name="idtype" value="quezon">
                        </label>
                        <label class="id-item">
                            <div class="id-left"><span class="id-icon"></span><span>Postal ID</span></div>
                            <input type="radio" name="idtype" value="postal">
                        </label>
                        <label class="id-item">
                            <div class="id-left"><span class="id-icon"></span><span>Philippine Passport</span></div>
                            <input type="radio" name="idtype" value="passport">
                        </label>
                    </div>
                    <div class="err-msg" id="idTypeErr"></div>
                </div>

                <div style="margin-bottom:12px">
                    <label class="">Proof of identification</label>
                    <input id="idFile" type="file" accept="image/*,application/pdf" class="file-input">
                    <div class="err-msg" id="idFileErr"></div>
                </div>

                <div>
                    <button id="idNextBtn" class="next-btn">Next</button>
                </div>
            </div>

            <!-- Personal details panel (final step) -->
            <div id="personalDetailsPanel" class="panel panel-scrollable">
                <div class="panel-top">
                    <button onclick="showIDPanel()" class="back-btn" aria-label="Back">&#x2039;</button>
                    <div>
                        <div class="verify-heading">Verify your ID and Personal details</div>
                    </div>
                </div>

                <form id="personalDetailsForm">
                    <div>
                        <label for="firstName">First name</label>
                        <input id="firstName" name="firstName" type="text">
                        <div class="err-msg" id="errMsg"></div>

                    </div>
                    <div>
                        <label for="middleName">Middle name</label>
                        <input id="middleName" name="middleName" type="text">
                        <div class="err-msg" id="errMsg"></div>

                    </div>
                    <div>
                        <label for="lastName">Last name</label>
                        <input id="lastName" name="lastName" type="text">
                        <div class="err-msg" id="errMsg"></div>

                    </div>
                    <div>
                        <label for="suffix">Suffix</label>
                        <input id="suffix" name="suffix" type="text">
                    </div>
                    <div>
                        <label for="sex">Sex</label>
                        <select id="sex" name="sex">
                            <option value="">Select</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                        </select>
                        <div class="err-msg" id="errMsg"></div>
                    </div>
                    <div>
                        <label for="address">Address</label>
                        <textarea id="address" name="address" rows="3"></textarea>
                        <div class="err-msg" id="errMsg"></div>
                    </div>

                    <div style="margin-top:16px">
                        <button type="submit" id="personalSubmitBtn" class="next-btn">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
<script src="../../scripts/auth/signup.js"></script>

</html>