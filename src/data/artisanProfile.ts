import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SAVED_ARTISAN_PROFILE from './artisan_profile.json';

export interface ArtisanPillar {
  title: string;
  desc: string;
}

export interface ArtisanImageMetadata {
  uploadedAt: string;
  versionId: string;
  contentType?: string;
  source?: string;
}

export interface ArtisanProfileData {
  artisanName: string;
  artisanRole: string;
  atelierLocation: string;
  establishedText: string;
  avatarUrl: string;
  avatarPosition?: string;
  avatarUpdatedAt?: string;
  avatarMetadata?: ArtisanImageMetadata;
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

const savedProfile = (SAVED_ARTISAN_PROFILE as unknown as Partial<ArtisanProfileData>) || {};
const authenticAvatar = (savedProfile.avatarUrl && savedProfile.avatarUrl.length > 50) ? savedProfile.avatarUrl : '/artisan_avatar.png';

export const DEFAULT_ARTISAN_PROFILE: ArtisanProfileData = {
  artisanName: savedProfile.artisanName || 'Sahina Shrestha',
  artisanRole: savedProfile.artisanRole || 'Founder & Master Artisan',
  atelierLocation: savedProfile.atelierLocation || 'Chikamugal Atelier • Kathmandu, Nepal',
  establishedText: savedProfile.establishedText || 'Est. 2021 • 100% Handcrafted in Nepal',
  avatarUrl: authenticAvatar,
  avatarPosition: savedProfile.avatarPosition || 'center 20%',
  avatarUpdatedAt: savedProfile.avatarUpdatedAt || '2026-10-02T00:00:00.000Z',
  avatarMetadata: savedProfile.avatarMetadata || {
    uploadedAt: '2026-10-02T00:00:00.000Z',
    versionId: 'ver_sahina_authentic',
    source: 'Atelier Portrait'
  },
  stat1Value: savedProfile.stat1Value || '9–14 Hours',
  stat1Label: savedProfile.stat1Label || 'Devoted Per Bag',
  stat2Value: savedProfile.stat2Value || '3x Living Wage',
  stat2Label: savedProfile.stat2Label || 'Local Women Makers',
  headline: savedProfile.headline || 'Meet the Artisan: Sahina Shrestha',
  subheadline: savedProfile.subheadline || 'Slow Craft & Living Beadwork from Chikamugal, Kathmandu',
  quote: savedProfile.quote || '“In a world crowded with disposable fast fashion and factory plastics, I envisioned accessories carrying genuine human warmth, patience, and ancestral devotion. Every pearl strand and cotton cord is knotted with intention right here in historic Kathmandu.”',
  pillar1: savedProfile.pillar1 || {
    title: '1. Rooted in Chikamugal',
    desc: 'Drawing from centuries of Newari beadwork in Indrachowk, reimagining ancient tactile techniques into modern haute couture.'
  },
  pillar2: savedProfile.pillar2 || {
    title: '2. 9–14 Hours Hand-Knotting',
    desc: 'Reinforced 7-strand nylon-coated stainless cores with 3-pass anchor knotting ensures heirloom durability.'
  },
  pillar3: savedProfile.pillar3 || {
    title: '3. Empowering Local Women',
    desc: 'Providing dignified livelihoods and fair living wages (3x standard piece rates) to skilled home-based women makers.'
  },
  pillar4: savedProfile.pillar4 || {
    title: '4. Bespoke Bridal Tailoring',
    desc: 'Personalized bespoke collaborations for brides: customized drops, strand counts, and matching pearl clutches.'
  },
  whatsappPhone: savedProfile.whatsappPhone || '9779767573721',
  whatsappGreetingEn: savedProfile.whatsappGreetingEn || 'Namaste Sahina! 🌸 I just read your artisan story on Artified Nepal and would love to consult with you regarding your handcrafted pearl creations.',
  whatsappGreetingNe: savedProfile.whatsappGreetingNe || 'नमस्ते सहिना दिदी! 🌸 मैले Artified वेबसाइटमा तपाईंको कथा पढें र हस्तनिर्मित मोती/म्याक्रामे सिर्जनाबारे कुरा गर्न चाहन्छु।',
  guaranteeText: savedProfile.guaranteeText || '24-Hour Easy Exchange Guarantee across Nepal',
  instagramHandle: savedProfile.instagramHandle || '@artified_np'
};

const ARTISAN_STORAGE_KEY = 'artified_artisan_profile';

// Global isSaving flag to prevent any re-render fallback to defaults during active saves/uploads
let isProfileSavingInFlight = false;

export function getIsProfileSaving(): boolean {
  return isProfileSavingInFlight;
}

export function getArtisanProfile(): ArtisanProfileData {
  try {
    const raw = localStorage.getItem(ARTISAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Sanitize out old unwanted corporate or unsplash photo fallback if present
        let avatarUrl = parsed.avatarUrl;
        if (!avatarUrl || avatarUrl.includes('photo-') || avatarUrl.includes('unsplash.com') || (!avatarUrl.startsWith('/artisan_avatar') && !avatarUrl.startsWith('data:image/'))) {
          avatarUrl = '/artisan_avatar.png';
        }

        return {
          ...DEFAULT_ARTISAN_PROFILE,
          ...parsed,
          avatarUrl,
          pillar1: { ...DEFAULT_ARTISAN_PROFILE.pillar1, ...(parsed.pillar1 || {}) },
          pillar2: { ...DEFAULT_ARTISAN_PROFILE.pillar2, ...(parsed.pillar2 || {}) },
          pillar3: { ...DEFAULT_ARTISAN_PROFILE.pillar3, ...(parsed.pillar3 || {}) },
          pillar4: { ...DEFAULT_ARTISAN_PROFILE.pillar4, ...(parsed.pillar4 || {}) },
        };
      }
    }
  } catch (e) {
    console.warn('Notice: Error loading artisan profile from localStorage:', e);
  }
  return DEFAULT_ARTISAN_PROFILE;
}

