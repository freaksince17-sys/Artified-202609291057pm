import React, { useEffect, useState } from 'react';
import { 
  X, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  MapPin, 
  Award, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Instagram
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getArtisanProfile, ArtisanProfileData } from '../data/artisanProfile';

interface MeetArtisanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreProducts?: () => void;
}

export const MeetArtisanModal: React.FC<MeetArtisanModalProps> = ({
  isOpen,
  onClose,
  onExploreProducts
}) => {
  const { language } = useLanguage();
  const isNe = language === 'ne';
  const [profile, setProfile] = useState<ArtisanProfileData>(() => getArtisanProfile());

  useEffect(() => {
    if (isOpen) {
      setProfile(getArtisanProfile());
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = profile.whatsappPhone || '9779767573721';
    const text = encodeURIComponent(
      isNe
        ? (profile.whatsappGreetingNe || 'नमस्ते सहिना दिदी! 🌸 मैले Artified वेबसाइटमा तपाईंको कथा पढें र हस्तनिर्मित मोती/म्याक्रामे सिर्जनाबारे कुरा गर्न चाहन्छु।')
        : (profile.whatsappGreetingEn || 'Namaste Sahina! 🌸 I just read your story on Artified and would love to ask about your handcrafted pearl and macrame pieces.')
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShop = () => {
    onClose();
    if (onExploreProducts) {
      onExploreProducts();
    } else {
      const el = document.getElementById('shop-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      {/* Dark Luxury Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0D0C0B]/80 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Truly Compact Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#D4AF37]/50 overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-[#1C1B1A] via-[#2A2623] to-[#1C1B1A] px-4 py-3 sm:px-5 sm:py-3.5 text-white overflow-hidden border-b border-[#D4AF37]/30 shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-[#D4AF37]/10 blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 relative z-10 pr-6">
            {/* Artisan Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] via-[#FFFDF9] to-[#C5A880] shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#24211F] flex items-center justify-center">
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.artisanName} - ${profile.artisanRole}`}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
                    }}
                  />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-[#D4AF37] text-[#1C1B1A] shadow-xs border border-[#1C1B1A]">
                <Sparkles className="w-2 h-2" />
              </span>
            </div>

            {/* Profile Intro */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-base sm:text-lg text-white font-semibold tracking-tight truncate">
                  {profile.artisanName}
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                  <Award className="w-2.5 h-2.5" />
                  <span>{profile.artisanRole}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#C5A880] truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{profile.atelierLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Body */}
        <div className="p-3 sm:p-4 space-y-2.5 text-[#1C1B1A] overflow-y-auto">
          
          {/* Sahina's Personal Quote - Compact */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-[#E8DFD8] shadow-2xs">
            <p className="font-serif italic text-xs sm:text-[12px] text-[#2C2926] leading-snug">
              {profile.quote}
            </p>
          </div>

          {/* Compact 2x2 Craft Pillars */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* Pillar 1 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-[#E8DFD8]">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <h4 className="font-serif font-bold text-[11px] text-[#1C1B1A] truncate">
                  {isNe ? 'चिकमुगलको जरा' : 'Kathmandu Roots'}
                </h4>
              </div>
              <p className="text-[10px] text-[#6E6761] leading-tight">
                {isNe ? 'नेवारी पोते र हातले बुन्ने मौलिक कला।' : 'Traditional Newari beadcraft reimagined.'}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-[#E8DFD8]">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-0.5">
                <Sparkles className="w-3 h-3 shrink-0" />
                <h4 className="font-serif font-bold text-[11px] text-[#1C1B1A] truncate">
                  {isNe ? 'मोती र म्याक्रामे' : 'Pearls & Macrame'}
                </h4>
              </div>
              <p className="text-[10px] text-[#6E6761] leading-tight">
                {isNe ? '९–१४ घण्टाको धैर्यतापूर्वक गाँठो पारिएको।' : '9–14 hours of patient artisan knotting.'}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-[#E8DFD8]">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-0.5">
                <Users className="w-3 h-3 shrink-0" />
                <h4 className="font-serif font-bold text-[11px] text-[#1C1B1A] truncate">
                  {isNe ? 'महिला सशक्तीकरण' : 'Local Artisans'}
                </h4>
              </div>
              <p className="text-[10px] text-[#6E6761] leading-tight">
                {isNe ? 'घरेलु महिलाहरूलाई उचित पारिश्रमिक।' : 'Fair wages for home-based women artisans.'}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-[#E8DFD8]">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-0.5">
                <Heart className="w-3 h-3 shrink-0" />
                <h4 className="font-serif font-bold text-[11px] text-[#1C1B1A] truncate">
                  {isNe ? 'बेहुली र विशेष अर्डर' : 'Bespoke Bridal'}
                </h4>
              </div>
              <p className="text-[10px] text-[#6E6761] leading-tight">
                {isNe ? 'नाप र पोशाकअनुसार विशेष सिर्जना।' : 'Custom lengths, drops, and matching sets.'}
              </p>
            </div>

          </div>

          {/* Ultra Slim Guarantee & Instagram Strip */}
          <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/30 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="font-medium text-[#1C1B1A] truncate">
                {isNe ? '२४ घण्टे सजिलो साटफेर ग्यारेन्टी' : '24-Hour Easy Exchange across Nepal'}
              </span>
            </div>
            <a
              href="https://www.instagram.com/artified_np/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#833ab4] font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <Instagram className="w-3 h-3" />
              <span>@artified_np</span>
            </a>
          </div>

        </div>

        {/* Modal Bottom Actions - Compact & Fully Visible */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white border-t border-[#E8DFD8] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShop}
            className="py-2 px-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1C1B1A] border border-[#E8DFD8] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>{isNe ? 'सिर्जनाहरू' : 'Explore Pieces'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#1C1B1A] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>{isNe ? 'ह्वाट्सएप' : 'DM Sahina'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
