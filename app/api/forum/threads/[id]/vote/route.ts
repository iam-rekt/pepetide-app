import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';

// GET - Get user's vote for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ voteType: null, configured: false });
  }

  try {
    const { id } = await params;

    // Get user identifier (hash IP for privacy)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userIdentifier = await hashIP(ip);

    const vote = await prisma.forumVote.findFirst({
      where: {
        targetId: id,
        targetType: 'thread',
        userIdentifier
      }
    });

    return NextResponse.json({ voteType: vote?.voteType || null });
  } catch (error) {
    console.error('Error fetching vote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Vote on a thread
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
    const { voteType } = body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Valid voteType is required (upvote or downvote)' },
        { status: 400 }
      );
    }

    // Get user identifier (hash IP for privacy)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userIdentifier = await hashIP(ip);

    // Check for existing vote
    const existingVote = await prisma.forumVote.findFirst({
      where: {
        targetId: id,
        targetType: 'thread',
        userIdentifier
      }
    });

    let thread;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote (toggle off)
        await prisma.$transaction([
          prisma.forumVote.delete({
            where: { id: existingVote.id }
          }),
          prisma.forumThread.update({
            where: { id },
            data: {
              [voteType === 'upvote' ? 'upvotes' : 'downvotes']: { decrement: 1 }
            }
          })
        ]);

        thread = await prisma.forumThread.findUnique({ where: { id } });
        return NextResponse.json({
          upvotes: thread?.upvotes || 0,
          downvotes: thread?.downvotes || 0,
          userVote: null
        });
      } else {
        // Change vote
        await prisma.$transaction([
          prisma.forumVote.update({
            where: { id: existingVote.id },
            data: { voteType }
          }),
          prisma.forumThread.update({
            where: { id },
            data: {
              upvotes: { [voteType === 'upvote' ? 'increment' : 'decrement']: 1 },
              downvotes: { [voteType === 'downvote' ? 'increment' : 'decrement']: 1 }
            }
          })
        ]);

        thread = await prisma.forumThread.findUnique({ where: { id } });
        return NextResponse.json({
          upvotes: thread?.upvotes || 0,
          downvotes: thread?.downvotes || 0,
          userVote: voteType
        });
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.forumVote.create({
          data: {
            targetId: id,
            targetType: 'thread',
            userIdentifier,
            voteType,
            threadId: id
          }
        }),
        prisma.forumThread.update({
          where: { id },
          data: {
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: { increment: 1 }
          }
        })
      ]);

      thread = await prisma.forumThread.findUnique({ where: { id } });
      return NextResponse.json({
        upvotes: thread?.upvotes || 0,
        downvotes: thread?.downvotes || 0,
        userVote: voteType
      });
    }
  } catch (error) {
    console.error('Error voting on thread:', error);
    return NextResponse.json(
      { error: 'Failed to vote on thread', details: String(error) },
      { status: 500 }
    );
  }
}
