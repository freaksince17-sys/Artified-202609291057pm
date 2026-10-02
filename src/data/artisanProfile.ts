export interface ArtisanPillar {
  title: string;
  desc: string;
}

export interface ArtisanProfileData {
  artisanName: string;
  artisanRole: string;
  atelierLocation: string;
  establishedText: string;
  avatarUrl: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  headline: string;
  subheadline: string;
  quote: string;
  pillar1: ArtisanPillar;
  pillar2: ArtisanPillar;
  pillar3: ArtisanPillar;
  pillar4: ArtisanPillar;
  whatsappPhone: string;
  whatsappGreetingEn: string;
  whatsappGreetingNe: string;
  guaranteeText: string;
  instagramHandle: string;
}

export const DEFAULT_ARTISAN_PROFILE: ArtisanProfileData = {
  artisanName: 'Sahina Shrestha',
  artisanRole: 'Founder & Master Artisan',
  atelierLocation: 'Chikamugal Atelier • Kathmandu, Nepal',
  establishedText: 'Est. 2021 • 100% Handcrafted in Nepal',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
  stat1Value: '9–14 Hours',
  stat1Label: 'Devoted Per Bag',
  stat2Value: '3x Living Wage',
  stat2Label: 'Local Women Makers',
  headline: 'Meet the Artisan: Sahina Shrestha',
  subheadline: 'Slow Craft & Living Beadwork from Chikamugal, Kathmandu',
  quote: '“In a world crowded with disposable fast fashion and factory plastics, I envisioned accessories carrying genuine human warmth, patience, and ancestral devotion. Every pearl strand and cotton cord is knotted with intention right here in historic Kathmandu.”',
  pillar1: {
    title: '1. Rooted in Chikamugal',
    desc: 'Drawing from centuries of Newari beadwork in Indrachowk, reimagining ancient tactile techniques into modern haute couture.'
  },
  pillar2: {
    title: '2. 9–14 Hours Hand-Knotting',
    desc: 'Reinforced 7-strand nylon-coated stainless cores with 3-pass anchor knotting ensures heirloom durability.'
  },
  pillar3: {
    title: '3. Empowering Local Women',
    desc: 'Providing dignified livelihoods and fair living wages (3x standard piece rates) to skilled home-based women makers.'
  },
  pillar4: {
    title: '4. Bespoke Bridal Tailoring',
    desc: 'Personalized bespoke collaborations for brides: customized drops, strand counts, and matching pearl clutches.'
  },
  whatsappPhone: '9779767573721',
  whatsappGreetingEn: 'Namaste Sahina! 🌸 I just read your artisan story on Artified Nepal and would love to consult with you regarding your handcrafted pearl creations.',
  whatsappGreetingNe: 'नमस्ते सहिना दिदी! 🌸 मैले Artified वेबसाइटमा तपाईंको कथा पढें र हस्तनिर्मित मोती/म्याक्रामे सिर्जनाबारे कुरा गर्न चाहन्छु।',
  guaranteeText: '24-Hour Easy Exchange Guarantee across Nepal',
  instagramHandle: '@artified_np'
};

const ARTISAN_STORAGE_KEY = 'artified_artisan_profile';

export function getArtisanProfile(): ArtisanProfileData {
  try {
    const raw = localStorage.getItem(ARTISAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_ARTISAN_PROFILE,
        ...parsed,
        pillar1: { ...DEFAULT_ARTISAN_PROFILE.pillar1, ...(parsed.pillar1 || {}) },
        pillar2: { ...DEFAULT_ARTISAN_PROFILE.pillar2, ...(parsed.pillar2 || {}) },
        pillar3: { ...DEFAULT_ARTISAN_PROFILE.pillar3, ...(parsed.pillar3 || {}) },
        pillar4: { ...DEFAULT_ARTISAN_PROFILE.pillar4, ...(parsed.pillar4 || {}) },
      };
    }
  } catch (e) {
    console.warn('Notice: Error loading artisan profile from localStorage:', e);
  }
  return DEFAULT_ARTISAN_PROFILE;
}

export function saveArtisanProfile(data: ArtisanProfileData): void {
  try {
    localStorage.setItem(ARTISAN_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('artified_artisan_updated', { detail: data }));
  } catch (e) {
    console.warn('Notice: Error saving artisan profile to localStorage:', e);
  }
}
