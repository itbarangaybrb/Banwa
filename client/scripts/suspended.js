import { initSocket } from '/client/scripts/utils/socketUtils.js';

initSocket('suspension_check', 'ws://localhost:8081', async (data) => {
    if (data.type === 'users_update') {
        const resp = await fetch('/server/api/shared/check_suspension_status.php', {
            credentials: 'include'
        });
        const result = await resp.json();
        if (result.status !== 'suspended') {
            window.location.href = '/client/index.php';
        }
    }
});