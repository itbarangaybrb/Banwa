<!DOCTYPE html>
<html lang="en">

    <head>
        <title>Home</title>
        <link rel="stylesheet" href="../../styles/resident/home.css">
    </head>

    <body>

    <?php  $page_title = "Home"; include '_layout/nav2.php'; ?>

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
                <h6>Barangay Blue Ridge B</h6>
                    <p>Welcome to BANWA. The system enables Barangay Blue Ridge B to efficiently manage infrastructure, clearance, utilities, and incidents through interactive mapping and data-driven tools.</p>
                    </div>
                </div>
            </div>
        </section>

        <section data-theme="blue">
            <h1>Updates</h1>
                <p>Your gateway to convenient access and management of municipal services.</p>
        </section>

        <section data-theme="white">
            <h1>Serives</h1>
                <p>Your gateway to convenient access and management of municipal services.</p>
        </section>

        <section data-theme="blue">
                <div class="cont">
                    <div class="story-content">
                        <div class="story-text">
                            <h2>Our Story</h2>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                        </div>
                        
                        <div class="story-media">
                            <div class="image-carousel">
                                <div class="main-image">
                                    <img src="../../img/building-1.png" alt="Barangay Hall" id="mainCarouselImage">
                                </div>
                                <div class="image-thumbnails">
                                    <div class="thumb" data-image="../../img/building-1.png">
                                        <img src="../../img/building-1.png" alt="Building 1">
                                    </div>
                                    <div class="thumb" data-image="../../img/building-2.png">
                                        <img src="../../img/building-2.png" alt="Building 2">
                                    </div>
                                    <div class="thumb" data-image="../../img/building-3.png">
                                        <img src="../../img/building-3.png" alt="Building 3">
                                    </div>
                                    <div class="thumb" data-image="../../img/building-4.png">
                                        <img src="../../img/building-4.png" alt="Building 4">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="partner-logos">
                                <h3>Our Partners</h3>
                                <div class="logos-grid">
                                    <img src="../../img/logo-1.png" alt="Partner 1">
                                    <img src="../../img/logo-2.png" alt="Partner 2">
                                    <img src="../../img/logo-3.png" alt="Partner 3">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        <section data-theme="blue">
            <div class="cont">
                <h1>Barangay Blue Ridge B</h1>
                    <p>Your gateway to convenient access and management of municipal services.</p>
            </div>
        </section>

        <section data-theme="white">
            <div class="cont">
                <div class="story-content">
                    <div class="story-text">
                        <h2>Contact Us</h2>
                        <p>If you have questions, concerns, or need assistance with any barangay services, feel free to reach out through the channels below.</p>
                        <ul class="contact-info">
                            <li><strong>BANWA | Barangay Blue Ridge B</strong><br> 5 Moonlight Loop, Project 4,  Quezon City, Metro Manila</li>
                            <li><strong>Phone:</strong> +63 946 456 6986</li>
                            <li><strong>Email:</strong>
                                <a href="mailto:
                            <span class="__cf_email__" data-cfemail="c1aeb7aeb4c1b6a3a8a2b7a5b4b9e1aca0a2">[email&#160;protected]</span>">[email protected]</a>
                            </li>
                            <li><strong>Facebook:</strong>
                                <a href="https://www.facebook.com/BarangayBlueRidgeB" target="_blank">facebook.com/BarangayBlueRidgeB</a>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="story-media">
                        <div class="image-carousel">
                            <div class="main-image">
                                <img src="../../img/building-1.png" alt="Barangay Hall" id="mainCarouselImage">
                            </div>
                            <div class="image-thumbnails">
                                <div class="thumb" data-image="../../img/building-1.png">
                                    <img src="../../img/building-1.png" alt="Building 1">
                                </div>
                                <div class="thumb" data-image="../../img/building-2.png">
                                    <img src="../../img/building-2.png" alt="Building 2">
                                </div>
                                <div class="thumb" data-image="../../img/building-3.png">
                                    <img src="../../img/building-3.png" alt="Building 3">
                                </div>
                                <div class="thumb" data-image="../../img/building-4.png">
                                    <img src="../../img/building-4.png" alt="Building 4">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <?php include '_layout/end2.php'; ?>

        <script src="../../scripts/resident/home.js" defer></script>
    </body>
</html>