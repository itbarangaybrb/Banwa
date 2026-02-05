<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home - Banwa Residential Management</title>
    <meta name="description" content="Professional residential management system with elegant design and user-friendly interface">
    <link rel="stylesheet" href="../client/styles/global.css">
    <link rel="stylesheet" href="../client/styles/index.css">
    <link rel="stylesheet" href="../client/styles/resident/home.css">
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
                    <a href="pages/auth/signup.php" class="sign-btn">Get Started</a>
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
                                            <h4>Office Hours</h4>
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

        <!-- <section data-theme="blue">
            <h1>Updates</h1>
                <p>Your gateway to convenient access and management of municipal services.</p>
        </section> -->

        <section data-theme="white">
            <div class="cont">
                <div class="quick_align">
                    <h2>Our Services</h2>
                </div>
                
                <!-- Service Details Panel -->
                <div class="service-details-panel" id="serviceDetails">

                    <div class="services-grid">
                        <!-- Construction Clearance Card -->
                        <div class="service-card" data-service="construction">
                            <h6 class="service-text">Construction Clearance</h6>
                        </div>
                        
                        <!-- Business Clearance Card -->
                        <div class="service-card" data-service="business">
                            <h6 class="service-text">Business Clearance</h6>
                        </div>
                        
                        <!-- Utilities Services Card -->
                        <div class="service-card" data-service="utilities">
                            <h6 class="service-text">Utilities Services</h6>
                        </div>
                    </div>

                    <div class="details-content">
                        <div id="constructionDetails" class="service-instructions" style="display: none;">
                            <h3>Construction Clearance</h3>
                            <p>Submit construction-related requests for barangay monitoring and documentation.</p>
                            <button class="close-btn" onclick="showDefaultService()">
                                Back to Services
                            </button>
                            
                            <div class="instructions-list">
                                <h4>Requirements:</h4>
                                <ul>
                                    <li>Notify the barangay about house repairs, renovations, or construction</li>
                                    <li>Submit basic details (location, type of work, duration)</li>
                                    <li>Complying with barangay guidelines for safe construction</li>
                                    <li>Help maintain community awareness on ongoing works</li>
                                </ul>
                            </div>
                            
                            <div class="action-buttons">
                                <a href="pages/auth/signin.php" class="apply-btn">Request</a>
                            </div>
                        </div>
                        
                        <div id="businessDetails" class="service-instructions" style="display: none;">
                            <h3>Business Clearance</h3>
                            <p>Apply for business permits and clearances to operate within the barangay.</p>
                            <button class="close-btn" onclick="showDefaultService()">
                                Back to Services
                            </button>
                            
                            <div class="instructions-list">
                                <h4>Requirements:</h4>
                                <ul>
                                    <li>Valid business registration documents</li>
                                    <li>Proof of business location within barangay</li>
                                    <li>Barangay clearance application form</li>
                                    <li>Payment of necessary fees</li>
                                    <li>Compliance with barangay ordinances</li>
                                </ul>
                            </div>
                            
                            <div class="action-buttons">
                                <a href="pages/auth/signin.php" class="apply-btn">Request</a>
                            </div>
                        </div>
                        
                        <div id="utilitiesDetails" class="service-instructions" style="display: none;">
                            <h3>Utilities Services</h3>
                            <p>Request utility connections, repairs, and maintenance services.</p>
                            <button class="close-btn" onclick="showDefaultService()">
                                Back to Services
                            </button>
                            
                            <div class="instructions-list">
                                <h4>Available Services:</h4>
                                <ul>
                                    <li>Water connection and disconnection requests</li>
                                    <li>Electrical service applications</li>
                                    <li>Internet and cable TV installations</li>
                                    <li>Utility repair and maintenance requests</li>
                                    <li>Billing inquiries and payment assistance</li>
                                </ul>
                            </div>
                            
                            <div class="action-buttons">
                                <a href="pages/auth/signin.php" class="apply-btn">Request</a>
                            </div>
                        </div>
                        
                        <div id="defaultDetails" class="service-instructions">
                            <div class="welcome-message">
                                <i class="fas fa-handshake"></i>
                                <h3>Welcome to Our Services</h3>
                                <p>Select a service above to view detailed information, requirements, and application procedures.</p>
                                <p>Each service has specific instructions and links to help you complete your application efficiently.</p>
                            </div>
                        </div>
                    </div>
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

        <section data-theme="white">
            <div class="cont">
                <div class="contact-content">
                    <div class="story-text">
                        <h2>Contact Us</h2>
                        <p>If you have questions, concerns, or need assistance with any barangay services, feel free to reach out through the channels below.</p>
                        <ul class="contact-info">
                            <li><strong>BANWA | Barangay Blue Ridge B</strong><br> 5 Moonlight Loop, Project 4,  Quezon City, Metro Manila</li>
                            <li><strong>Phone:</strong> +63 946 456 6986</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script src="../client/scripts/resident/nav.js" defer></script>
    <script src="../client/scripts/resident/home.js" defer></script>
    </body>
</html>