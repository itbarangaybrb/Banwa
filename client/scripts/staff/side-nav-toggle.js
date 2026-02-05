// Side navigation toggle with persistence and event dispatch
(function() {
    function isCollapsed() {
        return document.body.classList.contains('side-nav-collapsed');
    }

    function applyState(collapsed) {
        if (collapsed) {
            document.body.classList.add('side-nav-collapsed');
        } else {
            document.body.classList.remove('side-nav-collapsed');
        }
        // Update any toggle buttons' aria-expanded
        document.querySelectorAll('[data-side-nav-toggle]').forEach(btn => {
            try {
                btn.setAttribute('aria-expanded', (!collapsed).toString());
            } catch (e) {}
        });
        // Broadcast event for other modules
        try {
            window.dispatchEvent(new CustomEvent('sideNavToggled', { detail: { collapsed } }));
        } catch (e) {
            console.warn('sideNavToggled dispatch failed', e);
        }
    }

    function toggleSideNav() {
        const collapsed = !isCollapsed();
        applyState(collapsed);
        try {
            localStorage.setItem('sideNavCollapsed', collapsed ? '1' : '0');
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize state from localStorage
        let collapsed = false;
        try {
            const val = localStorage.getItem('sideNavCollapsed');
            if (val === '1') collapsed = true;
        } catch (e) {}
        applyState(collapsed);

        // Attach to any toggle controls
        document.querySelectorAll('[data-side-nav-toggle]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSideNav();
            });
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSideNav();
                }
            });
        });

        // Allow other code to set state via window.setSideNavCollapsed(true|false)
        try {
            window.setSideNavCollapsed = function(value) {
                applyState(Boolean(value));
                try { localStorage.setItem('sideNavCollapsed', value ? '1' : '0'); } catch (e) {}
            };
        } catch (e) {}
    });
})();
