import { initSocket, sockets } from './socketUtils.js';
import { fetchUsers } from '../staff/superadmin/manage_users.js';

/**
 * Archives a record in a specified table by sending a POST request to the server.
 * Displays a success or error message using SweetAlert and refreshes both the 
 * active users table and the archive list.
 *
 * @param {string} tableName - The name of the table containing the record to archive.
 * @param {number|string}  - The ID of the record to archive.
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
        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Archived successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        // Remove the row from the users table if we're on the users page
        const row = document
            .querySelector(`button.edit-btn[data-id="${recordId}"]`)
            ?.closest('tr');

        if (row) row.remove();

        // Refresh the archives table
        fetchArchives();

        // Also refresh the users table to ensure consistency
        if (typeof window.fetchUsers === 'function') {
            window.fetchUsers();
        }

        // Notify via WebSocket that archives have been updated
        if (sockets["archives"] && sockets["archives"].readyState === WebSocket.OPEN) {
            sockets["archives"].send(JSON.stringify({
                type: "archives_update",
                action: "archive",
                tableName: tableName,
                recordId: recordId
            }));
        }

        // Also notify users update
        if (sockets["users"] && sockets["users"].readyState === WebSocket.OPEN) {
            sockets["users"].send(JSON.stringify({
                type: "users_update",
                action: "archive",
                recordId: recordId
            }));
        }

        // Also notify audit update
        if (sockets["audit"] && sockets["audit"].readyState === WebSocket.OPEN) {
            sockets["audit"].send(JSON.stringify({
                type: "new_audit_log",
                action: "new_audit_log",
            }));
        }

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
            popup: 'swal-popup',
            title: 'swal-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
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
        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Restored successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        // Refresh the archives table
        fetchArchives();
        fetchUsers();

        // Notify via WebSocket that archives have been updated
        if (sockets["archives"] && sockets["archives"].readyState === WebSocket.OPEN) {
            sockets["archives"].send(JSON.stringify({
                type: "archives_update",
                action: "restore",
                archiveId: archiveId
            }));
        }

        // Also notify users update
        if (sockets["users"] && sockets["users"].readyState === WebSocket.OPEN) {
            sockets["users"].send(JSON.stringify({
                type: "users_update",
                action: "restore",
                archiveId: archiveId
            }));
        }

        // Also notify audit update - ADDED THIS SECTION
        if (sockets["audit"] && sockets["audit"].readyState === WebSocket.OPEN) {
            sockets["audit"].send(JSON.stringify({
                type: "new_audit_log",
                action: "new_audit_log",
            }));
        }
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
 * Handles empty results and errors gracefully by displaying appropriate messages.
 */
async function fetchArchives() {
    const tbody = document.getElementById('archiveTableBody');
    if (!tbody) return;

    try {
        const resp = await fetch('/Banwa/server/api/shared/get_archives.php', {
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
                    <button class="buttons restore-btn" data-id="${item.archive_id}">
                        Restore
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch archives:', err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error loading users</td></tr>`;
    }
}

/**
 * Handles user interactions for restore and archive buttons.
 * Triggers restoreRecord or archiveRecord based on the clicked button and confirms actions via SweetAlert.
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
                    popup: 'swal-popup',
                    title: 'swal-title',
                    confirmButton: 'swal-confirm-btn',
                    cancelButton: 'swal-cancel-btn'
                }
            });
            return;
        }

        await restoreRecord(archiveId);
        fetchArchives();
        return;
    }

    // Handle archive button clicks
    if (e.target.classList.contains('archive-btn')) {
        const userId = e.target.dataset.id;

        if (!userId || userId === 'undefined') {
            console.error('Invalid user ID:', userId);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid user ID. Please try again.',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-popup',
                    title: 'swal-title',
                    confirmButton: 'swal-confirm-btn',
                    cancelButton: 'swal-cancel-btn'
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
                popup: 'swal-popup',
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
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!sockets["archives"]) {
        initSocket("archives", "ws://localhost:8081", data => {
            if (data.type === "archives_update") fetchArchives();
        });

        fetchArchives();
    }
});
