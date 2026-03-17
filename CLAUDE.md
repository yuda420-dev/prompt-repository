# Prompt Repository — HiPeR Gallery (Standalone Source)

## Project Status
**Production-live** at https://prompt-repository-orcin.vercel.app
Build: clean, no errors.

## What This Is
AI-powered art gallery for uploading, describing, and showcasing artwork with AI-assisted descriptions. Features:
- Role-based permissions (Admin/Artist/Viewer)
- Series/folder grouping with drag-and-drop ordering
- Category filtering + sort (Curated/Newest/Oldest/A-Z) + **text search**
- Favorites system
- Prodigi print-on-demand integration
- Export/Import (JSON + Markdown)
- Supabase auth + storage (falls back to localStorage if unconfigured)

## Relationship to HiPeR (~/projects/apps/HiPeR/)

**This repo is the gallery-only standalone deployment.** Here's the full picture:

```
prompt-repository/src/App.jsx   (5264 lines) ← this repo, standalone gallery
HiPeR/gallery/src/App.jsx       (5264 lines) ← IDENTICAL COPY inside HiPeR monorepo
HiPeR/src/App.jsx               (6536 lines) ← MORE ADVANCED — gallery + shop merged
HiPeR/shop/                                  ← separate e-commerce app
```

### Should they be merged?
**No — keep separate.** The architecture is intentional:
- `prompt-repository` deploys as the **public gallery** (gallery.vercel.app)
- `HiPeR/shop` deploys as the **e-commerce shop** (hiper-shop.vercel.app)
- `HiPeR/src/App.jsx` (6536 lines) appears to be an **experimental merge** — it has Stripe/cart/orders baked in, but is not the production deployment of either app

**Gap to close:** `HiPeR/gallery/src/App.jsx` and this repo are in sync at 5264 lines. The `HiPeR/src/App.jsx` at 6536 lines is ahead (adds `loadSavedPrices`, `loadSavedShippingInfo`, Stripe cart state, shop analytics, order history). These are shop features and do NOT belong in the standalone gallery.

## Tech Stack
- React 19.2 / Vite 7.2
- Tailwind CSS 4.1 + PostCSS
- Supabase 2.89 (auth + database)
- dnd-kit (drag-and-drop)
- Lucide React (icons)
- Prodigi API (print-on-demand)
- Vercel deployment

## Key Files
```
src/
├── App.jsx              ← Main gallery UI (5264 lines)
├── services/
│   ├── ai.js            ← AI description generation
│   ├── database.js      ← Supabase operations
│   ├── auth.js          ← Authentication logic
│   ├── prodigi.js       ← Print-on-demand integration
│   └── analytics.js     ← Event tracking
├── components/
│   └── AuthModal.jsx    ← Login/signup modal
├── hooks/useAuth.js     ← Auth state hook
└── lib/supabase.js      ← Supabase client init
```

## Quick Start
```bash
npm install
npm run dev      # Local development
npm run build    # Production build
npm run lint     # ESLint
```

## GitHub
- Repo: yuda420-dev/prompt-repository
- Push requires: `gh auth switch --user yuda420-dev`

## Cross-Project Reference
- HiPeR project: ~/projects/apps/HiPeR/
- Shared patterns: ~/orginize/knowledge/patterns.md
- Master registry: ~/orginize/CLAUDE.md
- Documentation: NOTION-ARCHIVE.md
