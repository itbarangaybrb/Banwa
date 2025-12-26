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

    <title>Profile</title>

    <link rel="stylesheet" href="../../styles/resident/profile.css">
</head>

<body>

    <!-- <p id="userStatus"></p>
    <button id="signoutBtn">Logout</button>

    <main>
        <section class="sections">
            <div class="containers">
               
                <div class="profile-details"></div>

                <div class="container-1">
                    
                    <div class="chng-pass-container" id="changePass">
                        <form action="" class="forms" id="changePassForm">
                            <h3>Change Password</h3>
                            

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
                    </div> -->

<!--                     
                    <div class="mng-acc-container hidden" id="manageAcc">
                        <form action="" class="forms" id="mngAccForm">
                            <h3>Manage Account</h3>
                            

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
                    </div> -->
<!-- 
                    <div class="panel-buttons-container">
                        <button type="button" id="changePasswordBtn">Change password</button>
                        <button type="button" id="manageAccountBtn">Manage account</button>
                    </div>
                </div>
            </div>
        </section>
    </main> -->

    <!-- <script type="module" src="../../scripts/resident/profile.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html> -->

<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <title>Profile</title>
    <link rel="stylesheet" href="../../styles/resident/profile.css">
</head>
<body>

    <?php 
    $page_title = "About Us";
    include '_layout/nav.php';
    ?>
        <div class="profile-container">
            <!-- Profile Header -->
            <div class="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account information and preferences</p>
                <!-- <button id="logoutBtn" class="btn-logout">Logout</button> -->
            </div>

            <div class="profile-content">
                <!-- Left Column: User Info -->
                <div class="profile-left">
                    <!-- User Profile Card -->
                    <div class="profile-card">
                        <div class="profile-image-section">
                            <div class="profile-image-large">
                                <img src="../../img/sample.png" alt="User Profile">
                            </div>
                            <div class="profile-actions">
                                <button class="btn-change-photo">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M16 5L19 8M20 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Change Photo
                                </button>
                            </div>
                        </div>
                        
                        <div class="user-info">
                            <h2 class="user-name">Juan Dela Cruz</h2>
                            <p class="user-role">Resident</p>
                            
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Member Since:</span>
                                    <span class="info-value">January 2023</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Account Status:</span>
                                    <span class="status-badge status-active">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-card">
                        <h3>Account Overview</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">5</span>
                                <span class="stat-label">Applications</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">3</span>
                                <span class="stat-label">Approved</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">1</span>
                                <span class="stat-label">Pending</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">1</span>
                                <span class="stat-label">Rejected</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Forms -->
                <div class="profile-right">
                    <!-- Change Password Form -->
                    <div class="form-card active" id="changePasswordForm">
                        <div class="form-header">
                            <h3>Change Password</h3>
                            <button class="btn-edit" id="changePassEditBtn">Edit</button>
                        </div>
                        
                        <form action="" class="forms" id="changePassFormContent">
                            <div class="inputs-container">
                                <div class="form-group">
                                    <label for="currentPassword">Current Password</label>
                                    <div class="input-with-icon">
                                        <input type="password" name="currentPassword" id="currentPassword" placeholder="Enter current password" disabled>
                                        <span class="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="error-msg"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="newPassword">New Password</label>
                                    <div class="input-with-icon">
                                        <input type="password" name="newPassword" id="newPassword" placeholder="Enter new password" disabled>
                                        <span class="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="error-msg"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="reTypeNewPassword">Confirm New Password</label>
                                    <div class="input-with-icon">
                                        <input type="password" name="reTypeNewPassword" id="reTypeNewPassword" placeholder="Re-type new password" disabled>
                                        <span class="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary" id="saveNewPass" disabled>Save Changes</button>
                                <button type="button" class="btn-secondary" id="changePassCancelBtn" style="display: none;">Cancel</button>
                            </div>
                        </form>
                    </div>

                    <!-- Manage Account Form -->
                    <div class="form-card" id="manageAccountForm">
                        <div class="form-header">
                            <h3>Manage Account</h3>
                            <button class="btn-edit" id="manageAccEditBtn">Edit</button>
                        </div>
                        
                        <form action="" class="forms" id="mngAccFormContent">
                            <div class="inputs-container">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="firstName">First Name</label>
                                        <input type="text" name="firstName" id="firstName" placeholder="Enter first name" disabled>
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="form-group">
                                        <label for="middleName">Middle Name</label>
                                        <input type="text" name="middleName" id="middleName" placeholder="Enter middle name" disabled>
                                        <div class="error-msg"></div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="lastName">Last Name</label>
                                        <input type="text" name="lastName" id="lastName" placeholder="Enter last name" disabled>
                                        <div class="error-msg"></div>
                                    </div>
                                    <div class="form-group">
                                        <label for="suffix">Suffix</label>
                                        <input type="text" name="suffix" id="suffix" placeholder="e.g., Jr., Sr." disabled>
                                        <div class="error-msg"></div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactNo">Contact Number</label>
                                    <input type="tel" name="contactNo" id="contactNo" placeholder="09XXXXXXXXX" maxlength="11" pattern="[0-9]{1,11}" disabled>
                                    <div class="error-msg"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="address">Address</label>
                                    <textarea name="address" id="address" rows="3" placeholder="Enter complete address" disabled></textarea>
                                    <div class="error-msg"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="email">Email Address</label>
                                    <input type="email" name="email" id="email" placeholder="user@example.com" disabled>
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary" id="saveNewAccDetails" disabled>Save Changes</button>
                                <button type="button" class="btn-secondary" id="manageAccCancelBtn" style="display: none;">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <?php include '_layout/end.php'; ?>
    <script type="module" src="../../scripts/resident/profile.js"></script>
