import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db-postgres';
import { hashIP } from '@/lib/hash';

// GET - Fetch all forum threads
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ threads: [], configured: false });
  }

  try {
    const threads = await prisma.forumThread.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new thread
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, username, tags, stackPeptides, imageUrls } = body;

    if (!title || !content || !username) {
      return NextResponse.json(
        { error: 'Title, content, and username are required' },
        { status: 400 }
      );
    }

    // Get user identifier (hash IP for privacy)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const authorId = await hashIP(ip);

    const newThread = await prisma.forumThread.create({
      data: {
        title,
        content,
        authorUsername: username,
        authorId,
        tags: tags || [],
        stackPeptides: stackPeptides || null,
        imageUrls: imageUrls || []
      }
    });

    return NextResponse.json(newThread);
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread', details: String(error) },
      { status: 500 }
    );
  }
}
