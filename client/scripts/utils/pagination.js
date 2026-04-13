/**
 * Creates a pagination controller that renders navigation controls into a DOM container.
 *
 * @param {object} options
 * @param {string} options.containerId       - Target DOM element ID for pagination controls.
 * @param {number} [options.pageSize=10]     - Items per page.
 * @param {number} [options.windowSize=5]    - Max visible page buttons.
 */
export function createPaginator({ containerId, pageSize = 10, windowSize = 5 }) {
    let allItems = [];
    let currentPage = 1;
    let onRenderCallback = null;

    function getContainer() {
        return document.getElementById(containerId);
    }

    function totalPages() {
        return Math.ceil(allItems.length / pageSize);
    }

    function getPage(page) {
        const start = (page - 1) * pageSize;
        return allItems.slice(start, start + pageSize);
    }

    function render() {
        const container = getContainer();
        if (!container) return;

        const total = totalPages();
        if (total <= 1) { container.innerHTML = ''; return; }

        const half = Math.floor(windowSize / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(total, start + windowSize - 1);

        // Adjust start if end hits the ceiling
        if (end - start + 1 < windowSize) {
            start = Math.max(1, end - windowSize + 1);
        }

        const buttons = [];

        // Prev
        buttons.push(btn('Previous', currentPage - 1, currentPage === 1));

        // First + ellipsis
        if (start > 1) {
            buttons.push(btn(1, 1));
            if (start > 2) buttons.push(ellipsis('left'));
        }

        // Page window
        for (let i = start; i <= end; i++) {
            buttons.push(btn(i, i, false, i === currentPage));
        }

        // Ellipsis + last
        if (end < total) {
            if (end < total - 1) buttons.push(ellipsis('right'));
            buttons.push(btn(total, total));
        }

        // Next
        buttons.push(btn('Next', currentPage + 1, currentPage === total));

        container.innerHTML = '';
        buttons.forEach(el => container.appendChild(el));
    }

    function btn(label, page, disabled = false, active = false) {
        const el = document.createElement('button');
        el.textContent = label;
        el.className = ['paginator-btn', active ? 'active' : '', disabled ? 'disabled' : ''].join(' ').trim();
        el.disabled = disabled;
        if (!disabled && !active) {
            el.addEventListener('click', () => goTo(page));
        }
        return el;
    }

    function ellipsis() {
        const el = document.createElement('span');
        el.textContent = '…';
        el.className = 'paginator-ellipsis';
        return el;
    }

    function goTo(page) {
        const total = totalPages();
        if (page < 1 || page > total) return;
        currentPage = page;
        render();
        if (onRenderCallback) onRenderCallback(getPage(currentPage), currentPage, total);
    }

    return {
        /**
         * Load data and jump to page 1
         * @param {Array} items - full dataset
         */
        load(items) {
            allItems = items;
            currentPage = 1;
            render();
            if (onRenderCallback) onRenderCallback(getPage(1), 1, totalPages());
        },

        /**
         * Register render callback — fires on every page change
         * @param {Function} fn - (pageItems, currentPage, totalPages) => void
         */
        onPage(fn) {
            onRenderCallback = fn;
            return this;
        }
    };
}