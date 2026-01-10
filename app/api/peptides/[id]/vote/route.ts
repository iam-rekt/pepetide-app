import { NextRequest, NextResponse } from 'next/server';
import prisma, { isDatabaseConfigured } from '@/lib/db-postgres';
import { headers } from 'next/headers';

// POST - Vote on a peptide (upvote/downvote)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { vote_type } = body;

    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    // Use IP address as user identifier (hashed for privacy)
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    const userIdentifier = Buffer.from(ip).toString('base64');

    // Check if peptide exists
    const peptide = await prisma.communityPeptide.findUnique({
      where: { id },
    });

    if (!peptide) {
      return NextResponse.json(
        { error: 'Peptide not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await prisma.peptideVote.findUnique({
      where: {
        peptideId_userIdentifier: {
          peptideId: id,
          userIdentifier,
        },
      },
    });

    if (existingVote) {
      // User already voted - update vote if different
      if (existingVote.voteType !== vote_type) {
        const oldField = existingVote.voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const newField = vote_type === 'upvote' ? 'upvotes' : 'downvotes';

        await prisma.$transaction([
          prisma.peptideVote.update({
            where: { id: existingVote.id },
            data: { voteType: vote_type },
          }),
          prisma.communityPeptide.update({
            where: { id },
            data: {
              [oldField]: { decrement: 1 },
              [newField]: { increment: 1 },
            },
          }),
        ]);

        return NextResponse.json({ message: 'Vote updated', vote_type });
      } else {
        return NextResponse.json({ message: 'Already voted', vote_type });
      }
    } else {
      // New vote
      const field = vote_type === 'upvote' ? 'upvotes' : 'downvotes';

      await prisma.$transaction([
        prisma.peptideVote.create({
          data: {
            peptideId: id,
            userIdentifier,
            voteType: vote_type,
          },
        }),
        prisma.communityPeptide.update({
          where: { id },
          data: { [field]: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ message: 'Vote recorded', vote_type });
    }
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { error: 'Failed to record vote', details: String(error) },
      { status: 500 }
    );
  }
}
