import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
        }),
    });
}

export async function GET(request: Request) {
    // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Reject anyone else
    // when the secret is configured.
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const now = new Date();

        // Find all pending/scheduled doses that are overdue
        const missedLogs = await prisma.syncedLog.findMany({
            where: {
                status: 'pending',
                scheduledDate: { lt: now },
            },
            include: {
                protocol: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Group by user to send consolidated notifications
        const userNotifications = new Map<string, { user: any; logs: typeof missedLogs }>();

        for (const log of missedLogs) {
            const userId = log.protocol.userId;
            const user = log.protocol.user;

            if (!user.telegramChatId) continue;

            if (!userNotifications.has(userId)) {
                userNotifications.set(userId, { user, logs: [] });
            }
            userNotifications.get(userId)!.logs.push(log);
        }

        // Send notifications
        let notificationsSent = 0;

        for (const [_userId, { user, logs }] of userNotifications) {
            const peptideNames = [...new Set(logs.map(l => l.protocol.peptideName))];
            const count = logs.length;

            const message = `⏰ <b>Missed Dose Reminder</b>\n\n` +
                `You have <b>${count}</b> overdue dose${count > 1 ? 's' : ''} for:\n` +
                peptideNames.map(name => `• ${name}`).join('\n') +
                `\n\n📱 Open PEPEtide to log your doses.`;

            await sendTelegramMessage(user.telegramChatId, message);
            notificationsSent++;
        }

        return NextResponse.json({
            success: true,
            notificationsSent,
            missedLogsFound: missedLogs.length,
        });
    } catch (error) {
        console.error('Cron notification error:', error);
        return NextResponse.json(
            { error: 'Failed to process notifications' },
            { status: 500 }
        );
    }
}
