import { exportTableAsPDF } from "../../scripts/utils/exportAs.js";

/**
 * Initialize export button for applications table
 * Binds click event to trigger PDF export
 *
 * @returns {void}
 */
function initExportButton() {
    const exportBtn = document.querySelector('[data-modal="exportApplicationsTable"]');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        exportTableAsPDF('applicationsTable', 'applicationsTable_export.pdf');
    });
}

document.addEventListener('DOMContentLoaded', initExportButton);