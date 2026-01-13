# SYS (Share Your Stack) Forum Feature

## Overview

The SYS (Share Your Stack) forum is a 4chan-style discussion board where users can share their peptide stacks, discuss experiences, and learn from the community. This feature allows users to:

- Share their complete peptide stacks with dosages and schedules
- Post images (progress pics, lab results, product photos)
- Engage in threaded discussions with nested replies
- Vote on threads and posts
- Filter by tags (cutting, bulking, anti-aging, recovery, cognitive, etc.)
- Import shared stacks directly into their peptide library

## Features

### Thread Creation
- **Stack Sharing**: Users can add peptides to their thread with full details:
  - Peptide name, dosage, frequency, timing
  - Duration and notes
  - Quick import from existing protocols
- **Image Uploads**: Up to 4 images per thread/post (max 5MB each)
- **Tags**: Categorize threads (cutting, bulking, anti-aging, recovery, cognitive, longevity, performance)
- **Pseudonymous**: Users choose an alias for privacy

### Thread Browsing
- **Sorting Options**:
  - Hot: Trending threads (combination of votes, replies, and recency)
  - New: Most recent threads first
  - Top: Highest-voted threads
- **Tag Filtering**: Click tags to filter threads by category
- **Search**: Search by title, content, username, or tags
- **Pinned Threads**: Moderators can pin important threads to the top

### Threaded Discussions
- **Nested Replies**: 4chan/Reddit-style reply threading
- **Voting**: Upvote/downvote threads and posts
- **View Tracking**: Thread view counts
- **Reply Count**: See active discussions at a glance

### Stack Import Feature
Users can import shared stacks with one click:
1. View a thread with stack details
2. Click "Import to My Library"
3. All peptides are added to their personal library
4. Users can then create vials and protocols

### Content Moderation (Delete)
4chan-style deletion system with **server-side authorization**:

- **Delete buttons visible to everyone** (like 4chan)
- **Server enforces authorization**:
  - Original poster can delete (matched by IP hash on server)
  - Admin can delete any content (validated via ADMIN_KEY header)
- **Cross-device support**: Works on desktop, mobile, different browsers
- **IP-based identity**: Server hashes requester's IP and compares to author's IP hash
- **Confirmation dialog**: All deletes require user confirmation
- **Cascade deletion**: Threads delete all posts/votes; posts delete child replies

**Security Model:**
- Client shows delete buttons to all users
- Server validates authorization on each DELETE request
- Only original poster (same IP) or admin (with valid ADMIN_KEY) can delete
- Prevents client-side tampering - all auth happens server-side

## Technical Implementation

### Frontend Components

#### ForumView.tsx
- Main forum view with thread list
- Search and filtering UI
- Thread sorting (hot/new/top)
- Tag filtering

#### CreateThreadDialog.tsx
- Thread creation form
- Stack peptide builder with import from protocols
- Image upload interface
- Tag selection

#### ThreadDetail.tsx
- Full thread view with voting
- Nested reply display
- Reply form with image support
- Stack import functionality

### Backend API Routes

#### `/api/forum/threads`
- GET: Fetch all threads (ordered by pinned/date)
- POST: Create new thread

#### `/api/forum/threads/[id]/posts`
- GET: Fetch all posts for a thread
- POST: Create new post/reply

#### `/api/forum/threads/[id]/vote`
- GET: Get user's vote for a thread
- POST: Vote on thread (upvote/downvote/toggle)

#### `/api/forum/threads/[id]/view`
- POST: Increment view count

#### `/api/forum/upload`
- POST: Upload images (max 4 images, 5MB each)
- Stores in `/public/uploads/forum/`

#### `/api/forum/threads/[id]`
- DELETE: Delete a thread (by author or admin)

#### `/api/forum/posts/[id]`
- DELETE: Delete a post (by author or admin)

### Database Schema

#### ForumThread
- id, title, content
- authorUsername, authorId (hashed IP)
- imageUrls[], stackPeptides (JSON)
- tags[]
- upvotes, downvotes, replyCount, viewCount
- isPinned
- timestamps

#### ForumPost
- id, threadId, content
- authorUsername, authorId
- imageUrls[]
- parentPostId (for nested replies)
- upvotes, downvotes
- timestamps

#### ForumVote
- id, targetId, targetType (thread/post)
- userIdentifier (hashed IP)
- voteType (upvote/downvote)
- threadId, postId (foreign keys)

## Privacy & Security

- **IP Hashing**: User IPs are hashed (SHA-256) for pseudonymous identity
- **No Personal Data**: No email, real names, or personal info required
- **Image Validation**:
  - File type checking (images only)
  - Size limits (5MB max)
  - Max 4 images per post
