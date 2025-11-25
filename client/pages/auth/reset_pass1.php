<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Forgot Password</title>

    <link rel="stylesheet" href="../../styles/auth/reset_pass1.css">
</head>

<body>
    <main>
        <section class="sections">
            <div class="containers">
                <!-- ==================== Reset Password Form ==================== -->
                <div class="reset-pass-container" id="forgotPass">
                    <form action="" id="resetPassForm">
                        <h3>Reset Password</h3>
                        <!-- <p></p> -->

                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="password">Password</label>
                                <input type="password" name="password" id="password" autocomplete="false" />
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="reTypePassword">Password</label>
                                <input type="password" name="reTypePassword" id="reTypePassword" autocomplete="false" />
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="submit" id="forgotPassBtn">Save</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/auth/reset_pass1.js"></script>
</body>

</html>