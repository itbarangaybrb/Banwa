document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // 1. BACKGROUND CAROUSEL
    // ======================
    const carouselImages = document.querySelectorAll('.carousel-image');
    const dots = document.querySelectorAll('.dot');
    let currentImageIndex = 0;
    const totalImages = carouselImages.length;
    
    // Function to change image
    function changeImage(index) {
        // Remove active class from all images and dots
        carouselImages.forEach(img => img.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current image and dot
        carouselImages[index].classList.add('active');
        dots[index].classList.add('active');
        currentImageIndex = index;
    }
    
    // Function for next image
    function nextImage() {
        let nextIndex = (currentImageIndex + 1) % totalImages;
        changeImage(nextIndex);
    }
    
    // Auto-play carousel
    let carouselInterval = setInterval(nextImage, 5000); // Change every 5 seconds
    
    // Click on dots to change image
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            changeImage(index);
            
            // Reset auto-play timer
            clearInterval(carouselInterval);
            carouselInterval = setInterval(nextImage, 5000);
        });
    });
    
    // Optional: Pause carousel on hover
    const carouselContainer = document.querySelector('.hero-bg-carousel');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(carouselInterval);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            carouselInterval = setInterval(nextImage, 5000);
        });
    }
    
    // ======================
    // 2. IMAGE CAROUSEL (Thumbnails)
    // ======================
    const mainImage = document.getElementById('mainCarouselImage');
    const thumbs = document.querySelectorAll('.thumb');
    
    if (mainImage && thumbs.length > 0) {
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', function() {
                const imageSrc = this.getAttribute('data-image');
                mainImage.src = imageSrc;
                
                // Update active thumbnail
                thumbs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Set first thumbnail as active by default
        thumbs[0].classList.add('active');
    }
    
    // ======================
    // 3. SERVICES SECTION
    // ======================
    const serviceCards = document.querySelectorAll('.service-card');
    const allDetails = document.querySelectorAll('.service-instructions');
    
    // Hide all service details initially except default
    allDetails.forEach(detail => {
        if (detail.id !== 'defaultDetails') {
            detail.style.display = 'none';
        }
    });
    
    // Add click event to each service card
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const serviceType = this.getAttribute('data-service');
            
            // Hide all details
            allDetails.forEach(detail => {
                detail.style.display = 'none';
            });
            
            // Show the selected service details
            const selectedDetails = document.getElementById(serviceType + 'Details');
            if (selectedDetails) {
                selectedDetails.style.display = 'block';
            }
            
            // Add active class to selected card
            serviceCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
        
        // Add keyboard support
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
    });
    
    // ======================
    // 4. SMOOTH SCROLLING (Global - only once)
    // ======================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if it's an internal anchor link
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Optional: Add a function to show default service details
    window.showDefaultService = function() {
        allDetails.forEach(detail => {
            detail.style.display = 'none';
        });
        const defaultDetails = document.getElementById('defaultDetails');
        if (defaultDetails) {
            defaultDetails.style.display = 'block';
        }
        serviceCards.forEach(card => {
            card.classList.remove('active');
        });
    };
});

// Barangay Officials Carousel - SIMPLE SINGLE CARD LOOP
document.addEventListener('DOMContentLoaded', function() {
    const carouselTrack = document.querySelector('.carousel-track');
    const officialCards = document.querySelectorAll('.official-card');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    
    let currentIndex = 0;
    const totalSlides = officialCards.length;
    let isAnimating = false;
    
    // Function to update carousel
    function updateCarousel() {
        if (isAnimating) return;
        isAnimating = true;
        
        // Calculate offset
        const cardWidth = officialCards[0].offsetWidth + 20; // width + gap
        const offset = -currentIndex * cardWidth;
        
        // Apply transform
        carouselTrack.style.transform = `translateX(${offset}px)`;
        
        // Update active states
        officialCards.forEach(card => card.classList.remove('active'));
        officialCards[currentIndex].classList.add('active');
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
        
        // Re-enable animation
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    // Next button
    nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    });
    
    // Previous button
    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });
    
    // Indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
            if (!isAnimating && currentIndex !== index) {
                currentIndex = index;
                updateCarousel();
            }
        });
    });
    
    // Auto-rotate
    let carouselInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }, 4000);
    
    // Pause on hover
    const carouselContainer = document.querySelector('.officials-carousel');
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        }, 4000);
    });
    
    // Initialize
    updateCarousel();
});