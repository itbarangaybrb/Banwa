const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');
const nav = document.getElementById('sideNav');

// Initial state
nav.classList.remove('open');
openMenu.style.display = 'inline-flex';
closeMenu.style.display = 'none';

openMenu.addEventListener('click', () => {
    nav.classList.add('open');
    openMenu.style.display = 'none';
    closeMenu.style.display = 'inline-flex';
});

closeMenu.addEventListener('click', () => {
    nav.classList.remove('open');
    closeMenu.style.display = 'none';
    openMenu.style.display = 'inline-flex';
});

window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "none";
});

document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    const submit = e.target.closest("button[type=submit]");
    const loader = document.getElementById("page-loader");

    if (
        loader &&
        link &&
        link.href &&
        !link.target &&
        !link.href.startsWith("javascript:") &&
        link.href.includes("#") &&
        document.getElementById("page-loader")
    ) {
        loader.style.display = "flex";
    }
});

document.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;

    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "flex";
});

/**
 * Export table data as PDF using jsPDF in landscape mode
 * @param {string} tableId - ID of the table
 * @param {string} filename - Output file name
 */
function exportTableAsPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    // Create PDF in landscape orientation
    const doc = new jsPDF({
        orientation: 'landscape', // change from default 'portrait'
        unit: 'pt',
        format: 'a4'
    });

    const table = document.getElementById(tableId);
    if (!table) return alert('Table not found');

    // Map rows, skip action buttons column
    const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('th, td'))
            .slice(0, -1) // exclude last column (actions)
            .map(cell => cell.innerText)
    );

    // Add table to PDF
    doc.autoTable({
        head: [rows[0]], // table header
        body: rows.slice(1), // table body
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 }
    });

    doc.save(filename);
}