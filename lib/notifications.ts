import { getDoseLogs } from './db';

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Client-side notification checker
 * Runs when the app is open to check for missed doses
 */
export async function checkMissedDoses() {
    try {
        const logs = await getDoseLogs();
        const now = new Date();

        // Get all overdue pending doses (no time window restriction)
        const missedDoses = logs.filter(log => {
            const scheduledDate = new Date(log.scheduledDate);
            return (
                log.status === 'pending' &&
                scheduledDate < now
            );
        });

        // Show browser notifications for missed doses
        if (missedDoses.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            for (const dose of missedDoses) {
                const timeStr = new Date(dose.scheduledDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Browser notification
                new Notification(`Missed Dose: ${dose.peptideName}`, {
                    body: `You were scheduled to take this around ${timeStr}. Don't forget to log it!`,
                    icon: '/pwaicon.png',
                    tag: `dose-${dose.id}`,
                    requireInteraction: true,
                });

                // Also send Telegram notification if user is connected
                sendTelegramNotification(dose.peptideName, new Date(dose.scheduledDate))
                    .catch(err => console.error('Telegram notification failed:', err));
            }
        }

        return missedDoses;
    } catch (error) {
        console.error('Error checking missed doses:', error);
        return [];
    }
}

/**
 * Schedule periodic checks for missed doses
 * Call this when the app mounts
 */
export function startMissedDoseChecker() {
    // Check immediately
    checkMissedDoses();

    // Then check every 5 minutes
    const intervalId = setInterval(checkMissedDoses, 5 * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(intervalId);
}

/**
 * Send Telegram notification for a missed dose
 * Only called when user explicitly enables Telegram
 */
export async function sendTelegramNotification(peptideName: string, scheduledTime: Date) {
    const userId = localStorage.getItem('pepetide_user_id');
    if (!userId) return;

    try {
        const timeStr = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = scheduledTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

        // Format message with MarkdownV2 and emojis
        const message = `
⚠️ *Missed Dose Alert*

💊 *Peptide:* ${escapeMarkdown(peptideName)}
🕐 *Scheduled:* ${escapeMarkdown(`${dateStr} at ${timeStr}`)}

Don't forget to log it\\!
        `.trim();

        await fetch('/api/telegram/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                message
            })
        });
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}
