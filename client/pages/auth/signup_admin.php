<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Signup</title>

    <link rel="stylesheet" href="../../styles/auth/signup.css">
</head>

<body>
    <main>
        <section class="sections">
            <div class="containers">
                <div class="panel left-panel">
                    <img src="../../img/banwalogo.png" alt="Banwa logo">
                </div>

                <div class="panel right-panel">
                    <!-- ==================== Create Account Form ==================== -->
                    <div class="create-account-container hidden" id="createAcc">
                        <form class="form" id="createAccForm">
                            <h5>Create Account</h5>

                            <span id="formMessage"></span>

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="createAccEmail">Email *</label>
                                    <input type="email" name="createAccEmail" id="createAccEmail" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="password">Password *</label>
                                    <input type="password" name="password" id="password" autocomplete="false" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="reTypePassword">Re-type password *</label>
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

    <script type="module" src="../../scripts/auth/signup.js"></script>
</body>

</html>