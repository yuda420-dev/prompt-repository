# HiPeR Gallery - Complete Project Documentation

*Created: January 2026*
*Live URL: https://prompt-repository-orcin.vercel.app*
*GitHub: https://github.com/yuda420-dev/prompt-repository*

---

## Project Overview

HiPeR Gallery is a React-based art gallery application that allows artists to upload, describe, and showcase their artwork. It features AI-assisted description generation, series uploads with shared themes, user authentication, and persistent storage.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| Tailwind CSS | 4.1.18 | Styling |
| Supabase | 2.89.0 | Backend (prepared, using localStorage fallback) |
| Vercel | - | Hosting & Deployment |

---

## Features

### 1. User Authentication

- **Sign Up / Sign In** with email and password
- Currently uses localStorage for demo mode
- Supabase integration prepared for production
- Session persistence across page refreshes

### 2. Artwork Upload

#### Single Upload
- Select an image file
- 5-step questionnaire to generate title and description:
  1. **Mood** - What emotion does the piece evoke?
  2. **Theme** - What theme does it explore?
  3. **Style** - Visual approach (Abstract, Realistic, etc.)
  4. **Inspiration** - What inspired the piece? (optional)
  5. **Message** - What should viewers feel? (optional)
- AI generates title and description based on answers
- Option to upload a pre-written description document
- Artist approval step to edit before publishing

#### Series Upload (Multiple Images)
When uploading 2+ images, you can choose:

**Option A: Upload as Series**
- Share one description across all pieces
- Add individual titles/notes for each piece (optional)
- Two ways to create series description:
  - **AI Generate** - Auto-generates creative description
  - **Upload Document** - Load from .txt, .doc, .md file
- "Publish Series Now" to skip individual notes

**Option B: Upload Individually**
- Process each image separately with full questionnaire

### 3. Gallery Display

- **Grid layout** with hover effects
- **Category filtering**: Abstract, Surreal, Nature, Portrait, Landscape
- **Preview mode**: Non-logged-in users see only 3 artworks
- **Full access**: Logged-in users see all artworks
- **NEW badge** on recently uploaded works
- **Edit/Delete buttons** on user's own artworks

### 4. Artwork Details Modal

- Large image preview
- Size selection: Small (12"×12") to Grand (48"×48")
- Frame selection: Canvas Only, Matte Black, Gallery White, Natural Oak, Dark Walnut, Antique Gold
- Dynamic pricing based on selections
- Add to Cart functionality

### 5. Shopping Cart

- Slide-out cart panel
- Item list with thumbnails
- Size and frame details per item
- Remove individual items
- Clear cart option
- Checkout with confirmation
- Free shipping indicator

### 6. Data Persistence

