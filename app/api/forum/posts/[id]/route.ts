import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';

// DELETE - Delete a post (by author or admin)
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

    // Get the post to check ownership
    const post = await prisma.forumPost.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = request.headers.get('x-admin-key') === process.env.ADMIN_KEY;

    // Check if user is the author
    const isAuthor = post.authorId === userIdentifier;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post (cascade will delete child replies and votes)
    await prisma.forumPost.delete({
      where: { id }
    });

    // Decrement thread reply count
    await prisma.forumThread.update({
      where: { id: post.threadId },
      data: { replyCount: { decrement: 1 } }
    });

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post', details: String(error) },
      { status: 500 }
    );
  }
}
