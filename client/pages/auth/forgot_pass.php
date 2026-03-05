<!DOCTYPE html>
<html lang="en">

<head>
    <title>Forgot Password - BANWA</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/global.css">
    <link rel="stylesheet" href="../../styles/resident/home.css">
    <link rel="stylesheet" href="../../styles/components/loader.css">
    <link rel="stylesheet" href="../../styles/auth/forgot_pass.css">
</head>

<body>
    <header>
        <div class="logo_container">
            <div class="head_space">
                <img class="logo" src="../../img/logo-1.png" alt="Logo">
                <img class="logo" src="../../img/banwalogo.png" alt="Banwa Logo">
                <span class="company_name">BANWA</span>
            </div>

            <div class="user_profile">
                <div class="time_date" id="live_datetime">
                    <div class="time-display">
                        <span class="weekday-box"></span>
                        <span class="time-part"></span>
                    </div>
                    <div class="date-display"></div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main>
        <!-- Forgot Password Section - Using BFP (Banwa Forgot Password) namespace -->
        <!-- <section class="bfp-section">
            <div class="bfp-container">
                Simple breadcrumb/context indicator
                <div class="bfp-context">
                    <a href="../../index.php" class="bfp-context-link">Home</a>
                    <span class="bfp-context-separator">•</span>
                    <span class="bfp-context-current">Forgot Password</span>
                </div>

                <div class="bfp-card">
                    <div class="bfp-card-header">
                        <div class="bfp-icon-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <circle cx="12" cy="12" r="10" stroke="currentColor"/>
                                <path d="M12 8V12L15 15" stroke="currentColor" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h2 class="bfp-title">Forgot password?</h2>
                        <p class="bfp-description">
                            Enter your email address and we'll send you instructions to reset your password.
                        </p>
                    </div>

                    <form class="bfp-form" id="forgotPassForm">
                        <div id="formMessage" class="bfp-message" style="display: none;"></div>

                        <div class="bfp-field">
                            <label for="email" class="bfp-label">
                                Email address
                                <span class="bfp-required">*</span>
                            </label>
                            <div class="bfp-input-wrapper">
                                <svg class="bfp-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                                    <path d="M22 6L12 13L2 6"/>
                                </svg>
                                <input 
                                    type="email" 
                                    class="bfp-input" 
                                    id="email"
                                    name="email" 
                                    placeholder="your.email@example.com"
                                    autocomplete="email"
                                >
                            </div>
                            <div class="error-msg bfp-error" id="emailError"></div>
                        </div>

                        <div class="bfp-actions">
                            <button type="button" class="bfp-btn bfp-btn-secondary" id="forgotPassBackBtn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Back
                            </button>
                            <button type="submit" class="bfp-btn bfp-btn-primary" id="forgotPassConfirmBtn">
                                Send instructions
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </form>

                    <div class="bfp-footer">
                        <div class="bfp-security">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            <span>Reset link expires in 1 hour</span>
                        </div>
                    </div>
                </div>
            </div>
        </section> -->

        <section class="sections">
            <div class="containers">
                <!-- ==================== Forgot Password Form ==================== -->
                <div class="forgot-pass-container" id="forgotPass">
                    <form class="form" id="forgotPassForm">
                        <h5>Forgot Password</h5>
                        <!-- <p></p> -->

                        <span id="formMessage"></span>

                        <div class="inputs-container">
                            <div class="label-and-input">
                                <label for="email">Email</label>
                                <input type="email" name="email" id="email">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <div class="buttons-container">
                            <button type="button" id="forgotPassBackBtn">Back</button>
                            <button type="submit" id="forgotPassConfirmBtn">Confirm</button>
                        </div>
                    </form>
                </div>
            </div>
        </section>

        <section data-theme="blue">
            <div class="cont">
                <div class="contact-content">
                    <div class="story-text">
                        <h2>Contact Us</h2>
                        <p>If you have questions, concerns, or need assistance with any barangay services, feel free to reach out through the channels below.</p>
                        <ul class="contact-info">
                            <li><strong>BANWA | Barangay Blue Ridge B</strong><br> 5 Moonlight Loop, Project 4, Quezon City, Metro Manila</li>
                            <li><strong>Phone:</strong> +63 946 456 6986</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Page Loader -->
    <div id="page-loader">
        <div class="loader-spinner"></div>
        <p>Loading…</p>
    </div>

    <!-- BFP Loading Overlay (for form submission) -->
    <div id="bfpLoader" class="bfp-loading" style="display: none;">
        <div class="bfp-spinner"></div>
        <p>Sending instructions...</p>
    </div>

    <script src="../../scripts/resident/nav.js" defer></script>
    <script src="../../scripts/resident/home.js" defer></script>
    <script type="module" src="../../scripts/auth/forgot_pass.js"></script>
    <script type="module" src="../../scripts/components/loader.js"></script>
</body>

</html>