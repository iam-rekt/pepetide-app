# Quick Storacha Setup (You Already Have a Key)

You already have a `did:key` from the Storacha website. Now you just need to create a delegation so your API can upload.

## Steps

### 1. Install Storacha CLI
```bash
npm install -g @storacha/cli
```

### 2. Login with Your Email
```bash
storacha login your-email@example.com
```
Use the same email you used on the Storacha website. Check your email and click the verification link.

### 3. List Your Spaces
```bash
storacha space ls
```
This shows your space(s). Copy the Space DID (looks like `did:key:z6Mk...`).

### 4. Select Your Space
```bash
storacha space use <your_space_did>
```
Replace `<your_space_did>` with the DID from step 3.

### 5. Generate a New Agent Key for Your API
```bash
storacha key create
```
**Output example:**
```
did:key:z6MkwXYZ... (the DID)
MgCYKXoHVy7... (the private key)
```

Copy the **private key** (starts with "Mg...") and save it. This is your `STORACHA_KEY`.

### 6. Create the Delegation
```bash
storacha delegation create <did_from_step_5> --base64
```
Replace `<did_from_step_5>` with the DID that was output in step 5.

**Output:** A long base64 string. This is your `STORACHA_PROOF`.

### 7. Add to Environment Variables

**Local (.env.local):**
```env
STORACHA_KEY="MgCYKXoHVy7..." (from step 5)
STORACHA_PROOF="uOqJlY29..." (from step 6)
```

**Production (Vercel/Railway):**
Add both variables to your deployment platform's environment variables.

## That's It!

Your API can now upload to IPFS via your Storacha space. The delegation allows your serverless API to upload without needing email verification each time.

## Troubleshooting

**"Space not found" error:**
- Make sure you ran `storacha space use <space_did>` first
- Verify you're logged in: `storacha whoami`

**"Invalid delegation" error:**
- Make sure you copied the full base64 string from step 6
- No extra spaces or newlines
- Use quotes around the value in .env.local
