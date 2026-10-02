import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Award, 
  Users, 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  MessageCircle, 
  Instagram, 
  Clock, 
  CheckCircle2, 
  ShoppingBag,
  ExternalLink,
  Edit3,
  Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArtisanProfileData, 
  getArtisanProfile 
} from '../data/artisanProfile';
import { ArtisanProfileEditModal } from './ArtisanProfileEditModal';

export const MeetArtisanSection: React.FC = () => {
  const { setActiveNavTab, isSellerMode } = useCart();
  const { language } = useLanguage();
  const isNe = language === 'ne';

  const [profile, setProfile] = useState<ArtisanProfileData>(() => getArtisanProfile());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getArtisanProfile());
    };
    window.addEventListener('artified_artisan_updated', handleUpdate);
    return () => window.removeEventListener('artified_artisan_updated', handleUpdate);
  }, []);

  const handleWhatsApp = () => {
    const phone = profile.whatsappPhone || '9779767573721';
    const text = encodeURIComponent(
      isNe
        ? (profile.whatsappGreetingNe || 'नमस्ते सहिना दिदी! 🌸 मैले Artified वेबसाइटमा तपाईंको कथा पढें र हस्तनिर्मित मोती/म्याक्रामे सिर्जनाबारे कुरा गर्न चाहन्छु।')
        : (profile.whatsappGreetingEn || 'Namaste Sahina! 🌸 I just read your artisan story on Artified Nepal and would love to consult with you regarding your handcrafted pearl creations.')
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShop = () => {
    setActiveNavTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pt-1 sm:pt-2 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-3.5 sm:space-y-5">
        
        {/* SELLER DIRECT EDIT BANNER (Visible only to the seller) */}
        {isSellerMode && (
          <div className="bg-gradient-to-r from-[#1C1B1A] via-[#2A2724] to-[#1C1B1A] text-white p-3 sm:p-3.5 rounded-2xl border border-[#D4AF37]/50 shadow-lg flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Seller Edit Mode Active</span>
                  <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/20 px-1.5 py-0.2 rounded font-semibold uppercase">
                    Live On-Page
                  </span>
                </p>
                <p className="text-[11px] text-[#A69E96]">
                  You can edit Sahina's bio, quotes, photos, 4 craft pillars, and stats directly on this page.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="py-1.5 px-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#c29f2e] text-[#1C1B1A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Artisan Profile Directly</span>
            </button>
          </div>
        )}

        {/* HERO BANNER SECTION */}
        <section className="bg-white rounded-3xl p-4 sm:p-7 border border-[#E8DFD8] shadow-sm relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Atelier Breadcrumb */}
          <div className="flex items-center justify-between pb-3.5 mb-4 sm:mb-6 border-b border-[#F0EBE5] flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8DFD8] text-[#8C5D36] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{profile.atelierLocation}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#736C65]">
                {profile.establishedText}
              </span>

              {isSellerMode && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1 rounded-md text-[#8C7A6B] hover:text-[#1C1B1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  title="Edit artisan details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C5A880]" />
                </button>
              )}
            </div>
          </div>

          {/* Main 2-Column Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Artisan Portrait & Verified Badge */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border-2 border-[#D4AF37]/40 bg-[#1C1B1A] group">
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.artisanName} - ${profile.artisanRole}`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85';
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Direct edit button over photo in seller mode */}
                {isSellerMode && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute top-3 right-3 z-20 py-1 px-2.5 rounded-full bg-black/80 hover:bg-black text-[#D4AF37] border border-[#D4AF37]/50 text-[10px] font-bold flex items-center gap-1 shadow-md transition-transform hover:scale-105"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change Photo</span>
                  </button>
                )}

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating Artisan Bio Pill */}
                <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/90 text-[#1C1B1A] text-[10px] font-bold uppercase tracking-wider mb-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span>{profile.artisanRole}</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-between">
                    <span>{profile.artisanName}</span>
                    {isSellerMode && (
                      <span 
                        onClick={() => setIsEditModalOpen(true)} 
                        className="text-[10px] text-[#D4AF37] font-sans font-normal underline cursor-pointer"
                      >
                        Edit
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#FAF8F5]/80 mt-0.5">
                    {profile.atelierLocation}
                  </p>
                </div>
              </div>

              {/* Quick Trust Strip Below Avatar */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3 rounded-xl bg-[#FAF8F5] border border-[#E8DFD8] text-center ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <Clock className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                  <p className="font-serif font-bold text-sm text-[#1C1B1A]">{profile.stat1Value}</p>
                  <p className="text-[10px] text-[#736C65]">{profile.stat1Label}</p>
                </div>

                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3 rounded-xl bg-[#FAF8F5] border border-[#E8DFD8] text-center ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <Heart className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                  <p className="font-serif font-bold text-sm text-[#1C1B1A]">{profile.stat2Value}</p>
                  <p className="text-[10px] text-[#736C65]">{profile.stat2Label}</p>
                </div>
              </div>
            </div>

            {/* Right: Story, Philosophy & The 4 Pillars */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="font-serif text-2xl sm:text-4xl text-[#1C1B1A] font-semibold tracking-tight">
                    {profile.headline}
                  </h1>
                  {isSellerMode && (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#1C1B1A] border border-transparent hover:border-[#E8DFD8] transition-colors cursor-pointer shrink-0"
                      title="Edit headline"
                    >
                      <Edit3 className="w-4 h-4 text-[#C5A880]" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#8C5D36] font-medium tracking-wide uppercase">
                  {profile.subheadline}
                </p>
              </div>

              {/* Artisan Quote Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD8] relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 bg-[#1C1B1A] text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {isNe ? 'कालिगढको भनाइ' : 'Artisan Philosophy'}
                  </span>
                  {isSellerMode && (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-[11px] font-semibold text-[#8C5D36] hover:text-[#1C1B1A] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Quote</span>
                    </button>
                  )}
                </div>
                <p className="font-serif italic text-sm sm:text-base text-[#1C1B1A] leading-relaxed pt-1">
                  {profile.quote}
                </p>
              </div>

              {/* The 4 Craft Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Pillar 1 */}
                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3.5 rounded-xl bg-white border border-[#E8DFD8] space-y-1.5 shadow-2xs ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between text-[#D4AF37]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1B1A]">
                        {profile.pillar1?.title || '1. Rooted in Chikamugal'}
                      </h4>
                    </div>
                    {isSellerMode && <Edit3 className="w-3 h-3 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#5E5955] leading-relaxed">
                    {profile.pillar1?.desc}
                  </p>
                </div>

                {/* Pillar 2 */}
                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3.5 rounded-xl bg-white border border-[#E8DFD8] space-y-1.5 shadow-2xs ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between text-[#D4AF37]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1B1A]">
                        {profile.pillar2?.title || '2. 9–14 Hours Hand-Knotting'}
                      </h4>
                    </div>
                    {isSellerMode && <Edit3 className="w-3 h-3 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#5E5955] leading-relaxed">
                    {profile.pillar2?.desc}
                  </p>
                </div>

                {/* Pillar 3 */}
                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3.5 rounded-xl bg-white border border-[#E8DFD8] space-y-1.5 shadow-2xs ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between text-[#D4AF37]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1B1A]">
                        {profile.pillar3?.title || '3. Empowering Local Women'}
                      </h4>
                    </div>
                    {isSellerMode && <Edit3 className="w-3 h-3 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#5E5955] leading-relaxed">
                    {profile.pillar3?.desc}
                  </p>
                </div>

                {/* Pillar 4 */}
                <div 
                  onClick={() => isSellerMode && setIsEditModalOpen(true)}
                  className={`p-3.5 rounded-xl bg-white border border-[#E8DFD8] space-y-1.5 shadow-2xs ${isSellerMode ? 'hover:border-[#C5A880] cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between text-[#D4AF37]">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1B1A]">
                        {profile.pillar4?.title || '4. Bespoke Bridal Tailoring'}
                      </h4>
                    </div>
                    {isSellerMode && <Edit3 className="w-3 h-3 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#5E5955] leading-relaxed">
                    {profile.pillar4?.desc}
                  </p>
                </div>

              </div>

              {/* Call-to-Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-[#1C1B1A] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/60 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>{isNe ? 'सहिनासँग ह्वाट्सएपमा कुरा गर्नुहोस्' : 'Consult Sahina on WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShop}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1C1B1A] border border-[#E8DFD8] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <span>{isNe ? 'सिर्जनाहरू हेर्नुहोस्' : 'Browse Handcrafted Pieces'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* 24-Hour Easy Exchange Guarantee Banner */}
              <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-[#D4AF37]/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-semibold text-xs text-[#1C1B1A]">
                    {profile.guaranteeText || '24-Hour Easy Exchange Guarantee across Nepal'}
                  </span>
                </div>

                <a
                  href={`https://www.instagram.com/${(profile.instagramHandle || 'artified_np').replace('@', '')}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#833ab4] font-bold hover:underline flex items-center gap-1 shrink-0"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{profile.instagramHandle || '@artified_np'}</span>
                </a>
              </div>

            </div>

          </div>

        </section>

      </div>

      {/* Artisan Profile Direct Editor Modal */}
      <ArtisanProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => setProfile(getArtisanProfile())}
      />
    </div>
  );
};
