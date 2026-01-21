<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home</title>
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
                </div>
            </div>
            
            <!-- Hero Content Overlay -->
            <div class="hero-content-overlay">
                <div class="hero_content">
                    <h1>BANWA</h1>
            <h6>Barangay Blue Ridge B</h6>
                <p>Welcome to BANWA. The system enables Barangay Blue Ridge B to efficiently manage infrastructure, clearance, utilities, and incidents through interactive mapping and data-driven tools.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Quick Action Section -->
    <section data-theme="white" class="quick-action-section">
        <div class="cont">
            <div class="quick-action-container">
                <!-- Title -->
                <div class="quick-align">
                    <h2>PLEASE CHOOSE FROM THE FOLLOWING SERVICES</h2>
                </div>
                
                <!-- Action Buttons Grid -->
                <div class="action-buttons-grid">
                    <!-- Construction Button -->
                    <a href="#" class="action-btn construction-btn">
                        <div class="btn-icon">
                            <i class="fas fa-hard-hat"></i>
                        </div>
                        <span class="btn-text">Construction</span>
                    </a>
                    
                    <!-- Business Clearance Button -->
                    <a href="#" class="action-btn business-btn">
                        <div class="btn-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <span class="btn-text">Business Clearance</span>
                    </a>
                    
                    <!-- Utilities Button -->
                    <a href="#" class="action-btn utilities-btn">
                        <div class="btn-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <span class="btn-text">Utilities</span>
                    </a>
                    
                    <!-- Report Button -->
                    <a href="#" class="action-btn report-btn">
                        <div class="btn-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <span class="btn-text">Report</span>
                    </a>
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
                            <li><strong>BANWA | Barangay Blue Ridge B</strong><br> 5 Moonlight Loop, Project 4,  Quezon City, Metro Manila</li>
                            <li><strong>Phone:</strong> +63 946 456 6986</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

    <?php include '../../pages/resident/_layout/end.php'; ?>
</body>
</html>