<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Profile</title>

    <link rel="stylesheet" href="../../styles/resident/profile.css">
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
                <!-- ==================== Profile Details ==================== -->
                <div class="profile-details"></div>

                <div class="container-1">
                    <!-- ==================== Change Password ==================== -->
                    <div class="chng-pass-container" id="changePass">
                        <form action="" class="forms" id="changePassForm">
                            <h3>Change Password</h3>
                            <!-- <p></p> -->

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="currentPassword">Current password</label>
                                    <input type="text" name="currentPassword" id="currentPassword">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="newPassword">New password</label>
                                    <input type="text" name="newPassword" id="newPassword">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="reTypeNewPassword">Re-type new password</label>
                                    <input type="text" name="reTypeNewPassword" id="reTypeNewPassword">
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="buttons-container">
                                <button type="submit" id="saveNewPass">Save</button>
                                <button type="submit" id="changePassEditBtn">Edit</button>
                                <button type="button" id="changePassCancelBtn">Cancel</button>
                            </div>
                        </form>
                    </div>

                    <!-- ==================== Manage Account ==================== -->
                    <div class="mng-acc-container hidden" id="manageAcc">
                        <form action="" class="forms" id="mngAccForm">
                            <h3>Manage Account</h3>
                            <!-- <p></p> -->

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="firstName">First Name</label>
                                    <input type="text" name="firstName" id="firstName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="middleName">Middle Name</label>
                                    <input type="text" name="middleName" id="middleName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="lastName">Last Name</label>
                                    <input type="text" name="lastName" id="lastName">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="suffix">Suffix</label>
                                    <input type="text" name="suffix" id="suffix">
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
                            </div>

                            <div class="buttons-container">
                                <button type="submit" id="saveNewAccDetails">Save</button>
                                <button type="submit" id="manageAccEditBtn">Edit</button>
                                <button type="button" id="manageAccCancelBtn">Cancel</button>
                            </div>
                        </form>
                    </div>

                    <div class="panel-buttons-container">
                        <button type="button" id="changePasswordBtn">Change password</button>
                        <button type="button" id="manageAccountBtn">Manage account</button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="../../scripts/resident/profile.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>