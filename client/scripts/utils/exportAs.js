/**
 * Export table data as PDF using jsPDF in landscape mode
 * @param {string} tableId - ID of the table
 * @param {string} filename - Output file name
 */
export function exportTableAsPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
    });

    const table = document.getElementById(tableId);
    if (!table) return alert('Table not found');

    const headerRow = table.querySelector('thead tr');
    const headers = Array.from(headerRow.querySelectorAll('th'));
    const actionsIndex = headers.findIndex(th =>
        th.innerText.trim().toLowerCase() === 'actions'
    );

    const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('th, td'))
            .filter((cell, index) => index !== actionsIndex)
            .map(cell => cell.innerText)
    );

    doc.autoTable({
        head: [rows[0]],
        body: rows.slice(1),
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 }
    });

    doc.save(filename);
}
