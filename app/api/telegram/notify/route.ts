import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

async function sendTelegramMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
        return false;
    }
}

/**
 * Send a notification to a user via Telegram
 * Called from the client when a missed dose is detected
 */
export async function POST(request: Request) {
    try {
        const { userId, message } = await request.json();

        if (!userId || !message) {
            return NextResponse.json(
                { error: 'userId and message required' },
                { status: 400 }
            );
        }

        // Get user's Telegram chat ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramChatId: true }
        });

        if (!user || !user.telegramChatId) {
            return NextResponse.json(
                { error: 'User not found or Telegram not connected' },
                { status: 404 }
            );
        }

        // Send the message
        const sent = await sendTelegramMessage(user.telegramChatId, message);

        if (!sent) {
            return NextResponse.json(
                { error: 'Failed to send message' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Telegram notify error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
