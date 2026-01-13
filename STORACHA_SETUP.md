# Storacha (IPFS) Setup Guide

## What You Get
- **Free 5GB** permanent decentralized storage
- **IPFS-based** content-addressed storage
- **Fast CDN** access via w3s.link gateway
- **No vendor lock-in** - your data is on IPFS

## Setup Steps

### 1. Install Storacha CLI
```bash
npm install -g @storacha/cli
```

### 2. Create an Account
```bash
storacha login your-email@example.com
```
Check your email and click the verification link.

### 3. Generate Private Key
```bash
storacha key create
```
This outputs a private key like: `MgCYKXoHVy7Vk4/QjcEGi...`

**Save this key!** Add it to your `.env.local`:
```
STORACHA_KEY="MgCYKXoHVy7Vk4/QjcEGi..."
```

### 4. Create Delegation Proof
```bash
storacha delegation create <did_from_above> --base64
```

Replace `<did_from_above>` with the DID that was output from step 3 (looks like `did:key:z6Mk...`).

This outputs a base64 proof string. Add it to your `.env.local`:
```
STORACHA_PROOF="uOqJlY29..."
```

### 5. Deploy
Add both environment variables to your production environment (Vercel, Railway, etc.):
- `STORACHA_KEY`
- `STORACHA_PROOF`

## How It Works

**UCAN Authentication:**
- Storacha uses UCAN (User Controlled Authorization Networks)
- No passwords - authentication via cryptographic keys
- Private key proves identity
- Delegation proof authorizes the space

**Upload Flow:**
1. User uploads image via forum
2. Image compressed with Sharp (WebP, 1200px max)
3. Uploaded to IPFS via Storacha
4. Returns permanent IPFS URL: `https://w3s.link/ipfs/{cid}`
5. Content-addressed - same file = same CID

## Benefits
- ✅ **Permanent** - Files never expire
- ✅ **Decentralized** - Not dependent on single server
- ✅ **Fast** - CDN-like access via gateways
- ✅ **Free** - 5GB free tier
- ✅ **No lock-in** - Can use any IPFS gateway

## Troubleshooting

**"Image upload not configured" error:**
- Check that `STORACHA_KEY` and `STORACHA_PROOF` are set in environment variables
- Verify the values are correct (no extra quotes or spaces)

**Upload fails:**
- Check the private key format is correct
- Verify delegation proof is base64 encoded
- Ensure you completed the email verification

**Images don't load:**
- IPFS gateway may be slow on first load (fetching from network)
- Try alternative gateway: `https://ipfs.io/ipfs/{cid}`
- Content-addressed storage is eventually consistent

## Resources
- [Storacha Documentation](https://docs.storacha.network/)
- [UCAN Concepts](https://docs.storacha.network/concepts/ucan/)
- [Upload Guide](https://docs.storacha.network/how-to/upload/)
