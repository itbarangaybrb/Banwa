<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home - Banwa Residential Management</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Professional residential management system with elegant design and user-friendly interface">
    <link rel="icon" type="image/png" sizes="32x32" href="../client/img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../client/img/browser-icon.svg">
    <link rel="stylesheet" href="../client/styles/global.css">
    <link rel="stylesheet" href="../client/styles/resident/home.css">
    <link rel="stylesheet" href="../client/styles/auth/signup-modal.css">
    <link rel="stylesheet" href="../client/styles/components/loader.css">
</head>

<body>
    <header>
        <div class="logo_container">
            <div class="head_space">
                <img class="logo" src="../client/img/logo-1.png">
                <img class="logo" src="../client/img/banwalogo.png">
                <span class="company_name">BANWA</span>
            </div>

            <div class="user_profile">
                <div class="auth_buttons">
                    <button class="sign-btn" id="getStartedBtn">Get Started</button>
                </div>
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

    <!-- Main Content with Proper Whitespace -->
    <main>
        <section data-theme="banner" class="hero-section">
            <div class="hero-cont">
                <!-- Background Carousel Container -->
                <div class="hero-bg-carousel">
                    <div class="carousel-images">
                        <img src="../client/img/building-1.png" alt="Barangay Hall" class="carousel-image active">
                        <img src="../client/img/building-2.png" alt="Municipal Building" class="carousel-image">
                        <img src="../client/img/building-3.png" alt="Community Center" class="carousel-image">
                        <img src="../client/img/building-4.png" alt="Barangay Hall-Side View" class="carousel-image">
                        <img src="../client/img/building-5.png" alt="Meeting Table" class="carousel-image">
                        <!-- Add more images as needed -->
                    </div>
                    <!-- Optional: Navigation dots -->
                    <div class="carousel-dots">
                        <span class="dot active" data-index="0"></span>
                        <span class="dot" data-index="1"></span>
                        <span class="dot" data-index="2"></span>
                        <span class="dot" data-index="3"></span>
                        <span class="dot" data-index="4"></span>
                    </div>
                </div>

                <!-- Hero Content Overlay -->
                <div class="hero-content-overlay">
                    <div class="hero_content">
                        <h1>BANWA</h1>

                        <div class="barangay-title-container">
                            <h6>Barangay Blue Ridge B</h6>
                            <div class="office-hours-container">
                                <div class="office-hours">
                                    <span class="hours-status"></span>
                                    <div class="hours-tooltip">
                                        <div class="hours-schedule">
                                            <h4>Onsite Office Hours</h4>

                                            <div class="schedule-item">
                                                <span class="days">Monday - Friday</span>
                                                <span class="time">8:00 AM - 5:00 PM</span>
                                            </div>
                                            <div class="schedule-item">
                                                <span class="days">Saturday</span>
                                                <span class="time">8:00 AM - 12:00 PM</span>
                                            </div>
                                            <div class="schedule-item">
                                                <span class="days">Sunday</span>
                                                <span class="time closed">Closed</span>
                                            </div>
                                            <div class="current-status">
                                                <span class="status-indicator"></span>
                                                <span class="status-text"></span>
                                            </div>
                                            <div class="next-open">
                                                <span class="next-open-info"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p>Welcome to BANWA. The system enables Barangay Blue Ridge B to efficiently manage infrastructure, clearance, utilities, and incidents through interactive mapping and data-driven tools.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section data-theme="white" class="services-section">
            <div class="cont">
                <!-- Section Header with 24/7 prominence -->
                <div class="services-header">
                    <div class="header-badge">
                        <span class="live-chip">
                            <span class="pulse-dot"></span>
                            ONLINE 24/7
                        </span>
                        <h2>Barangay Services</h2>
                    </div>
                    <p class="header-description">All services available online 24 hours a day, 7 days a week.</p>
                </div>

                <!-- 3 Horizontal Cards -->
                <div class="services-horizontal">
                    <!-- Card 1: Construction Clearance -->
                    <button class="service-h-card" id="getStartedBtn">
                        <div class="card-icon-wrapper">
                            <div class="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M2 20L22 20" stroke-linecap="round" />
                                    <rect x="4" y="9" width="16" height="11" rx="1" stroke="currentColor" />
                                    <path d="M8 6L12 3L16 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <h3>Construction Clearance</h3>
                        <p class="card-subtitle">Home Repairs, Renovations, and New Construction</p>

                        <div class="card-preview-content">
                            <div class="preview-header">
                                <span class="preview-title">Requirements</span>
                            </div>
                            <ul class="preview-list">
                                <li>Construction Information</li>
                                <li>Contractor Information</li>
                                <li>Blueprint Document</li>
                            </ul>
                            <div class="preview-footer">
                                <span class="preview-cta">Proceed →</span>
                            </div>
                        </div>
                    </button>

                    <!-- Card 2: Business Clearance -->
                    <button class="service-h-card">
                        <!-- same content, just change opening/closing tags -->
                        <div class="card-icon-wrapper">
                            <div class="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" />
                                    <path d="M16 3L16 7" stroke="currentColor" stroke-linecap="round" />
                                    <path d="M8 3L8 7" stroke="currentColor" stroke-linecap="round" />
                                    <path d="M8 13L16 13" stroke="currentColor" stroke-linecap="round" />
                                </svg>
                            </div>
                        </div>

                        <h3>Business Clearance</h3>
                        <p class="card-subtitle">New businesses, Renewwals, and Closure</p>

                        <div class="card-preview-content">
                            <div class="preview-header">
                                <span class="preview-title">Requirements</span>
                            </div>
                            <ul class="preview-list">

                                <li>SEC (Securities and Exchange Commission) Registration</li>
                                <li>DTI (Department of Trade and Industry) Registration</li>
                                <li>TCT (Transfer Certificate of Title)</li>
                                <li>Lease Contract</li>
                            </ul>
                            <div class="preview-footer">
                                <span class="preview-cta">Proceed →</span>
                            </div>
                        </div>
                    </button>

                    <!-- Card 3: Utilities Services -->
                    <button class="service-h-card">
                        <!-- same content, just change opening/closing tags -->
                        <div class="card-icon-wrapper">
                            <div class="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="12" cy="12" r="5" stroke="currentColor" />
                                    <path d="M12 2L12 7" stroke="currentColor" stroke-linecap="round" />
                                    <path d="M12 17L12 22" stroke="currentColor" stroke-linecap="round" />
                                    <path d="M22 12L17 12" stroke="currentColor" stroke-linecap="round" />
                                    <path d="M7 12L2 12" stroke="currentColor" stroke-linecap="round" />
                                </svg>
                            </div>
                        </div>

                        <h3>Utilities Services</h3>
                        <p class="card-subtitle">Water, Electricity, Internet, and Billing Inquiries</p>

                        <div class="card-preview-content">
                            <div class="preview-header">
                                <span class="preview-title">Services</span>
                            </div>
                            <ul class="preview-list">
                                <li>Water connection</li>
                                <li>Electrical repair</li>
                                <li>Internet Connectivity</li>
                                <li>Billing inquiries</li>
                            </ul>
                            <div class="preview-footer">
                                <span class="preview-cta">Proceed →</span>
                            </div>
                        </div>
                    </button>
                </div>

                <!-- 24/7 Floating Notice (Optional) -->
                <div class="always-open-note">
                    <span><strong>Applications submitted outside office hours will be processed the next business day.</strong></span>
                </div>
            </div>
        </section>

        <section data-theme="blue">
            <div class="cont">
                <div class="story-content">
                    <div class="story-text">
                        <h2>Our Story</h2>
                        <p>Barangay Blue Ridge B was established as a growing residential community committed to fostering unity, safety, and responsible governance among its residents. Over the years, the barangay has continuously adapted to social and technological changes to better serve the needs of its people.</p>
                        <p>Guided by transparent leadership and active community participation, it has strengthened programs focused on public service, development, and welfare. Today, Barangay Blue Ridge B stands as a progressive and organized community that values cooperation, innovation, and sustainable growth.</p>
                    </div>

                    <div class="story-media">
                        <div class="image-carousel">
                            <div class="main-image">
                                <img src="../client/img/building-1.png" alt="Barangay Hall" id="mainCarouselImage">
                            </div>
                            <div class="image-thumbnails">
                                <div class="thumb" data-image="../client/img/building-1.png">
                                    <img src="../client/img/building-1.png" alt="Building 1">
                                </div>
                                <div class="thumb" data-image="../client/img/building-2.png">
                                    <img src="../client/img/building-2.png" alt="Building 2">
                                </div>
                                <div class="thumb" data-image="../client/img/building-3.png">
                                    <img src="../client/img/building-3.png" alt="Building 3">
                                </div>
                                <div class="thumb" data-image="../client/img/building-4.png">
                                    <img src="../client/img/building-4.png" alt="Building 4">
                                </div>
                            </div>
                        </div>

                        <div class="partner-logos">
                            <h3>Our Partners</h3>
                            <div class="logos-grid">
                                <img src="../client/img/logo-1.png" alt="Partner 1">
                                <img src="../client/img/logo-2.png" alt="Partner 2">
                                <img src="../client/img/logo-3.png" alt="Partner 3">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- With this: -->
        <section data-theme="white" class="mission-vision-section">
            <div class="cont">
                <div class="quick_align">
                    <h2>Our Mission & Vision</h2>
                </div>
                <div class="mission-vision-wrapper">
                    <div class="mv-background-side">
                        <div class="mv-bg-image">
                            <!-- This div will have the background image -->
                        </div>
                    </div>
                    <div class="mission-vision-content">

                        <!-- Mission Section -->
                        <div class="mv-section">
                            <h3>Mission</h3>
                            <div class="mv-text">
                                <p>We, as the front-liners of the government to its citizen at the Barangay level, are committed to become models of excellence and to deliver efficient, high quality and good value services to Blue Ridge B towards attainment of our vision.</p>
                            </div>
                        </div>

                        <!-- Vision Section -->
                        <div class="mv-section">
                            <h3>Vision</h3>
                            <div class="mv-text">
                                <p>We envision Barangay Blue Ridge B to be a community of peaceful, drug-free, clean, environmentally aware, self sufficient, disaster resilient, vigilant and ever ready to help and responsible to address the problem and needs of others. We intent to project a community that is morally and socially progressive, caring, disciplined, law-abiding, productive and healthy individuals.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </section>

        <section data-theme="blue" class="officials-section">
            <div class="cont">
                <div class="quick_align">
                    <h2>Barangay Officials</h2>
                </div>

                <!-- Officials Carousel Container -->
                <div class="officials-carousel">
                    <div class="carousel-viewport">
                        <!-- Carousel Navigation Buttons -->
                        <button class="carousel-nav prev" aria-label="Previous official">
                            <span>&#10094;</span>
                        </button>

                        <!-- Carousel Track Container -->
                        <div class="carousel-container">
                            <!-- Carousel Track -->
                            <div class="carousel-track">
                                <!-- Official 1 -->
                                <div class="official-card" data-index="0">
                                    <div class="official-image">
                                        <img src="../client/img/official-1.png" alt="Kapitan Sessan Castro-Lee">
                                    </div>
                                    <div class="official-content">
                                        <h3>Kapitan Sessan Castro-Lee</h3>
                                        <p class="official-position">Barangay Captain</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 2 -->
                                <div class="official-card" data-index="1">
                                    <div class="official-image">
                                        <img src="../client/img/official-2.png" alt="Katherine T. De Jesus">
                                    </div>
                                    <div class="official-content">
                                        <h3>Katherine T. De Jesus</h3>
                                        <p class="official-position">1st Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 3 -->
                                <div class="official-card" data-index="2">
                                    <div class="official-image">
                                        <img src="../client/img/official-3.png" alt="Margarette Karra De Jesus">
                                    </div>
                                    <div class="official-content">
                                        <h3>Margarette Karra De Jesus</h3>
                                        <p class="official-position">2nd Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 4 -->
                                <div class="official-card" data-index="3">
                                    <div class="official-image">
                                        <img src="../client/img/official-4.png" alt="Anna Francesca L. Maristela">
                                    </div>
                                    <div class="official-content">
                                        <h3>Anna Francesca L. Maristela</h3>
                                        <p class="official-position">3rd Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 5 -->
                                <div class="official-card" data-index="4">
                                    <div class="official-image">
                                        <img src="../client/img/official-5.png" alt="Augusto D. Ilagan">
                                    </div>
                                    <div class="official-content">
                                        <h3>Augusto D. Ilagan</h3>
                                        <p class="official-position">4th Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 6 -->
                                <div class="official-card" data-index="5">
                                    <div class="official-image">
                                        <img src="../client/img/official-6.png" alt="Natalia L. Maristela">
                                    </div>
                                    <div class="official-content">
                                        <h3>Natalia L. Maristela</h3>
                                        <p class="official-position">5th Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 7 -->
                                <div class="official-card" data-index="6">
                                    <div class="official-image">
                                        <img src="../client/img/official-7.png" alt="Modesto Carlo M. Ruiz Jr.">
                                    </div>
                                    <div class="official-content">
                                        <h3>Modesto Carlo M. Ruiz Jr.</h3>
                                        <p class="official-position">6th Kagawad</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 8 -->
                                <div class="official-card" data-index="7">
                                    <div class="official-image">
                                        <img src="../client/img/official-8.png" alt="Rovie Rose B. Baylon">
                                    </div>
                                    <div class="official-content">
                                        <h3>Rovie Rose B. Baylon</h3>
                                        <p class="official-position">Barangay Secretary</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>

                                <!-- Official 9 -->
                                <div class="official-card" data-index="8">
                                    <div class="official-image">
                                        <img src="../client/img/official-9.png" alt="Michell V. Meniano">
                                    </div>
                                    <div class="official-content">
                                        <h3>Michell V. Meniano</h3>
                                        <p class="official-position">Barangay Treasurer</p>
                                        <div class="official-divider"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="carousel-nav next" aria-label="Next official">
                            <span>&#10095;</span>
                        </button>
                    </div>

                    <!-- Carousel Indicators/Dots -->
                    <div class="carousel-indicators">
                        <button class="indicator active" data-index="0" aria-label="Go to slide 1"></button>
                        <button class="indicator" data-index="1" aria-label="Go to slide 2"></button>
                        <button class="indicator" data-index="2" aria-label="Go to slide 3"></button>
                        <button class="indicator" data-index="3" aria-label="Go to slide 4"></button>
                        <button class="indicator" data-index="4" aria-label="Go to slide 5"></button>
                        <button class="indicator" data-index="5" aria-label="Go to slide 6"></button>
                        <button class="indicator" data-index="6" aria-label="Go to slide 7"></button>
                        <button class="indicator" data-index="7" aria-label="Go to slide 8"></button>
                        <button class="indicator" data-index="8" aria-label="Go to slide 9"></button>
                    </div>
                </div>
            </div>
        </section>

        <section data-theme="white" class="faq-section">
            <div class="cont">
                <div class="quick_align">
                    <h2>Frequently Asked Questions</h2>
                    <p class="faq-subtitle">Find answers to common questions about our services</p>
                </div>

                <div class="faq-container">
                    <!-- FAQ Category: General -->
                    <div class="faq-category">
                        <h3 class="category-title">General Questions</h3>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>What is BANWA?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>BANWA (Barangay Blue Ridge B Management System) is an online platform that allows residents to access barangay services, submit applications for clearances, report issues, and stay updated with barangay announcements from anywhere, anytime.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>Is the website available 24/7?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p><strong>Yes!</strong> While our physical office has specific hours (Monday-Friday: 8AM-5PM, Saturday: 8AM-12PM), our online services are available 24 hours a day, 7 days a week. You can submit applications, request documents, and report issues at any time.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>Do I need to create an account to use the services?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>Yes, you need to register for an account to access most services. This helps us verify your identity and ensure the security of your information. The registration process is simple and only takes a few minutes.</p>
                            </div>
                        </div>
                    </div>

                    <!-- FAQ Category: Clearances -->
                    <div class="faq-category">
                        <h3 class="category-title">Clearances & Permits</h3>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>How long does it take to process a clearance?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>Online clearance applications are typically processed within a few working days. You'll receive a notification via BANWA website once your clearance is ready for pickup or if there are any issues with your application.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>What requirements do I need for Business Clearance?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <ul>
                                    <li>SEC (Securities and Exchange Commission) Registration</li>
                                    <li>DTI (Department of Trade and Industry) Registration</li>
                                    <li>TCT (Transfer Certificate of Title)</li>
                                    <li>Lease Contract</li>
                                </ul>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>Can I track my application status?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>Yes! After logging in, you can view the status of all your applications in your dashboard. Status updates include: Pending, Under Review, Approved, Ready for Pickup, and Completed.</p>
                            </div>
                        </div>
                    </div>

                    <!-- FAQ Category: Technical -->
                    <div class="faq-category">
                        <h3 class="category-title">Technical Support</h3>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>I forgot my password. How can I reset it?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>Click on the "Forgot password?" link on the login page. Enter your registered email address, and we'll send you instructions to reset your password. If you don't receive the email within a few minutes, check your spam folder.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>What file formats are accepted for ID upload?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>We accept JPG, JPEG, and PNG file formats. The maximum file size is 5MB. Make sure the image is clear and all information on the ID is readable.</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>Who can I contact for technical issues?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>For technical support, you can:<br>
                                    • Email us at support@banwa-bbrb.gov.ph<br>
                                    • Call our technical support hotline: +63 946 456 6986<br>
                                    • Visit the barangay hall during office hours and ask for the IT support staff</p>
                            </div>
                        </div>
                    </div>

                    <!-- FAQ Category: Payments -->
                    <div class="faq-category">
                        <h3 class="category-title">Payments & Fees</h3>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>What payment methods are accepted?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>Currently, we accept:<br>
                                    • Cash payments at the barangay hall<br>
                                    • GCash (through our official account)<br>
                                    • Bank transfer receipt<br>
                                    Online payment options will be expanded soon!</p>
                            </div>
                        </div>

                        <div class="faq-item">
                            <button class="faq-question">
                                <span>Are there any fees for using the online system?</span>
                                <span class="faq-icon">▼</span>
                            </button>
                            <div class="faq-answer">
                                <p>No, using the online system itself is completely free. You only pay the standard government fees for the clearances and permits you apply for, just as you would when applying in person.</p>
                            </div>
                        </div>
                    </div>
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

    <!-- Auth Modal (Signup/Login) -->
    <div id="authModal" class="signup-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Welcome to BANWA</h2>
                <div class="subtitle">Barangay Blue Ridge B Management System</div>
                <button class="modal-close" id="closeModalBtn">&times;</button>
            </div>

            <!-- Auth Toggle -->
            <div class="auth-toggle">
                <button class="toggle-btn active" id="showSignupBtn">Sign Up</button>
                <button class="toggle-btn" id="showLoginBtn">Log In</button>
            </div>

            <!-- Signup Panel (with progress steps) -->
            <div class="auth-panel" id="signupPanel">
                <!-- Progress Steps -->
                <div class="progress-steps">
                    <div class="step active" data-step="1">
                        <div class="step-number">1</div>
                        <div class="step-label">Identity</div>
                    </div>
                    <div class="step" data-step="2">
                        <div class="step-number">2</div>
                        <div class="step-label">Personal Info</div>
                    </div>
                    <div class="step" data-step="3">
                        <div class="step-number">3</div>
                        <div class="step-label">Account</div>
                    </div>
                </div>

                <!-- Modal Body - Contains the signup forms -->
                <div class="modal-body">
                    <!-- Select ID Panel (Step 1) -->
                    <div class="form-panel" id="selectId">
                        <form class="form" id="selectIdForm">
                            <h2 class="form2">Identity Verification</h2>
                            <p>Please upload a valid ID to autofill your information.</p>

                            <div class="inputs-container">
                                <div class="label-and-input" id="idTypeWrapper">
                                    <label>Type of ID <span style="color: #BB1B1B;">*</span></label>
                                    <select name="idType" id="idType" required>
                                        <option value="" disabled selected>Select ID Type</option>
                                        <option value="National">National ID (PhilSys)</option>
                                        <option value="Quezon">Quezon City ID</option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>

                                <div class="label-and-input" id="idFileWrapper">
                                    <label for="idFile">
                                        Upload ID File <span style="color: #BB1B1B;">*</span><br>
                                        <i>(Clear image of the front of your ID)</i>
                                    </label>
                                    <input id="idFile" name="idFile" type="file" accept="image/png, image/jpeg, image/jpg" required />
                                    <div id="imagePreviewContainer" style="margin-top: 10px; display: none;">
                                        <img id="idImagePreview" src="#" alt="ID Preview" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;">
                                    </div>
                                    <div class="error-msg"></div>
                                </div>

                                <div id="ocrStatus" style="display:none;"></div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="selectIdBackBtn">Back</button>
                                <button type="button" id="selectIdNextBtn">Next</button>
                            </div>
                        </form>
                    </div>

                    <!-- Personal Details Panel (Step 2) -->
                    <div class="form-panel hidden" id="personalDetails">
                        <form class="form" id="personalDetailsForm">
                            <h2 class="form2">Personal Information</h2>
                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="firstName">First name <span style="color: #BB1B1B;">*</span></label>
                                    <input id="firstName" name="firstName" type="text" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="middleName">Middle name <i>(Optional)</i></label>
                                    <input id="middleName" name="middleName" type="text">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="lastName">Last name <span style="color: #BB1B1B;">*</span></label>
                                    <input id="lastName" name="lastName" type="text" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="suffix">Suffix <i>(Optional)</i></label>
                                    <input id="suffix" name="suffix" type="text">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="sex">Sex <span style="color: #BB1B1B;">*</span></label>
                                    <select id="sex" name="sex" required>
                                        <option value="">Select</option>
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="contactNo">Contact no. <span style="color: #BB1B1B;">*</span></label>
                                    <input type="tel" id="contactNo" name="contactNo" maxlength="11" pattern="[0-9]{1,11}" required>
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="address">Address</label>
                                    <textarea id="address" name="address"></textarea>
                                    <div class="error-msg"></div>
                                </div>
                            </div>

                            <div class="buttons-container">
                                <button type="button" id="personalDetailsBackBtn">Back</button>
                                <button type="button" id="personalDetailsNextBtn">Next</button>
                            </div>
                        </form>
                    </div>

                    <!-- Create Account Panel (Step 3) -->
                    <div class="form-panel hidden" id="createAcc">
                        <form class="form" id="createAccForm">
                            <h2 class="form2">Create Account</h2>

                            <span id="formMessage"></span>

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="createAccEmail">Email <span style="color: #BB1B1B;">*</span></label>
                                    <input type="email" name="createAccEmail" id="createAccEmail" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="password">Password <span style="color: #BB1B1B;">*</span></label>
                                    <input type="password" name="password" id="password" autocomplete="false" required />
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="reTypePassword">Re-type password <span style="color: #BB1B1B;">*</span></label>
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

            <!-- Login Panel -->
            <div class="auth-panel hidden" id="loginPanel">
                <div class="modal-body">
                    <div class="login-container">
                        <form class="form" id="loginForm">
                            <!-- <div class="header-and-parag">
                                <img src="../client/img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
                                <h4>Sign in to BBRB</h4>
                            </div> -->

                            <div id="loginFormMessage" class="form-message"></div>

                            <div class="inputs-container">
                                <div class="label-and-input">
                                    <label for="loginEmail">Email</label>
                                    <input type="email" id="loginEmail" name="email">
                                    <div class="error-msg"></div>
                                </div>
                                <div class="label-and-input">
                                    <label for="loginPassword">Password</label>
                                    <input type="password" id="loginPassword" name="password" autocomplete="false">
                                    <div class="error-msg"></div>
                                </div>
                                <a href="../auth/forgot_pass.php">Forgot password?</a>
                            </div>

                            <div class="buttons-container">
                                <button type="submit" id="loginSubmitBtn" class="login-btn">Log in</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Submit Confirmation Modal -->
    <div id="submitConfirmModal" aria-hidden="true" class="modal-hidden">
        <div class="modal-backdrop" role="dialog" aria-modal="true">
            <div class="modal-box" role="document">
                <div class="modal-title">Submit Application</div>
                <div class="modal-body">Are you sure you want to submit this application? This will create your account and send a verification email.</div>
                <div class="modal-actions">
                    <button class="btn btn-cancel">Cancel</button>
                    <button class="btn btn-confirm">Submit</button>
                </div>
            </div>
        </div>
    </div>

    <div id="page-loader">
        <div class="loader-spinner"></div>
        <p>Loading…</p>
    </div>

    <script src="../client/scripts/resident/nav.js" defer></script>
    <script src="../client/scripts/resident/home.js" defer></script>
    <script type="module" src="../client/scripts/auth/signup-modal.js"></script>
    <script type="module" src="../client/scripts/auth/auth-modal.js"></script>
    <script type="module" src="../client/scripts/components/loader.js"></script>

</body>

</html>