import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const defaultArtworks = [
  { id: 1, title: "Ethereal Dreams", artist: "HiPeR Gallery", style: "Abstract Expressionism", category: "abstract", description: "A mesmerizing exploration of color and form, where dreams meet reality in an ethereal dance of light.", price: 249, image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=800&fit=crop", isDefault: true },
  { id: 2, title: "Urban Solitude", artist: "HiPeR Gallery", style: "Contemporary Photography", category: "landscape", description: "Capturing the quiet moments in bustling cityscapes, where architecture meets human emotion.", price: 199, image: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&h=800&fit=crop", isDefault: true },
  { id: 3, title: "Nature's Whisper", artist: "HiPeR Gallery", style: "Fine Art Nature", category: "nature", description: "An intimate portrait of nature's delicate beauty, frozen in a moment of perfect serenity.", price: 279, image: "https://images.unsplash.com/photo-1518882605630-8b17b9c1d406?w=800&h=800&fit=crop", isDefault: true },
  { id: 4, title: "Digital Renaissance", artist: "HiPeR Gallery", style: "Digital Art / AI", category: "portrait", description: "Where classical artistry meets cutting-edge technology in a stunning visual synthesis.", price: 349, image: "https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=800&h=800&fit=crop", isDefault: true },
  { id: 5, title: "Cosmic Reverie", artist: "HiPeR Gallery", style: "Surrealist Digital", category: "surreal", description: "Journey through impossible landscapes where physics bends to imagination.", price: 299, image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=800&fit=crop", isDefault: true },
  { id: 6, title: "Chromatic Flow", artist: "HiPeR Gallery", style: "Abstract Fluid Art", category: "abstract", description: "Vibrant colors cascade and merge in this hypnotic study of movement and harmony.", price: 229, image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=800&h=800&fit=crop", isDefault: true },
];

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

const categories = ['abstract', 'surreal', 'nature', 'portrait', 'landscape'];

const moodOptions = ['Peaceful', 'Energetic', 'Mysterious', 'Joyful', 'Melancholic', 'Dramatic', 'Playful', 'Contemplative'];
const themeOptions = ['Love', 'Nature', 'Identity', 'Dreams', 'Time', 'Freedom', 'Connection', 'Solitude', 'Transformation', 'Memory'];
const styleOptions = ['Abstract', 'Realistic', 'Surreal', 'Minimalist', 'Expressive', 'Geometric', 'Organic', 'Digital'];

// Preview limit for non-logged in users
const PREVIEW_LIMIT = 3;

// Fun description generator based on answers
const generateDescription = (answers) => {
  const { mood, theme, style, inspiration, message } = answers;

  const openers = [
    `A ${mood.toLowerCase()} exploration of ${theme.toLowerCase()}`,
    `This ${style.toLowerCase()} piece captures the essence of ${theme.toLowerCase()}`,
    `Diving deep into ${theme.toLowerCase()}, this work radiates ${mood.toLowerCase()} energy`,
    `Where ${mood.toLowerCase()} meets ${theme.toLowerCase()}`,
  ];

  const middles = [
    `through bold ${style.toLowerCase()} expression`,
    `with stunning visual harmony`,
    `in a dance of color and form`,
    `creating an unforgettable visual journey`,
  ];

  const endings = inspiration ? [
    `Inspired by ${inspiration}, it invites viewers to ${message || 'discover their own meaning'}.`,
    `Drawing from ${inspiration}, this piece asks us to ${message || 'pause and reflect'}.`,
    `With echoes of ${inspiration}, it speaks to ${message || 'the depths of human experience'}.`,
  ] : [
    `It invites viewers to ${message || 'discover their own meaning within its depths'}.`,
    `A piece that asks us to ${message || 'pause, breathe, and simply feel'}.`,
    `Speaking directly to ${message || 'the soul of those who dare to look closely'}.`,
  ];

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const middle = middles[Math.floor(Math.random() * middles.length)];
  const ending = endings[Math.floor(Math.random() * endings.length)];

  return `${opener} ${middle}. ${ending}`;
};

// Fun title generator based on answers
const generateTitle = (answers) => {
  const { mood, theme, style } = answers;

  const titlePatterns = [
    `${mood} ${theme}`,
    `The ${mood} ${theme}`,
    `${theme} in ${mood}`,
    `${style} ${theme}`,
    `Whispers of ${theme}`,
    `${mood} Dreams`,
    `The ${theme} Within`,
    `${theme}'s Echo`,
    `Beyond ${theme}`,
    `${mood} Horizons`,
  ];

  return titlePatterns[Math.floor(Math.random() * titlePatterns.length)];
};

export default function ArtGallery() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Gallery state
  const [artworks, setArtworks] = useState(defaultArtworks);
  const [filter, setFilter] = useState('all');
  const [selectedArt, setSelectedArt] = useState(null);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedFrame, setSelectedFrame] = useState(1);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

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
  const [selectedCategory, setSelectedCategory] = useState('abstract');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [useCustomDescription, setUseCustomDescription] = useState(false);

  // Series upload state
  const [isSeriesMode, setIsSeriesMode] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [seriesCategory, setSeriesCategory] = useState('abstract');
  const [individualNotes, setIndividualNotes] = useState({}); // { index: { title, note } }
  const [seriesStep, setSeriesStep] = useState(0); // 0: choose mode, 1: series info, 2: individual notes, 3: review

  // Settings/Export state
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef(null);
  const galleryRef = useRef(null);
  const docInputRef = useRef(null);
  const importInputRef = useRef(null);

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
        price: art.price,
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

  // Check auth state on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode - check localStorage
      const savedUser = localStorage.getItem('hiperGalleryUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setAuthLoading(false);
      loadArtworksFromStorage();
      return;
    }

    // Real Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        loadArtworksFromDatabase(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadArtworksFromDatabase(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load artworks from localStorage (demo mode)
  const loadArtworksFromStorage = () => {
    const savedArtworks = localStorage.getItem('hiperGalleryArtworks');
    if (savedArtworks) {
      const parsed = JSON.parse(savedArtworks);
      setArtworks([...defaultArtworks, ...parsed]);
    }
  };

  // Load artworks from Supabase
  const loadArtworksFromDatabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedArtworks = data.map(art => ({
          id: art.id,
          title: art.title,
          artist: art.artist,
          style: art.category,
          category: art.category?.toLowerCase() || 'abstract',
          description: art.description,
          price: parseFloat(art.base_price) || 249,
          image: art.image_url,
          isDefault: art.is_default,
          isNew: !art.is_default && art.user_id === userId,
          userId: art.user_id,
        }));
        setArtworks(formattedArtworks);
      }
    } catch (err) {
      console.error('Error loading artworks:', err);
      // Fall back to defaults
    }
  };

  // Save artwork to storage/database
  const saveArtwork = async (artwork, imageFile) => {
    if (!isSupabaseConfigured()) {
      // Demo mode - save to localStorage
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      savedArtworks.unshift(artwork);
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify(savedArtworks));
      return artwork;
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
          base_price: artwork.price || 249,
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

  // Delete artwork
  const deleteArtworkFromDB = async (id) => {
    if (!isSupabaseConfigured()) {
      // Demo mode
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      const filtered = savedArtworks.filter(a => a.id !== id);
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify(filtered));
      return true;
    }

    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting artwork:', err);
      return false;
    }
  };

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    if (!isSupabaseConfigured()) {
      // Demo mode
      const demoUser = {
        id: Date.now().toString(),
        email: authEmail,
        name: authName || authEmail.split('@')[0],
      };
      setUser(demoUser);
      localStorage.setItem('hiperGalleryUser', JSON.stringify(demoUser));
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      showToastMessage('Welcome back!');
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
      };
      setUser(demoUser);
      localStorage.setItem('hiperGalleryUser', JSON.stringify(demoUser));
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      showToastMessage('Welcome to HiPeR Gallery!');
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
          },
        },
      });

      if (error) throw error;

      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
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
  const filteredArt = filter === 'all' ? visibleArtworks : visibleArtworks.filter(a => a.category === filter);
  const hasMoreArtworks = !user && artworks.length > PREVIEW_LIMIT;

  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle multiple file selection - requires login
  const handleFileSelect = (e) => {
    if (!user) {
      setShowAuthModal(true);
      showToastMessage('Please log in to upload artwork', 'error');
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
      setSelectedCategory('abstract');
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
        price: 149,
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
      category: selectedCategory,
      description: generatedDescription,
      price: 149,
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
      setSelectedCategory('abstract');
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
    e.stopPropagation();
    if (!user || art.isDefault) return;
    setEditingArt({ ...art });
    setSelectedArt(null);
    setTimeout(() => setIsModalOpen(true), 10);
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

    if (isSupabaseConfigured() && user) {
      try {
        await supabase
          .from('artworks')
          .update({
            title: editingArt.title,
            description: editingArt.description,
            category: editingArt.category,
            base_price: editingArt.price,
          })
          .eq('id', editingArt.id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating artwork:', err);
      }
    } else {
      // Update localStorage
      const savedArtworks = JSON.parse(localStorage.getItem('hiperGalleryArtworks') || '[]');
      const updated = savedArtworks.map(a => a.id === editingArt.id ? editingArt : a);
      localStorage.setItem('hiperGalleryArtworks', JSON.stringify(updated));
    }

    setArtworks(prev => prev.map(a =>
      a.id === editingArt.id
        ? { ...editingArt, isNew: false }
        : a
    ));
    showToastMessage('Artwork updated');
    closeModal();
  };

  const deleteArtwork = async (id, e) => {
    e.stopPropagation();
    const art = artworks.find(a => a.id === id);
    if (!user || art?.isDefault) return;

    const success = await deleteArtworkFromDB(id);
    if (success) {
      setArtworks(prev => prev.filter(a => a.id !== id));
      showToastMessage('Artwork removed');
    }
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

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-500">
        <div className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/5" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={scrollToGallery} className="text-sm text-white/60 hover:text-white transition-colors">Collection</button>
            <button onClick={() => user ? fileInputRef.current?.click() : setShowAuthModal(true)} className="text-sm text-white/60 hover:text-white transition-colors">Upload</button>
            <button onClick={() => setShowAbout(true)} className="text-sm text-white/60 hover:text-white transition-colors">About</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Upload</span>
                </button>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-[#0a0a0b]">
                      {user.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <span className="text-sm text-white/70 hidden sm:block">{user.email?.split('@')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-[#1a1a1c] rounded-xl border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
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
            <button
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
            </button>
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
            <span className="text-sm text-white/60">Museum-Quality Fine Art Prints</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
            <span className="text-white/90">Your Vision,</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent font-normal">Masterfully Printed</span>
          </h2>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Transform your digital creations into gallery-worthy pieces. Premium archival printing on museum-grade materials.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group px-8 py-4 rounded-full bg-white text-[#0a0a0b] font-medium transition-all duration-300 hover:shadow-xl hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
              >
                Upload Multiple Images
                <svg className="inline-block w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ) : (
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
            <button
              onClick={scrollToGallery}
              className="px-8 py-4 rounded-full border border-white/20 text-white/80 font-medium hover:bg-white/5 hover:border-white/30 transition-all duration-300"
            >
              View Collection
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <nav ref={galleryRef} className="px-6 lg:px-8 pb-12 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
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
                {f === 'all' ? 'All Works' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Gallery Grid */}
      <main className="px-6 lg:px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Upload Card - only show when logged in */}
            {user && (
              <article
                onClick={() => fileInputRef.current?.click()}
                className="group relative bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl overflow-hidden border border-dashed border-white/10 hover:border-amber-500/40 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5"
              >
                <div className="aspect-[4/5] flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-amber-500/10 group-hover:scale-110 transition-all duration-500">
                    <svg className="w-8 h-8 text-white/30 group-hover:text-amber-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-white/50 group-hover:text-white/80 transition-colors duration-300">Upload Artworks</span>
                  <span className="text-sm text-white/30 mt-2">We'll help you craft the perfect description</span>
                </div>
              </article>
            )}

            {/* Artwork Cards */}
            {filteredArt.map((art, index) => (
              <article
                key={art.id}
                onClick={() => openArtDetail(art)}
                className={`group relative bg-[#111113] rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${art.isNew ? 'ring-2 ring-amber-500/50' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* New badge */}
                {art.isNew && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 text-[#0a0a0b] text-xs font-bold rounded-full">
                    NEW
                  </div>
                )}

                {/* Edit & Delete buttons - only for own non-default artworks */}
                {user && !art.isDefault && (
                  <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => openEditModal(art, e)}
                      className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => deleteArtwork(art.id, e)}
                      className="w-9 h-9 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/40 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="aspect-[4/5] relative overflow-hidden">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
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
                        {art.style}
                      </span>
                      <h3 className="text-xl font-semibold text-white mb-1">{art.title}</h3>
                      <p className="text-amber-400 font-medium">From ${art.price}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

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
          <div className="bg-[#141416] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
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
              <div className="p-8">
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
              <div className="grid md:grid-cols-2 h-full">
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
                <div className="p-8 flex flex-col h-full overflow-y-auto">
                  {seriesStep === 1 && (
                    <>
                      <div className="mb-2 text-xs text-amber-500 font-medium">Series Info</div>
                      <h3 className="text-2xl font-semibold mb-2">Describe Your Series</h3>
                      <p className="text-white/40 mb-6">This description will be shared by all pieces</p>

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
                            rows={5}
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

                      <div className="mt-auto flex gap-3">
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
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] hover:shadow-lg hover:shadow-amber-500/25'
                              : 'bg-white/10 text-white/30 cursor-not-allowed'
                          }`}
                        >
                          Add Individual Notes
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
              <div className="grid md:grid-cols-2 h-full">
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
                <div className="p-8 flex flex-col h-full overflow-y-auto">
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
                        <label className="block text-sm text-white/50 mb-2">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                                selectedCategory === cat
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

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-[#141416] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">About HiPeR Gallery</h3>
              <p className="text-white/60 mb-4 leading-relaxed">
                HiPeR Gallery is your destination for transforming digital art into museum-quality prints.
                We use premium archival materials and state-of-the-art printing technology.
              </p>
              <p className="text-white/60 mb-6 leading-relaxed">
                Upload your artwork, choose your size and frame, and we'll deliver a gallery-worthy
                piece right to your door.
              </p>
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
                      value={editingArt.title}
                      onChange={e => setEditingArt({ ...editingArt, title: e.target.value })}
                      placeholder="Enter artwork title"
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Style / Medium</label>
                    <input
                      type="text"
                      value={editingArt.style}
                      onChange={e => setEditingArt({ ...editingArt, style: e.target.value })}
                      placeholder="e.g., Digital Art, Photography, Oil Painting"
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-3">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditingArt({ ...editingArt, category: cat })}
                          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                            editingArt.category === cat
                              ? 'bg-amber-500 text-[#0a0a0b] font-medium'
                              : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Description</label>
                    <textarea
                      value={editingArt.description}
                      onChange={e => setEditingArt({ ...editingArt, description: e.target.value })}
                      placeholder="Tell the story behind your artwork..."
                      rows={3}
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/50 mb-2">Price ($)</label>
                    <input
                      type="number"
                      value={editingArt.price}
                      onChange={e => setEditingArt({ ...editingArt, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4">
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
            <div className={`bg-[#141416] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-500 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
              <div className="grid md:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square md:aspect-auto">
                  <img src={selectedArt.image} alt={selectedArt.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#141416]/50 hidden md:block" />
                </div>

                {/* Details */}
                <div className="p-8 lg:p-10 overflow-y-auto max-h-[90vh] md:max-h-none">
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-xs text-white/50 mb-4">{selectedArt.style}</span>
                    <h2 className="text-3xl font-semibold mb-2">{selectedArt.title}</h2>
                    <p className="text-white/40 leading-relaxed">{selectedArt.description}</p>
                  </div>

                  {/* Size Selection */}
                  <div className="mb-8">
                    <label className="block text-sm text-white/50 mb-4">Select Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {sizes.map((size, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSize(i)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                            selectedSize === i
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="text-sm font-medium">{size.name}</div>
                          <div className="text-xs text-white/40 mt-0.5">{size.dimensions}</div>
                          <div className="text-amber-400 font-semibold mt-2">${size.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Selection */}
                  <div className="mb-8">
                    <label className="block text-sm text-white/50 mb-4">Frame Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {frames.map((frame, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedFrame(i)}
                          className={`p-4 rounded-2xl border text-center transition-all duration-300 ${
                            selectedFrame === i
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg mx-auto mb-2 border-2"
                            style={{
                              backgroundColor: frame.color === 'transparent' ? 'transparent' : frame.color,
                              borderColor: frame.color === 'transparent' ? 'rgba(255,255,255,0.2)' : frame.color
                            }}
                          />
                          <div className="text-xs font-medium">{frame.label}</div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {frame.price ? `+$${frame.price}` : 'Included'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="p-5 rounded-2xl bg-white/5 mb-6">
                    <div className="flex justify-between text-sm text-white/50 mb-2">
                      <span>Print ({sizes[selectedSize].dimensions})</span>
                      <span>${sizes[selectedSize].price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/50 mb-3">
                      <span>Frame ({frames[selectedFrame].label})</span>
                      <span>{frames[selectedFrame].price ? `$${frames[selectedFrame].price}` : 'Included'}</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-2xl font-semibold text-amber-400">${sizes[selectedSize].price + frames[selectedFrame].price}</span>
                    </div>
                  </div>

                  <button
                    onClick={addToCart}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Add to Cart — ${sizes[selectedSize].price + frames[selectedFrame].price}
                  </button>
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