export async function saveArtisanProfile(data: ArtisanProfileData): Promise<void> {
  isProfileSavingInFlight = true;
  try {
    const timestamp = new Date().toISOString();
    const versionId = `ver_${Date.now()}`;
    const enrichedData: ArtisanProfileData = {
      ...data,
      avatarUpdatedAt: timestamp,
      avatarMetadata: {
        ...(data.avatarMetadata || { uploadedAt: timestamp, versionId }),
        uploadedAt: timestamp,
        versionId
      }
    };

    // Step 1: Save to localStorage immediately - local is authoritative for current browser
    try {
      localStorage.setItem(ARTISAN_STORAGE_KEY, JSON.stringify(enrichedData));
    } catch (lsErr) {
      console.warn('Notice: localStorage save error:', lsErr);
    }
    window.dispatchEvent(new CustomEvent('artified_artisan_updated', { detail: enrichedData }));
    
    // Step 2: Explicitly persist to server JSON disk via API (permanent across reloads & server restarts)
    try {
      await fetch('/api/artisan-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData),
      });
    } catch (serverErr) {
      console.warn('Notice: Server API save error:', serverErr);
    }

    // Step 3: Explicitly persist to Firestore
    try {
      const firestorePayload: ArtisanProfileData = {
        ...enrichedData,
        avatarUrl: enrichedData.avatarUrl || DEFAULT_ARTISAN_PROFILE.avatarUrl
      };
      const activeProfileRef = doc(db, 'activeProfile', 'sahina_shrestha');
      const mirrorRef = doc(db, 'store_settings', 'artisan_profile');
      await setDoc(activeProfileRef, firestorePayload, { merge: true });
      await setDoc(mirrorRef, firestorePayload, { merge: true });
    } catch (fsErr) {
      console.warn('Notice: Firestore save error:', fsErr);
    }
  } catch (e) {
    console.warn('Notice: Error saving artisan profile:', e);
  } finally {
    isProfileSavingInFlight = false;
  }
}

