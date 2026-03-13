document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // 0. OFFICE HOURS STATUS
    // ======================
    function updateOfficeHoursStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Check if office is open based on schedule
        let isOpen = false;
        let statusText = '';
        let nextOpenInfo = '';
        
        // Sunday - always closed
        if (currentDay === 0) {
            isOpen = false;
            statusText = 'Closed Today';
            nextOpenInfo = 'Opens Monday at 8 AM';
        } 
        // Monday to Friday: 8:00 AM - 5:00 PM
        else if (currentDay >= 1 && currentDay <= 5) {
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const openTime = 8 * 60; // 8:00 AM
            const closeTime = 17 * 60; // 5:00 PM
            
            isOpen = currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime;
            
            if (isOpen) {
                statusText = 'Open Now';
                nextOpenInfo = ''; // Empty when open
            } else if (currentTimeInMinutes < openTime) {
                statusText = 'Closed Now';
                nextOpenInfo = 'Opens at 8 AM';
            } else {
                statusText = 'Closed Now';
                nextOpenInfo = 'Opens tomorrow at 8 AM';
            }
        } 
        // Saturday: 8:00 AM - 12:00 PM
        else if (currentDay === 6) {
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const openTime = 8 * 60; // 8:00 AM
            const closeTime = 12 * 60; // 12:00 PM
            
            isOpen = currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime;
            
            if (isOpen) {
                statusText = 'Open Now';
                nextOpenInfo = ''; // Empty when open
            } else if (currentTimeInMinutes < openTime) {
                statusText = 'Closed Now';
                nextOpenInfo = 'Opens at 8 AM';
            } else {
                statusText = 'Closed Now';
                nextOpenInfo = 'Opens Monday at 8 AM';
            }
        }
        
        // Update office hours status if the element exists
        const hoursStatus = document.querySelector('.hours-status');
        const officeHoursElement = document.querySelector('.office-hours');
        
        if (hoursStatus && officeHoursElement) {
            officeHoursElement.className = isOpen ? 'office-hours status-open' : 'office-hours status-closed';
            
            // Set status text
            hoursStatus.textContent = isOpen ? 'Open Now' : 'Closed Now';
        }
        
        // Update current status in tooltip if it exists
        const currentStatusIndicator = document.querySelector('.current-status .status-indicator');
        const currentStatusText = document.querySelector('.current-status .status-text');
        const nextOpenSpan = document.querySelector('.next-open-info');
        const nextOpenDiv = document.querySelector('.next-open');
        
        if (currentStatusIndicator && currentStatusText) {
            currentStatusIndicator.className = isOpen ? 'status-indicator status-open' : 'status-indicator status-closed';
            currentStatusText.textContent = statusText;
            currentStatusText.className = isOpen ? 'status-text open' : 'status-text closed';
            
            // Update container class
            const currentStatusContainer = document.querySelector('.current-status');
            if (currentStatusContainer) {
                currentStatusContainer.className = isOpen ? 'current-status' : 'current-status closed';
            }
            
            // Update next open info if element exists
            if (nextOpenSpan) {
                nextOpenSpan.textContent = nextOpenInfo;
            }
            
            // Show/hide the next-open div based on whether we have nextOpenInfo
            if (nextOpenDiv) {
                if (nextOpenInfo) {
                    nextOpenDiv.classList.add('visible');
                    nextOpenDiv.classList.remove('hidden');
                } else {
                    nextOpenDiv.classList.add('hidden');
                    nextOpenDiv.classList.remove('visible');
                }
            }
        }
    }
    
    // Initial call and set interval
    updateOfficeHoursStatus();
    setInterval(updateOfficeHoursStatus, 60000); // Update every minute
    
    // ======================
    // 1. BACKGROUND CAROUSEL
    // ======================
    // Only run if carousel elements exist on this page
    const carouselImages = document.querySelectorAll('.carousel-image');
    const dots = document.querySelectorAll('.dot');

    // Check if carousel exists on this page
    if (carouselImages.length > 0 && dots.length > 0) {
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
    // SERVICE CARDS - OPEN MODAL (FIXED)
    // ======================
    // Only run this code if the auth modal exists on the page
    const authModal = document.getElementById('authModal');

    if (authModal) {
        const serviceCards = document.querySelectorAll('.service-h-card');
        const getStartedBtn = document.getElementById('getStartedBtn');
        
        // Function to open modal
        function openModal() {
            authModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('Modal opened - show class added');
        }
        
        // Function to close modal
        function closeModal() {
            authModal.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        // Get Started button
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', openModal);
        }
        
        // Service cards
        serviceCards.forEach((card) => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            });
        });
        
        // Close button
        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Click outside to close
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                closeModal();
            }
        });
    }
    
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
});

// Barangay Officials Carousel - SIMPLE SINGLE CARD LOOP
document.addEventListener('DOMContentLoaded', function() {
    const carouselTrack = document.querySelector('.carousel-track');
    const officialCards = document.querySelectorAll('.official-card');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    
    // Only run if elements exist
    if (!carouselTrack || !officialCards.length) return;
    
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
        if (indicators.length) {
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }
        
        // Re-enable animation
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        });
    }
    
    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }
    
    // Indicators
    if (indicators.length) {
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                if (!isAnimating && currentIndex !== index) {
                    currentIndex = index;
                    updateCarousel();
                }
            });
        });
    }
    
    // Auto-rotate
    let carouselInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }, 4000);
    
    // Pause on hover
    const carouselContainer = document.querySelector('.officials-carousel');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(carouselInterval);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            carouselInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel();
            }, 4000);
        });
    }
    
    // Initialize
    updateCarousel();
});

// ======================
// 5. FAQ ACCORDION
// ======================
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            // Toggle active class on question
            this.classList.toggle('active');
            
            // Get the answer element
            const answer = this.nextElementSibling;
            
            // Toggle active class on answer
            if (answer) {
                answer.classList.toggle('active');
            }
            
            // Close other open FAQs (optional - remove if you want multiple open)
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== this && otherQuestion.classList.contains('active')) {
                    otherQuestion.classList.remove('active');
                    if (otherQuestion.nextElementSibling) {
                        otherQuestion.nextElementSibling.classList.remove('active');
                    }
                }
            });
        });
    });
});

