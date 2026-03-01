/**
 * Makes a table sortable by clicking on its header cells.
 *
 * @param {string} tableId - The ID of the table to make sortable.
 *
 * @description
 * Clicking a header cell with an ID sorts the table rows by that column.
 * Sorting toggles between ascending and descending order each click.
 */
export function makeTableSortable(tableId) {
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

            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));

            asc = !asc;
        });
    });
}