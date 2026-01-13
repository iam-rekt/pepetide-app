import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';

// GET - Fetch all posts for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ posts: [], configured: false });
  }

  try {
    const { id } = await params;

    const posts = await prisma.forumPost.findMany({
      where: { threadId: id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new post/reply
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
    const { content, username, parentPostId, imageUrls } = body;

    if (!content || !username) {
      return NextResponse.json(
        { error: 'Content and username are required' },
        { status: 400 }
      );
    }

    // Get user identifier (hash IP for privacy)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const authorId = await hashIP(ip);

    const newPost = await prisma.forumPost.create({
      data: {
        threadId: id,
        content,
        authorUsername: username,
        authorId,
        parentPostId: parentPostId || null,
        imageUrls: imageUrls || []
      }
    });

    // Increment thread reply count
    await prisma.forumThread.update({
      where: { id },
      data: { replyCount: { increment: 1 } }
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post', details: String(error) },
      { status: 500 }
    );
  }
}
