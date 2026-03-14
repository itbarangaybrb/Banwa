const CHECK_INTERVAL = 30000;

async function checkSuspensionStatus() {
    try {
        const res = await fetch('/server/api/staff/superadmin/check_suspension_status.php', {
            credentials: 'same-origin'
        });
        const data = await res.json();

        if (!data.suspended) {
            window.location.href = '/client/pages/resident/home.php';
        }
    } catch (err) {
        console.error('Suspension check failed:', err);
    }
}

setInterval(checkSuspensionStatus, CHECK_INTERVAL);
