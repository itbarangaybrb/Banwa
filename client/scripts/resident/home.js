document.addEventListener('DOMContentLoaded', function() {
    // Background Carousel Functionality
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
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(nextImage, 5000);
    });
    
    // Smooth scrolling for anchor links (keep your existing code)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Image Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Image carousel functionality
    const mainImage = document.getElementById('mainCarouselImage');
    const thumbs = document.querySelectorAll('.thumb');
    
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
    if (thumbs.length > 0) {
        thumbs[0].classList.add('active');
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});