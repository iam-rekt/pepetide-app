import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';

// PATCH - Admin moderation controls for a thread
export async function PATCH(
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
    const isAdmin = request.headers.get('x-admin-key') === process.env.ADMIN_KEY;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - admin key required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isPinned, isHidden, isLocked } = body;

    const data: {
      isPinned?: boolean;
      isHidden?: boolean;
      isLocked?: boolean;
    } = {};

    if (typeof isPinned === 'boolean') data.isPinned = isPinned;
    if (typeof isHidden === 'boolean') data.isHidden = isHidden;
    if (typeof isLocked === 'boolean') data.isLocked = isLocked;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No moderation changes provided' },
        { status: 400 }
      );
    }

    const updatedThread = await prisma.forumThread.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('Error moderating thread:', error);
    return NextResponse.json(
      { error: 'Failed to moderate thread', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete a thread (by author or admin)
export async function DELETE(
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

    // Get user identifier
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userIdentifier = await hashIP(ip);

    // Get the thread to check ownership
    const thread = await prisma.forumThread.findUnique({
      where: { id }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Check if user is admin (via environment variable or special header)
    const isAdmin = request.headers.get('x-admin-key') === process.env.ADMIN_KEY;

    // Check if user is the author
    const isAuthor = thread.authorId === userIdentifier;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own threads' },
        { status: 403 }
      );
    }

    // Delete the thread (cascade will delete posts and votes)
    await prisma.forumThread.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Thread deleted' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread', details: String(error) },
      { status: 500 }
    );
  }
}
