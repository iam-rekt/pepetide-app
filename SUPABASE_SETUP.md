# Supabase Setup Guide for PEPEtide Community Database

This guide will help you set up the community peptide database using Supabase.

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: PEPEtide-community (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (sufficient for most use cases)
4. Click "Create Project"
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, navigate to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" or press Ctrl/Cmd + Enter
6. You should see "Success. No rows returned" - this is correct!

## Step 3: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API** (left sidebar)
2. Find these two values:
   - **Project URL**: Something like `https://xxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## Step 4: Configure Environment Variables

1. In your PEPEtide project root, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Step 5: Test the Connection

1. Restart your development server:

```bash
npm run dev
```

2. Navigate to the **Community** tab in the app
3. Try submitting a test peptide
4. Check your Supabase dashboard:
   - Go to **Table Editor** → `community_peptides`
   - You should see your submission

## Database Tables Overview

The schema creates these tables:

### `community_peptides`
Main peptide database with aggregated data from all submissions. One row per unique peptide name.

### `peptide_submissions`
Individual submissions from users. Multiple rows can exist for the same peptide, showing different perspectives.

### `user_reviews`
User reviews and experiences with specific peptides.

### `peptide_votes`
Tracks upvotes/downvotes on peptides (one vote per IP/user).

### `review_votes`
Tracks helpful votes on reviews.

## Security

The schema includes Row Level Security (RLS) policies that:
- Allow anyone to **read** all data (public community database)
- Allow anyone to **insert** new submissions (anonymous contributions)
- Prevent deletion and most updates (data integrity)
- Use IP-based vote limiting (prevent spam)

## Optional: Monitoring and Analytics

1. **Database Activity**: Settings → Database → Database Settings
2. **API Logs**: Logs & Reporting
3. **Usage**: Settings → Billing → Usage

## Scaling

The free tier includes:
- 500MB database space
- 2GB bandwidth/month
- 50,000 monthly active users

For production with higher traffic:
1. Go to Settings → Billing
2. Choose Pro plan ($25/month)
3. Get 8GB database + 250GB bandwidth

## Backup

Supabase automatically backs up your database. To create manual backups:

1. Go to **Database** → **Backups**
2. Click "Create backup"
3. Or export via SQL:

```sql
-- In SQL Editor
COPY (SELECT * FROM community_peptides) TO STDOUT WITH CSV HEADER;
```

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the `schema.sql` file completely
- Check the SQL Editor for any errors

### Submissions not appearing
- Check browser console for errors
- Verify `.env.local` has correct credentials
- Check Supabase dashboard → Logs for API errors

### Votes not working
- This is expected in localhost (same IP)
- Deploy to test voting properly
- Each unique IP can vote once per peptide

## Development vs Production

### Development
- Use one Supabase project
- `.env.local` for local credentials

### Production (Vercel)
- Same Supabase project, or create a separate production project
- Add environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Data Migration

To migrate data between projects:

```sql
-- Export from old project
COPY (SELECT * FROM community_peptides) TO '/tmp/peptides.csv' WITH CSV HEADER;

-- Import to new project
COPY community_peptides FROM '/tmp/peptides.csv' WITH CSV HEADER;
```

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- PEPEtide Issues: [Your GitHub repo]

---

## Quick Start Checklist

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Run `schema.sql` in SQL Editor
- [ ] Copy Project URL and anon key
- [ ] Create `.env.local` file
- [ ] Add credentials to `.env.local`
- [ ] Restart dev server
- [ ] Test submission in Community tab
- [ ] Verify data in Supabase Table Editor

That's it! Your community peptide database is now live.
