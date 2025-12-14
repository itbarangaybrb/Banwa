async function loadApplications() {
    try {
        const res = await fetch('/Banwa/server/api/resident/get_applications.php');
        const data = await res.json();

        const container = document.getElementById('applicationStatus');
        container.innerHTML = '';

        if (data.error) {
            container.innerText = data.error;
            return;
        }

        if (!data.success || !Array.isArray(data.applications) || data.applications.length === 0) {
            container.innerText = 'No applications found.';
            return;
        }

        // TODO:
        // Front-end developer, add edit action if the status is === additional requirement ... - jep
        data.applications
            .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)) // newest first
            .forEach(app => {
                const div = document.createElement('div');
                div.className = 'application-card';
                const remarks = app.approval_comments && app.approval_comments.trim() !== ''
                    ? `<p>Remarks: ${app.approval_comments}</p>`
                    : '';
                const fullname = `${app.first_name} ${app.first_name} ${app.last_name}` || "No Name";
                div.innerHTML = `
            <h3>${fullname}</h3>
            <p>Status: ${app.status || 'Pending'}</p>
            <p>Submitted: ${app.request_date || 'N/A'}</p>
            <p>Type: ${app.type || 'N/A'}</p>
            ${remarks}
        `;
                container.appendChild(div);
            });

    } catch (err) {
        console.error('Error loading applications:', err);
        document.getElementById('applicationStatus').innerText = 'Failed to load applications.';
    }
}

document.addEventListener('DOMContentLoaded', loadApplications);