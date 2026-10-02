import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Award, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Check, 
  Search, 
  Tag, 
  ArrowRight, 
  X, 
  Plus, 
  Edit3,
  Feather,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_CRAFT_STORY } from '../data/products';
import { getCraftArticles, saveCraftArticle } from '../data/journalArticles';
import { CAVIAR_PEARL_BAG_IMAGE, getRealProductImage } from '../utils/productImages';
import { CraftArticle } from '../types';

type CategoryFilter = 'All' | 'Craft Techniques' | 'Nepali Heritage' | 'Care Guides' | 'Bridal & Styling';

const resolveVideoSrc = (url?: string): string => {
  if (!url) return '/tiktok_videos/7625655459537603860.mp4';
  if (url.endsWith('.mp4') || url.startsWith('/tiktok_videos/')) return url;
  const match = url.match(/(\d{15,22})/);
  if (match && match[1]) {
    return `/tiktok_videos/${match[1]}.mp4`;
  }
  return '/tiktok_videos/7625655459537603860.mp4';
};

export const CraftStoryAndJournal: React.FC = () => {
  const { 
    craftStory, 
    isSellerMode, 
    setIsCraftStoryModalOpen,
    setQuickViewProduct,
    products,
    openMeetArtisanModal,
    activeNavTab
  } = useCart();
  const { language } = useLanguage();
  const isNe = language === 'ne';

  const story = craftStory || DEFAULT_CRAFT_STORY;

  // Video State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isSectionMuted, setIsSectionMuted] = useState(true);
  const [isCraftHovered, setIsCraftHovered] = useState(false);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

  // Journal Articles State
  const [articles, setArticles] = useState<CraftArticle[]>(() => getCraftArticles());
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<CraftArticle | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Publisher modal for Shop Owner
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newCategory, setNewCategory] = useState<'Craft Techniques' | 'Nepali Heritage' | 'Care Guides' | 'Bridal & Styling'>('Craft Techniques');
  const [newCoverImage, setNewCoverImage] = useState(CAVIAR_PEARL_BAG_IMAGE);
  const [newContentText, setNewContentText] = useState('');
  const [newTagsText, setNewTagsText] = useState('Pearl Weaving, Kathmandu, Handmade');
  const [newKeywordsText, setNewKeywordsText] = useState('handmade pearl bags nepal, chikamugal craft');

  useEffect(() => {
    const handleUpdate = () => {
      setArticles(getCraftArticles());
    };
    window.addEventListener('artified_articles_updated', handleUpdate);
    return () => window.removeEventListener('artified_articles_updated', handleUpdate);
  }, []);

  // Autoplay starts ONLY when mouse is hovered, and pauses when mouse leaves
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (isCraftHovered) {
      video.muted = isSectionMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingVideo(true))
          .catch((err) => {
            console.warn('Playback notice:', err);
          });
      }
    } else {
      video.pause();
      setIsPlayingVideo(false);
    }
  }, [isCraftHovered, isSectionMuted]);

  const togglePlay = () => {
    const video = mainVideoRef.current;
    if (!video) return;
    if (video.paused) {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => setIsPlayingVideo(true)).catch(() => {});
      }
    } else {
      video.pause();
      setIsPlayingVideo(false);
    }
  };

  const toggleMute = () => {
    setIsSectionMuted((prev) => {
      const next = !prev;
      if (mainVideoRef.current) {
        mainVideoRef.current.muted = next;
      }
      return next;
    });
  };

  const filteredArticles = articles.filter((art) => {
    const matchCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchQuery = !query || 
      art.title.toLowerCase().includes(query) ||
      art.subtitle.toLowerCase().includes(query) ||
      art.tags.some(t => t.toLowerCase().includes(query));
    return matchCategory && matchQuery;
  });

  const handleShareArticle = (art: CraftArticle) => {
    if (navigator.share) {
      navigator.share({
        title: art.title,
        text: art.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveNewArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContentText.trim()) return;

    const newArt: CraftArticle = {
      id: `art-${Date.now()}`,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `journal-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Handcrafted Heritage from Kathmandu',
      excerpt: newExcerpt.trim() || newContentText.slice(0, 160) + '...',
      content: newContentText.trim().split('\n\n'),
      author: 'Sahina Shrestha',
      authorRole: 'Master Artisan & Founder',
      category: newCategory,
      publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: `${Math.max(2, Math.ceil(newContentText.split(' ').length / 180))} min read`,
      coverImage: newCoverImage.trim(),
      tags: newTagsText.split(',').map(t => t.trim()).filter(Boolean),
      seoKeywords: newKeywordsText.split(',').map(k => k.trim()).filter(Boolean),
    };

    saveCraftArticle(newArt);
    setArticles(getCraftArticles());
    setIsPublishModalOpen(false);
    // Reset
    setNewTitle('');
    setNewSubtitle('');
    setNewExcerpt('');
    setNewContentText('');
  };

  // Safe image helper
  const getSafeImageUrl = (img?: string) => {
    if (!img || img.startsWith('/uploads/') || img.includes('blob:') || img.includes('unsplash.com')) {
      return '/tiktok_videos/7625655459537603860_cover.jpg';
    }
    return img;
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pt-1 sm:pt-2 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">

        {/* SECTION 1: THE ATELIER STORY & LIVING CRAFT */}
        <section className="bg-white rounded-3xl p-4 sm:p-7 border border-[#E8DFD8] shadow-sm relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 sm:mb-6 pb-4 border-b border-[#F0EBE5]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8DFD8] text-[#8C5D36] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Chikamugal Atelier • Kathmandu, Nepal</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1C1B1A] font-semibold tracking-tight">
                {isNe ? 'हाम्रो कथा र जीवित शिल्पकारी' : 'Our Story & Living Craft'}
              </h1>
              <p className="text-xs sm:text-sm text-[#736C65] max-w-2xl leading-relaxed">
                {isNe
                  ? 'काठमाडौंको ऐतिहासिक गल्लीमा मोती र म्याक्रामेलाई आधुनिक विलासितामा रूपान्तरण गर्दै।'
                  : 'In a world of mass production, every pearl strand and cotton cord is knotted with intention and human warmth right here in Kathmandu.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openMeetArtisanModal}
                className="py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1C1B1A] border border-[#E8DFD8] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Meet Sahina Shrestha</span>
              </button>

              {isSellerMode && (
                <button
                  type="button"
                  onClick={() => setIsCraftStoryModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-[#1C1B1A] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Story</span>
                </button>
              )}
            </div>
          </div>

          {/* Story Showcase: Video & Philosophy Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Making Video Player */}
            <div 
              className="lg:col-span-6 relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5] max-h-[460px] rounded-2xl overflow-hidden bg-[#1C1B1A] shadow-md border border-[#E8DFD8] group cursor-pointer"
              onMouseEnter={() => setIsCraftHovered(true)}
              onMouseLeave={() => setIsCraftHovered(false)}
              onClick={togglePlay}
            >
              <video
                ref={mainVideoRef}
                src={resolveVideoSrc(story.videoUrl)}
                poster={getSafeImageUrl(story.image1)}
                autoPlay={false}
                muted={isSectionMuted}
                loop
                playsInline
                preload="metadata"
                onPlay={() => setIsPlayingVideo(true)}
                onPause={() => setIsPlayingVideo(false)}
                className="w-full h-full object-cover"
              />

              {/* Video Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Play / Pause indicator button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center text-white transition-all transform ${isPlayingVideo ? 'opacity-0 scale-75' : 'opacity-100 scale-100 shadow-xl'}`}>
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>

              {/* Top controls */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider border border-white/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Chikamugal Workshop</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-xs text-white hover:bg-black/70 border border-white/20 transition-all cursor-pointer"
                  aria-label={isSectionMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isSectionMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Bottom Video Caption */}
              <div className="absolute bottom-3 left-3 right-3 text-white space-y-1 z-10">
                <p className="text-xs font-bold font-serif tracking-wide drop-shadow-sm">
                  {story.title || 'Hand-knotted with Reinforced Core Wire'}
                </p>
                <p className="text-[10px] text-white/80 line-clamp-2">
                  Each baroque pearl is individually threaded and balanced by hand in our Kathmandu workshop.
                </p>
              </div>
            </div>

            {/* Right: The 3 Core Pillars */}
            <div className="lg:col-span-6 space-y-4">
              {/* Pillar 1 */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8] hover:border-[#D4AF37]/50 transition-all space-y-1.5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1B1A]">
                    {isNe ? '१. १००% मौलिक हस्तनिर्मित' : '1. 100% Patiently Handcrafted'}
                  </h3>
                </div>
                <p className="text-xs text-[#5E5955] leading-relaxed">
                  No factory molding or glued parts. Every bag requires 9 to 14 hours of continuous knotting on high-tensile core threads that last for decades.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8] hover:border-[#D4AF37]/50 transition-all space-y-1.5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Heart className="w-4 h-4" />
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1B1A]">
                    {isNe ? '२. घरेलु महिला कालिगढको सशक्तीकरण' : '2. Ethical Valley Livelihoods'}
                  </h3>
                </div>
                <p className="text-xs text-[#5E5955] leading-relaxed">
                  Artified pays fair living wages (3x standard piece rates) to skilled home-based women artisans across Kathmandu, Lalitpur, and Bhaktapur.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8] hover:border-[#D4AF37]/50 transition-all space-y-1.5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <ShieldCheck className="w-4 h-4" />
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1B1A]">
                    {isNe ? '३. २४ घण्टे सजिलो साटफेर' : '3. Authentic Baroque Freshwater Pearls'}
                  </h3>
                </div>
                <p className="text-xs text-[#5E5955] leading-relaxed">
                  We hand-select organic freshwater baroque pearls with deep luster and unique natural contours, creating one-of-a-kind heirlooms.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: THE CRAFT JOURNAL & HERITAGE LIBRARY */}
        <section className="space-y-6">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E8DFD8]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[#C5A880] text-xs font-bold uppercase tracking-wider mb-1">
                <Feather className="w-3.5 h-3.5" />
                <span>Artisanal Essays & Heritage Guides</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1B1A] font-semibold">
                Craft Journal & Styling Library
              </h2>
            </div>

            {/* Actions: Search & Publisher */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C847E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-[#E8DFD8] rounded-xl text-xs text-[#1C1B1A] placeholder-[#8C847E] focus:outline-none focus:border-[#C5A880] w-48 sm:w-60 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C847E] hover:text-[#1C1B1A]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isSellerMode && (
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-[#1C1B1A] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Article</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(['All', 'Craft Techniques', 'Nepali Heritage', 'Care Guides', 'Bridal & Styling'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#1C1B1A] text-[#FAF8F5] shadow-xs'
                    : 'bg-white text-[#736C65] border border-[#E8DFD8] hover:border-[#C5A880] hover:text-[#1C1B1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Article Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="bg-white rounded-2xl overflow-hidden border border-[#E8DFD8] hover:border-[#C5A880] transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col group"
              >
                {/* Article Cover Photo */}
                <div className="aspect-[16/10] overflow-hidden bg-[#FAF8F5] relative">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1B1A]/85 backdrop-blur-xs text-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider border border-white/20">
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{article.readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1B1A] group-hover:text-[#C5A880] transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#736C65] line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F0EBE5] flex items-center justify-between text-xs text-[#8C847E]">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span className="font-medium text-[#1C1B1A]">{article.author}</span>
                    </span>
                    <span className="text-[#C5A880] group-hover:translate-x-1 transition-transform font-bold inline-flex items-center gap-1">
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DFD8]">
              <p className="text-sm font-semibold text-[#1C1B1A]">No articles found matching &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-3 text-xs text-[#C5A880] hover:underline font-bold"
              >
                Clear filters
              </button>
            </div>
          )}

        </section>

      </div>

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8DFD8] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-white border-b border-[#E8DFD8] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                {activeArticle.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareArticle(activeArticle)}
                  className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#736C65] hover:text-[#1C1B1A] cursor-pointer"
                  title="Share article"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#736C65] hover:text-[#1C1B1A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reader Content */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-xs">
                <img
                  src={activeArticle.coverImage}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1B1A] font-semibold leading-tight">
                  {activeArticle.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#8C847E] mt-2 flex-wrap">
                  <span>By {activeArticle.author} ({activeArticle.authorRole})</span>
                  <span>•</span>
                  <span>{activeArticle.publishedDate}</span>
                  <span>•</span>
                  <span>{activeArticle.readTime}</span>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-[#5E5955] space-y-4 leading-relaxed font-sans text-xs sm:text-sm">
                {activeArticle.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-[#E8DFD8] flex flex-wrap gap-1.5">
                {activeArticle.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-white border border-[#E8DFD8] text-[#736C65] text-[11px] rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Reader Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-[#E8DFD8] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveArticle(null);
                  openMeetArtisanModal();
                }}
                className="text-xs font-bold text-[#8C5D36] hover:text-[#1C1B1A] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Meet the Artisan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="py-1.5 px-4 bg-[#1C1B1A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PUBLISHER MODAL FOR SHOP OWNER (SELLER STUDIO) */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E8DFD8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD8] mb-4">
              <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">Publish Journal Article</h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 text-[#8C847E] hover:text-[#1C1B1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewArticle} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#1C1B1A] uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The Sacred Knotting of Baroque Pearls"
                  className="w-full px-3 py-2 border border-[#E8DFD8] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1B1A] uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E8DFD8] rounded-xl text-xs bg-white"
                >
                  <option value="Craft Techniques">Craft Techniques</option>
                  <option value="Nepali Heritage">Nepali Heritage</option>
                  <option value="Care Guides">Care Guides</option>
                  <option value="Bridal & Styling">Bridal & Styling</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1B1A] uppercase mb-1">Cover Image URL</label>
                <input
                  type="text"
                  required
                  value={newCoverImage}
                  onChange={(e) => setNewCoverImage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8DFD8] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1B1A] uppercase mb-1">Content (Paragraphs)</label>
                <textarea
                  required
                  rows={5}
                  value={newContentText}
                  onChange={(e) => setNewContentText(e.target.value)}
                  placeholder="Write the article content here. Separate paragraphs with double enter..."
                  className="w-full px-3 py-2 border border-[#E8DFD8] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-[#736C65]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#1C1B1A] text-[#D4AF37] font-bold text-xs"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
