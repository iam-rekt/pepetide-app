import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: { telegramChatId: true, telegramUsername: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            telegramConnected: !!user.telegramChatId,
            telegramUsername: user.telegramUsername,
        });
    } catch (error) {
        console.error('Error fetching user status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}
