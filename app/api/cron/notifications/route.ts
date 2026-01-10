import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

// Simple helper to send TG message (duplicated for now to keep independent)
async function sendTelegramMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    });
}

export async function GET() {
    // Verify cron secret if needed (omitted for simple MVP)

    try {
        const now = new Date();
        // Check for missed doses: scheduled in the past 24 hours, still pending
        // We only check past 15 mins to avoid spamming for old missed doses on every run
        const windowStart = new Date(now.getTime() - 15 * 60 * 1000);

        const missedLogs = await prisma.syncedLog.findMany({
            where: {
                status: 'pending',
                scheduledDate: {
                    lt: now,
                    gt: windowStart
                },
                protocol: {
                    user: {
                        telegramChatId: {
                            not: null
                        }
                    }
                }
            },
            include: {
                protocol: {
                    include: {
                        user: true
                    }
                }
            }
        });

        for (const log of missedLogs) {
            if (log.protocol.user.telegramChatId) {
                const timeStr = log.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const msg = `⚠️ **Missed Dose Alert**\n\nYou were scheduled to take **${log.protocol.peptideName}** around ${timeStr}.\n\nDon't forget to log it!`;

                await sendTelegramMessage(log.protocol.user.telegramChatId, msg);

                // Mark as notified? Or just leave as scheduled.
                // Ideally we'd have a 'notified' flag. For MVP, we rely on the 15min window 
                // to prevent double sending (CRON should run every 10-15 mins).
            }
        }

        return NextResponse.json({ processed: missedLogs.length });
    } catch (error) {
        console.error('Notification cron error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
