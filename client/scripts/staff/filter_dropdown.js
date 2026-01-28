document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.staff-filter-dropdown').forEach(dropdown => {
        const btn = dropdown.querySelector('.filter-dropdown-btn');
        const menu = dropdown.querySelector('.filter-dropdown-menu');
        const items = dropdown.querySelectorAll('.filter-item');

        // Toggle menu
        btn && btn.addEventListener('click', (e) => {
            e.preventDefault();
            menu && menu.classList.toggle('show');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                menu && menu.classList.remove('show');
            }
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const type = item.dataset.type;
                const label = item.textContent.trim();

                // Update button label
                const textEl = btn.querySelector('.filter-text');
                if (textEl) textEl.textContent = label;

                // Build activeFilters object
                const activeFilters = {
                    household: false,
                    business: false,
                    construction: false,
                    utility: false
                };
                if (type && activeFilters.hasOwnProperty(type)) activeFilters[type] = true;

                // Dispatch global event
                try {
                    window.dispatchEvent(new CustomEvent('staffMapFilterChanged', { detail: { activeFilters } }));
                } catch (e) { console.warn('Failed to dispatch staffMapFilterChanged', e); }

                // Try to call map filter helpers if present
                try {
                    const normalized = type === 'utility' ? 'utility' : type;
                    if (typeof window.activateFilter === 'function') {
                        window.activateFilter(normalized);
                    } else if (typeof window.selectFilterType === 'function') {
                        window.selectFilterType(normalized);
                    } else if (typeof window.toggleMarkerType === 'function') {
                        // toggleMarkerType expects toggling; call activate instead by dispatch
                        window.toggleMarkerType(normalized);
                    }
                } catch (err) {
                    console.warn('Error invoking map helpers', err);
                }

                // Close menu
                menu && menu.classList.remove('show');
            });
        });
    });
});
