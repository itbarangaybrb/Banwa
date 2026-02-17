/**
 * Archives a record in a specified table by sending a POST request to the server.
 * Displays a success or error message using SweetAlert and refreshes the archive list.
 *
 * @param {string} tableName - The name of the table containing the record to archive.
 * @param {number|string} recordId - The ID of the record to archive.
 */
async function archiveRecord(tableName, recordId) {
    const response = await fetch("/Banwa/server/api/shared/archive_record.php", {
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
            timer: 2000
        });

        fetchArchives();
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
 * Refreshes the archive list after restoration.
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

    const response = await fetch("/Banwa/server/api/shared/restore_record.php", {
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
            timer: 2000
        });
        fetchArchives();
    } else {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message
        });
    }
}

/**
 * Periodically fetches the latest archives every 10 seconds.
 * Ensures that only one fetch operation runs at a time to prevent overlapping requests.
 */
let archiveRefreshing = false;
setInterval(() => {
    if (archiveRefreshing) return;

    archiveRefreshing = true;

    const finish = () => { archiveRefreshing = false; };

    fetchArchives().finally(finish);

}, 10000);

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

document.addEventListener('DOMContentLoaded', fetchArchives);

/**
 * Handles user interactions for restore and archive buttons.
 * Triggers restoreRecord or archiveRecord based on the clicked button and confirms actions via SweetAlert.
 */
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('restore-btn')) {
        const archiveId = e.target.dataset.id;
        await restoreRecord(archiveId);
        return;
    }

    if (!e.target.classList.contains('delete-btn')) return;

    const userId = e.target.dataset.id;

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
});
