import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import * as Client from '@storacha/client';
import { StoreMemory } from '@storacha/client/stores/memory';
import * as Proof from '@storacha/client/proof';
import { Signer } from '@storacha/client/principal/ed25519';

// IPFS via Storacha (formerly Web3.Storage)
// Free decentralized permanent storage (5GB free tier)
// Uses UCAN-based authentication
const STORACHA_KEY = process.env.STORACHA_KEY;
const STORACHA_PROOF = process.env.STORACHA_PROOF;

// POST - Upload images to IPFS via Storacha
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

    // Check if Storacha is configured
    if (!STORACHA_KEY || !STORACHA_PROOF) {
      return NextResponse.json(
        { error: 'Image upload not configured' },
        { status: 503 }
      );
    }

    // Initialize Storacha client with UCAN authentication
    const principal = Signer.parse(STORACHA_KEY);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    // Add delegation proof and set space
    const proof = await Proof.parse(STORACHA_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

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
      // - Resize to max 1200px width
      // - Convert to WebP format (70-90% smaller)
      // - Quality 75
      const compressedBuffer = await sharp(buffer)
        .resize(1200, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 75 })
        .toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const filename = `${timestamp}-${randomStr}.webp`;

      // Upload to IPFS via Storacha
      // Create a File object from the buffer
      const file = new File([compressedBuffer], filename, { type: 'image/webp' });

      // Upload to IPFS
      const cid = await client.uploadFile(file);

      // Generate IPFS gateway URL
      // Using w3s.link gateway (Storacha's public gateway)
      const ipfsUrl = `https://w3s.link/ipfs/${cid}`;

      urls.push(ipfsUrl);
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
