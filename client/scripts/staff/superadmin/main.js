
import { initSocket, sockets } from '../../utils/socketUtils.js';
import { exportTableAsPDF } from '../../utils/exportAs.js';

/**
 * Initialize side navigation toggle controls
 * Handles open and close menu button behavior
 */
const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');
const nav = document.getElementById('sideNav');

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

/**
 * Hide page loader after full window load
 * Ensures loader is removed when all resources are ready
 */
window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "none";
});


/**
 * Display page loader when navigating via anchor links
 * Prevents interaction during page transition
 */
document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    // const submit = e.target.closest("button[type=submit]");
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

/**
 * Display page loader on form submission
 * Ensures loader appears unless submission is prevented
 */
document.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;

    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "flex";
});

/**
 * Initialize export button for users table
 * Binds click event to trigger PDF export
 *
 * @returns {void}
 */
function initExportButton() {
    const exportBtn = document.querySelector('[data-modal="exportUsers"]');
    if (!exportBtn) return;
    exportBtn.addEventListener('click', () => {
        exportTableAsPDF('usersTable', 'users_export.pdf');
    });
}

/**
 * Fetch audit logs from the server
 * Clears and re-renders the entire audit table
 *
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

/**
 * Append a new audit log row to the top of the audit table
 * Prevents duplicate rows based on log ID
 *
 * @param {Object} log - Audit log object
 * @param {number|string} log.id - Unique log identifier
 * @returns {void}
 */
function appendAuditRow(log) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (document.getElementById(`audit-${log.id}`)) return; // skip if already exists

    const tr = document.createElement('tr');
    tr.id = `audit-${log.id}`;

    tr.innerHTML = `
        <td>${log.id}</td>
        <td>${log.action}</td>
        <td>${log.full_name}</td>
        <td>${log.table_name}</td>
        <td>${log.record_id}</td>
        <td>${log.role_id}</td>
        <td>${log.created_at}</td>
    `;

    tbody.prepend(tr);
}

/**
 * Initializes table search filtering
 * Filters by ID, name, email, and role
 * @returns {void}
 */
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const tbody = document.getElementById('usersTableBody') || document.getElementById('auditTableBody') || document.getElementById('archiveTableBody');

    if (!searchInput || !tbody) return;

    searchInput.addEventListener('change', () => {
        const keyword = searchInput.value.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;

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

        if (visibleCount === 0) {
            const tr = document.createElement('tr');
            tr.classList.add('no-users-row');
            tr.innerHTML = `<td colspan="6" style="text-align:center;">No users found</td>`;
            tbody.appendChild(tr);
        }
    });
}

function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th');
    headers.forEach((th, index) => {
        if (!th.id) return;

        let asc = true;

        th.addEventListener('click', () => {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            rows.sort((a, b) => {
                const cellA = a.children[index].textContent.trim().toLowerCase();
                const cellB = b.children[index].textContent.trim().toLowerCase();

                if (cellA < cellB) return asc ? -1 : 1;
                if (cellA > cellB) return asc ? 1 : -1;
                return 0;
            });

            // Remove existing rows and append sorted
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));

            asc = !asc; // toggle sort order

            // Optionally toggle arrow icon
            const img = th.querySelector('img');
            if (img) {
                img.style.transform = asc ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });
}

/**
 * Initialize page features after DOM is fully loaded
 * - Fetch initial audit log snapshot
 * - Setup search filtering
 * - Initialize PDF export button
 * - Initialize WebSocket connection for real-time audit updates
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchAuditLogs();
    handleSearch();
    initExportButton();

    if (!sockets["audit"]) {
        initSocket("audit", "ws://localhost:8081", (data) => {
            if (data.type === "new_audit_log") {
                if (data.payload) {
                    appendAuditRow(data.payload);
                }
                else if (data.id) {
                    appendAuditRow(data);
                }
                else {
                    fetchAuditLogs()
                }
            }
        });
    }

    makeTableSortable('usersTable');
    makeTableSortable('auditTable');
    makeTableSortable('archiveTable');
});