import { getActiveProtocols, getDoseLogs } from './db';

export async function syncData() {
    const userId = localStorage.getItem('pepetide_user_id');
    if (!userId) return;

    try {
        const protocols = await getActiveProtocols();
        const logs = await getDoseLogs();

        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                protocols,
                logs
            })
        });

        console.log('Data synced successfully');
    } catch (error) {
        console.error('Sync failed:', error);
    }
}
