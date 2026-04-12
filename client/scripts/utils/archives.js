import { initSocket, sockets } from './socket.js';
import { fetchUsers } from '../staff/superadmin/manage_users.js';

const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    /* Universal Popup Spacing */
    .archive-swal2-popup {
        padding: 2rem 1.5rem !important; 
        border-radius: 15px !important;
        display: flex !important;
        flex-direction: column !important;
    }

    /* Consistent Icon Margins for Success/Error/Warning */
    .archive-swal2-popup .swal2-icon {
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        border-width: 4px !important;
    }

    /* Standardized Titles */
    .archive-swal2-popup .swal2-title {
        color: #00247C !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        margin: 0.5rem 0 !important;
        padding: 0 !important;
    }

    /* Standardized Text Content */
    .archive-swal2-popup .swal2-html-container {
        margin: 1rem 0 !important;
        font-size: 1.05rem !important;
        color: #555 !important;
        text-align: center !important;
    }

    /* Button Spacing */
    .archive-swal2-popup .swal2-actions {
        gap: 4px;
    }

    .archive-swal2-popup .swal2-actions button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
    }

    .archive-swal2-popup .swal2-actions .swal2-confirm {
        background: #00247c !important;
        color: white;
    }

    .archive-swal2-popup .swal2-actions .swal2-cancel {
        background: #ecf0f1 !important;
        color: #333;
    }
`;
document.head.appendChild(swalStyle);

/**
 * Archives a record in a specified table by sending a POST request to the server.
 * Displays a success or error message using SweetAlert and refreshes both the 
 * active users table and the archive list.
 *
 * @param {string} tableName - The name of the table containing the record to archive.
 * @param {number|string} recordId - The ID of the record to archive.
 */
export async function archiveRecord(tableName, recordId) {
    const response = await fetch("/server/api/shared/archive_record.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            table_name: tableName,
            record_id: recordId
        })
    });

    const data = await response.json();

    if (data.success) {
        const socket = sockets["main"];
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "archives_update",
                action: "archive",
                tableName: tableName,
                recordId: recordId
            }));
        }

        const row = document
            .querySelector(`button.edit-btn[data-id="${recordId}"]`)
            ?.closest('tr');

        if (row) row.remove();

        fetchArchives();

        if (typeof window.fetchUsers === 'function') {
            window.fetchUsers();
        }

        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Archived successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message
        });
    }
}

/**
 * Restores an archived record by sending a POST request to the server.
 * Confirms the action with the user and displays a success or error message.
 * Refreshes both the archive list and users table after restoration.
 *
 * @param {number|string} archiveId - The ID of the archive record to restore.
 */
async function restoreRecord(archiveId) {
    const confirmResult = await Swal.fire({
        title: 'Restore this record?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, restore it',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            popup: 'archive-swal2-popup'
        }
    });

    if (!confirmResult.isConfirmed) return;

    const response = await fetch("/server/api/shared/restore_record.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            archive_id: archiveId
        })
    });

    const data = await response.json();

    if (data.success) {
        const socket = sockets["main"];
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "archives_update",
                action: "restore",
                archiveId: archiveId
            }));
        }

        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Restored successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        fetchArchives();
        fetchUsers();
    } else {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message
        });
    }
}

/**
 * Fetches all archived records from the server and populates the archive table in the DOM.
 */
async function fetchArchives() {
    const tbody = document.getElementById('archiveTableBody');
    if (!tbody) return;

    try {
        const resp = await fetch('/server/api/shared/get_archives.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        const archives = await resp.json();
        tbody.innerHTML = '';

        if (!Array.isArray(archives) || archives.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No archives found</td></tr>`;
            return;
        }

        archives.forEach(item => {
            const tr = document.createElement('tr');
            const isRestored = item.restored_at && item.restored_at !== 'Not restored' && item.restored_at !== null;
            const restoreButton = !isRestored
                ? `<button class="btn buttons restore-btn" data-id="${item.archive_id}">Restore</button>`
                : '<span style="color:#28a745; font-weight:500;">Restored</span>';

            tr.innerHTML = `
                <td>${item.archive_id}</td>
                <td>${item.table_name}</td>
                <td>${item.record_id}</td>
                <td>${item.full_name || ''}</td>
                <td>${item.email || ''}</td>
                <td>${item.archived_at}</td>
                <td>${item.restored_at || 'Not restored'}</td>
                <td>${item.role_id || ''}</td>
                <td>
                    ${restoreButton}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch archives:', err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error loading archives</td></tr>`;
    }
}

/**
 * Handles user interactions for restore and archive buttons.
 * FIX: archive-btn handler now checks data-table and only processes
 * "users" table archives. Other tables (e.g. utility_applications)
 * are handled by their own module's click listener.
 */
document.addEventListener('click', async (e) => {
    // Handle restore button clicks
    if (e.target.classList.contains('restore-btn')) {
        const archiveId = e.target.dataset.id;

        if (!archiveId || archiveId === 'undefined') {
            console.error('Invalid archive ID:', archiveId);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid archive ID. Please try again.',
                buttonsStyling: false,
                customClass: {
                    popup: 'archive-swal2-popup'
                }
            });
            return;
        }

        await restoreRecord(archiveId);
        fetchArchives();
        return;
    }

    if (e.target.classList.contains('archive-btn')) {
        const tableName = e.target.dataset.table || 'users';
        if (tableName !== 'users') return;

        const userId = e.target.dataset.id;

        if (!userId || userId === 'undefined') {
            console.error('Invalid user ID:', userId);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid user ID. Please try again.',
                buttonsStyling: false,
                customClass: {
                    popup: 'archive-swal2-popup'
                }
            });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: 'This user will be archived.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, archive it',
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: {
                popup: 'archive-swal2-popup',
                title: 'swal-title',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            }
        });

        if (!confirmResult.isConfirmed) return;

        await archiveRecord('users', userId);
        fetchArchives();
        return;
    }
});

/**
 * Initializes WebSocket connection and fetches archives on page load.
 * Uses a single "main" socket with a switch statement — consistent with utilities.js.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchArchives();

    initSocket("main", "http://localhost:8081", (data) => {
        switch (data.type) {
            case "archives_update":
                fetchArchives();
                break;
            case "users_update":
                if (typeof window.fetchUsers === 'function') {
                    window.fetchUsers();
                }
                break;
            case "business_applications_update":
            case "construction_applications_update":
            case "utility_applications_update":
            case "incident_report_applications_update":
            case "finance_applications_update":
                fetchArchives();
                break;
        }
    });
});