<?php
$pageTitle = "Manage Users";

include __DIR__ . '/../../layouts/superadmin_layout/header.php';
include __DIR__ . '/../../layouts/superadmin_layout/side_nav.php';
?>

<section class="sections">
    <div class="containers registration-container">
        <form class="form" id="registrationForm">
            <div class="header-and-parags">
                <h5>Register New Account</h5>
            </div>

            <span id="formMessage"></span>

            <div class="inputs-container">
                <div class="label-and-input">
                    <label for="role">Role</label>
                    <select name="role" id="role" name="role">
                        <option value="" disabled selected>Select</option>
                        <option value="3">Admin</option>
                        <option value="4">Business staff</option>
                        <option value="5">Construction staff</option>
                        <option value="6">Utility staff</option>
                        <option value="7">Finance staff</option>
                    </select>
                    <div class="error-msg"></div>
                </div>
                <div class="label-and-input">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email">
                    <div class="error-msg"></div>
                </div>
                <div class="label-and-input">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password">
                    <div class="error-msg"></div>
                </div>
                <div class="label-and-input">
                    <label for="retypePassword">Re-type password</label>
                    <input type="password" id="retypePassword" name="retypePassword">
                    <div class="error-msg"></div>
                </div>
            </div>

            <div class="buttons-container">
                <button type="button">Back</button>
                <button type="submit">Create</button>
            </div>
        </form>
    </div>

    <!-- <div class="containers suspend-container">
        <form class="suspend-form" id="suspendForm">
            <div class="header-and-parags">
                <h1>Suspend User</h1>
            </div>

            <div class="inputs-container">
                <div class="label-and-input">
                    <label for="">Lorem</label>
                    <select name="role" id="role">
                        <option value="select" disabled>Select</option>
                        <option value="3" disabled>Admin</option>
                        <option value="4" disabled>Business staff</option>
                        <option value="5" disabled>Construction staff</option>
                        <option value="6" disabled>Utility staff</option>
                        <option value="7" disabled>Finance staff</option>
                    </select>
                </div>
                <div class="label-and-input">
                    <label for="email">Email</label>
                    <input type="email" id="email">
                </div>
                <div class="label-and-input">
                    <label for="password">Password</label>
                    <input type="password" id="password">
                </div>
                <div class="label-and-input">
                    <label for="retypePassword">Re-type password</label>
                    <input type="password" id="retypePassword">
                </div>
                <div class="label-and-input">
                    <label for="retypePassword">re-type password</label>
                    <input type="password" id="retypePassword">
                </div>
            </div>

            <div class="buttons-container">
                <button type="button">Back</button>
                <button type="submit">Submit</button>
            </div>
        </form>
    </div> -->
</section>

<?php
include __DIR__ . '/../../layouts/superadmin_layout/footer.php';
?>