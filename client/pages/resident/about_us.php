<?php 
    require_once __DIR__ . '/../../../server/api/shared/check_session.php';
    
if ($_SESSION['role_id'] != 1) {
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home</title>
    <meta name="description" content="Professional residential management system with elegant design and user-friendly interface">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/global.css">
    <link rel="stylesheet" href="../../styles/index.css">
    <link rel="stylesheet" href="../../styles/resident/home.css">
</head>

<body>
<?php 
$page_title = "About Us";
include '../../pages/resident/_layout/nav.php';
?>

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

        <!-- Barangay Officials Carousel -->
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
                                        <img src="../../img/official-1.png" alt="Kapitan Sessan Castro-Lee">
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
                                        <img src="../../img/official-2.png" alt="Katherine T. De Jesus">
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
                                        <img src="../../img/official-3.png" alt="Margarette Karra De Jesus">
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
                                        <img src="../../img/official-4.png" alt="Anna Francesca L. Maristela">
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
                                        <img src="../../img/official-5.png" alt="Augusto D. Ilagan">
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
                                        <img src="../../img/official-6.png" alt="Natalia L. Maristela">
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
                                        <img src="../../img/official-7.png" alt="Modesto Carlo M. Ruiz Jr.">
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
                                        <img src="../../img/official-8.png" alt="Rovie Rose B. Baylon">
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
                                        <img src="../../img/official-9.png" alt="Michell V. Meniano">
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

    <script src="../../scripts/resident/nav.js" defer></script>
    <script src="../../scripts/resident/home.js" defer></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
    <?php include '../../pages/resident/_layout/end.php'; ?>
    </body>
</html>