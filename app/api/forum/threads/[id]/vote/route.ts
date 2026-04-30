import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';
import { getWalletTokenIdentity } from '@/lib/server-token';

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

    const walletAddress = request.nextUrl.searchParams.get('walletAddress') || undefined;
    const walletIdentity = await getWalletTokenIdentity(walletAddress);

    // Prefer wallet identity for holder voting; fall back to hashed IP for anon votes.
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userIdentifier = walletIdentity?.walletHash ?? await hashIP(ip);

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
    const { voteType, walletAddress } = body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Valid voteType is required (upvote or downvote)' },
        { status: 400 }
      );
    }

    const walletIdentity = await getWalletTokenIdentity(walletAddress);
    const voteWeight = walletIdentity?.voteWeight ?? 1;

    // Prefer wallet identity for holder voting; fall back to hashed IP for anon votes.
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userIdentifier = walletIdentity?.walletHash ?? await hashIP(ip);

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
      const existingWeight = existingVote.voteWeight || 1;

      if (existingVote.voteType === voteType) {
        // Remove vote (toggle off)
        await prisma.$transaction([
          prisma.forumVote.delete({
            where: { id: existingVote.id }
          }),
          prisma.forumThread.update({
            where: { id },
            data: {
              [voteType === 'upvote' ? 'upvotes' : 'downvotes']: { decrement: existingWeight }
            }
          })
        ]);

        thread = await prisma.forumThread.findUnique({ where: { id } });
        return NextResponse.json({
          upvotes: thread?.upvotes || 0,
          downvotes: thread?.downvotes || 0,
          userVote: null,
          voteWeight
        });
      } else {
        // Change vote
        await prisma.$transaction([
          prisma.forumVote.update({
            where: { id: existingVote.id },
            data: {
              voteType,
              voteWeight,
              voterWalletHash: walletIdentity?.walletHash
            }
          }),
          prisma.forumThread.update({
            where: { id },
            data: {
              upvotes: voteType === 'upvote'
                ? { increment: voteWeight }
                : { decrement: existingWeight },
              downvotes: voteType === 'downvote'
                ? { increment: voteWeight }
                : { decrement: existingWeight }
            }
          })
        ]);

        thread = await prisma.forumThread.findUnique({ where: { id } });
        return NextResponse.json({
          upvotes: thread?.upvotes || 0,
          downvotes: thread?.downvotes || 0,
          userVote: voteType,
          voteWeight
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
            voteWeight,
            voterWalletHash: walletIdentity?.walletHash,
            threadId: id
          }
        }),
        prisma.forumThread.update({
          where: { id },
          data: {
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: { increment: voteWeight }
          }
        })
      ]);

      thread = await prisma.forumThread.findUnique({ where: { id } });
      return NextResponse.json({
        upvotes: thread?.upvotes || 0,
        downvotes: thread?.downvotes || 0,
        userVote: voteType,
        voteWeight
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
