import React, { useState, useEffect } from 'react';
import { Search, Plus, Zap, Download, Upload, Edit, Trash2, Copy, X, Star, Folder, FileText, Tag, ChevronDown, ChevronUp, Settings, Sparkles } from 'lucide-react';

// Initial sample prompts
const samplePrompts = [
  {
    id: 1,
    title: "Code Review Assistant",
    category: "Coding",
    content: "You are an expert code reviewer. Please review the following code for:\n1. Potential bugs and errors\n2. Performance optimizations\n3. Code style and best practices\n4. Security vulnerabilities\n5. Suggestions for improvement\n\nProvide specific, actionable feedback with examples where applicable.",
    tags: ["code review", "development", "quality"],
    notes: "Great for thorough code reviews. Works best with specific code snippets.",
    rating: 5,
    dateAdded: new Date().toISOString(),
    timesUsed: 12
  },
  {
    id: 2,
    title: "Creative Story Writer",
    category: "Writing",
    content: "You are a creative writing assistant. Help me write a compelling story with:\n- Vivid descriptions\n- Complex characters\n- Engaging dialogue\n- Unexpected plot twists\n\nGenre: [SPECIFY]\nTone: [SPECIFY]\nLength: [SPECIFY]",
    tags: ["creative", "storytelling", "fiction"],
    notes: "Excellent for generating creative content. Customize genre and tone as needed.",
    rating: 4,
    dateAdded: new Date().toISOString(),
    timesUsed: 8
  },
  {
    id: 3,
    title: "Data Analysis Expert",
    category: "Analysis",
    content: "You are a data analysis expert. Analyze the following data and provide:\n1. Key insights and patterns\n2. Statistical summary\n3. Anomalies or outliers\n4. Recommendations based on findings\n5. Visualizations suggestions\n\nFormat your response with clear sections and bullet points.",
    tags: ["data", "analysis", "statistics"],
    notes: "Works well with CSV data or structured datasets.",
    rating: 5,
    dateAdded: new Date().toISOString(),
    timesUsed: 15
  },
  {
    id: 4,
    title: "Email Professional Writer",
    category: "Business",
    content: "Write a professional email with the following characteristics:\n- Tone: [formal/semi-formal/casual]\n- Purpose: [inform/request/follow-up/thank you]\n- Key points to include: [list your points]\n\nEnsure the email is concise, clear, and includes appropriate greeting and sign-off.",
    tags: ["email", "professional", "communication"],
    notes: "Customize tone and purpose for different contexts.",
    rating: 4,
    dateAdded: new Date().toISOString(),
    timesUsed: 20
  }
];

