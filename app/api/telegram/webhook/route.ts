import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string | number, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    });
}

export async function POST(request: Request) {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    try {
        const update = await request.json();

        // Check for message
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const username = update.message.from.username;

            // Check for /start command
            if (text.startsWith('/start')) {
                const parts = text.split(' ');

                // If there's a payload (the UUID)
                if (parts.length > 1) {
                    const userId = parts[1];

                    console.log(`[Telegram] Attempting to link userId: ${userId} with chatId: ${chatId}`);

                    // Verify user exists
                    const user = await prisma.user.findUnique({
                        where: { id: userId }
                    });

                    if (user) {
                        console.log(`[Telegram] User found, updating with chatId: ${chatId}`);

                        // Update user with Telegram info
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                telegramChatId: chatId.toString(),
                                telegramUsername: username
                            }
                        });

                        await sendTelegramMessage(chatId, "✅ Successfully connected to PEPEtide!\n\nYou will now receive reminders for your missed peptide doses.\n\nUse /disconnect to unlink at any time.");
                    } else {
                        console.error(`[Telegram] User not found for userId: ${userId}`);
                        await sendTelegramMessage(chatId, `❌ Invalid connection code.\n\nPlease try linking again from the app settings.\n\nDebug: User ID ${userId.substring(0, 8)}... not found in database.`);
                    }
                } else {
                    await sendTelegramMessage(chatId, "Welcome to PEPEtide Bot! 🐸\n\nPlease use the link from the app settings to connect your account.\n\nCommands:\n/start <code> — Link your account\n/disconnect — Unlink this chat\n/help — Show this menu");
                }
            } else if (text.startsWith('/disconnect')) {
                // Find user(s) linked to this chatId and unlink them
                const linkedUsers = await prisma.user.findMany({
                    where: { telegramChatId: chatId.toString() }
                });

                if (linkedUsers.length === 0) {
                    await sendTelegramMessage(chatId, "ℹ️ No linked PEPEtide account found for this chat.\n\nIf you meant to connect, use the link from the app settings.");
                } else {
                    await prisma.user.updateMany({
                        where: { telegramChatId: chatId.toString() },
                        data: { telegramChatId: null, telegramUsername: null }
                    });
                    await sendTelegramMessage(chatId, "✅ Disconnected. You will no longer receive PEPEtide reminders.\n\nReconnect any time from the app settings.");
                }
            } else if (text.startsWith('/help')) {
                await sendTelegramMessage(chatId, "PEPEtide Bot — peptide dose reminders 🐸\n\nCommands:\n/start <code> — Link your account (use the link from the app)\n/disconnect — Unlink this chat\n/help — Show this menu");
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
