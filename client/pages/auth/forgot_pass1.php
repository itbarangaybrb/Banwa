<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Forgot Password</title>

    <link rel="stylesheet" href="../../styles/auth/forgot_pass1.css">
</head>

<body>
    <main>
        <section class="sections">
            <div class="containers">
                <!-- ==================== Forgot Password Form ==================== -->
                <div class="forgot-pass-container" id="forgotPass">
                    <form action="" id="forgotPassForm">
                        <h3>Forgot Password</h3>
                        <!-- <p></p> -->

                        <span id="formMessage" style="display:block; color:red; margin-bottom:10px;"></span>

                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="email">Email</label>
                                <input type="email" name="email" id="email">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="button" id="forgotPassBackBtn">Back</button>
                        <button type="submit" id="forgotPassConfirmBtn">Confirm</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/auth/forgot_pass1.js"></script>
</body>

</html>