// ───────────────────────────────────────────────────────────────
// Image Carousel + Smooth Scroll Initialization
// ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // ── Image Carousel Functionality ───────────────────────────────
    /**
     * Handles clicking on thumbnail images to update the main displayed image
     * and highlight the selected thumbnail
     */

    // Main large image element that shows the selected photo
    const mainImage = document.getElementById('mainCarouselImage');

    // All thumbnail elements (should have data-image attribute with full image URL)
    const thumbs = document.querySelectorAll('.thumb');

    if (!mainImage || thumbs.length === 0) {
        console.warn('Image carousel: main image or thumbnails not found');
        return;
    }

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', function () {
            // Get the full-size image URL from data attribute
            const imageSrc = this.getAttribute('data-image');
            if (!imageSrc) return;

            // Update main image source
            mainImage.src = imageSrc;

            // Remove active class from all thumbnails
            thumbs.forEach(t => t.classList.remove('active'));

            // Highlight the clicked thumbnail
            this.classList.add('active');
        });
    });

    // Set the first thumbnail as active by default (visual starting point)
    if (thumbs.length > 0) {
        thumbs[0].classList.add('active');

        // Optional: also load the first image into main view immediately
        const firstSrc = thumbs[0].getAttribute('data-image');
        if (firstSrc) {
            mainImage.src = firstSrc;
        }
    }

    // ── Smooth Scrolling for Anchor Links ──────────────────────────
    /**
     * Enables smooth scrolling when clicking internal page anchor links (href="#...")
     * Improves user experience on long pages with sections
     */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Prevent default jump behavior
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Scroll smoothly to the target section
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'        // align to top of viewport
                    // block: 'center'    // alternative: center in view
                    // block: 'nearest'   // minimal scroll to make visible
                });
            }
        });
    });
});