- **Content Moderation**:
  - **Server-side authorization**: All delete requests verified on server
  - **IP-based ownership**: Authors identified by hashed IP address
  - **Cross-device support**: Works on desktop, mobile, any browser
  - **Admin authentication**: Requires ADMIN_KEY in request header (optional localStorage)
  - **Delete buttons**: Visible to all users (4chan-style UX)
  - **Authorization happens server-side**: Prevents client tampering
  - **Cascade deletion**: Threads delete all posts/votes automatically

## Deployment Notes

### Database Migration

Run this SQL on your PostgreSQL database:

```bash
psql $DATABASE_URL -f prisma/migrations/add_forum_tables.sql
```

Or run via Prisma:

```bash
npx prisma migrate deploy
```

### File Storage

Images are stored in `/public/uploads/forum/`. Ensure:
- Directory has write permissions
- Consider using a CDN or cloud storage (S3, Cloudflare R2) for production
- Set up image optimization/compression for better performance

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (existing)

Optional:
- `ADMIN_KEY` - Secret key for admin moderation (generate a strong random string)
  - Example: `ADMIN_KEY="your-secret-admin-key-here"`
  - Keep this secret - anyone with this key can delete any content
  - Set up admin access via Settings > Admin Panel in the app

## Future Enhancements

Potential improvements:
- [ ] Post editing/deletion
- [ ] Report system for inappropriate content
- [ ] User profiles with post history
- [ ] Direct messaging between users
- [ ] Subscribe to threads for notifications
- [ ] Markdown support in posts
- [ ] Code syntax highlighting for stack protocols
- [ ] Integration with Telegram for thread notifications
- [ ] Advanced search (filter by date range, author, etc.)
- [ ] "Hot take" or "Question" thread types
- [ ] Leaderboard for top contributors

## Usage Tips

### For Users
1. **Use descriptive titles**: "My cutting stack - BPC-157 + CJC/Ipa" is better than "My stack"
2. **Tag appropriately**: Use relevant tags to help others find your content
3. **Share details**: Include dosages, timing, duration, and results
4. **Be helpful**: Reply to others' questions and share your experience
5. **Use images wisely**: Progress pics, lab results, and product photos add value

### For Admins

**Setup:**
1. Add to `.env.local`: `ADMIN_KEY="your-secret-random-key-here"`
2. **Optional**: For convenience, store in browser console: `localStorage.setItem('adminKey', 'your-secret-key')`
   - This allows the client to send the key automatically
   - Still secure - server validates the key on each request

**Delete Content:**
- Delete buttons visible on all content (for all users)
- When admin key is in localStorage, it's sent with delete requests
- Server validates the key matches `ADMIN_KEY` environment variable
- If valid, deletion is allowed regardless of IP

**Security Notes:**
- Admin key must match exactly between `.env.local` and client
- Key is sent in `x-admin-key` header (not visible in URL)
- Server-side validation prevents unauthorized deletions
- Regular users clicking delete will get "Unauthorized" error from server

**Without localStorage method:**
- Users can only delete their own content (same IP)
- Admins would need to modify client code to send admin key
- localStorage is optional convenience feature

## Navigation

The SYS forum is accessible via:
- Bottom navigation on mobile (MessageSquare icon)
- Top navigation on desktop
- Tab label: "SYS"

## Files Modified/Created

### New Files
- `components/ForumView.tsx` - Main forum view with thread list
- `components/CreateThreadDialog.tsx` - Thread creation dialog
- `components/ThreadDetail.tsx` - Thread view with replies and delete buttons
- `components/AdminPanel.tsx` - Admin key management panel
- `lib/hash.ts` - IP hashing utility
- `app/api/forum/threads/route.ts` - List/create threads
- `app/api/forum/threads/[id]/route.ts` - Delete thread
- `app/api/forum/threads/[id]/posts/route.ts` - List/create posts
- `app/api/forum/threads/[id]/vote/route.ts` - Vote on threads
- `app/api/forum/threads/[id]/view/route.ts` - Track views
- `app/api/forum/posts/[id]/route.ts` - Delete post
- `app/api/forum/upload/route.ts` - Upload images
- `prisma/migrations/add_forum_tables.sql` - Database migration

### Modified Files
- `types/index.ts` - Added ForumThread, ForumPost, ForumVote, StackPeptideInfo types
- `prisma/schema.prisma` - Added ForumThread, ForumPost, ForumVote models
- `components/Navigation.tsx` - Added SYS tab with MessageSquare icon
- `app/page.tsx` - Added ForumView to view routing
- `components/Settings.tsx` - Added AdminPanel component

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify DATABASE_URL is set correctly
3. Ensure PostgreSQL is running
4. Check that Prisma migrations are applied
5. Verify file upload permissions in `/public/uploads/forum/`
