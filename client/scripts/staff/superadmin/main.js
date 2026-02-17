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

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.querySelector('[data-modal="exportUsers"]');
    exportBtn.addEventListener('click', () => {
        exportTableAsPDF('usersTable', 'users_export.pdf');
    });
});

let isRefreshing = false;
setInterval(() => {
    if (isRefreshing) return;

    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    fetchAuditLogs().finally(finish); // call your existing fetch function

}, 10000);

/**
 * Fetch audit logs from the server and render them into the audit table
 * @async
 * @returns {Promise<void>}
 */
async function fetchAuditLogs() {
    try {
        const resp = await fetch('/Banwa/server/api/shared/get_audit_logs.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        const logs = await resp.json();

        if (!Array.isArray(logs)) {
            console.error('Invalid audit log response');
            return;
        }

        console.log('Audit Logs:', logs);

        // Example: render to table
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${log.id}</td>
                <td>${log.action}</td>
                <td>${log.full_name}</td>
                <td>${log.table_name}</td>
                <td>${log.record_id}</td>
                <td>${log.role_id}</td>
                <td>${log.created_at}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchAuditLogs());

/**
 * Initializes table search filtering
 * Filters by ID, name, email, and role
 */
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const tbody = document.getElementById('usersTableBody') || document.getElementById('auditTableBody');

    if (!searchInput || !tbody) return;

    searchInput.addEventListener('change', () => {
        const keyword = searchInput.value.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;

        // Remove existing "No users found" row
        const existingNoUsersRow = tbody.querySelector('.no-users-row');
        if (existingNoUsersRow) {
            tbody.removeChild(existingNoUsersRow);
        }

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return; // skip non-data rows

            const rowText = Array.from(cells)
                .map(td => td.textContent.toLowerCase())
                .join(' ');

            if (rowText.includes(keyword)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // If no rows visible, show "No users found"
        if (visibleCount === 0) {
            const tr = document.createElement('tr');
            tr.classList.add('no-users-row');
            tr.innerHTML = `<td colspan="6" style="text-align:center;">No users found</td>`;
            tbody.appendChild(tr);
        }
    });
}

document.addEventListener('DOMContentLoaded', handleSearch());