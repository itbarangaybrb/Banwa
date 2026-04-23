document.addEventListener('DOMContentLoaded', function () {

    // ─────────────────────────────────────────────
    // 1. LIVE TIME (top-right of nav)
    // ─────────────────────────────────────────────
    const timeEl = document.getElementById('navTime');

    function tick() {
        if (!timeEl) return;
        const d   = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let h      = d.getHours();
        const m    = d.getMinutes();
        const ap   = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeEl.textContent =
            days[d.getDay()] + ' ' +
            (h < 10 ? '0' + h : h) + ':' +
            (m < 10 ? '0' + m : m) + ' ' + ap;
    }

    tick();
    setInterval(tick, 30000);


    // ─────────────────────────────────────────────
    // 2. SCROLL BEHAVIOUR
    //    Pages that have a .hero → transparent until
    //    user scrolls. Pages without → always scrolled.
    // ─────────────────────────────────────────────
    const nav     = document.getElementById('mainNav');
    const hasHero = !!document.querySelector('.hero');

    function applyScroll() {
        if (!nav) return;
        if (!hasHero || window.scrollY > 50) {
            nav.classList.add('nav--scrolled');
        } else {
            nav.classList.remove('nav--scrolled');
        }
    }

    if (!hasHero && nav) {
        nav.classList.add('nav--scrolled');
    }

    window.addEventListener('scroll', applyScroll, { passive: true });
    applyScroll();


    // ─────────────────────────────────────────────
    // 3. ACTIVE LINK HIGHLIGHTING
    // ─────────────────────────────────────────────
    const currentPage = window.location.pathname.split('/').pop() || '';

    document.querySelectorAll('.nav__link, .nav__dropdown-menu a').forEach(function (link) {
        const href = link.getAttribute('href') || '';
        const page = href.split('/').pop();
        if (page && page === currentPage) {
            link.classList.add('is-active');
            // Also mark parent dropdown toggle active
            const parentDropdown = link.closest('.nav__dropdown');
            if (parentDropdown) {
                const toggle = parentDropdown.querySelector('.nav__dropdown-toggle');
                if (toggle) toggle.classList.add('is-active');
            }
        }
    });


    // ─────────────────────────────────────────────
    // 4. CLEARANCES DROPDOWN (click-based, keyboard-friendly)
    // ─────────────────────────────────────────────
    document.querySelectorAll('.nav__dropdown').forEach(function (dropdown) {
        const toggle = dropdown.querySelector('.nav__dropdown-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('is-open');

            // Close all other dropdowns first
            document.querySelectorAll('.nav__dropdown.is-open').forEach(function (d) {
                d.classList.remove('is-open');
                const t = d.querySelector('.nav__dropdown-toggle');
                if (t) t.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                dropdown.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        // Keyboard: Escape closes
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        document.querySelectorAll('.nav__dropdown.is-open').forEach(function (d) {
            d.classList.remove('is-open');
            const t = d.querySelector('.nav__dropdown-toggle');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    });


    // ─────────────────────────────────────────────
    // 5. PROFILE CIRCLE DROPDOWN
    // ─────────────────────────────────────────────
    const profileWrapper = document.getElementById('navProfile');
    const profileBtn     = document.getElementById('profileIcon');

    if (profileWrapper && profileBtn) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = profileWrapper.classList.contains('is-open');
            profileWrapper.classList.toggle('is-open', !isOpen);
            profileBtn.setAttribute('aria-expanded', String(!isOpen));
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!profileWrapper.contains(e.target)) {
                profileWrapper.classList.remove('is-open');
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Keyboard: Escape closes
        profileWrapper.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                profileWrapper.classList.remove('is-open');
                profileBtn.setAttribute('aria-expanded', 'false');
                profileBtn.focus();
            }
        });
    }


    // ─────────────────────────────────────────────
    // 6. PROFILE AVATAR — fetch initials from API
    // ─────────────────────────────────────────────
    async function loadAvatar() {
        const circle = document.getElementById('profileIcon');
        if (!circle) return;

        // Set a fallback immediately
        circle.textContent = 'US';

        try {
            const res  = await fetch('/server/api/resident/get_user.php', { credentials: 'include' });
            const data = await res.json();
            if (data.error) return;

            let initials = 'US';

            if (data.first_name && data.last_name) {
                initials = (data.first_name[0] + data.last_name[0]).toUpperCase();
            } else if (data.first_name && data.first_name.length >= 2) {
                initials = data.first_name.slice(0, 2).toUpperCase();
            } else if (data.full_name) {
                const tokens = data.full_name.split(/\s+/).filter(Boolean);
                if (tokens.length >= 2) {
                    initials = (tokens[0][0] + tokens[1][0]).toUpperCase();
                } else if (tokens.length === 1 && tokens[0].length >= 2) {
                    initials = tokens[0].slice(0, 2).toUpperCase();
                }
            }

            circle.textContent = initials;

        } catch (err) {
            console.error('Could not load user avatar:', err);
        }
    }

    loadAvatar();


    // ─────────────────────────────────────────────
    // 7. MARK PROFILE / STATUS LINKS ACTIVE
    // ─────────────────────────────────────────────
    document.querySelectorAll('.nav__profile-link[href]').forEach(function (link) {
        const page = (link.getAttribute('href') || '').split('/').pop();
        if (page && page === currentPage) {
            link.classList.add('is-active');
        }
    });


    // ─────────────────────────────────────────────
    // 8. HAMBURGER — mobile drawer
    // ─────────────────────────────────────────────
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu      = document.getElementById('navMenu');
    const navOverlay   = document.getElementById('navOverlay');

    function openDrawer() {
        if (!navMenu || !hamburgerBtn) return;
        navMenu.classList.add('is-open');
        hamburgerBtn.classList.add('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        if (navOverlay) navOverlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (!navMenu || !hamburgerBtn) return;
        navMenu.classList.remove('is-open');
        hamburgerBtn.classList.remove('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        if (navOverlay) navOverlay.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navMenu && navMenu.classList.contains('is-open') ? closeDrawer() : openDrawer();
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeDrawer);
    }

    // Close drawer on nav link click (mobile)
    if (navMenu) {
        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 860) closeDrawer();
            });
        });
    }

    // Close drawer on resize back to desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 860) closeDrawer();
    }, { passive: true });

    // Escape key closes drawer
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDrawer();
    });

});