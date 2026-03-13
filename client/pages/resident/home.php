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
    <title>Home</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/resident/home.css">
</head>


<body>
<?php 
$page_title = "Home";
include '../../pages/resident/_layout/nav.php';
?>

    <section data-theme="banner" class="hero-section">
        <div class="hero-cont">
            <!-- Background Carousel Container -->
            <div class="hero-bg-carousel">
                <div class="carousel-images">
                    <img src="../../img/building-1.png" alt="Barangay Hall" class="carousel-image active">
                    <img src="../../img/building-2.png" alt="Municipal Building" class="carousel-image">
                    <img src="../../img/building-3.png" alt="Community Center" class="carousel-image">
                    <img src="../../img/building-4.png" alt="Barangay Hall-Side View" class="carousel-image">
                    <img src="../../img/building-5.png" alt="Meeting Table" class="carousel-image">
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
                                            <span class="days">Sunday & Holidays</span>
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

            <!-- 3 Horizontal Cards - These should link to actual pages -->
            <div class="services-horizontal">
                <!-- Card 1: Construction Clearance -->
                <a href="construction_app.php" class="service-h-card" id="constructionCard">
                    <div class="card-icon-wrapper">
                        <div class="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M2 20L22 20" stroke-linecap="round"/>
                                <rect x="4" y="9" width="16" height="11" rx="1" stroke="currentColor"/>
                                <path d="M8 6L12 3L16 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
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
                </a>

                <!-- Card 2: Business Clearance -->
                <a href="business_app.php" class="service-h-card" id="businessCard">
                    <div class="card-icon-wrapper">
                        <div class="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor"/>
                                <path d="M16 3L16 7" stroke="currentColor" stroke-linecap="round"/>
                                <path d="M8 3L8 7" stroke="currentColor" stroke-linecap="round"/>
                                <path d="M8 13L16 13" stroke="currentColor" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>
                    
                    <h3>Business Clearance</h3>
                    <p class="card-subtitle">New businesses, Renewals, and Closure</p>

                    <div class="card-preview-content">
                        <div class="preview-header">
                            <span class="preview-title">Requirements</span>
                        </div>
                        <ul class="preview-list">
                            <li>SEC Registration or DTI Registration</li>
                            <li>TCT or Lease Contract</li>
                        </ul>
                        <div class="preview-footer">
                            <span class="preview-cta">Proceed →</span>
                        </div>
                    </div>
                </a>

                <!-- Card 3: Utilities Services -->
                <a href="utilities_app.php" class="service-h-card" id="utilitiesCard">
                    <div class="card-icon-wrapper">
                        <div class="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="5" stroke="currentColor"/>
                                <path d="M12 2L12 7" stroke="currentColor" stroke-linecap="round"/>
                                <path d="M12 17L12 22" stroke="currentColor" stroke-linecap="round"/>
                                <path d="M22 12L17 12" stroke="currentColor" stroke-linecap="round"/>
                                <path d="M7 12L2 12" stroke="currentColor" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>
                    
                    <h3>Utilities Services</h3>
                    <p class="card-subtitle">Water, Electricity, Internet and Billing Inquiries</p>

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
                </a>
            </div>

            <!-- 24/7 Notice -->
            <div class="always-open-note">
                <span><strong>Applications submitted outside office hours will be processed the next business day.</strong></span>
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
                        <li><strong>Mobile:</strong> 0917-1822272</li>
                        <li><strong>Landline:</strong> 8-5359822</li>
                        <li><strong>Email:</strong> blueridgeb@yahoo.com</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <?php include '../../pages/resident/_layout/end.php'; ?>
</body>
</html>