const PromptRepository = () => {
  // State
  const [prompts, setPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('promptRepository');
    if (saved) {
      setPrompts(JSON.parse(saved));
    } else {
      setPrompts(samplePrompts);
      localStorage.setItem('promptRepository', JSON.stringify(samplePrompts));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (prompts.length > 0) {
      localStorage.setItem('promptRepository', JSON.stringify(prompts));
    }
  }, [prompts]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get unique categories
  const categories = ['all', ...new Set(prompts.map(p => p.category))];

  // Get all unique tags
  const allTags = [...new Set(prompts.flatMap(p => p.tags || []))];

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = activeCategory === 'all' || prompt.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prompt.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  // Copy prompt to clipboard
  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt.content);
    setPrompts(prev => prev.map(p =>
      p.id === prompt.id ? { ...p, timesUsed: (p.timesUsed || 0) + 1 } : p
    ));
    showToast('Prompt copied to clipboard!');
  };

  // Delete prompt
  const deletePrompt = (id) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
      showToast('Prompt deleted successfully!');
    }
  };

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-repository-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Data exported successfully!');
  };

  // Import data
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          const newPrompts = imported.map(p => ({ ...p, id: Date.now() + Math.random() }));
          setPrompts(prev => [...prev, ...newPrompts]);
          showToast(`Imported ${imported.length} prompts!`);
        }
      } catch (err) {
        showToast('Failed to import file', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Quick Add Modal
  const QuickAddModal = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');

    const handleSave = () => {
      if (!content.trim()) {
        showToast('Please paste a prompt to save', 'error');
        return;
      }

      const autoTitle = title.trim() || content.split('\n')[0].slice(0, 60) + (content.length > 60 ? '...' : '');

      const autoTags = [];
      const keywords = ['code', 'write', 'analyze', 'explain', 'create', 'generate', 'review', 'summarize'];
      keywords.forEach(kw => {
        if (content.toLowerCase().includes(kw)) autoTags.push(kw);
      });

      const newPrompt = {
        id: Date.now(),
        title: autoTitle,
        category,
        content: content.trim(),
        tags: autoTags,
        notes: 'Added via Quick Add',
        rating: null,
        dateAdded: new Date().toISOString(),
        timesUsed: 0
      };

      setPrompts(prev => [newPrompt, ...prev]);
      setShowQuickAdd(false);
      showToast('⚡ Prompt saved instantly!');
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQuickAdd(false)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Add from Chat
            </h2>
            <button onClick={() => setShowQuickAdd(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">Paste a prompt from your Claude conversation and save it instantly!</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste Prompt Here *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your prompt from the Claude chat..."
                className="w-full border rounded-lg px-4 py-3 h-48 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave blank for auto-title"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option>General</option>
                <option>Coding</option>
                <option>Writing</option>
                <option>Analysis</option>
                <option>Creative</option>
                <option>Business</option>
                <option>Research</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowQuickAdd(false)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Save Instantly
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full Add/Edit Modal
  const AddEditModal = () => {
    const [formData, setFormData] = useState(editingPrompt || {
      title: '',
      category: '',
      content: '',
      tags: [],
      notes: '',
      rating: null
    });
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
      if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
        setTagInput('');
      }
    };

    const removeTag = (tag) => {
      setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSave = () => {
      if (!formData.title.trim() || !formData.category.trim() || !formData.content.trim()) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      if (editingPrompt) {
        setPrompts(prev => prev.map(p =>
          p.id === editingPrompt.id
            ? { ...p, ...formData, lastModified: new Date().toISOString() }
            : p
        ));
        showToast('Prompt updated successfully!');
      } else {
        const newPrompt = {
          ...formData,
          id: Date.now(),
          dateAdded: new Date().toISOString(),
          timesUsed: 0
        };
        setPrompts(prev => [newPrompt, ...prev]);
        showToast('Prompt added successfully!');
      }

      setShowAddModal(false);
      setEditingPrompt(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); setEditingPrompt(null); }}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h2>
            <button onClick={() => { setShowAddModal(false); setEditingPrompt(null); }} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Coding, Writing, Analysis"
                list="categoryList"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="categoryList">
                {categories.filter(c => c !== 'all').map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Paste your prompt here..."
                className="w-full border rounded-lg px-4 py-3 h-48 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (press Enter to add)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Type a tag and press Enter"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about when/how to use this prompt"
                className="w-full border rounded-lg px-4 py-2 h-20 resize-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Success Rate</label>
              <select
                value={formData.rating || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Not rated</option>
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                <option value="4">⭐⭐⭐⭐ Very Good</option>
                <option value="3">⭐⭐⭐ Good</option>
                <option value="2">⭐⭐ Fair</option>
                <option value="1">⭐ Needs Work</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => { setShowAddModal(false); setEditingPrompt(null); }} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prompt Card
  const PromptCard = ({ prompt }) => {
    const isExpanded = expandedPrompt === prompt.id;

    return (
      <div className={`bg-gray-50 rounded-xl p-5 transition-all hover:shadow-lg ${isExpanded ? 'ring-2 ring-indigo-500 bg-white' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{prompt.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium">
                {prompt.category}
              </span>
              {prompt.rating && (
                <span className="text-yellow-500 text-sm">
                  {'⭐'.repeat(prompt.rating)}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Used {prompt.timesUsed || 0} times
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {prompt.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-white text-gray-600 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className={`text-gray-600 text-sm leading-relaxed cursor-pointer ${isExpanded ? '' : 'line-clamp-3'}`}
          onClick={() => setExpandedPrompt(isExpanded ? null : prompt.id)}
        >
          <pre className="whitespace-pre-wrap font-sans">{prompt.content}</pre>
        </div>

        {!isExpanded && prompt.content.length > 200 && (
          <button
            onClick={() => setExpandedPrompt(prompt.id)}
            className="text-indigo-600 text-sm mt-2 hover:underline flex items-center gap-1"
          >
            Show more <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {isExpanded && (
          <button
            onClick={() => setExpandedPrompt(null)}
            className="text-indigo-600 text-sm mt-2 hover:underline flex items-center gap-1"
          >
            Show less <ChevronUp className="w-4 h-4" />
          </button>
        )}

        {prompt.notes && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-gray-600">
            📝 {prompt.notes}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => copyPrompt(prompt)}
            className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-1"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button
            onClick={() => { setEditingPrompt(prompt); setShowAddModal(true); }}
            className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 flex items-center gap-1"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => deletePrompt(prompt.id)}
            className="py-2 px-3 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              Prompt Repository
            </h1>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{prompts.length}</div>
                <div className="text-xs text-gray-500 uppercase">Prompts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{categories.length - 1}</div>
                <div className="text-xs text-gray-500 uppercase">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{allTags.length}</div>
                <div className="text-xs text-gray-500 uppercase">Tags</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white rounded-2xl p-5 shadow-xl h-fit md:sticky md:top-6">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 mb-3"
            >
              <Zap className="w-5 h-5" /> Quick Add from Chat
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2 mb-4"
            >
              <Plus className="w-5 h-5" /> Full Add Prompt
            </button>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {cat === 'all' ? 'All Prompts' : cat}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeCategory === cat ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {cat === 'all' ? prompts.length : prompts.filter(p => p.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <button
                onClick={exportData}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Data
              </button>
              <label className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Import Data
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </aside>

          {/* Main Content */}
          <main className="bg-white rounded-2xl p-6 shadow-xl min-h-[600px]">
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">No prompts found</h2>
                <p className="text-gray-500 mb-4">
                  {searchQuery || activeCategory !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Click "Add New Prompt" to start building your library.'}
                </p>
                {(searchQuery || activeCategory !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                    className="text-indigo-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPrompts.map(prompt => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showQuickAdd && <QuickAddModal />}
      {showAddModal && <AddEditModal />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg text-white ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } animate-slide-in`}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PromptRepository;