export async function fetchArtisanProfileFromServer(): Promise<ArtisanProfileData> {
  const currentLocal = getArtisanProfile();
  
  // Return local storage state immediately so UI never blocks or lags
  // Fetch remote updates from server JSON disk and Firestore non-intrusively in background
  setTimeout(async () => {
    if (isProfileSavingInFlight) return;
    try {
      let serverData: any = null;
      let activeProfileData: any = null;
      let mirrorData: any = null;

      // 1. Fetch permanently saved profile from server disk
      try {
        const resp = await fetch('/api/artisan-profile');
        if (resp.ok) {
          serverData = await resp.json();
        }
      } catch (err) {}

      // 2. Fetch from Firestore
      try {
        const snap = await getDoc(doc(db, 'activeProfile', 'sahina_shrestha'));
        if (snap.exists()) {
          activeProfileData = snap.data();
        }
      } catch (err) {}

      try {
        const snap2 = await getDoc(doc(db, 'store_settings', 'artisan_profile'));
        if (snap2.exists()) {
          mirrorData = snap2.data();
        }
      } catch (err) {}

      // Prefer candidate with latest update or custom edits
      const candidates = [serverData, activeProfileData, mirrorData].filter(Boolean);
      if (candidates.length === 0) return;

      let authoritative = candidates[0];
      for (const cand of candidates) {
        const candTs = cand?.avatarUpdatedAt ? new Date(cand.avatarUpdatedAt).getTime() : 0;
        const authTs = authoritative?.avatarUpdatedAt ? new Date(authoritative.avatarUpdatedAt).getTime() : 0;
        if (candTs > authTs) {
          authoritative = cand;
        }
      }

      // Clean out corporate or unsplash photo if present in remote record
      if (authoritative?.avatarUrl && (authoritative.avatarUrl.includes('photo-') || authoritative.avatarUrl.includes('unsplash.com'))) {
        authoritative.avatarUrl = '/artisan_avatar.png';
      }

      // Check timestamps:
      const localUpdated = currentLocal?.avatarUpdatedAt ? new Date(currentLocal.avatarUpdatedAt).getTime() : 0;
      const remoteUpdated = authoritative?.avatarUpdatedAt ? new Date(authoritative.avatarUpdatedAt).getTime() : 0;

      // Detect if local is default
      const defaultTs = new Date('2026-10-02T00:00:00.000Z').getTime();
      const localIsDefault = !currentLocal?.avatarUpdatedAt || localUpdated <= defaultTs;

      let merged: ArtisanProfileData;
      if (remoteUpdated > localUpdated || (localIsDefault && remoteUpdated > defaultTs)) {
        // Remote is newer or local is uninitialized default: adopt remote permanently
        merged = {
          ...DEFAULT_ARTISAN_PROFILE,
          ...authoritative,
          avatarUrl: authoritative.avatarUrl || currentLocal.avatarUrl || DEFAULT_ARTISAN_PROFILE.avatarUrl,
          pillar1: { ...DEFAULT_ARTISAN_PROFILE.pillar1, ...(authoritative?.pillar1 || {}) },
          pillar2: { ...DEFAULT_ARTISAN_PROFILE.pillar2, ...(authoritative?.pillar2 || {}) },
          pillar3: { ...DEFAULT_ARTISAN_PROFILE.pillar3, ...(authoritative?.pillar3 || {}) },
          pillar4: { ...DEFAULT_ARTISAN_PROFILE.pillar4, ...(authoritative?.pillar4 || {}) },
        };
        try {
          localStorage.setItem(ARTISAN_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        window.dispatchEvent(new CustomEvent('artified_artisan_updated', { detail: merged }));
      } else if (localUpdated > remoteUpdated && localUpdated > defaultTs) {
        // Local is newer: sync local to server disk and Firestore so remote has the latest user edits!
        try {
          fetch('/api/artisan-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentLocal)
          }).catch(() => {});
          
          const fsPayload = {
            ...currentLocal,
            avatarUrl: currentLocal.avatarUrl || DEFAULT_ARTISAN_PROFILE.avatarUrl
          };
          setDoc(doc(db, 'activeProfile', 'sahina_shrestha'), fsPayload, { merge: true }).catch(() => {});
          setDoc(doc(db, 'store_settings', 'artisan_profile'), fsPayload, { merge: true }).catch(() => {});
        } catch {}
      }
    } catch (e) {}
  }, 50);

  return currentLocal;
}
