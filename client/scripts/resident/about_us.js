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