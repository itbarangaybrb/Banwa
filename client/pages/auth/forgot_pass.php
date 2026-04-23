<!DOCTYPE html>
<html lang="en">

<head>
    <title>Forgot Password - BANWA</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/resident/home.css">
    <link rel="stylesheet" href="../../styles/resident/nav.css">
    <link rel="stylesheet" href="../../styles/components/loader.css">
    <link rel="stylesheet" href="../../styles/auth/forgot_pass.css">
</head>

<body>
    <!-- NAV -->
    <nav class="nav" id="mainNav" aria-label="Main navigation">
    <div class="wrap nav__inner">
        <a href="/client/index2.php" class="nav__brand">
        <div class="nav__logos" aria-hidden="true">
            <img src="../../img/logo-1.png" alt="">
            <img src="../../img/banwalogo.png" alt="">
        </div>
        <span class="nav__wordmark">BANWA</span>
        </a>
        <div class="nav__right">
        <time class="nav__time" id="navTime" aria-live="polite"></time>
        </div>
    </div>
    </nav>

    <!-- ==================== FORGOT PASSWORD SECTION ==================== -->
    <section class="bfp-section">
        <div class="bfp-container">
            <div class="bfp-context">
                <a href="../../index.php" class="bfp-context-link">Home</a>
                <span class="bfp-context-separator">•</span>
                <span class="bfp-context-current">Forgot Password</span>
            </div>

            <div class="bfp-card" id="forgotPass">
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

                    <div class="bfp-field label-and-input">
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
                        <div class="error-msg"></div>
                    </div>

                    <div class="bfp-actions buttons-container">
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
    </section>

    <!-- CONTACT -->
    <section class="contact" id="contact" aria-labelledby="contact-heading">
    <div class="wrap">
        <div class="contact__layout">
        <div>
            <div class="section-index reveal" data-n="02" style="color:rgba(255,255,255,0.30);">Contact Us</div>
            <h2 class="section-title section-title--md section-title--light reveal reveal-d1" id="contact-heading">Get in Touch</h2>
            <p class="section-lead section-lead--light reveal reveal-d2" style="margin-top:var(--s2);">Have questions or need assistance? Reach us through any of the channels below.</p>
            <div class="contact__info-grid reveal reveal-d2">
            <div class="contact__info-item"><div class="contact__info-label">Address</div><div class="contact__info-value">5 Moonlight Loop,<br>Blue Ridge B,<br>Quezon City, Metro Manila</div></div>
            <div class="contact__info-item"><div class="contact__info-label">Mobile</div><div class="contact__info-value">0917-182-2272</div></div>
            <div class="contact__info-item"><div class="contact__info-label">Landline</div><div class="contact__info-value">8-5359822</div></div>
            <div class="contact__info-item"><div class="contact__info-label">Email</div><div class="contact__info-value">brgy.blueridgeb@quezoncity.gov.ph</div></div>
            <div class="contact__info-item"><div class="contact__info-label">Office Hours</div><div class="contact__info-value">Monday &ndash; Friday:<br>8:00 AM &ndash; 5:00 PM<br>Saturday:<br>8:00 AM &ndash; 12:00 PM</div></div>
            <div class="contact__info-item"><div class="contact__info-label">Online System</div><div class="contact__info-value">Available 24 hours a day,<br>7 days a week</div></div>
            </div>
        </div>

        <div class="contact__map reveal reveal-d3" aria-label="Barangay Blue Ridge B location map">
            <iframe
            src="https://www.google.com/maps?q=14.6183228,121.0744429&z=18&output=embed"
            width="100%"
            height="100%"
            style="border:0; display:block;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Barangay Blue Ridge B — 5 Moonlight Loop, Quezon City">
            </iframe>
        </div>
        </div>
    </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer" role="contentinfo">
    <div class="wrap footer__inner">
        <span class="footer__brand">BANWA</span>
        <span class="footer__copy">&copy; <?php echo date('Y'); ?> Barangay Blue Ridge B. All rights reserved.</span>
    </div>
    </footer>

    <!-- LOADER -->
    <div id="loader" role="status" aria-label="Loading BANWA">
    <span class="loader__wordmark">BANWA</span>
    <span class="loader__sub">Barangay Blue Ridge B</span>
    <div class="loader__track"><div class="loader__bar"></div></div>
    </div>

    <!-- Form Submission Loader -->
    <div id="bfpLoader" class="bfp-loading" style="display: none;">
        <div class="bfp-spinner"></div>
        <p>Sending instructions...</p>
    </div>

<script type="module" src="../../scripts/auth/forgot_pass.js"></script>
<script src="../../scripts/resident/nav.js" defer></script>
<script type="module" src="../../scripts/resident/home.js"></script>
<script type="module" src="../../scripts/components/loader.js"></script>
</body>

</html>