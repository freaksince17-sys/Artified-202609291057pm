import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Image as ImageIcon, 
  User, 
  MapPin, 
  Clock, 
  Heart, 
  Quote, 
  Layers, 
  Phone, 
  ShieldCheck, 
  Instagram,
  Check
} from 'lucide-react';
import { 
  ArtisanProfileData, 
  DEFAULT_ARTISAN_PROFILE, 
  getArtisanProfile, 
  saveArtisanProfile 
} from '../data/artisanProfile';

interface ArtisanProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ArtisanProfileEditModal: React.FC<ArtisanProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [profile, setProfile] = useState<ArtisanProfileData>(() => getArtisanProfile());
  const [activeTab, setActiveTab] = useState<'general' | 'story' | 'pillars' | 'contact'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getArtisanProfile());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveArtisanProfile(profile);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all artisan details to original atelier defaults?')) {
      setProfile({ ...DEFAULT_ARTISAN_PROFILE });
      saveArtisanProfile({ ...DEFAULT_ARTISAN_PROFILE });
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#FAF8F5] border border-[#E8DFD8] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-white border-b border-[#E8DFD8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1B1A]">
                Edit "Meet the Artisan"
              </h3>
              <p className="text-[11px] text-[#736C65] font-medium">
                Direct Seller Editor • Edits will instantly update the live page
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#736C65] hover:text-[#1C1B1A] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E8DFD8] bg-[#FAF8F5] px-5 sm:px-7 shrink-0 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-[#C5A880] text-[#1C1B1A]'
                : 'border-transparent text-[#736C65] hover:text-[#1C1B1A]'
            }`}
          >
            1. Artisan Identity & Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'story'
                ? 'border-[#C5A880] text-[#1C1B1A]'
                : 'border-transparent text-[#736C65] hover:text-[#1C1B1A]'
            }`}
          >
            2. Headline, Quote & Philosophy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pillars')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pillars'
                ? 'border-[#C5A880] text-[#1C1B1A]'
                : 'border-transparent text-[#736C65] hover:text-[#1C1B1A]'
            }`}
          >
            3. The 4 Craft Pillars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#C5A880] text-[#1C1B1A]'
                : 'border-transparent text-[#736C65] hover:text-[#1C1B1A]'
            }`}
          >
            4. WhatsApp & Guarantees
          </button>
        </div>

        {/* Tab Content & Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Artisan profile saved successfully! The page has updated live.</span>
            </div>
          )}

          {/* TAB 1: General & Photo */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    Artisan Name
                  </label>
                  <input
                    type="text"
                    value={profile.artisanName}
                    onChange={(e) => setProfile({ ...profile, artisanName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="e.g. Sahina Shrestha"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    Artisan Role / Title
                  </label>
                  <input
                    type="text"
                    value={profile.artisanRole}
                    onChange={(e) => setProfile({ ...profile, artisanRole: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="e.g. Founder & Master Artisan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    Atelier Location Text
                  </label>
                  <input
                    type="text"
                    value={profile.atelierLocation}
                    onChange={(e) => setProfile({ ...profile, atelierLocation: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="e.g. Chikamugal Atelier • Kathmandu, Nepal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    Established Badge Text
                  </label>
                  <input
                    type="text"
                    value={profile.establishedText}
                    onChange={(e) => setProfile({ ...profile, establishedText: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="e.g. Est. 2021 • 100% Handcrafted in Nepal"
                  />
                </div>
              </div>

              {/* Photo & Portrait */}
              <div className="pt-2 border-t border-[#E8DFD8]">
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  Artisan Portrait Photo URL
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#1C1B1A] shrink-0 border border-[#D4AF37]/50">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.artisanName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={profile.avatarUrl}
                      onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none font-mono"
                      placeholder="https://images.unsplash.com/... or /tiktok_videos/..."
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#736C65]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85' })}
                        className="px-2 py-0.5 bg-white border border-[#E8DFD8] hover:border-[#C5A880] rounded text-[10px] text-[#1C1B1A]"
                      >
                        Sahina Portrait (Unsplash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, avatarUrl: '/tiktok_videos/7625655459537603860_cover.jpg' })}
                        className="px-2 py-0.5 bg-white border border-[#E8DFD8] hover:border-[#C5A880] rounded text-[10px] text-[#1C1B1A]"
                      >
                        Atelier Craft Video Cover
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Below Photo */}
              <div className="pt-2 border-t border-[#E8DFD8] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5D36]">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Stat Card 1 (Time devoted)</span>
                  </div>
                  <input
                    type="text"
                    value={profile.stat1Value}
                    onChange={(e) => setProfile({ ...profile, stat1Value: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                    placeholder="e.g. 9–14 Hours"
                  />
                  <input
                    type="text"
                    value={profile.stat1Label}
                    onChange={(e) => setProfile({ ...profile, stat1Label: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                    placeholder="e.g. Devoted Per Bag"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5D36]">
                    <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Stat Card 2 (Fair living wage)</span>
                  </div>
                  <input
                    type="text"
                    value={profile.stat2Value}
                    onChange={(e) => setProfile({ ...profile, stat2Value: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                    placeholder="e.g. 3x Living Wage"
                  />
                  <input
                    type="text"
                    value={profile.stat2Label}
                    onChange={(e) => setProfile({ ...profile, stat2Label: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                    placeholder="e.g. Local Women Makers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Headline, Quote & Philosophy */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  Main Section Headline
                </label>
                <input
                  type="text"
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                  placeholder="e.g. Meet the Artisan: Sahina Shrestha"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  Subheadline / Heritage Byline
                </label>
                <input
                  type="text"
                  value={profile.subheadline}
                  onChange={(e) => setProfile({ ...profile, subheadline: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                  placeholder="e.g. Slow Craft & Living Beadwork from Chikamugal, Kathmandu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1 flex items-center justify-between">
                  <span>Artisan Quote & Philosophy</span>
                  <span className="text-[10px] text-[#8C7A6B] font-normal">Highlighted prominently in gold card</span>
                </label>
                <textarea
                  rows={4}
                  value={profile.quote}
                  onChange={(e) => setProfile({ ...profile, quote: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none leading-relaxed"
                  placeholder="Share Sahina's personal philosophy on slow fashion and handmade art..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: The 4 Craft Pillars */}
          {activeTab === 'pillars' && (
            <div className="space-y-4">
              <p className="text-xs text-[#736C65]">
                Customize the 4 core craft pillars displayed in the 2x2 grid on the artisan section.
              </p>

              {/* Pillar 1 */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                <span className="text-xs font-bold text-[#8C5D36]">Craft Pillar 1</span>
                <input
                  type="text"
                  value={profile.pillar1.title}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar1: { ...profile.pillar1, title: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                  placeholder="e.g. 1. Rooted in Chikamugal"
                />
                <textarea
                  rows={2}
                  value={profile.pillar1.desc}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar1: { ...profile.pillar1, desc: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                  placeholder="Pillar description..."
                />
              </div>

              {/* Pillar 2 */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                <span className="text-xs font-bold text-[#8C5D36]">Craft Pillar 2</span>
                <input
                  type="text"
                  value={profile.pillar2.title}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar2: { ...profile.pillar2, title: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                  placeholder="e.g. 2. 9–14 Hours Hand-Knotting"
                />
                <textarea
                  rows={2}
                  value={profile.pillar2.desc}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar2: { ...profile.pillar2, desc: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                  placeholder="Pillar description..."
                />
              </div>

              {/* Pillar 3 */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                <span className="text-xs font-bold text-[#8C5D36]">Craft Pillar 3</span>
                <input
                  type="text"
                  value={profile.pillar3.title}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar3: { ...profile.pillar3, title: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                  placeholder="e.g. 3. Empowering Local Women"
                />
                <textarea
                  rows={2}
                  value={profile.pillar3.desc}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar3: { ...profile.pillar3, desc: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                  placeholder="Pillar description..."
                />
              </div>

              {/* Pillar 4 */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD8] space-y-2">
                <span className="text-xs font-bold text-[#8C5D36]">Craft Pillar 4</span>
                <input
                  type="text"
                  value={profile.pillar4.title}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar4: { ...profile.pillar4, title: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs font-bold"
                  placeholder="e.g. 4. Bespoke Bridal Tailoring"
                />
                <textarea
                  rows={2}
                  value={profile.pillar4.desc}
                  onChange={(e) => setProfile({
                    ...profile,
                    pillar4: { ...profile.pillar4, desc: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD8] rounded-lg text-xs"
                  placeholder="Pillar description..."
                />
              </div>
            </div>
          )}

          {/* TAB 4: WhatsApp & Guarantees */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={profile.whatsappPhone}
                    onChange={(e) => setProfile({ ...profile, whatsappPhone: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="e.g. 9779767573721"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={profile.instagramHandle}
                    onChange={(e) => setProfile({ ...profile, instagramHandle: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                    placeholder="@artified_np"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  Exchange Guarantee Banner Text
                </label>
                <input
                  type="text"
                  value={profile.guaranteeText}
                  onChange={(e) => setProfile({ ...profile, guaranteeText: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                  placeholder="e.g. 24-Hour Easy Exchange Guarantee across Nepal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  WhatsApp Default Pre-filled Message (English)
                </label>
                <textarea
                  rows={2}
                  value={profile.whatsappGreetingEn}
                  onChange={(e) => setProfile({ ...profile, whatsappGreetingEn: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1">
                  WhatsApp Default Pre-filled Message (Nepali)
                </label>
                <textarea
                  rows={2}
                  value={profile.whatsappGreetingNe}
                  onChange={(e) => setProfile({ ...profile, whatsappGreetingNe: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] focus:border-[#C5A880] rounded-xl text-xs text-[#1C1B1A] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-[#E8DFD8] flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-[#8C7A6B] hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Atelier Defaults</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-[#E8DFD8] bg-white text-xs font-bold text-[#5E5955] hover:text-[#1C1B1A] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-[#1C1B1A] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/60 text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
