import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const defaultArtworks = [
  { id: 1, title: "Ethereal Dreams", artist: "HiPeR Gallery", style: "Abstract Expressionism", category: "abstract", description: "A mesmerizing exploration of color and form, where dreams meet reality in an ethereal dance of light.", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=800&fit=crop", isDefault: true },
  { id: 2, title: "Urban Solitude", artist: "HiPeR Gallery", style: "Contemporary Photography", category: "landscape", description: "Capturing the quiet moments in bustling cityscapes, where architecture meets human emotion.", image: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&h=800&fit=crop", isDefault: true },
  { id: 3, title: "Nature's Whisper", artist: "HiPeR Gallery", style: "Fine Art Nature", category: "nature", description: "An intimate portrait of nature's delicate beauty, frozen in a moment of perfect serenity.", image: "https://images.unsplash.com/photo-1518882605630-8b17b9c1d406?w=800&h=800&fit=crop", isDefault: true },
  { id: 4, title: "Digital Renaissance", artist: "HiPeR Gallery", style: "Digital Art / AI", category: "portrait", description: "Where classical artistry meets cutting-edge technology in a stunning visual synthesis.", image: "https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=800&h=800&fit=crop", isDefault: true },
  { id: 5, title: "Cosmic Reverie", artist: "HiPeR Gallery", style: "Surrealist Digital", category: "surreal", description: "Journey through impossible landscapes where physics bends to imagination.", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=800&fit=crop", isDefault: true },
  { id: 6, title: "Chromatic Flow", artist: "HiPeR Gallery", style: "Abstract Fluid Art", category: "abstract", description: "Vibrant colors cascade and merge in this hypnotic study of movement and harmony.", image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=800&h=800&fit=crop", isDefault: true },
];

// Sizes and frames - kept for future shop feature
const sizes = [
  { name: "Small", dimensions: '12" × 12"', price: 149, desc: "Perfect for intimate spaces" },
  { name: "Medium", dimensions: '24" × 24"', price: 299, desc: "Ideal statement piece" },
  { name: "Large", dimensions: '36" × 36"', price: 449, desc: "Gallery-worthy presence" },
  { name: "Grand", dimensions: '48" × 48"', price: 699, desc: "Museum-scale impact" },
];

const frames = [
  { name: "none", label: "Canvas Only", price: 0, color: "transparent" },
  { name: "black", label: "Matte Black", price: 89, color: "#1a1a1a" },
  { name: "white", label: "Gallery White", price: 89, color: "#f5f5f5" },
  { name: "natural", label: "Natural Oak", price: 119, color: "#c4a574" },
  { name: "walnut", label: "Dark Walnut", price: 119, color: "#5c4033" },
  { name: "gold", label: "Antique Gold", price: 149, color: "#d4af37" },
];

const categories = ['abstract', 'surreal', 'nature', 'portrait', 'landscape', 'geometric', 'minimal', 'digital', 'mixed-media'];

// User roles
const USER_ROLES = {
  ADMIN: 'admin',      // Can manage all artworks, users, and settings
  ARTIST: 'artist',    // Can upload, edit, delete their own artworks
  VIEWER: 'viewer',    // Can only view artworks, no upload/edit
};

const ROLE_LABELS = {
  admin: 'Administrator',
  artist: 'Artist',
  viewer: 'Viewer',
};

// Admin email
const ADMIN_EMAIL = 'hiper.6258@gmail.com';

// Permission helpers - get role from Supabase user_metadata or direct property
const getUserRole = (user) => {
  if (!user) return null;
  // Check if user is the admin
  if (user.email === ADMIN_EMAIL) return USER_ROLES.ADMIN;
  return user?.user_metadata?.role || user?.role || USER_ROLES.ARTIST;
};
const canUpload = (user) => {
  if (!user) return false;
  const role = getUserRole(user);
  return role === USER_ROLES.ADMIN || role === USER_ROLES.ARTIST;
};
const canEdit = (user, artwork) => {
  if (!user) return false;
  const role = getUserRole(user);
  if (role === USER_ROLES.ADMIN) return true;
  if (role === USER_ROLES.ARTIST && artwork.userId === user.id) return true;
  return false;
};
const canDelete = (user, artwork) => {
  if (!user) return false;
  const role = getUserRole(user);
  if (role === USER_ROLES.ADMIN) return true;
  if (role === USER_ROLES.ARTIST && artwork.userId === user.id) return true;
  return false;
};
const isAdmin = (user) => user && user.role === USER_ROLES.ADMIN;

const moodOptions = ['Peaceful', 'Energetic', 'Mysterious', 'Joyful', 'Melancholic', 'Dramatic', 'Playful', 'Contemplative'];
const themeOptions = ['Love', 'Nature', 'Identity', 'Dreams', 'Time', 'Freedom', 'Connection', 'Solitude', 'Transformation', 'Memory'];
const styleOptions = ['Abstract', 'Realistic', 'Surreal', 'Minimalist', 'Expressive', 'Geometric', 'Organic', 'Digital'];

// Preview limit for non-logged in users
const PREVIEW_LIMIT = 3;

// Enhanced description generator with more variety and poetic language
const generateDescription = (answers) => {
  const { mood, theme, style, inspiration, message } = answers;
  const m = mood?.toLowerCase() || 'contemplative';
  const t = theme?.toLowerCase() || 'beauty';
  const s = style?.toLowerCase() || 'expressive';

  // Mood-specific vocabulary
  const moodWords = {
    peaceful: ['serene', 'tranquil', 'gentle', 'calm', 'still'],
    energetic: ['vibrant', 'dynamic', 'pulsing', 'alive', 'electric'],
    mysterious: ['enigmatic', 'veiled', 'shadowed', 'hidden', 'cryptic'],
    joyful: ['radiant', 'bright', 'luminous', 'warm', 'celebratory'],
    melancholic: ['wistful', 'tender', 'haunting', 'bittersweet', 'soft'],
    dramatic: ['bold', 'striking', 'powerful', 'intense', 'commanding'],
    playful: ['whimsical', 'spirited', 'dancing', 'light', 'free'],
    contemplative: ['thoughtful', 'reflective', 'quiet', 'deep', 'meditative'],
  };

  const getRandomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const moodAdjectives = moodWords[m] || moodWords.contemplative;
  const adj1 = getRandomWord(moodAdjectives);
  const adj2 = getRandomWord(moodAdjectives.filter(w => w !== adj1));

  // Opening variations that feel more natural
  const openers = [
    `This ${s} piece draws the viewer into a ${adj1} meditation on ${t}`,
    `A ${adj1} exploration of ${t}, rendered through ${s} visual language`,
    `${t.charAt(0).toUpperCase() + t.slice(1)} takes form in this ${adj1} composition`,
    `Through layers of ${adj1} imagery, this work explores the nature of ${t}`,
    `The artist captures ${t} in its most ${adj1} form`,
    `A ${adj2} dialogue between ${m} emotion and ${t}`,
    `Here, ${t} unfolds with ${adj1} grace through ${s} expression`,
  ];

  // Middle sentences that add depth
  const middles = [
    `The composition balances tension and release, creating visual poetry that speaks without words.`,
    `Every element serves the whole, building toward a moment of ${adj2} revelation.`,
    `Color and form interweave, each stroke carrying the weight of intention.`,
    `The work breathes with an internal rhythm that pulls viewers deeper into its world.`,
    `Surface and depth play against each other, revealing new dimensions with each viewing.`,
    `The piece holds space for both movement and stillness, finding harmony in their dance.`,
    `Light becomes a character here, shaping mood and meaning through subtle gradations.`,
  ];

  // Endings that incorporate inspiration and message
  const endingsWithInspiration = inspiration ? [
    `Drawing inspiration from ${inspiration}, the artist invites us to ${message || 'see the world anew'}.`,
    `With ${inspiration} as a touchstone, the work asks: ${message || 'what does this moment mean to you'}?`,
    `Echoes of ${inspiration} resonate throughout, ultimately speaking to ${message || 'our shared experience of being'}.`,
    `The influence of ${inspiration} is felt in every choice, leading us toward ${message || 'a deeper understanding'}.`,
  ] : [
    `The work invites viewers to ${message || 'pause and let meaning emerge on its own terms'}.`,
    `Ultimately, it asks us to ${message || 'trust our own response to what we see'}.`,
    `This is art that rewards attention, ${message || 'offering new insights with each encounter'}.`,
    `It speaks to ${message || 'something universal yet deeply personal in the human experience'}.`,
  ];

  const opener = getRandomWord(openers);
  const middle = getRandomWord(middles);
  const ending = getRandomWord(endingsWithInspiration);

  return `${opener}. ${middle} ${ending}`;
};

// Enhanced title generator with more creative patterns
const generateTitle = (answers) => {
  const { mood, theme, style } = answers;
  const m = mood || 'Ethereal';
  const t = theme || 'Dreams';
  const s = style || 'Abstract';

  // More poetic and varied title patterns
  const titlePatterns = [
    // Simple poetic
    `${m} ${t}`,
    `The ${m} Hour`,
    `${t} Ascending`,
    `Where ${t} Lives`,
    // Evocative phrases
    `Whispers of ${t}`,
    `${m} Reverie`,
    `The Weight of ${t}`,
    `${t} in Motion`,
    // Roman numeral series style
    `Study in ${m}`,
    `${t}, Unfolding`,
    // Abstract/conceptual
    `After ${m}`,
    `Before ${t}`,
    `${s} Meditation`,
    // Poetic compounds
    `${m} Light`,
    `${t} Song`,
    `The ${t} Between`,
    `${m} Territory`,
    // One-word + modifier
    `${t}: A Reflection`,
    `On ${t}`,
    `Into ${m}`,
  ];

  return titlePatterns[Math.floor(Math.random() * titlePatterns.length)];
};

// Sortable wrapper component for artwork cards
function SortableArtworkCard({ id, children, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Sortable thumbnail for series reordering
function SortableSeriesThumbnail({ art, index, isActive, onClick, onMoveLeft, onMoveRight, isFirst, isLast, totalCount }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: art.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div className="relative group flex-shrink-0">
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
          isActive
            ? 'ring-2 ring-amber-500 scale-110'
            : 'opacity-60 hover:opacity-90'
        } ${isDragging ? 'ring-2 ring-white scale-105' : ''}`}
      >
        <img src={art.image} alt={art.title} className="w-full h-full object-cover" draggable={false} />
        {/* Position number badge */}
        <div className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/70 text-white/80 px-1 rounded">
          {index + 1}
        </div>
      </div>
      {/* Mobile-friendly move buttons (visible on touch devices) */}
      {isActive && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 md:hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveLeft?.(); }}
            disabled={isFirst}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${isFirst ? 'bg-white/10 text-white/30' : 'bg-amber-500 text-black'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveRight?.(); }}
            disabled={isLast}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${isLast ? 'bg-white/10 text-white/30' : 'bg-amber-500 text-black'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArtGallery() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState(USER_ROLES.ARTIST); // Default to artist
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Gallery state
  const [artworks, setArtworks] = useState(defaultArtworks);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('curated'); // curated (admin order), newest, oldest, title
  const [selectedArt, setSelectedArt] = useState(null);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedFrame, setSelectedFrame] = useState(1);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0); // For sliding in fullscreen
  const [fullscreenArtworks, setFullscreenArtworks] = useState([]); // Context for fullscreen sliding

  // Favorites state
  const [favorites, setFavorites] = useState([]);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState(null);
  const [customOrder, setCustomOrder] = useState(null); // Custom order for artworks (null = use default)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  // Upload questionnaire state
  const [pendingUploads, setPendingUploads] = useState([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [questionnaireStep, setQuestionnaireStep] = useState(0);
  const [answers, setAnswers] = useState({
    mood: '',
    theme: '',
    style: '',
    inspiration: '',
    message: '',
  });
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['abstract']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [useCustomDescription, setUseCustomDescription] = useState(false);

  // Series upload state
  const [isSeriesMode, setIsSeriesMode] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [seriesCategory, setSeriesCategory] = useState('abstract');

  // Series folder viewing state
  const [openSeries, setOpenSeries] = useState(null); // { name, artworks, currentIndex }
  const [seriesViewIndex, setSeriesViewIndex] = useState(0);
  const [individualNotes, setIndividualNotes] = useState({}); // { index: { title, note } }
  const [seriesStep, setSeriesStep] = useState(0); // 0: choose mode, 1: series info, 2: individual notes, 3: review
  const [seriesDeckRotation, setSeriesDeckRotation] = useState({}); // { seriesName: currentIndex } for auto-rotation

  // Settings/Export state
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Touch/swipe state for series carousel
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const fileInputRef = useRef(null);
  const galleryRef = useRef(null);
  const docInputRef = useRef(null);
  const importInputRef = useRef(null);
  const seriesDocInputRef = useRef(null);

  // Export gallery data to JSON file
  const exportGalleryData = () => {
    const userArtworks = artworks.filter(a => !a.isDefault);
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: user ? { email: user.email, name: user.name } : null,
      artworks: userArtworks.map(art => ({
        id: art.id,
        title: art.title,
        artist: art.artist,
        style: art.style,
        category: art.category,
        description: art.description,
        image: art.image,
        seriesName: art.seriesName || null,
        createdAt: art.createdAt || new Date().toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hiper-gallery-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMessage(`Exported ${userArtworks.length} artworks to JSON`);
  };

  // Export to Notion-friendly markdown
  const exportToNotion = () => {
    const userArtworks = artworks.filter(a => !a.isDefault);

    if (userArtworks.length === 0) {
      showToastMessage('No artworks to export', 'error');
      return;
    }

    // Group by series
    const series = {};
    const standalone = [];

    userArtworks.forEach(art => {
      if (art.seriesName) {
        if (!series[art.seriesName]) {
          series[art.seriesName] = [];
        }
        series[art.seriesName].push(art);
      } else {
        standalone.push(art);
      }
    });

    let markdown = `# HiPeR Gallery - Art Collection\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    // Series
    Object.entries(series).forEach(([seriesName, arts]) => {
      markdown += `## Series: ${seriesName}\n\n`;
      arts.forEach((art, i) => {
        markdown += `### ${i + 1}. ${art.title}\n\n`;
        markdown += `- **Category:** ${art.category}\n`;
        markdown += `- **Style:** ${art.style || 'N/A'}\n\n`;
        if (art.description) {
          markdown += `> ${art.description.replace(/\n/g, '\n> ')}\n\n`;
        }
        if (art.image && art.image.startsWith('http')) {
          markdown += `![${art.title}](${art.image})\n\n`;
        }
        markdown += `---\n\n`;
      });
    });

    // Standalone artworks
    if (standalone.length > 0) {
      markdown += `## Individual Works\n\n`;
      standalone.forEach((art, i) => {
        markdown += `### ${i + 1}. ${art.title}\n\n`;
        markdown += `- **Category:** ${art.category}\n`;
        markdown += `- **Style:** ${art.style || 'N/A'}\n\n`;
        if (art.description) {
          markdown += `> ${art.description.replace(/\n/g, '\n> ')}\n\n`;
        }
        if (art.image && art.image.startsWith('http')) {
          markdown += `![${art.title}](${art.image})\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      showToastMessage('Copied to clipboard! Paste in Notion.');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiper-gallery-notion-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToastMessage('Downloaded markdown file for Notion');
    });
  };

  // Import gallery data from JSON file
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.artworks || !Array.isArray(data.artworks)) {
        throw new Error('Invalid backup file format');
      }

      // Merge imported artworks with existing (avoid duplicates by title)
      const existingTitles = new Set(artworks.map(a => a.title));
      const newArtworks = data.artworks.filter(a => !existingTitles.has(a.title));

      if (newArtworks.length === 0) {
        showToastMessage('No new artworks to import', 'error');
        return;
      }

      // Add isNew flag and save to localStorage
      const artworksToAdd = newArtworks.map(a => ({ ...a, isNew: true }));
      setArtworks(prev => [...artworksToAdd, ...prev]);

      // Save to localStorage
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify([...artworksToAdd, ...savedArtworks]));

      showToastMessage(`Imported ${newArtworks.length} artworks!`);
      setShowSettings(false);
    } catch (err) {
      console.error('Import error:', err);
      showToastMessage('Failed to import: Invalid file format', 'error');
    }

    e.target.value = '';
  };

  // Handle series document upload
  const handleSeriesDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const firstLine = lines[0]?.trim() || '';

      // If first line is short (likely a title), use it as series name
      if (firstLine.length > 0 && firstLine.length < 100 && !firstLine.includes('.')) {
        setSeriesName(firstLine);
        setSeriesDescription(lines.slice(1).join('\n').trim());
      } else {
        setSeriesDescription(text.trim());
      }
      showToastMessage('Document loaded!');
    } catch (err) {
      showToastMessage('Could not read document', 'error');
    }
    e.target.value = '';
  };

  // Generate AI description for series
  const generateSeriesDescription = () => {
    const themes = ['journey', 'exploration', 'transformation', 'connection', 'reflection', 'discovery'];
    const adjectives = ['captivating', 'evocative', 'mesmerizing', 'thought-provoking', 'intimate', 'bold'];
    const approaches = [
      'examines the relationship between light and shadow',
      'explores the boundaries of perception',
      'captures fleeting moments of beauty',
      'invites viewers into a world of imagination',
      'challenges conventional perspectives',
      'celebrates the complexity of human experience'
    ];

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const approach = approaches[Math.floor(Math.random() * approaches.length)];

    const description = `This ${adj} series ${approach}. Each piece in this collection represents a unique perspective on the theme of ${theme}, while maintaining a cohesive visual language that ties the works together. The series invites contemplation and rewards close observation.`;

    setSeriesDescription(description);

    if (!seriesName) {
      const nameOptions = [
        `${theme.charAt(0).toUpperCase() + theme.slice(1)} Studies`,
        `Variations on ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
        `The ${adj.charAt(0).toUpperCase() + adj.slice(1)} Collection`,
      ];
      setSeriesName(nameOptions[Math.floor(Math.random() * nameOptions.length)]);
    }

    showToastMessage('Description generated!');
  };

  // Check auth state on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    // Load artworks for everyone (logged in or not)
    loadArtworksFromDatabase(null);

    // Check auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Reload artworks when auth changes to show user's own works
      loadArtworksFromDatabase(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard navigation for series carousel
  useEffect(() => {
    if (!openSeries) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSeriesArt();
      } else if (e.key === 'ArrowRight') {
        nextSeriesArt();
      } else if (e.key === 'Escape') {
        closeSeriesFolder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSeries, seriesViewIndex]);

  // Load artworks from localStorage (demo mode)
  const loadArtworksFromStorage = () => {
    const deletedIds = JSON.parse(localStorage.getItem('hiperGalleryDeletedIds') || '[]').map(id => String(id));
    const savedArtworks = localStorage.getItem('hiperGalleryArtworks');

    // Filter out deleted items from both defaults and saved
    const filteredDefaults = defaultArtworks.filter(art => !deletedIds.includes(String(art.id)));

    if (savedArtworks) {
      const parsed = JSON.parse(savedArtworks);
      const filteredSaved = parsed.filter(art => !deletedIds.includes(String(art.id)));
      setArtworks([...filteredDefaults, ...filteredSaved]);
    } else {
      setArtworks(filteredDefaults);
    }
  };

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('hiperGalleryFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = (artworkId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = prev.includes(artworkId)
        ? prev.filter(id => id !== artworkId)
        : [...prev, artworkId];
      localStorage.setItem('hiperGalleryFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (artworkId) => favorites.includes(artworkId);

  // Open fullscreen with sliding context
  const openFullscreen = (artwork, artworksList = null) => {
    const list = artworksList || artworks.filter(a => !a.seriesName); // Use provided list or all non-series artworks
    const index = list.findIndex(a => a.id === artwork.id);
    setFullscreenArtworks(list);
    setFullscreenIndex(index >= 0 ? index : 0);
    setFullscreenImage(artwork.image);
  };

  // Navigate in fullscreen
  const fullscreenPrev = () => {
    if (fullscreenIndex > 0) {
      const newIndex = fullscreenIndex - 1;
      setFullscreenIndex(newIndex);
      setFullscreenImage(fullscreenArtworks[newIndex]?.image);
    }
  };

  const fullscreenNext = () => {
    if (fullscreenIndex < fullscreenArtworks.length - 1) {
      const newIndex = fullscreenIndex + 1;
      setFullscreenIndex(newIndex);
      setFullscreenImage(fullscreenArtworks[newIndex]?.image);
    }
  };

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        fullscreenPrev();
      } else if (e.key === 'ArrowRight') {
        fullscreenNext();
      } else if (e.key === 'Escape') {
        setFullscreenImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, fullscreenIndex, fullscreenArtworks]);

  // Load artworks from Supabase
  const loadArtworksFromDatabase = async (userId) => {
    try {
      // Load all public artworks (is_public = true includes defaults and user uploads)
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get locally deleted IDs
      const localDeletedIds = JSON.parse(localStorage.getItem('hiperGalleryDeletedIds') || '[]');

      // Also get deleted IDs from Supabase (for cross-device sync)
      const dbDeletedIds = await loadDeletedIdsFromDB();

      // Merge both lists of deleted IDs (convert all to strings for consistent comparison)
      const allDeletedIds = [...new Set([...localDeletedIds, ...dbDeletedIds].map(id => String(id)))];

      // Update local storage with merged list
      localStorage.setItem('hiperGalleryDeletedIds', JSON.stringify(allDeletedIds));

      console.log('All deleted IDs:', allDeletedIds);

      if (data && data.length > 0) {
        const formattedArtworks = data
          .filter(art => !allDeletedIds.includes(String(art.id))) // Filter out deleted items (compare as strings)
          .map(art => ({
            id: art.id,
            title: art.title,
            artist: art.artist,
            style: art.category,
            category: art.category?.toLowerCase() || 'abstract',
            description: art.description,
            image: art.image_url,
            seriesName: art.series_name,
            isDefault: art.is_default,
            isNew: !art.is_default && art.user_id === userId,
            userId: art.user_id,
            user_id: art.user_id, // Keep both for compatibility
          }));

        // Also load localStorage artworks and merge (for items not in DB)
        const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
        const localOnlyArtworks = savedArtworks.filter(
          local => !allDeletedIds.includes(local.id) && !formattedArtworks.some(db => db.id === local.id)
        );

        setArtworks([...formattedArtworks, ...localOnlyArtworks]);
      } else {
        // No DB artworks, load from localStorage
        loadArtworksFromStorage();
      }
    } catch (err) {
      console.error('Error loading artworks:', err);
      // Fall back to localStorage
      loadArtworksFromStorage();
    }
  };

  // Save artwork to storage/database
  const saveArtwork = async (artwork, imageFile) => {
    if (!isSupabaseConfigured()) {
      // Demo mode - save to localStorage with userId for permission tracking
      const artworkWithUser = { ...artwork, userId: user?.id || 'demo-user' };
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      savedArtworks.unshift(artworkWithUser);
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify(savedArtworks));
      return artworkWithUser;
    }

    try {
      setUploadingImage(true);

      // Upload image to Supabase Storage
      let imageUrl = artwork.image;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('artworks')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Save artwork to database
      const { data, error } = await supabase
        .from('artworks')
        .insert({
          user_id: user.id,
          title: artwork.title,
          artist: user.email?.split('@')[0] || 'Artist',
          description: artwork.description,
          category: artwork.category,
          image_url: imageUrl,
          series_name: artwork.seriesName || null,
          is_default: false,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...artwork,
        id: data.id,
        image: imageUrl,
      };
    } catch (err) {
      console.error('Error saving artwork:', err);
      showToastMessage('Failed to save artwork', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete artwork from database (if it exists there)
  const deleteArtworkFromDB = async (id, artwork) => {
    // If Supabase is not configured, just return success (we'll handle localStorage separately)
    if (!isSupabaseConfigured()) {
      return { success: true, fromDB: false };
    }

    const isUserAdmin = getUserRole(user) === USER_ROLES.ADMIN;

    // Try to delete from artworks table
    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id);

      if (!error) {
        console.log('Successfully deleted from Supabase');
        return { success: true, fromDB: true };
      }

      console.error('Supabase delete error:', error);
    } catch (err) {
      console.error('Error deleting from artworks table:', err);
    }

    // If direct delete failed and user is admin, try to mark as deleted in a separate table
    if (isUserAdmin) {
      try {
        // Try to insert into deleted_artworks table (for cross-device sync)
        // Store ID as string
        const { error: insertError } = await supabase
          .from('deleted_artworks')
          .upsert({
            artwork_id: String(id),
            deleted_by: user.email,
            deleted_at: new Date().toISOString()
          });

        if (!insertError) {
          console.log('Marked as deleted in deleted_artworks table, ID:', String(id));
          return { success: true, fromDB: true, markedDeleted: true };
        }
        console.error('Could not mark as deleted:', insertError);
      } catch (err) {
        console.error('Error marking as deleted:', err);
      }
    }

    // Return success anyway - we'll handle it locally
    return { success: true, fromDB: false };
  };

  // Load deleted artwork IDs from Supabase (for cross-device sync)
  const loadDeletedIdsFromDB = async () => {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('deleted_artworks')
        .select('artwork_id');

      if (error) {
        console.error('Error fetching deleted_artworks:', error);
        return [];
      }

      if (data && data.length > 0) {
        console.log('Loaded deleted IDs from Supabase:', data);
        // Return both string and number versions to handle type mismatches
        const ids = data.map(d => d.artwork_id);
        return ids;
      }
      return [];
    } catch (err) {
      console.error('Error loading deleted IDs:', err);
    }
    return [];
  };

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    if (!isSupabaseConfigured()) {
      // Demo mode - retrieve stored user with role
      const storedUser = localStorage.getItem('hiperGalleryUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.email === authEmail) {
          setUser(parsed);
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
          showToastMessage(`Welcome back, ${ROLE_LABELS[parsed.role] || 'User'}!`);
          setAuthSubmitting(false);
          return;
        }
      }
      // No matching user found, create new with default artist role
      const demoUser = {
        id: Date.now().toString(),
        email: authEmail,
        name: authEmail.split('@')[0],
        role: USER_ROLES.ARTIST,
      };
      setUser(demoUser);
      localStorage.setItem('hiperGalleryUser', JSON.stringify(demoUser));
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      showToastMessage(`Welcome, ${ROLE_LABELS[demoUser.role]}!`);
      setAuthSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) throw error;

      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      showToastMessage('Welcome back!');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    if (!isSupabaseConfigured()) {
      // Demo mode
      const demoUser = {
        id: Date.now().toString(),
        email: authEmail,
        name: authName || authEmail.split('@')[0],
        role: authRole,
      };
      setUser(demoUser);
      localStorage.setItem('hiperGalleryUser', JSON.stringify(demoUser));
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthRole(USER_ROLES.ARTIST);
      showToastMessage(`Welcome to HiPeR Gallery as ${ROLE_LABELS[authRole]}!`);
      setAuthSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            name: authName,
            role: authRole,
          },
        },
      });

      if (error) throw error;

      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthRole(USER_ROLES.ARTIST);
      showToastMessage('Account created! Check your email to confirm.');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('hiperGalleryUser');
      setUser(null);
      setArtworks(defaultArtworks);
      showToastMessage('Logged out');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setArtworks(defaultArtworks);
    showToastMessage('Logged out');
  };

  // Determine which artworks to show based on login status
  const getVisibleArtworks = () => {
    if (user) {
      return artworks;
    }
    // Show only preview (first few) for non-logged in users
    return artworks.slice(0, PREVIEW_LIMIT);
  };

  const visibleArtworks = getVisibleArtworks();
  const filteredArt = (() => {
    if (filter === 'all') return visibleArtworks;
    if (filter === 'favorites') return visibleArtworks.filter(a => favorites.includes(a.id));
    if (filter === 'my-artworks') return visibleArtworks.filter(a => a.userId === user?.id);
    return visibleArtworks.filter(a => a.category === filter);
  })();
  const hasMoreArtworks = !user && artworks.length > PREVIEW_LIMIT;

  // Group artworks by series for folder display
  const getGalleryItems = () => {
    const seriesMap = {};
    const standalone = [];

    filteredArt.forEach(art => {
      if (art.seriesName) {
        if (!seriesMap[art.seriesName]) {
          seriesMap[art.seriesName] = {
            type: 'series',
            name: art.seriesName,
            artworks: [],
            category: art.category,
          };
        }
        seriesMap[art.seriesName].artworks.push(art);
      } else {
        standalone.push({ type: 'artwork', ...art });
      }
    });

    // Convert series map to array and interleave with standalone
    const seriesFolders = Object.values(seriesMap);
    const items = [...seriesFolders, ...standalone];

    // Sort based on sortBy preference (skip for 'curated' as it uses custom order)
    if (sortBy !== 'curated') {
      items.sort((a, b) => {
        const aId = a.type === 'series' ? Math.max(...a.artworks.map(x => x.id)) : a.id;
        const bId = b.type === 'series' ? Math.max(...b.artworks.map(x => x.id)) : b.id;
        const aTitle = a.type === 'series' ? a.name : a.title;
        const bTitle = b.type === 'series' ? b.name : b.title;

        switch (sortBy) {
          case 'oldest':
            return aId - bId;
          case 'title':
            return aTitle.localeCompare(bTitle);
          case 'newest':
          default:
            return bId - aId;
        }
      });
    }

    return items;
  };

  const galleryItems = getGalleryItems();

  // Apply custom order only when in 'curated' mode and custom order exists
  const orderedGalleryItems = (sortBy === 'curated' && customOrder)
    ? customOrder.map(id => galleryItems.find(item => (item.type === 'series' ? `series-${item.name}` : item.id) === id)).filter(Boolean)
    : galleryItems;

  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    // Only allow reordering in curated mode
    if (sortBy !== 'curated') {
      showToastMessage('Switch to Curated sort to reorder', 'error');
      return;
    }

    if (over && active.id !== over.id) {
      const getItemId = (item) => item.type === 'series' ? `series-${item.name}` : item.id;
      const oldIndex = orderedGalleryItems.findIndex(item => getItemId(item) === active.id);
      const newIndex = orderedGalleryItems.findIndex(item => getItemId(item) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedGalleryItems.map(getItemId), oldIndex, newIndex);
        setCustomOrder(newOrder);
        // Save to localStorage
        localStorage.setItem('hiperGalleryOrder', JSON.stringify(newOrder));
        showToastMessage('Gallery order saved');
      }
    }
  };

  // Load custom order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('hiperGalleryOrder');
    if (savedOrder) {
      try {
        setCustomOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error('Error loading custom order:', e);
      }
    }
  }, []);

  // Get unique IDs for sortable context
  const sortableIds = orderedGalleryItems.map(item =>
    item.type === 'series' ? `series-${item.name}` : item.id
  );

  // Find active item for drag overlay
  const activeItem = activeId ? orderedGalleryItems.find(item =>
    (item.type === 'series' ? `series-${item.name}` : item.id) === activeId
  ) : null;

  // Track which series is being hovered for rotation
  const [hoveredSeries, setHoveredSeries] = useState(null);
  const hoverIntervalRef = useRef(null);

  // Rotate series cards on hover every 3 seconds
  useEffect(() => {
    if (hoveredSeries) {
      // Start rotation interval for hovered series
      hoverIntervalRef.current = setInterval(() => {
        setSeriesDeckRotation(prev => {
          const series = orderedGalleryItems.find(item => item.type === 'series' && item.name === hoveredSeries);
          if (!series) return prev;
          return {
            ...prev,
            [hoveredSeries]: ((prev[hoveredSeries] || 0) + 1) % series.artworks.length,
          };
        });
      }, 3000); // Rotate every 3 seconds on hover
    } else {
      // Clear interval when not hovering
      if (hoverIntervalRef.current) {
        clearInterval(hoverIntervalRef.current);
        hoverIntervalRef.current = null;
      }
    }

    return () => {
      if (hoverIntervalRef.current) {
        clearInterval(hoverIntervalRef.current);
      }
    };
  }, [hoveredSeries, orderedGalleryItems]);

  // Open a series folder
  const openSeriesFolder = (series) => {
    setOpenSeries(series);
    setSeriesViewIndex(0);
  };

  // Navigate within series
  const nextSeriesArt = () => {
    if (openSeries && seriesViewIndex < openSeries.artworks.length - 1) {
      setSeriesViewIndex(prev => prev + 1);
    }
  };

  const prevSeriesArt = () => {
    if (openSeries && seriesViewIndex > 0) {
      setSeriesViewIndex(prev => prev - 1);
    }
  };

  const closeSeriesFolder = () => {
    setOpenSeries(null);
    setSeriesViewIndex(0);
  };

  // Reorder artworks within a series (admin only)
  const reorderSeriesArtwork = async (seriesName, fromIndex, toIndex) => {
    if (!user || getUserRole(user) !== USER_ROLES.ADMIN) return;
    if (fromIndex === toIndex) return;

    // Get artworks in the series
    const seriesArtworks = artworks.filter(a => a.seriesName === seriesName);
    const reordered = arrayMove(seriesArtworks, fromIndex, toIndex);

    // Update order field for each artwork in the series
    const updatedArtworks = artworks.map(art => {
      if (art.seriesName === seriesName) {
        const newOrder = reordered.findIndex(a => a.id === art.id);
        return { ...art, seriesOrder: newOrder };
      }
      return art;
    });

    setArtworks(updatedArtworks);

    // Update openSeries if it's the current series
    if (openSeries && openSeries.name === seriesName) {
      setOpenSeries(prev => ({
        ...prev,
        artworks: reordered.map((a, i) => ({ ...a, seriesOrder: i })),
      }));
    }

    // Save to localStorage
    const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
    const updatedSaved = savedArtworks.map(art => {
      if (art.seriesName === seriesName) {
        const newOrder = reordered.findIndex(a => a.id === art.id);
        return { ...art, seriesOrder: newOrder };
      }
      return art;
    });
    localStorage.setItem('hiperGalleryArtworks', JSON.stringify(updatedSaved));

    showToastMessage('Series order updated');
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle multiple file selection - requires upload permission
  const handleFileSelect = (e) => {
    if (!canUpload(user)) {
      if (!user) {
        setShowAuthModal(true);
        showToastMessage('Please log in to upload artwork', 'error');
      } else {
        showToastMessage('Viewers cannot upload artwork. Please sign up as an Artist.', 'error');
      }
      return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploads = files
      .filter(file => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        originalName: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      }));

    if (uploads.length > 0) {
      setPendingUploads(uploads);
      setCurrentUploadIndex(0);
      setQuestionnaireStep(0);
      setAnswers({ mood: '', theme: '', style: '', inspiration: '', message: '' });
      setGeneratedTitle('');
      setGeneratedDescription('');
      setSelectedCategories(['abstract']);
      // Reset series state
      setIsSeriesMode(false);
      setSeriesStep(uploads.length > 1 ? 0 : -1); // Show mode selection only for multiple images
      setSeriesName('');
      setSeriesDescription('');
      setSeriesCategory('abstract');
      setIndividualNotes({});
    }

    e.target.value = '';
  };

  const currentUpload = pendingUploads[currentUploadIndex];

  // Series mode functions
  const startSeriesMode = () => {
    setIsSeriesMode(true);
    setSeriesStep(1); // Go to series info step
  };

  const startIndividualMode = () => {
    setIsSeriesMode(false);
    setSeriesStep(-1); // Skip series, go to normal questionnaire
  };

  const saveSeriesAndContinue = async () => {
    setUploadingImage(true);

    const savedArtworks = [];
    for (let i = 0; i < pendingUploads.length; i++) {
      const upload = pendingUploads[i];
      const notes = individualNotes[i] || {};

      const newArtwork = {
        id: Date.now() + i,
        title: notes.title || `${seriesName} #${i + 1}`,
        artist: user?.email?.split('@')[0] || 'Artist',
        style: seriesName,
        category: seriesCategory,
        description: notes.note
          ? `${seriesDescription}\n\n---\n\n${notes.note}`
          : seriesDescription,
        image: upload.preview,
        isNew: true,
        seriesName: seriesName,
      };

      const saved = await saveArtwork(newArtwork, upload.file);
      if (saved) {
        savedArtworks.push(saved);
      }
    }

    setArtworks(prev => [...savedArtworks, ...prev]);
    setPendingUploads([]);
    setCurrentUploadIndex(0);
    setIsSeriesMode(false);
    setSeriesStep(0);
    setSeriesName('');
    setSeriesDescription('');
    setIndividualNotes({});
    setUploadingImage(false);

    showToastMessage(`Series "${seriesName}" with ${savedArtworks.length} artworks added!`);
    setTimeout(() => scrollToGallery(), 300);
  };

  const updateIndividualNote = (index, field, value) => {
    setIndividualNotes(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  };

  const handleAnswerSelect = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  // Handle document upload for custom description
  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Try to extract title from first line if it looks like a title
      const lines = text.trim().split('\n');
      const firstLine = lines[0]?.trim() || '';

      // If first line is short (likely a title), use it as title
      if (firstLine.length > 0 && firstLine.length < 100 && !firstLine.includes('.')) {
        setCustomTitle(firstLine);
        setCustomDescription(lines.slice(1).join('\n').trim());
      } else {
        setCustomTitle('');
        setCustomDescription(text.trim());
      }
      setUseCustomDescription(true);
      showToastMessage('Document loaded! Review and edit below.');
    } catch (err) {
      showToastMessage('Could not read document', 'error');
    }
    e.target.value = '';
  };

  // Skip questionnaire and go directly to approval with custom content
  const skipToCustomApproval = () => {
    setGeneratedTitle(customTitle || currentUpload?.originalName || 'Untitled');
    setGeneratedDescription(customDescription);
    setQuestionnaireStep(5); // Go to approval step
  };

  const nextStep = () => {
    if (questionnaireStep < 4) {
      setQuestionnaireStep(prev => prev + 1);
    } else {
      // Generate title and description
      const title = generateTitle(answers);
      const description = generateDescription(answers);
      setGeneratedTitle(title);
      setGeneratedDescription(description);
      setQuestionnaireStep(5); // Approval step
    }
  };

  const prevStep = () => {
    if (questionnaireStep > 0) {
      setQuestionnaireStep(prev => prev - 1);
    }
  };

  const regenerateSuggestions = () => {
    setGeneratedTitle(generateTitle(answers));
    setGeneratedDescription(generateDescription(answers));
  };

  const approveAndSave = async () => {
    const newArtwork = {
      id: Date.now(),
      title: generatedTitle,
      artist: user?.email?.split('@')[0] || 'Artist',
      style: `${answers.style} / ${answers.mood}`,
      category: selectedCategories[0] || 'abstract',
      categories: selectedCategories,
      description: generatedDescription,
      image: currentUpload.preview,
      isNew: true
    };

    // Save to database/storage
    const savedArtwork = await saveArtwork(newArtwork, currentUpload.file);

    if (savedArtwork) {
      setArtworks(prev => [savedArtwork, ...prev]);
    }

    // Move to next upload or finish
    if (currentUploadIndex < pendingUploads.length - 1) {
      setCurrentUploadIndex(prev => prev + 1);
      setQuestionnaireStep(0);
      setAnswers({ mood: '', theme: '', style: '', inspiration: '', message: '' });
      setGeneratedTitle('');
      setGeneratedDescription('');
      setSelectedCategories(['abstract']);
      setCustomTitle('');
      setCustomDescription('');
      setUseCustomDescription(false);
    } else {
      // All done
      setPendingUploads([]);
      setCurrentUploadIndex(0);
      setCustomTitle('');
      setCustomDescription('');
      setUseCustomDescription(false);
      showToastMessage(`${pendingUploads.length} artwork${pendingUploads.length > 1 ? 's' : ''} added to gallery!`);
      setTimeout(() => scrollToGallery(), 300);
    }
  };

  const skipCurrentUpload = () => {
    if (currentUploadIndex < pendingUploads.length - 1) {
      setCurrentUploadIndex(prev => prev + 1);
      setQuestionnaireStep(0);
      setAnswers({ mood: '', theme: '', style: '', inspiration: '', message: '' });
      setCustomTitle('');
      setCustomDescription('');
      setUseCustomDescription(false);
    } else {
      setPendingUploads([]);
      setCurrentUploadIndex(0);
      setCustomTitle('');
      setCustomDescription('');
      setUseCustomDescription(false);
    }
  };

  const cancelAllUploads = () => {
    setPendingUploads([]);
    setCurrentUploadIndex(0);
    setQuestionnaireStep(0);
    setCustomTitle('');
    setCustomDescription('');
    setUseCustomDescription(false);
  };

  const openArtDetail = (art) => {
    setSelectedArt(art);
    setSelectedSize(1);
    setSelectedFrame(1);
    setEditingArt(null);
    setTimeout(() => setIsModalOpen(true), 10);
  };

  const openEditModal = (art, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    // Only admin can edit default artworks
    if (art.isDefault && getUserRole(user) !== USER_ROLES.ADMIN) return;
    // Initialize with proper defaults to prevent flashing/uncontrolled inputs
    setEditingArt({
      ...art,
      title: art.title || '',
      style: art.style || '',
      description: art.description || '',
      seriesName: art.seriesName || '',
      categories: art.categories || (art.category ? [art.category] : ['abstract']),
    });
    setSelectedArt(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedArt(null);
      setEditingArt(null);
    }, 300);
  };

  const saveArtworkEdit = async () => {
    if (!editingArt.title.trim()) {
      showToastMessage('Please add a title', 'error');
      return;
    }

    // Use primary category (first in array) or fallback
    const primaryCategory = editingArt.categories?.[0] || editingArt.category || 'abstract';
    const updatedArt = {
      ...editingArt,
      category: primaryCategory,
      categories: editingArt.categories || [primaryCategory],
    };

    if (isSupabaseConfigured() && user) {
      try {
        const isUserAdmin = getUserRole(user) === USER_ROLES.ADMIN;
        let query = supabase
          .from('artworks')
          .update({
            title: updatedArt.title,
            description: updatedArt.description || '',
            category: primaryCategory,
            style: updatedArt.style || '',
            series_name: updatedArt.seriesName || null,
          })
          .eq('id', updatedArt.id);

        // Admin can update any artwork, others only their own
        if (!isUserAdmin) {
          query = query.eq('user_id', user.id);
        }

        await query;
      } catch (err) {
        console.error('Error updating artwork:', err);
      }
    } else {
      // Update localStorage
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      const updated = savedArtworks.map(a => a.id === updatedArt.id ? updatedArt : a);
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify(updated));
    }

    setArtworks(prev => prev.map(a =>
      a.id === updatedArt.id
        ? { ...updatedArt, isNew: false }
        : a
    ));
    showToastMessage('Artwork updated');
    closeModal();
  };

  const deleteArtwork = async (id, e) => {
    if (e) e.stopPropagation();
    const art = artworks.find(a => a.id === id);
    if (!art) {
      showToastMessage('Artwork not found', 'error');
      return;
    }

    if (!user) {
      showToastMessage('Please sign in to delete artworks', 'error');
      return;
    }

    const userRole = getUserRole(user);

    // Only admin can delete default artworks
    if (art.isDefault && userRole !== USER_ROLES.ADMIN) {
      showToastMessage('Only admins can delete gallery artworks', 'error');
      return;
    }

    // Artists can only delete their own artworks (check both userId and user_id)
    const artOwnerId = art.userId || art.user_id;
    if (userRole === USER_ROLES.ARTIST && artOwnerId && artOwnerId !== user.id) {
      showToastMessage('You can only delete your own artworks', 'error');
      return;
    }

    // Viewers cannot delete at all
    if (userRole === USER_ROLES.VIEWER) {
      showToastMessage('You do not have permission to delete artworks', 'error');
      return;
    }

    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${art.title}"? This cannot be undone.`)) {
      return;
    }

    // Delete from database if configured (pass the artwork for context)
    await deleteArtworkFromDB(id, art);

    // Always proceed with local deletion regardless of DB result
    // Remove from localStorage artworks
    const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
    const updatedSaved = savedArtworks.filter(a => a.id !== id);
    localStorage.setItem('hiperGalleryArtworks', JSON.stringify(updatedSaved));

    // Remove from custom order if present
    const savedOrder = JSON.parse(localStorage.getItem('hiperGalleryCustomOrder') || '[]');
    const updatedOrder = savedOrder.filter(orderId => orderId !== id);
    localStorage.setItem('hiperGalleryCustomOrder', JSON.stringify(updatedOrder));

    // Track deleted IDs so they don't come back from database on refresh
    // Store as strings for consistent comparison
    const deletedIds = JSON.parse(localStorage.getItem('hiperGalleryDeletedIds') || '[]').map(i => String(i));
    const idStr = String(id);
    if (!deletedIds.includes(idStr)) {
      deletedIds.push(idStr);
      localStorage.setItem('hiperGalleryDeletedIds', JSON.stringify(deletedIds));
    }
    console.log('Deleted ID added:', idStr, 'All deleted:', deletedIds);

    // Update state
    setArtworks(prev => prev.filter(a => a.id !== id));
    showToastMessage('Artwork deleted successfully');
  };

  const addToCart = () => {
    const item = {
      id: Date.now(),
      artwork: selectedArt,
      size: sizes[selectedSize],
      frame: frames[selectedFrame],
      total: sizes[selectedSize].price + frames[selectedFrame].price
    };
    setCart([...cart, item]);
    showToastMessage(`Added to cart`);
    closeModal();
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
    showToastMessage('Removed from cart');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const total = cartTotal;
    const itemCount = cart.length;
    setCart([]);
    setShowCart(false);
    showToastMessage(`Order placed! ${itemCount} item${itemCount > 1 ? 's' : ''} for $${total}`);
  };

  const clearCart = () => {
    setCart([]);
    showToastMessage('Cart cleared');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Questionnaire questions
  const questions = [
    {
      title: "What mood does this piece evoke?",
      subtitle: "Select the primary emotion",
      field: 'mood',
      options: moodOptions,
    },
    {
      title: "What theme does it explore?",
      subtitle: "What's at the heart of this work?",
      field: 'theme',
      options: themeOptions,
    },
    {
      title: "How would you describe the style?",
      subtitle: "The visual approach",
      field: 'style',
      options: styleOptions,
    },
    {
      title: "What inspired this piece?",
      subtitle: "A place, person, moment, or idea (optional)",
      field: 'inspiration',
      isText: true,
      placeholder: "e.g., A sunset in Bali, My grandmother's garden, A recurring dream...",
    },
    {
      title: "What do you want viewers to feel or understand?",
      subtitle: "The message or takeaway (optional)",
      field: 'message',
      isText: true,
      placeholder: "e.g., That beauty exists in imperfection, To feel connected to nature...",
    },
  ];

  const currentQuestion = questions[questionnaireStep];
  const canProceed = questionnaireStep >= 3 || answers[currentQuestion?.field];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased">
      {/* Subtle ambient gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-[200px]" />
      </div>

      {/* Hidden file input for multiple uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden file input for document upload */}
      <input
        ref={docInputRef}
        type="file"
        accept=".txt,.doc,.docx,.md,.rtf"
        onChange={handleDocUpload}
        className="hidden"
      />

      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Hidden file input for series document */}
      <input
        ref={seriesDocInputRef}
        type="file"
        accept=".txt,.doc,.docx,.md,.rtf"
        onChange={handleSeriesDocUpload}
        className="hidden"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-500">
        <div className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/5" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">HiPeR</span>
                <span className="text-white/40 font-light ml-1.5">Gallery</span>
              </h1>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={scrollToGallery} className="text-sm text-white/60 hover:text-white transition-colors">Collection</button>
            {canUpload(user) && (
              <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white/60 hover:text-white transition-colors">Upload</button>
            )}
            <button onClick={() => setShowAbout(true)} className="text-sm text-white/60 hover:text-white transition-colors">About</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {canUpload(user) && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Upload</span>
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-[#0a0a0b]">
                      {user.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <span className="text-sm text-white/70 hidden sm:block">{user.name || user.email?.split('@')[0]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:block ${
                      user.role === USER_ROLES.ADMIN ? 'bg-red-500/20 text-red-400' :
                      user.role === USER_ROLES.ARTIST ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ROLE_LABELS[user.role] || 'Artist'}
                    </span>
                    <svg className={`w-4 h-4 text-white/50 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 py-2 bg-[#1a1a1c] rounded-xl border border-white/10 shadow-xl z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                    {/* Role badge in dropdown for mobile */}
                    <div className="px-4 py-2 border-b border-white/10 sm:hidden">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === USER_ROLES.ADMIN ? 'bg-red-500/20 text-red-400' :
                        user.role === USER_ROLES.ARTIST ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {ROLE_LABELS[user.role] || 'Artist'}
                      </span>
                    </div>
                    {/* My Favorites */}
                    <button
                      onClick={() => { setFilter('favorites'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      My Favorites
                      {favorites.length > 0 && (
                        <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{favorites.length}</span>
                      )}
                    </button>
                    {/* My Artworks - for artists */}
                    {canUpload(user) && (
                      <button
                        onClick={() => { setFilter('my-artworks'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        My Artworks
                      </button>
                    )}
                    <div className="border-t border-white/10 my-1" />
                    {/* Analytics - Admin only */}
                    {getUserRole(user) === USER_ROLES.ADMIN && (
                      <button
                        onClick={() => { setShowAnalytics(true); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analytics
                      </button>
                    )}
                    <button
                      onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => { handleLogout(); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                  )}
                  {/* Click outside overlay to close dropdown */}
                  {showUserMenu && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Sign In</span>
              </button>
            )}
            {/* Cart button - hidden for now, will enable with shop features later */}
            {/* <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-[#0a0a0b] text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cart.length}
                </span>
              )}
            </button> */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-sm text-white/60">Curated Digital Art Collection</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
            <span className="text-white/90">Where Art Comes</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent font-normal">To Life</span>
          </h2>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            A curated gallery for digital creators. Upload your work, let AI craft the perfect description, and showcase your art in beautifully organized collections.
          </p>

          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="group px-8 py-4 rounded-full bg-white text-[#0a0a0b] font-medium transition-all duration-300 hover:shadow-xl hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In to Upload
              <svg className="inline-block w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Filters & Sorting */}
      <nav ref={galleryRef} className="px-6 lg:px-8 pb-12 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Category filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', ...categories].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    filter === f
                      ? 'bg-white text-[#0a0a0b]'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-transparent hover:border-white/10'
                  }`}
                >
                  {f === 'all' ? 'All Works' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/40 text-sm">Sort:</span>
              {[
                { value: 'curated', label: 'Curated' },
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'title', label: 'A-Z' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    sortBy === s.value
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Gallery Grid */}
      <main className="px-6 lg:px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Gallery Items - Series Folders & Standalone Artworks */}
                {orderedGalleryItems.map((item, index) => (
                  <SortableArtworkCard
                    key={item.type === 'series' ? `series-${item.name}` : item.id}
                    id={item.type === 'series' ? `series-${item.name}` : item.id}
                    disabled={!user || getUserRole(user) !== USER_ROLES.ADMIN}
                  >
                    {item.type === 'series' ? (
                      // Series Card - Stacked Deck Style with hover rotation
                      <article
                        onClick={() => openSeriesFolder(item)}
                        onMouseEnter={() => setHoveredSeries(item.name)}
                        onMouseLeave={() => setHoveredSeries(null)}
                        className="group relative cursor-pointer transition-all duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                  {(() => {
                    const rotationIndex = seriesDeckRotation[item.name] || 0;
                    const getRotatedArtwork = (offset) => {
                      const idx = (rotationIndex + offset) % item.artworks.length;
                      return item.artworks[idx];
                    };
                    return (
                  <div className="aspect-[4/5] relative pt-3 pl-3">
                    {/* Background cards - fanned out for deck effect with rotation */}
                    {item.artworks.length > 2 && (
                      <div
                        className="absolute rounded-2xl overflow-hidden shadow-lg transition-all duration-700 group-hover:translate-x-4 group-hover:-translate-y-2"
                        style={{
                          top: '-4px',
                          left: '-4px',
                          right: '20px',
                          bottom: '20px',
                          zIndex: 1,
                          transform: 'rotate(-8deg) translateX(-8px)',
                        }}
                      >
                        <div className="w-full h-full bg-[#1a1a1c]">
                          <img
                            src={getRotatedArtwork(2)?.image}
                            alt=""
                            className="w-full h-full object-cover opacity-80 transition-opacity duration-700"
                          />
                        </div>
                      </div>
                    )}

                    {item.artworks.length > 1 && (
                      <div
                        className="absolute rounded-2xl overflow-hidden shadow-lg transition-all duration-700 group-hover:translate-x-3 group-hover:-translate-y-1"
                        style={{
                          top: '4px',
                          left: '4px',
                          right: '16px',
                          bottom: '16px',
                          zIndex: 2,
                          transform: 'rotate(-4deg) translateX(-4px)',
                        }}
                      >
                        <div className="w-full h-full bg-[#1a1a1c]">
                          <img
                            src={getRotatedArtwork(1)?.image}
                            alt=""
                            className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
                          />
                        </div>
                      </div>
                    )}

                    {/* Top card - main visible card with rotation animation */}
                    <div
                      className="absolute rounded-2xl overflow-hidden shadow-2xl ring-2 ring-amber-500/40 group-hover:ring-amber-500/70 transition-all duration-500 group-hover:shadow-amber-500/20 group-hover:translate-x-1"
                      style={{
                        top: '12px',
                        left: '12px',
                        right: '12px',
                        bottom: '12px',
                        zIndex: 3,
                      }}
                    >
                      <div className="w-full h-full relative">
                        <img
                          src={getRotatedArtwork(0)?.image}
                          alt={getRotatedArtwork(0)?.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />

                        {/* Series badge */}
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {item.artworks.length}
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Info at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/70 mb-2 capitalize">
                            {item.category}
                          </span>
                          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{item.name}</h3>
                        </div>

                        {/* Tap to open indicator */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <span className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold shadow-xl">
                            View Series
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                      </article>
                    ) : (
                      // Regular Artwork Card
                      <article
                        onClick={() => openArtDetail(item)}
                        className={`group relative bg-[#111113] rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${item.isNew ? 'ring-2 ring-amber-500/50' : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                  {/* New badge */}
                  {item.isNew && (
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 text-[#0a0a0b] text-xs font-bold rounded-full">
                      NEW
                    </div>
                  )}

                  {/* Star/Favorite button - always visible, bottom left */}
                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className={`absolute bottom-20 left-4 z-10 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
                      isFavorite(item.id)
                        ? 'bg-amber-500 text-black'
                        : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100'
                    } ${isFavorite(item.id) ? 'opacity-100' : ''}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isFavorite(item.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Edit & Delete buttons - based on user permissions (admin can edit/delete all) */}
                  {/* Always visible for admin, hover for others (touch-friendly) */}
                  {(canEdit(user, item) || canDelete(user, item)) && (!item.isDefault || getUserRole(user) === USER_ROLES.ADMIN) && (
                    <div className={`absolute top-4 right-4 z-10 flex gap-2 transition-opacity duration-300 ${getUserRole(user) === USER_ROLES.ADMIN ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {canEdit(user, item) && (
                        <button
                          onClick={(e) => openEditModal(item, e)}
                          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      {canDelete(user, item) && (
                        <button
                          onClick={(e) => deleteArtwork(item.id, e)}
                          className="w-9 h-9 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/40 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/20 to-transparent opacity-60" />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-[#0a0a0b]/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="px-6 py-3 bg-white text-[#0a0a0b] rounded-full text-sm font-medium">
                          View Details
                        </span>
                      </div>
                    </div>

                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/70 mb-3">
                          {item.style}
                        </span>
                        <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                      </div>
                    </div>
                  </div>
                      </article>
                    )}
                  </SortableArtworkCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* "Sign in to see more" prompt */}
          {hasMoreArtworks && (
            <div className="mt-16 text-center">
              <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">More artwork awaits</h3>
                <p className="text-white/40 mb-6 max-w-sm">Sign in to explore our full collection and upload your own masterpieces</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In to See All {artworks.length} Works
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Series Folder Modal - Carousel View */}
      {openSeries && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeSeriesFolder}
        >
          <div
            className="relative w-full max-w-6xl mx-4 h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{openSeries.name}</h2>
                    <p className="text-white/40 text-sm">{openSeries.artworks.length} pieces in this series</p>
                  </div>
                </div>
              </div>
              <button
                onClick={closeSeriesFolder}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Carousel Area - with swipe support */}
            <div
              className="flex-1 flex items-center justify-center relative min-h-0"
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!touchStart || !touchEnd) return;
                const distance = touchStart - touchEnd;
                if (Math.abs(distance) > minSwipeDistance) {
                  if (distance > 0 && seriesViewIndex < openSeries.artworks.length - 1) {
                    nextSeriesArt();
                  } else if (distance < 0 && seriesViewIndex > 0) {
                    prevSeriesArt();
                  }
                }
                setTouchStart(null);
                setTouchEnd(null);
              }}
            >
              {/* Previous Button */}
              <button
                onClick={prevSeriesArt}
                disabled={seriesViewIndex === 0}
                className={`absolute left-4 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  seriesViewIndex === 0
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Cards Stack */}
              <div className="relative w-full max-w-2xl h-full flex items-center justify-center px-20">
                {openSeries.artworks.map((art, i) => {
                  const offset = i - seriesViewIndex;
                  const isActive = offset === 0;
                  const isVisible = Math.abs(offset) <= 2;

                  if (!isVisible) return null;

                  return (
                    <div
                      key={art.id}
                      className="absolute w-full transition-all duration-500 ease-out cursor-pointer"
                      style={{
                        transform: `
                          translateX(${offset * 60}px)
                          scale(${isActive ? 1 : 0.85 - Math.abs(offset) * 0.05})
                          rotateY(${offset * -5}deg)
                        `,
                        zIndex: 10 - Math.abs(offset),
                        opacity: isActive ? 1 : 0.5 - Math.abs(offset) * 0.15,
                        filter: isActive ? 'none' : 'brightness(0.7)',
                      }}
                      onClick={() => {
                        if (offset !== 0) {
                          setSeriesViewIndex(i);
                        } else {
                          openArtDetail(art);
                        }
                      }}
                    >
                      <div className={`bg-[#141416] rounded-3xl overflow-hidden shadow-2xl ${isActive ? 'ring-2 ring-amber-500/50' : ''}`}>
                        {/* Image */}
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent" />

                          {/* Position indicator */}
                          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white/80">
                            {i + 1} / {openSeries.artworks.length}
                          </div>

                          {/* Star, Edit, and Fullscreen buttons - only on active card */}
                          {isActive && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(art.id); }}
                                className={`absolute top-4 left-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                                  isFavorite(art.id)
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
                                }`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill={isFavorite(art.id) ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                              {/* Edit button - show for users with permission */}
                              {canEdit(user, art) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); closeSeriesFolder(); openEditModal(art, e); }}
                                  className="absolute top-4 left-16 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/70 hover:text-white transition-all"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); openFullscreen(art, openSeries.artworks); }}
                                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/70 hover:text-white transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-white mb-2">{art.title}</h3>
                          <p className="text-white/50 text-sm line-clamp-2 mb-4">{art.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/60 capitalize">
                              {art.category}
                            </span>
                            {isActive && (
                              <span className="text-amber-400 text-sm font-medium">Click to view details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={nextSeriesArt}
                disabled={seriesViewIndex === openSeries.artworks.length - 1}
                className={`absolute right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  seriesViewIndex === openSeries.artworks.length - 1
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Thumbnail strip - draggable for admin */}
            <div className="px-4 py-4 pt-8">
              {getUserRole(user) === USER_ROLES.ADMIN ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white/40 text-xs hidden md:block">Drag to reorder</span>
                  <span className="text-white/40 text-xs md:hidden">Tap arrows to reorder</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = openSeries.artworks.findIndex(a => a.id === active.id);
                        const newIndex = openSeries.artworks.findIndex(a => a.id === over.id);
                        reorderSeriesArtwork(openSeries.name, oldIndex, newIndex);
                        // Update view index if needed
                        if (seriesViewIndex === oldIndex) {
                          setSeriesViewIndex(newIndex);
                        } else if (seriesViewIndex > oldIndex && seriesViewIndex <= newIndex) {
                          setSeriesViewIndex(seriesViewIndex - 1);
                        } else if (seriesViewIndex < oldIndex && seriesViewIndex >= newIndex) {
                          setSeriesViewIndex(seriesViewIndex + 1);
                        }
                      }
                    }}
                  >
                    <SortableContext items={openSeries.artworks.map(a => a.id)} strategy={rectSortingStrategy}>
                      <div className="flex justify-center gap-2 md:gap-3 overflow-x-auto max-w-full pb-2 px-2">
                        {openSeries.artworks.map((art, i) => (
                          <SortableSeriesThumbnail
                            key={art.id}
                            art={art}
                            index={i}
                            isActive={i === seriesViewIndex}
                            onClick={() => setSeriesViewIndex(i)}
                            isFirst={i === 0}
                            isLast={i === openSeries.artworks.length - 1}
                            totalCount={openSeries.artworks.length}
                            onMoveLeft={() => {
                              if (i > 0) {
                                reorderSeriesArtwork(openSeries.name, i, i - 1);
                                if (seriesViewIndex === i) setSeriesViewIndex(i - 1);
                              }
                            }}
                            onMoveRight={() => {
                              if (i < openSeries.artworks.length - 1) {
                                reorderSeriesArtwork(openSeries.name, i, i + 1);
                                if (seriesViewIndex === i) setSeriesViewIndex(i + 1);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <div className="flex justify-center gap-2">
                  {openSeries.artworks.map((art, i) => (
                    <button
                      key={art.id}
                      onClick={() => setSeriesViewIndex(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden transition-all ${
                        i === seriesViewIndex
                          ? 'ring-2 ring-amber-500 scale-110'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={art.image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation hint */}
            <div className="text-center pb-4">
              <span className="text-white/30 text-xs hidden sm:inline">
                Use arrow keys to navigate • Click thumbnails to jump
              </span>
              <span className="text-white/30 text-xs sm:hidden">
                Swipe left/right to navigate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-[#141416] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-2xl font-semibold text-center mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Join HiPeR Gallery'}
              </h3>
              <p className="text-white/40 text-center mb-8">
                {authMode === 'login' ? 'Sign in to access your gallery' : 'Create an account to start uploading'}
              </p>

              {authError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {authError}
                </div>
              )}

              <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-white/50 mb-2">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/50 mb-2">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                  />
                </div>

                {/* Role Selection - only on signup */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">I am a...</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(USER_ROLES).map(([key, value]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAuthRole(value)}
                          className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                            authRole === value
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60'
                          }`}
                        >
                          <div className="text-sm font-medium">{ROLE_LABELS[value]}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                      {authRole === USER_ROLES.ADMIN && 'Full access to manage gallery and all artworks'}
                      {authRole === USER_ROLES.ARTIST && 'Upload and manage your own artworks'}
                      {authRole === USER_ROLES.VIEWER && 'Browse and view the gallery'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    authMode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                  }}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Questionnaire Modal */}
      {pendingUploads.length > 0 && currentUpload && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#141416] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Progress bar */}
            <div className="h-1 bg-white/10 flex-shrink-0">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: isSeriesMode
                  ? `${((seriesStep) / 3) * 100}%`
                  : `${((questionnaireStep + 1) / 6) * 100}%`
                }}
              />
            </div>

            {/* Series Mode Selection - Show when multiple images and step 0 */}
            {pendingUploads.length > 1 && seriesStep === 0 && !isSeriesMode && (
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">You're uploading {pendingUploads.length} images</h3>
                  <p className="text-white/40">How would you like to describe them?</p>
                </div>

                {/* Preview thumbnails */}
                <div className="flex gap-2 justify-center mb-8 flex-wrap">
                  {pendingUploads.slice(0, 6).map((upload, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                      <img src={upload.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {pendingUploads.length > 6 && (
                    <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-sm">
                      +{pendingUploads.length - 6}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 max-w-lg mx-auto">
                  <button
                    onClick={startSeriesMode}
                    className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Upload as a Series</h4>
                        <p className="text-sm text-white/50">Share one description for all, add individual notes for each piece</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={startIndividualMode}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Upload Individually</h4>
                        <p className="text-sm text-white/50">Describe each artwork separately, one at a time</p>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={cancelAllUploads}
                  className="mt-6 text-sm text-white/40 hover:text-white/60 transition-colors mx-auto block"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Series Mode Flow */}
            {isSeriesMode && seriesStep >= 1 && (
              <div className="grid md:grid-cols-2 flex-1 min-h-0">
                {/* Left: Image previews grid */}
                <div className="relative bg-black p-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {pendingUploads.map((upload, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          seriesStep === 2 && currentUploadIndex === i
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-white/10'
                        }`}
                        onClick={() => seriesStep === 2 && setCurrentUploadIndex(i)}
                      >
                        <img src={upload.preview} alt="" className="w-full h-full object-cover" />
                        {seriesStep === 2 && individualNotes[i]?.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            <p className="text-xs text-white truncate">{individualNotes[i].title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Series info or individual notes */}
                <div className="p-8 flex flex-col min-h-0 overflow-y-auto">
                  {seriesStep === 1 && (
                    <>
                      <div className="mb-2 text-xs text-amber-500 font-medium">Series Info</div>
                      <h3 className="text-2xl font-semibold mb-2">Describe Your Series</h3>
                      <p className="text-white/40 mb-4">This description will be shared by all pieces</p>

                      {/* Quick options: AI Generate or Upload Document */}
                      <div className="flex gap-2 mb-6">
                        <button
                          onClick={generateSeriesDescription}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-purple-300 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Generate
                        </button>
                        <button
                          onClick={() => seriesDocInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Upload Document
                        </button>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-white/50 mb-2">Series Name *</label>
                          <input
                            type="text"
                            value={seriesName}
                            onChange={(e) => setSeriesName(e.target.value)}
                            placeholder="e.g., Urban Dreams, Nature Studies, Abstract Emotions"
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-white/50 mb-2">Shared Description *</label>
                          <textarea
                            value={seriesDescription}
                            onChange={(e) => setSeriesDescription(e.target.value)}
                            placeholder="Describe the theme, concept, or story that connects all pieces in this series..."
                            rows={4}
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-white/50 mb-2">Category</label>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSeriesCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                                  seriesCategory === cat
                                    ? 'bg-amber-500 text-[#0a0a0b] font-medium'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setSeriesStep(0); setIsSeriesMode(false); }}
                            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setSeriesStep(2)}
                            disabled={!seriesName.trim() || !seriesDescription.trim()}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                              seriesName.trim() && seriesDescription.trim()
                                ? 'bg-white/10 text-white hover:bg-white/15'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                          >
                            Add Individual Notes
                          </button>
                        </div>

                        {/* Skip to publish button */}
                        <button
                          onClick={() => setSeriesStep(3)}
                          disabled={!seriesName.trim() || !seriesDescription.trim()}
                          className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            seriesName.trim() && seriesDescription.trim()
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/25'
                              : 'bg-white/5 text-white/30 cursor-not-allowed'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Publish Series Now
                        </button>
                      </div>
                    </>
                  )}

                  {seriesStep === 2 && (
                    <>
                      <div className="mb-2 text-xs text-amber-500 font-medium">
                        Piece {currentUploadIndex + 1} of {pendingUploads.length}
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Individual Notes</h3>
                      <p className="text-white/40 mb-6">Add specific details for this piece (optional)</p>

                      <div className="mb-4">
                        <img
                          src={pendingUploads[currentUploadIndex]?.preview}
                          alt=""
                          className="w-full h-48 object-contain rounded-xl bg-black/50 mb-4"
                        />
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-white/50 mb-2">Title for this piece</label>
                          <input
                            type="text"
                            value={individualNotes[currentUploadIndex]?.title || ''}
                            onChange={(e) => updateIndividualNote(currentUploadIndex, 'title', e.target.value)}
                            placeholder={`${seriesName} #${currentUploadIndex + 1}`}
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-white/50 mb-2">Individual note (optional)</label>
                          <textarea
                            value={individualNotes[currentUploadIndex]?.note || ''}
                            onChange={(e) => updateIndividualNote(currentUploadIndex, 'note', e.target.value)}
                            placeholder="What makes this specific piece unique? Any special details..."
                            rows={3}
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
                          />
                        </div>
                      </div>

                      {/* Navigation dots */}
                      <div className="flex justify-center gap-2 mb-6">
                        {pendingUploads.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentUploadIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentUploadIndex
                                ? 'bg-amber-500 w-6'
                                : individualNotes[i]?.title || individualNotes[i]?.note
                                  ? 'bg-green-500'
                                  : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-auto flex gap-3">
                        <button
                          onClick={() => currentUploadIndex > 0 ? setCurrentUploadIndex(prev => prev - 1) : setSeriesStep(1)}
                          className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                        >
                          {currentUploadIndex > 0 ? 'Previous' : 'Back'}
                        </button>
                        {currentUploadIndex < pendingUploads.length - 1 ? (
                          <button
                            onClick={() => setCurrentUploadIndex(prev => prev + 1)}
                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all"
                          >
                            Next Piece
                          </button>
                        ) : (
                          <button
                            onClick={() => setSeriesStep(3)}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                          >
                            Review Series
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setSeriesStep(3)}
                        className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors text-center"
                      >
                        Skip individual notes, review now
                      </button>
                    </>
                  )}

                  {seriesStep === 3 && (
                    <>
                      <div className="mb-2 text-xs text-green-500 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ready to publish
                      </div>
                      <h3 className="text-2xl font-semibold mb-6">Review Your Series</h3>

                      <div className="space-y-4 mb-6">
                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-sm text-white/50 mb-1">Series Name</p>
                          <p className="font-medium">{seriesName}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-sm text-white/50 mb-1">Shared Description</p>
                          <p className="text-white/80 text-sm">{seriesDescription}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-sm text-white/50 mb-2">{pendingUploads.length} Pieces</p>
                          <div className="grid grid-cols-4 gap-2">
                            {pendingUploads.map((upload, i) => (
                              <div key={i} className="relative">
                                <img src={upload.preview} alt="" className="w-full aspect-square object-cover rounded-lg" />
                                {(individualNotes[i]?.title || individualNotes[i]?.note) && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-3">
                        <button
                          onClick={() => setSeriesStep(2)}
                          className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={saveSeriesAndContinue}
                          disabled={uploadingImage}
                          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving {pendingUploads.length} artworks...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Publish Series
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Cancel option */}
                  <button
                    onClick={cancelAllUploads}
                    className="mt-6 text-sm text-red-400/60 hover:text-red-400 transition-colors text-center"
                  >
                    Cancel upload
                  </button>
                </div>
              </div>
            )}

            {/* Individual Mode Flow (existing questionnaire) */}
            {(seriesStep === -1 || pendingUploads.length === 1) && (
              <div className="grid md:grid-cols-2 flex-1 min-h-0">
                {/* Image preview */}
                <div className="relative aspect-square md:aspect-auto bg-black">
                  <img
                    src={currentUpload.preview}
                    alt="Upload preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/70">
                      {currentUploadIndex + 1} of {pendingUploads.length}
                    </span>
                  </div>
                </div>

                {/* Questions / Approval */}
                <div className="p-8 flex flex-col min-h-0 overflow-y-auto">
                  {questionnaireStep < 5 ? (
                    <>
                      {/* Question step */}
                      <div className="mb-2 text-xs text-amber-500 font-medium">
                        Step {questionnaireStep + 1} of 5
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">{currentQuestion.title}</h3>
                      <p className="text-white/40 mb-6">{currentQuestion.subtitle}</p>

                      {currentQuestion.isText ? (
                        <>
                          <textarea
                            value={answers[currentQuestion.field]}
                            onChange={(e) => handleAnswerSelect(currentQuestion.field, e.target.value)}
                            placeholder={currentQuestion.placeholder}
                            rows={4}
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none placeholder:text-white/20 mb-4"
                          />

                          {/* Document upload option - show on first text step */}
                          {questionnaireStep === 3 && (
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-dashed border-white/20">
                              <p className="text-sm text-white/50 mb-3">Already have a description written?</p>
                              <button
                                onClick={() => docInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Upload Document (.txt, .doc, .md)
                            </button>

                            {useCustomDescription && (
                              <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Document loaded!
                                </div>
                                {customTitle && <p className="text-white/60 text-sm">Title: {customTitle}</p>}
                                <p className="text-white/40 text-xs mt-1 line-clamp-2">{customDescription.substring(0, 150)}...</p>
                                <button
                                  onClick={skipToCustomApproval}
                                  className="mt-3 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all"
                                >
                                  Use This Description
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {currentQuestion.options.map(option => (
                          <button
                            key={option}
                            onClick={() => handleAnswerSelect(currentQuestion.field, option)}
                            className={`px-4 py-2.5 rounded-full text-sm transition-all duration-300 ${
                              answers[currentQuestion.field] === option
                                ? 'bg-amber-500 text-[#0a0a0b] font-medium'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex gap-3">
                      {questionnaireStep > 0 && (
                        <button
                          onClick={prevStep}
                          className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={nextStep}
                        disabled={!canProceed}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                          canProceed
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] hover:shadow-lg hover:shadow-amber-500/25'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {questionnaireStep === 4 ? 'Generate Description' : 'Continue'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Approval step */}
                    <div className="mb-2 text-xs text-green-500 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready for your approval
                    </div>
                    <h3 className="text-2xl font-semibold mb-6">Review Your Artwork</h3>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm text-white/50 mb-2">Title</label>
                        <input
                          type="text"
                          value={generatedTitle}
                          onChange={(e) => setGeneratedTitle(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all text-lg font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/50 mb-2">Description</label>
                        <textarea
                          value={generatedDescription}
                          onChange={(e) => setGeneratedDescription(e.target.value)}
                          rows={4}
                          className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/50 mb-2">Categories <span className="text-white/30">(select multiple)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(cat => {
                            const isSelected = selectedCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  if (isSelected) {
                                    // Don't allow removing last category
                                    if (selectedCategories.length > 1) {
                                      setSelectedCategories(prev => prev.filter(c => c !== cat));
                                    }
                                  } else {
                                    setSelectedCategories(prev => [...prev, cat]);
                                  }
                                }}
                                className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-amber-500 text-[#0a0a0b] font-medium'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={regenerateSuggestions}
                      className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors mb-6"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate suggestions
                    </button>

                    <div className="mt-auto flex gap-3">
                      <button
                        onClick={prevStep}
                        className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={approveAndSave}
                        disabled={uploadingImage}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve & Add to Gallery
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Skip / Cancel */}
                <div className="flex justify-between mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={skipCurrentUpload}
                    className="text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Skip this image
                  </button>
                  <button
                    onClick={cancelAllUploads}
                    className="text-sm text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Cancel all
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-[#141416] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Settings</h3>
                  <p className="text-sm text-white/40">Manage your gallery data</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-amber-400">{artworks.filter(a => !a.isDefault).length}</p>
                  <p className="text-sm text-white/40">Your Artworks</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white/70">{artworks.filter(a => a.isDefault).length}</p>
                  <p className="text-sm text-white/40">Default Gallery</p>
                </div>
              </div>

              {/* Export/Import Section */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider">Backup & Restore</h4>

                <button
                  onClick={exportGalleryData}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Export Gallery</p>
                    <p className="text-sm text-white/40">Download your artworks as a JSON file</p>
                  </div>
                </button>

                <button
                  onClick={() => importInputRef.current?.click()}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Import Gallery</p>
                    <p className="text-sm text-white/40">Restore from a backup JSON file</p>
                  </div>
                </button>

                <button
                  onClick={exportToNotion}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#000]/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.62c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM2.213 1.548l12.728-.932c1.588-.14 1.961-.047 2.941.7l4.018 2.8c.653.467.84.7.84 1.307v16.38c0 1.026-.374 1.634-1.68 1.726L5.7 24c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.948c0-.84.374-1.54 1.397-1.4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Export to Notion</p>
                    <p className="text-sm text-white/40">Copy formatted markdown for Notion</p>
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <p className="text-sm text-amber-200/80">
                  <strong>Tip:</strong> Export your gallery before clearing browser data.
                  You can also commit the JSON file to GitHub for version control.
                </p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && getUserRole(user) === USER_ROLES.ADMIN && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowAnalytics(false)}
        >
          <div
            className="bg-[#141416] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Gallery Analytics</h3>
                  <p className="text-sm text-white/40">Overview of your gallery's performance</p>
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <p className="text-3xl font-bold text-amber-400">{artworks.length}</p>
                  <p className="text-sm text-white/50">Total Artworks</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">{artworks.filter(a => !a.isDefault).length}</p>
                  <p className="text-sm text-white/50">Your Uploads</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <p className="text-3xl font-bold text-purple-400">{favorites.length}</p>
                  <p className="text-sm text-white/50">Favorites</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400">
                    {[...new Set(artworks.filter(a => a.seriesName).map(a => a.seriesName))].length}
                  </p>
                  <p className="text-sm text-white/50">Series</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">By Category</h4>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const count = artworks.filter(a => a.category === cat).length;
                    const percentage = artworks.length > 0 ? (count / artworks.length) * 100 : 0;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-white/60 capitalize">{cat}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-sm text-white/40 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Favorited Works */}
              {favorites.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Favorited Works</h4>
                  <div className="flex flex-wrap gap-2">
                    {favorites.slice(0, 10).map(favId => {
                      const art = artworks.find(a => a.id === favId);
                      if (!art) return null;
                      return (
                        <div
                          key={favId}
                          className="w-16 h-16 rounded-lg overflow-hidden ring-2 ring-amber-500/50"
                          title={art.title}
                        >
                          <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                    {favorites.length > 10 && (
                      <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white/50">
                        +{favorites.length - 10}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Series List */}
              {(() => {
                const seriesNames = [...new Set(artworks.filter(a => a.seriesName).map(a => a.seriesName))];
                if (seriesNames.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Series</h4>
                    <div className="space-y-2">
                      {seriesNames.map(name => {
                        const seriesArtworks = artworks.filter(a => a.seriesName === name);
                        return (
                          <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span className="font-medium">{name}</span>
                            <span className="text-sm text-amber-400">{seriesArtworks.length} pieces</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-8 border-t border-white/5">
              <button
                onClick={() => setShowAnalytics(false)}
                className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-[#141416] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Welcome to HiPeR Gallery</h3>

              <div className="space-y-4 text-white/60 leading-relaxed mb-6">
                <p>
                  HiPeR Gallery is an innovative digital art platform where creativity meets technology.
                  Our curated collection showcases diverse artistic expressions spanning abstract, surreal,
                  landscape, portrait, and digital art forms.
                </p>

                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">What You Can Do</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span><strong className="text-white/80">Explore</strong> — Browse our gallery of unique artworks, organized by categories and curated series</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span><strong className="text-white/80">Upload</strong> — Share your own creations with our AI-powered description generator that crafts compelling narratives for each piece</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span><strong className="text-white/80">Organize</strong> — Create and manage art series, group related works, and curate your collection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span><strong className="text-white/80">Collect</strong> — Save your favorites, track your preferred pieces, and build your personal gallery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span><strong className="text-white/80">Export</strong> — Back up your collection to JSON or export to Notion-friendly markdown</span>
                    </li>
                  </ul>
                </div>

                <p>
                  Whether you're an artist looking to showcase your work or an art enthusiast exploring new
                  visual experiences, HiPeR Gallery provides an immersive, beautifully designed space for
                  discovering and sharing digital art.
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-amber-400">{artworks.length}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Artworks</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-amber-400">
                      {[...new Set(artworks.filter(a => a.seriesName).map(a => a.seriesName))].length}
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Series</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-amber-400">{categories.length}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Categories</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowAbout(false)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowAbout(false); user ? fileInputRef.current?.click() : setShowAuthModal(true); }}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold transition-all"
                >
                  Start Creating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingArt && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${isModalOpen ? 'bg-black/90 backdrop-blur-xl' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`bg-[#141416] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-500 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              <div className="p-8 border-b border-white/5">
                <h3 className="text-2xl font-semibold">Edit Artwork</h3>
                <p className="text-white/40 mt-1">Update details for your artwork</p>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Image Preview */}
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <img src={editingArt.image} alt="Preview" className="w-full h-full object-cover" />
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Title *</label>
                    <input
                      type="text"
                      value={editingArt.title || ''}
                      onChange={e => setEditingArt({ ...editingArt, title: e.target.value })}
                      placeholder="Enter artwork title"
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Style / Medium</label>
                    <input
                      type="text"
                      value={editingArt.style || ''}
                      onChange={e => setEditingArt({ ...editingArt, style: e.target.value })}
                      placeholder="e.g., Digital Art, Photography, Oil Painting"
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Categories <span className="text-white/30">(select multiple)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => {
                        const isSelected = editingArt.categories?.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const currentCats = editingArt.categories || [editingArt.category];
                              let newCats;
                              if (isSelected) {
                                // Don't allow removing last category
                                if (currentCats.length > 1) {
                                  newCats = currentCats.filter(c => c !== cat);
                                } else {
                                  return;
                                }
                              } else {
                                newCats = [...currentCats, cat];
                              }
                              setEditingArt({ ...editingArt, categories: newCats, category: newCats[0] });
                            }}
                            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                              isSelected
                                ? 'bg-amber-500 text-[#0a0a0b] font-medium'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Series Assignment */}
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Series</label>
                    <div className="space-y-2">
                      {/* Existing series dropdown */}
                      <select
                        value={editingArt.seriesName || ''}
                        onChange={(e) => setEditingArt({ ...editingArt, seriesName: e.target.value || null })}
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all text-white"
                      >
                        <option value="">No series (standalone)</option>
                        {[...new Set(artworks.filter(a => a.seriesName).map(a => a.seriesName))].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      {/* Create new series option */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Or create new series..."
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              setEditingArt({ ...editingArt, seriesName: e.target.value.trim() });
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            if (input.value.trim()) {
                              setEditingArt({ ...editingArt, seriesName: input.value.trim() });
                              input.value = '';
                            }
                          }}
                          className="px-4 py-3 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Description</label>
                    <textarea
                      value={editingArt.description || ''}
                      onChange={e => setEditingArt({ ...editingArt, description: e.target.value })}
                      placeholder="Tell the story behind your artwork..."
                      rows={3}
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none placeholder:text-white/20"
                    />
                    {/* AI Generate Description Button */}
                    <button
                      type="button"
                      onClick={() => {
                        // Generate a new description based on title, style, and categories
                        const answers = {
                          mood: moodOptions[Math.floor(Math.random() * moodOptions.length)],
                          theme: themeOptions[Math.floor(Math.random() * themeOptions.length)],
                          style: editingArt.style || styleOptions[Math.floor(Math.random() * styleOptions.length)],
                          inspiration: editingArt.title || 'artistic vision',
                          message: editingArt.categories?.[0] || editingArt.category || 'abstract'
                        };
                        const newDesc = generateDescription(answers);
                        setEditingArt({ ...editingArt, description: newDesc });
                      }}
                      className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate AI Description
                    </button>
                  </div>

                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4">
                {/* Delete Button */}
                {canDelete(user, editingArt) && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteArtwork(editingArt.id);
                      closeModal();
                    }}
                    className="px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveArtworkEdit}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Art Detail Modal */}
      {selectedArt && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${isModalOpen ? 'bg-black/90 backdrop-blur-xl' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`bg-[#141416] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-500 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              {/* Large Image */}
              <div className="relative aspect-[4/3] md:aspect-[16/10]">
                <img src={selectedArt.image} alt={selectedArt.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white/80 capitalize">
                    {selectedArt.category}
                  </span>
                </div>

                {/* Fullscreen button */}
                <button
                  onClick={(e) => { e.stopPropagation(); openFullscreen(selectedArt, artworks); }}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/70 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>

                {/* Star/Favorite button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedArt.id); }}
                  className={`absolute bottom-4 left-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                    isFavorite(selectedArt.id)
                      ? 'bg-amber-500 text-black'
                      : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isFavorite(selectedArt.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>

                {/* Series badge if part of series */}
                {selectedArt.seriesName && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/80 backdrop-blur-sm text-xs text-black font-medium">
                      {selectedArt.seriesName}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Card Content */}
              <div className="p-6 md:p-8">
                {/* Title and Artist */}
                <div className="mb-4">
                  <h2 className="text-2xl md:text-3xl font-semibold mb-2">{selectedArt.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black text-sm font-bold">
                      {selectedArt.artist?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{selectedArt.artist}</p>
                      <p className="text-white/40 text-xs">{selectedArt.style}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-white/60 leading-relaxed">{selectedArt.description}</p>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/50 capitalize">
                    {selectedArt.category}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/50">
                    {selectedArt.style}
                  </span>
                  {selectedArt.isNew && (
                    <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-xs text-green-400">
                      New
                    </span>
                  )}
                </div>

                              </div>
            </div>

            <button
              onClick={closeModal}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowCart(false)}
          />
          <aside className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#141416] z-50 flex flex-col shadow-2xl transform transition-transform duration-500 ease-out ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Shopping Cart</h3>
                <p className="text-sm text-white/40 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-white/40 mb-2">Your cart is empty</p>
                  <p className="text-sm text-white/20 mb-6">Add some beautiful art to get started</p>
                  <button
                    onClick={() => { setShowCart(false); scrollToGallery(); }}
                    className="px-6 py-3 rounded-full bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.artwork.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.artwork.title}</h4>
                        <p className="text-sm text-white/40 mt-0.5">{item.size.dimensions}</p>
                        <p className="text-sm text-white/40">{item.frame.label}</p>
                        <p className="text-amber-400 font-semibold mt-2">${item.total}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all self-start flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-[#0f0f11]">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span>${cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-amber-400">${cartTotal}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300"
                >
                  Checkout — ${cartTotal}
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-3 mt-3 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* Fullscreen Image View with Navigation */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (!touchStart || !touchEnd) return;
            const distance = touchStart - touchEnd;
            if (Math.abs(distance) > minSwipeDistance) {
              if (distance > 0) {
                fullscreenNext();
              } else {
                fullscreenPrev();
              }
            }
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          {/* Main Image */}
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation Arrows - only show if there are multiple images */}
          {fullscreenArtworks.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => { e.stopPropagation(); fullscreenPrev(); }}
                disabled={fullscreenIndex === 0}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  fullscreenIndex === 0
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => { e.stopPropagation(); fullscreenNext(); }}
                disabled={fullscreenIndex === fullscreenArtworks.length - 1}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  fullscreenIndex === fullscreenArtworks.length - 1
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Close Button */}
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Star/Favorite button in fullscreen */}
          {fullscreenArtworks[fullscreenIndex] && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(fullscreenArtworks[fullscreenIndex].id); }}
              className={`absolute top-6 left-6 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                isFavorite(fullscreenArtworks[fullscreenIndex]?.id)
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill={isFavorite(fullscreenArtworks[fullscreenIndex]?.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                {fullscreenArtworks[fullscreenIndex] && (
                  <>
                    <h3 className="text-lg font-semibold text-white">{fullscreenArtworks[fullscreenIndex].title}</h3>
                    <p className="text-white/50 text-sm">{fullscreenArtworks[fullscreenIndex].artist}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {fullscreenArtworks.length > 1 && (
                  <span className="px-3 py-1.5 rounded-full bg-white/10 text-sm text-white/70">
                    {fullscreenIndex + 1} / {fullscreenArtworks.length}
                  </span>
                )}
                <span className="text-white/40 text-sm hidden sm:inline">
                  Use arrow keys or swipe to navigate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl ${toast?.type === 'error' ? 'bg-red-500/90' : 'bg-[#1a1a1c] border border-white/10'}`}>
          {toast?.type !== 'error' && (
            <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0a0a0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          <span className="font-medium">{toast?.message}</span>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        article { animation: fadeIn 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
