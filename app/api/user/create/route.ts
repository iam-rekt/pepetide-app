import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

export async function POST() {
    try {
        console.log('Creating new user...');
        const user = await prisma.user.create({
            data: {
                timezone: 'UTC', // Default, should ideally be passed from client
            },
        });

        console.log('User created:', user.id);
        return NextResponse.json({ userId: user.id });
    } catch (error) {
        console.error('Error creating user:', error);

        // More detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Full error:', errorMessage);

        return NextResponse.json(
            {
                error: 'Failed to create user',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}
