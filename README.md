# PEPEtide

A modern Progressive Web App (PWA) for tracking peptide protocols with precision and safety.

## Features

### Core Functionality
- **Peptide Library**: Create and manage custom peptide entries with dosage ranges, benefits, contraindications, and warnings
- **Community Database**: Browse, search, and submit peptides to a shared community knowledge base
- **User Reviews**: Read and write reviews with dosages, effectiveness ratings, and experienced benefits
- **Vial Management**: Track peptide vials with batch numbers, received dates, reconstitution dates, and expiration tracking
- **Reconstitution Calculator**: Calculate exact dosing volumes, concentrations, and syringe units
- **Protocol Builder**: Set up automated dosing schedules that auto-populate your calendar
- **Calendar Tracking**: Visual calendar with dose tracking and one-tap marking of completed doses
- **Safety Checks**: Automated alerts for interactions, expiration warnings, and dosage range validation

### Community Features
- **Anonymous Submissions**: Share peptides with username/alias (no account required)
- **Multiple Perspectives**: View all user submissions for each peptide
- **Voting System**: Upvote/downvote peptides based on quality
- **User Attribution**: All submissions clearly marked as "user-contributed"
- **Search & Filter**: Find peptides by name, sort by popularity or date

### Technical Features
- **Progressive Web App**: Install on mobile devices for native app-like experience
- **Offline Support**: Works without internet connection using service workers (for personal data)
- **Dual Storage**: Local IndexedDB for personal data + Supabase for community data
- **No Account Required**: Complete privacy with anonymous community participation
- **Modern UI**: Clean, elegant design with dark mode support

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PEPEtide
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up community database:
   - See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions
   - Skip this if you only want local-only features

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### 1. Add a Peptide
- Navigate to "Add Peptide"
- Enter peptide name (e.g., BPC-157, TB-500)
- Optionally add:
  - Description
  - Common dosage range (min/max in mcg or mg)
  - Benefits
  - Contraindications
  - Safety warnings
  - Storage instructions
  - Shelf life information

### 2. Add a Vial
- Navigate to "Add Vial"
- Select your peptide
- Enter vial size (e.g., 5mg)
- Add bacteriostatic water amount if reconstituted
- Enter received date
- Optionally add:
  - Reconstituted date (calculates expiration automatically)
  - Batch number for tracking

### 3. Use the Reconstitution Calculator
- Navigate to "Calculator"
- Enter:
  - Vial size (mg or mcg)
  - Bacteriostatic water added (mL)
  - Target dose per injection (mcg or mg)
- Get instant calculations for:
  - Final concentration
  - Volume per dose
  - Units on U-100 insulin syringe
  - Total doses in vial

### 4. Build a Dosing Protocol
- Navigate to "Protocol"
- Select peptide and vial
- Enter target dose
- Choose frequency (daily, every other day, weekly)
- Set duration (weeks)
- Choose time of day
- Click "Create Protocol" to auto-populate calendar

### 5. Track Daily Doses
- Navigate to "Calendar"
- Click any date to view scheduled doses
- Tap "Mark Taken" to log completion
- Visual indicators show:
  - Green: All doses taken
  - Yellow: Partial completion
  - Red: Missed doses
  - Blue ring: Today's date

## Safety Information

### Important Disclaimers
⚠️ This app is for educational and organizational purposes only.

- **Not Medical Advice**: This tool does NOT provide medical advice
- **Consult Healthcare Providers**: Always verify protocols with qualified healthcare professionals
- **Verify Calculations**: Double-check all dosage calculations independently
- **FDA Status**: Many peptides (including BPC-157, TB-500) are not FDA-approved and may have safety concerns
- **No Liability**: Users assume all responsibility for peptide use

### Safety Features
The app includes automated safety checks for:
- Vial expiration warnings
- Dosage range validation
- Missed dose notifications
- Potential peptide interactions
- Double-dose warnings

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Storage**: IndexedDB via idb library
- **PWA**: Service Worker with offline support
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Data Privacy

- **100% Local**: All data stored on your device only
- **No Cloud Sync**: No servers, no databases, no tracking
- **No Analytics**: Zero telemetry or usage tracking
- **No Accounts**: No registration or authentication required
- **Export/Import**: (Coming soon) Backup your data locally

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## PWA Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Tap "Install"

### Desktop
1. Look for the install icon in the address bar
2. Click to install as desktop app

## Development

### Project Structure
```
PEPEtide/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with PWA setup
│   ├── page.tsx           # Main app page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AddPeptide.tsx    # Peptide creation form
│   ├── Calculator.tsx     # Reconstitution calculator
│   ├── CalendarView.tsx   # Dose tracking calendar
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Navigation.tsx     # Navigation menu
│   ├── ProtocolBuilder.tsx # Protocol creation
│   ├── VialManager.tsx    # Vial management
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── calculator.ts      # Dosage calculations
│   ├── db.ts             # IndexedDB operations
│   ├── safety.ts         # Safety checks
│   └── utils.ts          # General utilities
├── types/                 # TypeScript types
│   └── index.ts          # Type definitions
└── public/               # Static assets
    ├── manifest.json     # PWA manifest
    └── sw.js            # Service worker
```

### Key Concepts

#### Data Models
- **Peptide**: Core peptide information with safety data
- **PeptideVial**: Physical vial tracking with reconstitution details
- **DoseProtocol**: Automated dosing schedule configuration
- **DoseLog**: Individual dose records with completion status

#### Calculations
All dosage calculations use consistent unit conversion:
- 1 mg = 1000 mcg
- U-100 insulin syringe: 1 unit = 0.01 mL
- Concentration = Vial Size ÷ Bacteriostatic Water
- Volume Per Dose = Target Dose ÷ Concentration

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with research from:
- [peptides.org](https://www.peptides.org/)
- [peptidedosages.com](https://peptidedosages.com/)
- Clinical peptide therapy resources
- User experience best practices for health tracking apps

## Support

For issues or questions:
1. Check the README
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Remember**: This is an organizational tool only. Always consult qualified healthcare professionals before starting any peptide protocol.
