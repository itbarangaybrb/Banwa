import { initTableFilter } from '../utils/tables_filter.js';

/**
 * Initializes table filtering on DOM load.
 *
 * @description
 * Calls `initTableFilter` for the table with ID 'tableBody', 
 * applying a filter on the 'Status' column using the select element with ID 'statusApplications'.
 */
document.addEventListener('DOMContentLoaded', () => {
    const tableBodyId =
        document.getElementById('tableBody')
            ? 'tableBody'
            : document.getElementById('pendingTable')
                ? 'pendingTable'
                : null;

    if (!tableBodyId) return;

    initTableFilter({
        tableBodyId,
        selectFilters: [
            { selectId: 'statusApplications', columnName: 'Status' }
        ]
    });
});