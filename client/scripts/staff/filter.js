import { initTableFilter } from '../utils/tables_filter.js';

/**
 * Initializes table filtering on DOM load.
 *
 * @description
 * Calls `initTableFilter` for the table with ID 'tableBody', 
 * applying a filter on the 'Status' column using the select element with ID 'statusApplications'.
 */
document.addEventListener('DOMContentLoaded', () => {
    initTableFilter({
        tableBodyId: 'tableBody',
        selectFilters: [
            { selectId: 'statusApplications', columnName: 'Status' }
        ]
    });
});
