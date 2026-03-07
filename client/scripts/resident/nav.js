// Main navigation script
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize all navigation functions
        initNavHighlighting();
        displayLiveDateTime();
        loadUserDataAndUpdateAvatar();
        initMobileNavigation();
    } catch (error) {
        console.error('Error in navigation script:', error);
    }
});

// ==================== NAVIGATION HIGHLIGHTING ====================
function initNavHighlighting() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'home.php';
    const navItems = document.querySelectorAll('.nav_list a, .nav_list button');
    
    if (navItems.length === 0) {
        console.warn('No navigation items found');
        return;
    }

    navItems.forEach(item => {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
    });
    
    let foundActive = false;
    
    navItems.forEach(item => {
        const linkHref = item.getAttribute('href');
        
        // Skip button (logout) - it doesn't have href
        if (!linkHref) return;
        
        const linkPage = linkHref.split('/').pop();
        
        // Match if: page filename matches
        if (linkPage === currentPage) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
            foundActive = true;
            console.log('Nav item activated:', linkPage);
        }
    });
    
    if (!foundActive) {
        // Fallback: activate home link if no match
        const homeLink = document.querySelector('.nav_list a[href*="home.php"]');
        if (homeLink) {
            homeLink.classList.add('active');
            homeLink.setAttribute('aria-current', 'page');
            console.log('Fallback: Home link activated');
        }
    }
}

// ==================== LIVE DATE TIME ====================
function displayLiveDateTime() {
    function update() {
        const weekdayBox = document.querySelector('.weekday-box');
        const timePart = document.querySelector('.time-part');
        const dateDisplay = document.querySelector('.date-display');
        
        if (!weekdayBox || !timePart || !dateDisplay) return;
        
        const now = new Date();
        
        // Format weekday: "Wed" (for the blue box)
        const weekdayOptions = { weekday: 'short' };
        const weekdayString = now.toLocaleDateString('en-US', weekdayOptions);
        
        // Format time: "03:11 AM" (for the time part)
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        const formattedTime = timeString.replace(',', '');
        
        // Format date: "03/04/2026"
        const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        // Update displays
        weekdayBox.textContent = weekdayString.toUpperCase();
        timePart.textContent = formattedTime;
        dateDisplay.textContent = dateString;
    }
    
    update();
    setInterval(update, 1000); // Update every second
}

// ==================== USER AVATAR ====================
async function loadUserDataAndUpdateAvatar() {
    try {
        // Function to get user initials from name
        function getInitialsFromUserData(data) {
            // Prefer first + last name initials
            if (data.first_name && data.last_name) {
                return (data.first_name[0] + data.last_name[0]).toUpperCase();
            }
            // Fallback: first two letters of first name
            if (data.first_name && data.first_name.length >= 2) {
                return data.first_name.slice(0, 2).toUpperCase();
            }
            // Fallback: first two letters of full name
            if (data.full_name) {
                const tokens = data.full_name.split(/\s+/).filter(Boolean);
                if (tokens.length >= 2) {
                    return (tokens[0][0] + tokens[1][0]).toUpperCase();
                }
                if (tokens.length === 1 && tokens[0].length >= 2) {
                    return tokens[0].slice(0, 2).toUpperCase();
                }
            }
            // Default fallback
            return 'US';
        }

        // Fetch user data from your backend
        const res = await fetch('/server/api/resident/get_user.php', { 
            credentials: 'include' 
        });
        const data = await res.json();
        
        if (data.error) {
            console.error(data.error);
            return;
        }
        
        // Get the profile circle element
        const profileCircle = document.querySelector('.profile_circle');
        
        if (profileCircle) {
            // Get initials from user data
            const initials = getInitialsFromUserData(data);
            
            // Update the text content
            profileCircle.textContent = initials;
            
            // Add a subtle animation
            profileCircle.style.transition = 'transform 0.2s ease';
            profileCircle.style.transform = 'scale(1.1)';
            setTimeout(() => {
                profileCircle.style.transform = 'scale(1)';
            }, 200);
        }
        
    } catch (err) {
        console.error('Failed to load user data for nav avatar:', err);
        // Show default if fetch fails
        const profileCircle = document.querySelector('.profile_circle');
        if (profileCircle && !profileCircle.textContent) {
            profileCircle.textContent = 'US';
        }
    }
}

// ==================== MOBILE NAVIGATION ====================
function initMobileNavigation() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    if (!hamburgerBtn || !navMenu) return;
    
    // Toggle mobile menu
    hamburgerBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Handle dropdown toggles on mobile
    function handleDropdownClick(e) {
        e.preventDefault();
        const dropdown = this.closest('.dropdown');
        dropdown.classList.toggle('active');
    }
    
    // Check if mobile view and attach handlers
    function checkMobileView() {
        if (window.innerWidth <= 992) {
            dropdownToggles.forEach(toggle => {
                toggle.removeEventListener('click', handleDropdownClick);
                toggle.addEventListener('click', handleDropdownClick);
            });
        } else {
            dropdownToggles.forEach(toggle => {
                toggle.removeEventListener('click', handleDropdownClick);
            });
            
            // Reset dropdowns when switching to desktop
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    }
    
    // Initial check
    checkMobileView();
    
    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav_select, .dropdown-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        checkMobileView();
        
        // Close mobile menu if window becomes larger than mobile breakpoint
        if (window.innerWidth > 992) {
            if (navMenu.classList.contains('active')) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}