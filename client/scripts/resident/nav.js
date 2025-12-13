// document.addEventListener('DOMContentLoaded', function() {
//     try {
//         initNavHighlighting();
//         displayLiveDateTime('#live_datetime');
//     } catch (error) {
//         console.error('Error in navigation script:', error);
//     }
// });

// function initNavHighlighting() {
//     const currentPath = window.location.pathname;
//     const currentPage = currentPath.split('/').pop() || 'home.php';
//     const navItems = document.querySelectorAll('.nav_list a, .nav_list button');
    
//     if (navItems.length === 0) {
//         console.warn('No navigation items found');
//         return;
//     }

//     navItems.forEach(item => {
//         item.classList.remove('active');
//         item.removeAttribute('aria-current');
//     });
    
//     let foundActive = false;
    
//     navItems.forEach(item => {
//         const linkHref = item.getAttribute('href');
        
//         // Skip button (logout) - it doesn't have href, only apply to links
//         if (!linkHref) return;
        
//         const linkPage = linkHref.split('/').pop();
        
//         // Match if: page filename matches OR current page is home and link is home
//         if (linkPage === currentPage || 
//            (currentPage === 'home.php' && linkPage === 'home.html') ||
//            (currentPath.includes(linkPage) && linkPage !== 'home.html')) {
            
//             item.classList.add('active');
//             item.setAttribute('aria-current', 'page');
//             foundActive = true;
//             console.log('Nav item activated:', linkPage);
//         }
//     });
    
//     if (!foundActive) {
//         // Fallback: activate home link if no match
//         const homeLink = document.querySelector('.nav_list a[href*="Home"]');
//         if (homeLink) {
//             homeLink.classList.add('active');
//             homeLink.setAttribute('aria-current', 'page');
//             console.log('Fallback: Home link activated');
//         } else {
//             console.log('No matching nav link found for current page:', currentPage);
//         }
//     }
// }

// function displayLiveDateTime(selector = '#current-datetime') {
//     function update() {
//         const element = document.querySelector(selector);
//         if (!element) return;
        
//         const now = new Date();
//         const dateOptions = { 
//             weekday: 'short', 
//             year: 'numeric', 
//             month: 'short', 
//             day: 'numeric' 
//         };
//         const timeOptions = { 
//             hour: '2-digit', 
//             minute: '2-digit',
//             hour12: true 
//         };
        
//         const dateString = now.toLocaleDateString('en-US', dateOptions);
//         const timeString = now.toLocaleTimeString('en-US', timeOptions);
        
//         element.textContent = `${dateString} | ${timeString}`;
//         element.setAttribute('datetime', now.toISOString());
//     }
    
//     update();
//     setInterval(update, 60000);
// }

function displayLiveDateTime() {
    function update() {
        const weekdayBox = document.querySelector('.weekday-box');
        const timePart = document.querySelector('.time-part');
        const dateDisplay = document.querySelector('.date-display');
        
        if (!weekdayBox || !timePart || !dateDisplay) return;
        
        const now = new Date();
        
        // Format weekday: "Wed" (for the blue box)
        const weekdayOptions = { 
            weekday: 'short' 
        };
        const weekdayString = now.toLocaleDateString('en-US', weekdayOptions);
        
        // Format time: "03:11 AM" (for the time part)
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        // Remove the comma if present (some locales add it)
        const formattedTime = timeString.replace(',', '');
        
        // Format date: "12/03/2025"
        const dateOptions = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        };
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        // Update displays
        weekdayBox.textContent = weekdayString.toUpperCase(); // "WED" in blue box
        timePart.textContent = formattedTime; // "03:11 AM"
        dateDisplay.textContent = dateString; // "12/03/2025"
    }
    
    update();
    setInterval(update, 1000); // Update every second for smooth time changes
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        initNavHighlighting();
        displayLiveDateTime();
    } catch (error) {
        console.error('Error in navigation script:', error);
    }
});

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
        
        // Skip button (logout) - it doesn't have href, only apply to links
        if (!linkHref) return;
        
        const linkPage = linkHref.split('/').pop();
        
        // Match if: page filename matches OR current page is home and link is home
        if (linkPage === currentPage || 
           (currentPage === 'home.php' && linkPage === 'home.html') ||
           (currentPath.includes(linkPage) && linkPage !== 'home.html')) {
            
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
            foundActive = true;
            console.log('Nav item activated:', linkPage);
        }
    });
    
    if (!foundActive) {
        // Fallback: activate home link if no match
        const homeLink = document.querySelector('.nav_list a[href*="Home"]');
        if (homeLink) {
            homeLink.classList.add('active');
            homeLink.setAttribute('aria-current', 'page');
            console.log('Fallback: Home link activated');
        } else {
            console.log('No matching nav link found for current page:', currentPage);
        }
    }
}