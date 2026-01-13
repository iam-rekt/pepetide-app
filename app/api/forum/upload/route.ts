import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// POST - Upload images for forum posts with aggressive compression
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

      // Validate file size (max 5MB before compression)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Convert image to buffer
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Compress image aggressively using sharp
      // - Resize to max 1200px width (good for forum posts)
      // - Convert to WebP format (much smaller than JPEG/PNG)
      // - Quality 75 (good balance between size and quality)
      // This typically reduces size by 70-90%
      const compressedBuffer = await sharp(buffer)
        .resize(1200, null, {
          withoutEnlargement: true, // Don't upscale smaller images
          fit: 'inside'
        })
        .webp({ quality: 75 })
        .toBuffer();

      // Generate unique filename with .webp extension
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const filename = `forum/${timestamp}-${randomStr}.webp`;

      // Upload compressed image to Vercel Blob
      const blob = await put(filename, compressedBuffer, {
        access: 'public',
        contentType: 'image/webp'
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
