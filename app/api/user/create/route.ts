import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

export async function POST() {
    try {
        const user = await prisma.user.create({
            data: {
                timezone: 'UTC', // Default, should ideally be passed from client
            },
        });

        return NextResponse.json({ userId: user.id });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
