<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /client/index.php");
    exit;
}
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

    <?php
    $page_title = "About Us";
    include '_layout/nav.php';
    ?>
    <div class="profile-container">
        <!-- Profile Header -->
        <div class="profile-header">
            <h1>My Profile</h1>
            <p>Manage your account information and preferences</p>
        </div>

        <div class="profile-content">
            <!-- Left Column: User Info -->
            <div class="profile-left">
                <!-- User Profile Card -->
                <div class="profile-card">
                    <div class="profile-image-section">
                        <div class="profile-image-large initial-avatar" id="profileAvatar" role="img" aria-label="User avatar"></div>
                    </div>

                    <div class="user-info">
                        <h2 class="user-name" id="userFullName"></h2>
                        <p class="user-role">Resident</p>

                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Member Since:</span>
                                <span class="info-value" id="memberSince">January 2023</span>
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
                        <div class="stat-item" data-key="applications">
                            <span class="stat-number">0</span>
                            <span class="stat-label">Applications</span>
                        </div>
                        <div class="stat-item" data-key="approved">
                            <span class="stat-number">0</span>
                            <span class="stat-label">Approved</span>
                        </div>
                        <div class="stat-item" data-key="pending">
                            <span class="stat-number">0</span>
                            <span class="stat-label">Pending</span>
                        </div>
                        <div class="stat-item" data-key="rejected">
                            <span class="stat-number">0</span>
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

                    <form action="" class="forms" id="changePassForm">
                        <input type="text" name="username" id="username" autocomplete="username" hidden>

                        <div class="inputs-container">
                            <div class="form-group">
                                <label for="currentPassword">Current Password</label>
                                <div class="input-with-icon">
                                    <input type="password" name="currentPassword" id="currentPassword" placeholder="Enter current password" autocomplete="current-password" disabled>
                                    <span class="input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="error-msg"></div>
                            </div>

                            <div class="form-group">
                                <!-- <label for="newPassword">New Password</label>
                                <div class="input-with-icon">
                                    <input type="password" name="newPassword" id="newPassword" placeholder="Enter new password" autocomplete="new-password" disabled>
                                    <span class="input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="error-msg"></div>
                            </div>

                            <div class="form-group">
                                <label for="reTypeNewPassword">Confirm New Password</label>
                                <div class="input-with-icon">
                                    <input type="password" name="reTypeNewPassword" id="reTypeNewPassword" placeholder="Re-type new password" autocomplete="new-password" disabled>
                                    <span class="input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="error-msg"></div>
                            </div> -->

                                <div id="newPassFields" style="display: none;">
                                    <div class="form-group">
                                        <label for="newPassword">New Password</label>
                                        <div class="input-with-icon">
                                            <input type="password" name="newPassword" id="newPassword" placeholder="Enter new password" autocomplete="new-password" disabled>
                                            <span class="input-icon">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="error-msg"></div>
                                    </div>

                                    <div class="form-group">
                                        <label for="reTypeNewPassword">Confirm New Password</label>
                                        <div class="input-with-icon">
                                            <input type="password" name="reTypeNewPassword" id="reTypeNewPassword" placeholder="Re-type new password" autocomplete="new-password" disabled>
                                            <span class="input-icon">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="error-msg"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-primary" id="nextBtn" style="display: none;">Next</button>
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

                    <form action="" class="forms" id="mngAccForm">
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
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>