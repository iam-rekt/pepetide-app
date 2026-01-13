import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// POST - Upload images for forum posts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 images allowed' },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const image of images) {
      // Validate file type
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const ext = image.name.split('.').pop();
      const filename = `forum/${timestamp}-${randomStr}.${ext}`;

      // Upload to Vercel Blob
      const blob = await put(filename, image, {
        access: 'public',
      });

      // Add URL to array
      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', details: String(error) },
      { status: 500 }
    );
  }
}
