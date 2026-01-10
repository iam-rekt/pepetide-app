import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-postgres';

export async function POST(request: Request) {
    try {
        const { userId, protocols, logs } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Upsert Protocols
        if (protocols && Array.isArray(protocols)) {
            for (const p of protocols) {
                await prisma.syncedProtocol.upsert({
                    where: {
                        userId_localId: {
                            userId,
                            localId: p.id
                        }
                    },
                    update: {
                        peptideName: p.peptideName,
                        otherPeptides: [], // Handle stacks later if needed
                        frequency: p.frequency,
                        doseAmount: p.targetDose,
                        doseUnit: p.targetDoseUnit,
                        timeOfDay: p.timeOfDay || 'anytime',
                        startDate: new Date(p.startDate),
                        isActive: p.isActive,
                    },
                    create: {
                        userId,
                        localId: p.id,
                        peptideName: p.peptideName,
                        otherPeptides: [],
                        frequency: p.frequency,
                        doseAmount: p.targetDose,
                        doseUnit: p.targetDoseUnit,
                        timeOfDay: p.timeOfDay || 'anytime',
                        startDate: new Date(p.startDate),
                        isActive: p.isActive,
                    }
                });
            }
        }

        // Upsert Logs (active only, or recent)
        if (logs && Array.isArray(logs)) {
            for (const log of logs) {
                // Find corresponding synced protocol to link
                const syncedProtocol = await prisma.syncedProtocol.findUnique({
                    where: {
                        userId_localId: {
                            userId,
                            localId: log.protocolId
                        }
                    }
                });

                if (syncedProtocol) {
                    await prisma.syncedLog.upsert({
                        where: {
                            syncedProtocolId_localId: {
                                syncedProtocolId: syncedProtocol.id,
                                localId: log.id
                            }
                        },
                        update: {
                            status: log.status,
                            takenAt: log.actualDate ? new Date(log.actualDate) : null,
                        },
                        create: {
                            syncedProtocolId: syncedProtocol.id,
                            localId: log.id,
                            scheduledDate: new Date(log.scheduledDate),
                            status: log.status,
                            takenAt: log.actualDate ? new Date(log.actualDate) : null,
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
