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
  console.log('[Upload API] Starting image upload...');

  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    console.log(`[Upload API] Received ${images?.length || 0} images`);

    if (!images || images.length === 0) {
      console.log('[Upload API] Error: No images provided');
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      console.log('[Upload API] Error: Too many images');
      return NextResponse.json(
        { error: 'Maximum 4 images allowed' },
        { status: 400 }
      );
    }

    // Check if Storacha is configured
    if (!STORACHA_KEY || !STORACHA_PROOF) {
      console.log('[Upload API] Error: Missing STORACHA_KEY or STORACHA_PROOF');
      console.log(`[Upload API] STORACHA_KEY set: ${!!STORACHA_KEY}, STORACHA_PROOF set: ${!!STORACHA_PROOF}`);
      return NextResponse.json(
        { error: 'Image upload not configured' },
        { status: 503 }
      );
    }

    console.log('[Upload API] Storacha credentials found, initializing client...');

    // Initialize Storacha client with UCAN authentication
    const principal = Signer.parse(STORACHA_KEY);
    console.log(`[Upload API] Principal DID: ${principal.did()}`);

    const store = new StoreMemory();
    const client = await Client.create({ principal, store });
    console.log('[Upload API] Client created');

    // Add delegation proof and set space
    console.log('[Upload API] Parsing delegation proof...');
    const proof = await Proof.parse(STORACHA_PROOF);
    console.log('[Upload API] Proof parsed, adding space...');

    const space = await client.addSpace(proof);
    console.log(`[Upload API] Space added: ${space.did()}`);

    await client.setCurrentSpace(space.did());
    console.log('[Upload API] Current space set, ready to upload');

    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`[Upload API] Processing image ${i + 1}/${images.length}: ${image.name} (${image.type}, ${image.size} bytes)`);

      // Validate file type
      if (!image.type.startsWith('image/')) {
        console.log(`[Upload API] Error: Invalid file type: ${image.type}`);
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB before compression)
      if (image.size > 5 * 1024 * 1024) {
        console.log(`[Upload API] Error: File too large: ${image.size} bytes`);
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Convert image to buffer
      console.log('[Upload API] Converting to buffer...');
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Compress image using sharp
      // - Resize to max 1200px width (maintains aspect ratio)
      // - Convert to JPEG format (better compatibility than WebP)
      // - Quality 80
      console.log('[Upload API] Compressing with Sharp...');
      const compressedBuffer = await sharp(buffer)
        .resize(1200, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      console.log(`[Upload API] Compressed to ${compressedBuffer.length} bytes`);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const filename = `${timestamp}-${randomStr}.jpg`;

      // Upload to IPFS via Storacha
      // Create a File object from the buffer (convert Buffer to Uint8Array for proper typing)
      const uint8Array = new Uint8Array(compressedBuffer);
      const file = new File([uint8Array], filename, { type: 'image/jpeg' });

      // Upload to IPFS
      console.log(`[Upload API] Uploading ${filename} to IPFS...`);
      const cid = await client.uploadFile(file);
      console.log(`[Upload API] Upload successful! CID: ${cid}`);

      // Generate IPFS gateway URL
      // Using w3s.link gateway (Storacha's public gateway)
      const ipfsUrl = `https://w3s.link/ipfs/${cid}`;
      console.log(`[Upload API] Gateway URL: ${ipfsUrl}`);

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
