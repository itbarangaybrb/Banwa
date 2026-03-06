/**
 * Sets up filtering for a table using select dropdowns and sorts by ID.
 *
 * @param {Object} options - Configuration for the filter.
 * @param {string} options.tableBodyId - ID of the table's tbody to filter.
 * @param {Array<{selectId: string, columnName: string}>} [options.selectFilters=[]] 
 *        Filters with select element IDs and corresponding column names.
 */
export function initTableFilter({
    tableBodyId,
    selectFilters = [] // [{selectId, columnName}]
}) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error('Table body not found:', tableBodyId);
        return;
    }

    // Get the table and header cells
    const table = tableBody.closest('table');
    if (!table) {
        console.error('Table element not found for tbody:', tableBodyId);
        return;
    }

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().toLowerCase());

    const idColumnIndex = headers.indexOf('id');
    if (idColumnIndex === -1) {
        console.warn('ID column not found.');
    }

    function filterTable() {
        const rows = Array.from(tableBody.querySelectorAll('tr'));

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (!cells.length) return;

            let isVisible = true;

            selectFilters.forEach(filter => {
                const select = document.getElementById(filter.selectId);
                if (!select) return;

                const filterValue = select.value.toLowerCase();
                if (!filterValue) return;

                const columnIndex = headers.indexOf(filter.columnName.toLowerCase());
                if (columnIndex === -1) return;

                const cellText = cells[columnIndex]?.innerText.toLowerCase();
                if (cellText !== filterValue) {
                    isVisible = false;
                }
            });

            row.style.display = isVisible ? '' : 'none';
        });

        if (idColumnIndex !== -1) {
            const visibleRows = Array.from(tableBody.querySelectorAll('tr'))
                .filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const aId = parseInt(a.children[idColumnIndex]?.innerText) || 0;
                const bId = parseInt(b.children[idColumnIndex]?.innerText) || 0;
                return aId - bId; // ascending = FIFO
            });

            visibleRows.forEach(row => tableBody.appendChild(row));
        }
    }

    selectFilters.forEach(filter => {
        const select = document.getElementById(filter.selectId);
        select?.addEventListener('change', filterTable);
    });
}