#### Current (localStorage)
- User session saved locally
- Artworks saved locally
- Survives page refresh
- Browser-specific (doesn't sync across devices)

#### Export/Import (Settings)
- **Export Gallery**: Download JSON backup file
- **Import Gallery**: Restore from JSON backup
- **Export to Notion**: Copy formatted markdown to clipboard

#### Future (Supabase Ready)
- Database schema prepared
- Storage bucket for images prepared
- Row-level security policies defined

---

## File Structure

```
prompt-repository/
├── src/
│   ├── App.jsx              # Main application (2,598 lines)
│   ├── App.css              # Additional styles
│   ├── index.css            # Tailwind imports
│   ├── main.jsx             # React entry point
│   ├── lib/
│   │   └── supabase.js      # Supabase client config
│   ├── hooks/
│   │   └── useAuth.js       # Auth hook (prepared)
│   ├── services/
│   │   ├── auth.js          # Auth service (prepared)
│   │   └── database.js      # DB service (prepared)
│   └── components/
│       └── AuthModal.jsx    # Auth modal (prepared)
├── supabase-schema.sql      # Database schema
├── vercel.json              # Vercel config
├── package.json             # Dependencies
├── .env.example             # Environment template
└── NOTION-ARCHIVE.md        # This documentation
```

---

## Key Components in App.jsx

### State Management

```javascript
// Auth state
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [showAuthModal, setShowAuthModal] = useState(false);

// Gallery state
const [artworks, setArtworks] = useState(defaultArtworks);
const [filter, setFilter] = useState('all');
const [selectedArt, setSelectedArt] = useState(null);
const [cart, setCart] = useState([]);

// Upload questionnaire state
const [pendingUploads, setPendingUploads] = useState([]);
const [questionnaireStep, setQuestionnaireStep] = useState(0);
const [answers, setAnswers] = useState({...});

// Series upload state
const [isSeriesMode, setIsSeriesMode] = useState(false);
const [seriesName, setSeriesName] = useState('');
const [seriesDescription, setSeriesDescription] = useState('');
const [individualNotes, setIndividualNotes] = useState({});
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `handleFileSelect` | Process uploaded images |
| `generateTitle` | AI-generate title from answers |
| `generateDescription` | AI-generate description from answers |
| `generateSeriesDescription` | AI-generate series description |
| `approveAndSave` | Save artwork to storage |
| `saveSeriesAndContinue` | Save entire series |
| `exportGalleryData` | Export to JSON |
| `exportToNotion` | Export to Notion markdown |
| `handleImportFile` | Import from JSON backup |

---

## Questionnaire Logic

### Mood Options
Peaceful, Energetic, Mysterious, Joyful, Melancholic, Dramatic, Playful, Contemplative

### Theme Options
Love, Nature, Identity, Dreams, Time, Freedom, Connection, Solitude, Transformation, Memory

### Style Options
Abstract, Realistic, Surreal, Minimalist, Expressive, Geometric, Organic, Digital

### Description Generation Algorithm

```javascript
const generateDescription = (answers) => {
  const openers = [
    `A ${mood} exploration of ${theme}`,
    `This ${style} piece captures the essence of ${theme}`,
    // ... more patterns
  ];

  const middles = [
    `through bold ${style} expression`,
    `with stunning visual harmony`,
    // ... more patterns
  ];

  const endings = inspiration ? [
    `Inspired by ${inspiration}, it invites viewers to ${message}.`,
    // ... more patterns
  ] : [
    `It invites viewers to ${message}.`,
    // ... more patterns
  ];

  // Random selection creates variety
  return `${opener} ${middle}. ${ending}`;
};
```

---

## Styling

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0b` | Main background |
| Card Background | `#141416` | Modals, cards |
| Amber | `#f59e0b` | Primary accent |
| Orange | `#f97316` | Gradient accent |
| White/10 | `rgba(255,255,255,0.1)` | Borders, subtle bg |

### Design Features
- Dark theme throughout
- Glassmorphism effects (backdrop-blur)
- Gradient backgrounds (amber to orange)
- Smooth animations (300-500ms transitions)
- Responsive grid (1-3 columns)
- Ambient gradient orbs in background

---

## Deployment

### Vercel Configuration

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Build Commands

```bash
npm run build    # Build for production
npm run dev      # Development server
npm run preview  # Preview production build
```

### Environment Variables (for Supabase)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Git History

| Commit | Description |
|--------|-------------|
| `bc84231` | Add series improvements and Notion export |
| `57b7f6e` | Add export/import functionality for gallery backup |
| `da7a527` | Complete HiPeR Gallery with auth, persistence, and series upload |
| `4b1eb86` | Initial commit: Prompt Repository React app |

---

## Supabase Schema (Prepared)

```sql
-- User Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Artworks
CREATE TABLE artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Unknown Artist',
  description TEXT,
  category TEXT DEFAULT 'Mixed Media',
  image_url TEXT NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 299,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security enabled
-- Storage bucket 'artworks' created
```

---

## Future Enhancements

### Ready to Implement
- [ ] Connect Supabase for real database storage
- [ ] Add image upload to Supabase Storage
- [ ] User profile pages
- [ ] Social sharing

### Potential Features
- [ ] Stripe payment integration
- [ ] Artist portfolios
- [ ] Artwork comments
- [ ] Favorites/wishlists
- [ ] Print fulfillment integration

---

## How to Use

### For Artists

1. **Sign Up** - Create account with email
2. **Upload Art** - Click "Upload" button
3. **Describe** - Answer questionnaire or upload description
4. **Approve** - Edit and confirm title/description
5. **Publish** - Artwork appears in gallery

### For Collectors

1. **Browse** - Scroll through gallery
2. **Filter** - Use category filters
3. **Select** - Click artwork for details
4. **Customize** - Choose size and frame
5. **Add to Cart** - Build your order
6. **Checkout** - Complete purchase

### Data Backup

1. **Log in** to your account
2. Click **profile icon** → **Settings**
3. Click **Export Gallery** for JSON backup
4. Click **Export to Notion** to copy markdown
5. Save JSON file to GitHub or cloud storage

---

## Support

- **GitHub Issues**: https://github.com/yuda420-dev/prompt-repository/issues
- **Live Site**: https://prompt-repository-orcin.vercel.app

---

*Documentation generated by Claude Code*
*Last updated: January 2026*
