document.addEventListener('DOMContentLoaded', function () {

    function createAutoRotate(callback, delay) {
        let timer = null;

        function start() {
            stop();
            timer = setInterval(callback, delay);
        }

        function stop() {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
        }

        return { start, stop };
    }


    // ─────────────────────────────────────────────
    // 1. OFFICE HOURS STATUS
    // ─────────────────────────────────────────────
    function getOfficeStatus() {
        const now = new Date();
        const day = now.getDay(); 
        const mins = now.getHours() * 60 + now.getMinutes();

        const OPEN_WEEKDAY  = { open: 8 * 60, close: 17 * 60 }; 
        const OPEN_SATURDAY = { open: 8 * 60, close: 12 * 60 }; 

        if (day === 0) {
            return { isOpen: false, statusText: 'Closed Today', nextOpen: 'Opens Monday at 8 AM' };
        }

        const schedule = day === 6 ? OPEN_SATURDAY : OPEN_WEEKDAY;
        const isOpen   = mins >= schedule.open && mins < schedule.close;

        let nextOpen = '';
        if (!isOpen) {
            if (mins < schedule.open) {
                nextOpen = 'Opens at 8 AM';
            } else if (day === 5) {
                nextOpen = 'Opens Saturday at 8 AM';
            } else if (day === 6) {
                nextOpen = 'Opens Monday at 8 AM';
            } else {
                nextOpen = 'Opens tomorrow at 8 AM';
            }
        }

        return { isOpen, statusText: isOpen ? 'Open Now' : 'Closed Now', nextOpen };
    }

    function updateOfficeHoursStatus() {
        const { isOpen, statusText, nextOpen } = getOfficeStatus();

        const hoursStatus    = document.querySelector('.hours-status');
        const officeHoursEl  = document.querySelector('.office-hours');
        const statusIndicator = document.querySelector('.current-status .status-indicator');
        const statusText_el  = document.querySelector('.current-status .status-text');
        const statusContainer = document.querySelector('.current-status');
        const nextOpenSpan   = document.querySelector('.next-open-info');
        const nextOpenDiv    = document.querySelector('.next-open');

        if (hoursStatus && officeHoursEl) {
            officeHoursEl.className = isOpen ? 'office-hours status-open' : 'office-hours status-closed';
            hoursStatus.textContent = isOpen ? 'Open Now' : 'Closed Now';
        }

        if (statusIndicator && statusText_el) {
            statusIndicator.className = `status-indicator ${isOpen ? 'status-open' : 'status-closed'}`;
            statusText_el.textContent  = statusText;
            statusText_el.className    = `status-text ${isOpen ? 'open' : 'closed'}`;
        }

        if (statusContainer) {
            statusContainer.className = isOpen ? 'current-status' : 'current-status closed';
        }

        if (nextOpenSpan) nextOpenSpan.textContent = nextOpen;

        if (nextOpenDiv) {
            nextOpenDiv.classList.toggle('visible', !!nextOpen);
            nextOpenDiv.classList.toggle('hidden',  !nextOpen);
        }
    }

    updateOfficeHoursStatus();
    setInterval(updateOfficeHoursStatus, 60_000);


    // ─────────────────────────────────────────────
    // 2. HERO BACKGROUND CAROUSEL
    // ─────────────────────────────────────────────
    const heroImages = document.querySelectorAll('.carousel-image');
    const heroDots   = document.querySelectorAll('.dot');

    if (heroImages.length && heroDots.length) {
        let current = 0;

        function showHeroSlide(index) {
            heroImages.forEach(img => img.classList.remove('active'));
            heroDots.forEach(dot => dot.classList.remove('active'));
            heroImages[index].classList.add('active');
            heroDots[index].classList.add('active');
            current = index;
        }

        const heroRotate = createAutoRotate(
            () => showHeroSlide((current + 1) % heroImages.length),
            5000
        );
        heroRotate.start();

        heroDots.forEach(dot => {
            dot.addEventListener('click', function () {
                showHeroSlide(parseInt(this.dataset.index));
                heroRotate.start(); 
            });
        });

        const heroBg = document.querySelector('.hero-bg-carousel');
        if (heroBg) {
            heroBg.addEventListener('mouseenter', heroRotate.stop);
            heroBg.addEventListener('mouseleave', heroRotate.start);
        }
    }


    // ─────────────────────────────────────────────
    // 3. STORY IMAGE THUMBNAILS
    // ─────────────────────────────────────────────
    const mainCarouselImage = document.getElementById('mainCarouselImage');
    const thumbs = document.querySelectorAll('.thumb');

    if (mainCarouselImage && thumbs.length) {
        thumbs[0].classList.add('active');

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', function () {
                mainCarouselImage.src = this.dataset.image;
                thumbs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }


    // ─────────────────────────────────────────────
    // 4. AUTH MODAL — service cards + get-started btn
    // ─────────────────────────────────────────────
    const authModal = document.getElementById('authModal');

    if (authModal) {
        function openModal() {
            authModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            authModal.classList.remove('show');
            document.body.style.overflow = '';
        }

        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) getStartedBtn.addEventListener('click', openModal);

        document.querySelectorAll('.service-h-card').forEach(card => {
            card.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            });
        });

        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        authModal.addEventListener('click', function (e) {
            if (e.target === authModal) closeModal();
        });
    }


    // ─────────────────────────────────────────────
    // 5. SMOOTH SCROLL for anchor links
    // ─────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });


    // ─────────────────────────────────────────────
    // 6. BARANGAY OFFICIALS CAROUSEL
    // ─────────────────────────────────────────────
    const track      = document.querySelector('.carousel-track');
    const cards      = document.querySelectorAll('.official-card');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn    = document.querySelector('.carousel-nav.prev');
    const nextBtn    = document.querySelector('.carousel-nav.next');

    if (track && cards.length) {
        let currentIndex = 0;
        let isAnimating  = false;
        const total      = cards.length;

        function getCardWidth() {
            return cards[0].offsetWidth + 20; 
        }

        function goToSlide(index) {
            if (isAnimating) return;
            isAnimating = true;

            track.style.transform = `translateX(${-index * getCardWidth()}px)`;

            cards.forEach(c => c.classList.remove('active'));
            cards[index].classList.add('active');

            indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));

            currentIndex = index;
            setTimeout(() => { isAnimating = false; }, 500);
        }

        if (nextBtn) nextBtn.addEventListener('click', () => goToSlide((currentIndex + 1) % total));
        if (prevBtn) prevBtn.addEventListener('click', () => goToSlide((currentIndex - 1 + total) % total));

        indicators.forEach((ind, i) => {
            ind.addEventListener('click', () => {
                if (!isAnimating && currentIndex !== i) goToSlide(i);
            });
        });

        const officialsRotate = createAutoRotate(
            () => goToSlide((currentIndex + 1) % total),
            4000
        );
        officialsRotate.start();

        const officialsCarousel = document.querySelector('.officials-carousel');
        if (officialsCarousel) {
            officialsCarousel.addEventListener('mouseenter', officialsRotate.stop);
            officialsCarousel.addEventListener('mouseleave', officialsRotate.start);
        }

        window.addEventListener('resize', () => goToSlide(currentIndex));

        goToSlide(0);
    }


    // ─────────────────────────────────────────────
    // 7. FAQ ACCORDION
    // ─────────────────────────────────────────────
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const isActive = this.classList.contains('active');

            document.querySelectorAll('.faq-question.active').forEach(openQ => {
                openQ.classList.remove('active');
                openQ.nextElementSibling?.classList.remove('active');
            });

            if (!isActive) {
                this.classList.add('active');
                this.nextElementSibling?.classList.add('active');
            }
        });
    });

});