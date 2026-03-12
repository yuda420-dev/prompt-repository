# Prompt Repository — AI Art Gallery (HiPeR Gallery Source)

## Project Scope
AI-powered art gallery application for uploading, describing, and showcasing artwork with AI-assisted description generation. Features role-based permissions (Admin/Artist/Viewer), series uploads, drag-and-drop ordering, and Prodigi print-on-demand integration.

**Note:** This is the source code for the HiPeR Gallery. The shop component lives at ~/projects/apps/HiPeR/shop/.

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
├── App.jsx              ← Main gallery UI (~254KB)
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

## Live URL
https://prompt-repository-orcin.vercel.app

## Notes
- Falls back to localStorage when Supabase not configured
- Related: HiPeR project (~/projects/apps/HiPeR/) contains both gallery + shop
- Documentation in NOTION-ARCHIVE.md

## Cross-Project Reference
- Shared patterns: ~/orginize/knowledge/patterns.md
- Master registry: ~/orginize/CLAUDE.md

## GitHub
- Repo: yuda420-dev/prompt-repository
- Push requires: `gh auth switch --user yuda420-dev`
