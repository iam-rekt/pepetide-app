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

    const threadPosts = await prisma.forumPost.findMany({
      where: { threadId: post.threadId },
      select: { id: true, parentPostId: true }
    });

    const deletedPostIds = new Set<string>([id]);
    let hasNewDescendants = true;

    while (hasNewDescendants) {
      hasNewDescendants = false;

      for (const threadPost of threadPosts) {
        if (threadPost.parentPostId && deletedPostIds.has(threadPost.parentPostId) && !deletedPostIds.has(threadPost.id)) {
          deletedPostIds.add(threadPost.id);
          hasNewDescendants = true;
        }
      }
    }

    const deletedCount = deletedPostIds.size;

    // Delete the post (cascade will delete child replies and votes)
    await prisma.forumPost.delete({
      where: { id }
    });

    // Decrement thread reply count
    await prisma.forumThread.update({
      where: { id: post.threadId },
      data: { replyCount: { decrement: deletedCount } }
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
      deletedCount,
      deletedPostIds: Array.from(deletedPostIds)
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post', details: String(error) },
      { status: 500 }
    );
  }
}
