# PEPEtide - Complete Feature List

## Community Database Features (NEW!)

### Browse Community Peptides
- **Search**: Find peptides by name with real-time filtering
- **Sort Options**:
  - Most Popular (by upvotes)
  - Recently Added
  - Alphabetical
- **Peptide Cards** show:
  - Name and description
  - Common dosage range
  - Number of user submissions
  - Net vote count (upvotes - downvotes)
  - Original submitter

### Peptide Details
Navigate through three tabs:

**1. Overview Tab**
- Dosage information with common ranges
- Average effectiveness rating (from user reviews)
- Benefits list
- Contraindications
- Warnings
- Storage and shelf life information
- Community stats (submissions, reviews, votes)

**2. Reviews Tab**
- User reviews with:
  - Username and date
  - Star ratings (1-5)
  - Dosage used and frequency
  - Duration of use
  - Benefits experienced
  - Side effects reported
  - Personal notes
  - Helpful votes count

**3. Submissions Tab**
- View ALL individual user submissions for a peptide
- Each submission shows:
  - Submitter username
  - Date submitted
  - Information source (personal experience, research, etc.)
  - Their suggested dosage range
  - Their notes and observations

### Submit Peptides
- **Anonymous with Username**: No account needed, just pick a username/alias
- **If peptide exists**: Your submission adds to it (increments submission count)
- **If peptide is new**: Creates new community entry with you as first submitter
- **Information captured**:
  - Peptide name and description
  - Recommended dosage range
  - Benefits
  - Contraindications
  - Warnings
  - Storage instructions
  - Personal notes
  - Information source

### Voting System
- **Upvote/Downvote** peptides
- IP-based vote limiting (one vote per peptide per IP)
- Can change vote from upvote to downvote or vice versa
- Net score displayed prominently

### Add to Personal Library
- One-click button to import community peptide into your personal app
- Copies all data (dosage, benefits, warnings, etc.)
- Becomes your private peptide for tracking

### User Attribution
- Every submission clearly labeled "Submitted by [username]"
- "First submitted by" attribution on main peptide
- All data clearly marked as "user-contributed"
- Strong disclaimers about medical verification

## Personal Features (Original)

### 1. Local Peptide Library
- Create custom peptides with full details
- Store privately in IndexedDB (never sent to server)
- Add/edit/delete anytime

### 2. Vial Management
- Track physical vials with:
  - Vial size (mg or mcg)
  - Received date
  - Batch number
  - Bacteriostatic water added
  - Automatic concentration calculation
  - Reconstitution date
  - Auto-calculated expiration (6 weeks)
- View all active and expired vials
- Delete vials when depleted

### 3. Reconstitution Calculator
- Input vial size and target dose
- Get instant calculations:
  - Concentration (mg/mL)
  - Volume per dose (mL)
  - Units on U-100 insulin syringe
  - Total doses in vial
- Recommendations for optimal water amounts
- Step-by-step instructions

### 4. Protocol Builder
- Select peptide and vial
- Set target dose
- Choose frequency:
  - Daily
  - Every other day
  - Weekly
- Set duration (weeks)
- Choose time of day
- **Auto-populates entire calendar** with scheduled doses

### 5. Interactive Calendar
- Monthly view with color-coded days:
  - **Green**: All doses taken
  - **Yellow**: Partial completion
  - **Red**: Missed doses
  - **Blue ring**: Today
- Click any date to see scheduled doses
- One-tap "Mark Taken" button
- Records exact time of completion
- Add notes to doses

### 6. Dashboard
- Stats overview:
  - Active peptides count
  - Active vials count
  - Active protocols count
  - Today's doses (completed/total)
- Safety alerts banner
- Quick actions

### 7. Safety Checks
Real-time alerts for:
- Vial expiration warnings (7 days before)
- Expired vials
- Dosage outside common range
- Missed doses
- Potential double doses

## Technical Features

### Data Storage
- **Personal Data**: IndexedDB (100% local, private)
- **Community Data**: Supabase PostgreSQL (shared, public)
- No mixing of personal and community data

### Progressive Web App
- Install on mobile devices
- Works offline (personal features)
- Service worker caching
- App-like experience

### Privacy & Security
- **Personal Data**: Never leaves your device
- **Community Submissions**: Anonymous (username only)
- **No Tracking**: Zero analytics or telemetry
- **No Accounts**: No email, password, or authentication
- **IP-based Voting**: Simple spam prevention

### Modern UX
- Clean, elegant design
- Dark mode support
- Mobile-responsive
- Touch-friendly
- Fast loading
- Smooth animations

## User Flow Examples

### Using Community Database

1. **Browse Peptides**
   - Go to "Community" tab
   - Search for "BPC-157"
   - See 5 different user submissions
   - Main entry shows 200-500mcg range

2. **View Details**
   - Click peptide card
   - Read overview (benefits, warnings)
   - Switch to Reviews tab
   - Read 3 user reviews with ratings
   - Switch to Submissions tab
   - See all 5 individual submissions with different perspectives

3. **Add to Your App**
   - Click "Add to My Peptides"
   - Peptide imported to personal library
   - Now available in Add Vial, Protocol Builder, etc.

4. **Submit Your Own**
   - Click "Submit Peptide"
   - Enter username: "PeptideResearcher123"
   - Fill in dosage, benefits from your experience
   - Submit
   - Appears in community database

### Personal Tracking

1. **Add and Track**
   - Add peptide (manually or from community)
   - Add vial (5mg with 2mL water)
   - Build protocol (250mcg daily for 4 weeks)
   - Calendar auto-populated with 28 doses

2. **Daily Use**
   - Check calendar
   - See today's dose marked
   - Tap "Mark Taken"
   - Dose logged with timestamp
   - Day turns green

3. **Safety**
   - Dashboard shows alert
   - "Vial expires in 5 days"
   - Add new vial before running out
   - Seamless transition

## Comparison: Community vs Personal

| Feature | Community | Personal |
|---------|-----------|----------|
| **Data Storage** | Supabase (cloud) | IndexedDB (local) |
| **Visibility** | Public | Private |
| **Multiple Users** | Yes | No |
| **Offline** | No | Yes |
| **Requires Setup** | Yes (Supabase) | No |
| **Purpose** | Knowledge sharing | Protocol tracking |

## Future Enhancements

Potential additions (not yet implemented):

1. **Review Submission Form**: Full UI for submitting reviews
2. **Report System**: Flag inappropriate content
3. **Admin Moderation**: Review flagged submissions
4. **Email Notifications**: Alert when new reviews added
5. **Export Community Data**: Download peptide info as PDF
6. **Advanced Search**: Filter by benefits, dosage range
7. **Trending**: Show most viewed/reviewed this week
8. **User Profiles**: Optional profiles with reputation points

---

**Note**: The app works fully without Supabase (local-only mode). Community features only activate when Supabase is configured.
