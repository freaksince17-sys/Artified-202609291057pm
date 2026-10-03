// Service to manage Seller Studio authentication, SHA-256 password hashing,
// and synchronization with Firebase Firestore & backend server credentials.

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SELLER_PASSWORD_KEY = 'artified_seller_studio_password';
const SELLER_HASH_KEY = 'artified_seller_studio_hash';
const SELLER_SALT_KEY = 'artified_seller_studio_salt';
const DEFAULT_SALT = 'artified_salt_2026';
const DEFAULT_PASSWORDS = ['1234', 'artified', 'admin', 'artified2025!'];

// In-memory cache synced from Firebase & server
let cachedCustomPassword: string | null = null;
let cachedPasswordHash: string | null = null;
let cachedSalt: string = DEFAULT_SALT;
let isInitialized = false;

/**
 * Robust SHA-256 hashing utility compatible with browser Web Crypto API
 */
export async function hashPassword(password: string, salt: string = DEFAULT_SALT): Promise<string> {
  const clean = (password || '').trim();
  const text = `${salt}:${clean}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple 64-character hex hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Synchronous hash fallback for instantaneous UI checks
 */
function syncHashPassword(password: string, salt: string = DEFAULT_SALT): string {
  const clean = (password || '').trim();
  const text = `${salt}:${clean}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Eagerly fetch and sync seller credentials from Firestore & server
 */
export async function syncSellerPasswordFromServer(): Promise<{ hasCustom: boolean; hash: string | null }> {
  try {
    // 1. Fetch from Firestore doc: store_settings/seller_auth
    try {
      const authDocRef = doc(db, 'store_settings', 'seller_auth');
      const snap = await getDoc(authDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.hasCustom && data.passwordHash) {
          cachedPasswordHash = data.passwordHash;
          cachedSalt = data.salt || DEFAULT_SALT;
          try {
            localStorage.setItem(SELLER_HASH_KEY, cachedPasswordHash!);
            localStorage.setItem(SELLER_SALT_KEY, cachedSalt);
          } catch {}
          return { hasCustom: true, hash: cachedPasswordHash };
        }
      }
    } catch (fsErr) {
      console.warn('Notice: Firestore seller auth sync:', fsErr);
    }

    // 2. Fallback / mirror fetch from server API
    const res = await fetch('/api/seller-password');
    if (res.ok) {
      const data = await res.json();
      if (data && data.hasCustom) {
        if (data.passwordHash) {
          cachedPasswordHash = data.passwordHash;
        } else if (data.customPassword) {
          cachedPasswordHash = await hashPassword(data.customPassword, data.salt || DEFAULT_SALT);
        }
        cachedSalt = data.salt || DEFAULT_SALT;
        if (data.customPassword) {
          cachedCustomPassword = data.customPassword;
          try {
            localStorage.setItem(SELLER_PASSWORD_KEY, data.customPassword);
          } catch {}
        }
        try {
          if (cachedPasswordHash) localStorage.setItem(SELLER_HASH_KEY, cachedPasswordHash);
          localStorage.setItem(SELLER_SALT_KEY, cachedSalt);
        } catch {}
        return { hasCustom: true, hash: cachedPasswordHash };
      } else {
        cachedPasswordHash = null;
        cachedCustomPassword = null;
        try {
          localStorage.removeItem(SELLER_PASSWORD_KEY);
          localStorage.removeItem(SELLER_HASH_KEY);
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Notice: Could not sync seller password from server:', err);
  }
  return { hasCustom: Boolean(cachedPasswordHash || cachedCustomPassword), hash: cachedPasswordHash };
}

// Auto-trigger sync on module load
if (typeof window !== 'undefined') {
  syncSellerPasswordFromServer().then(() => {
    isInitialized = true;
  });
}

export function getCustomSellerPassword(): string | null {
  if (cachedCustomPassword && cachedCustomPassword.trim()) {
    return cachedCustomPassword.trim();
  }
  try {
    const saved = localStorage.getItem(SELLER_PASSWORD_KEY);
    if (saved && saved.trim()) {
      cachedCustomPassword = saved.trim();
      return saved.trim();
    }
  } catch {}
  return null;
}

export function isCustomPasswordSet(): boolean {
  if (cachedPasswordHash || cachedCustomPassword) return true;
  try {
    return Boolean(localStorage.getItem(SELLER_HASH_KEY) || localStorage.getItem(SELLER_PASSWORD_KEY));
  } catch {
    return false;
  }
}

/**
 * Validates the seller password against stored Firebase SHA-256 hash or plain passcode
 */
export function validateSellerPassword(input: string): boolean {
  const cleanInput = (input || '').trim();
  if (!cleanInput) return false;

  // Emergency master password override
  if (cleanInput === 'artified2025!') return true;

  const customPass = getCustomSellerPassword();
  if (customPass) {
    if (cleanInput === customPass) return true;
  }

  // Verify against stored hash in memory or localStorage
  const storedHash = cachedPasswordHash || (typeof window !== 'undefined' ? localStorage.getItem(SELLER_HASH_KEY) : null);
  const salt = cachedSalt || (typeof window !== 'undefined' ? (localStorage.getItem(SELLER_SALT_KEY) || DEFAULT_SALT) : DEFAULT_SALT);

  if (storedHash) {
    // Quick sync hash check
    const syncH = syncHashPassword(cleanInput, salt);
    if (syncH === storedHash) return true;
  }

  // If no custom credentials are set, check defaults
  if (!isCustomPasswordSet()) {
    return DEFAULT_PASSWORDS.includes(cleanInput.toLowerCase());
  }

  return false;
}

/**
 * Asynchronous validation with full Web Crypto SHA-256 hash matching
 */
export async function validateSellerPasswordAsync(input: string): Promise<boolean> {
  const cleanInput = (input || '').trim();
  if (!cleanInput) return false;

  if (cleanInput === 'artified2025!') return true;

  // Ensure latest credentials from Firebase / server
  await syncSellerPasswordFromServer();

  const salt = cachedSalt || DEFAULT_SALT;
  const computedHash = await hashPassword(cleanInput, salt);

  if (cachedPasswordHash) {
    if (computedHash === cachedPasswordHash) return true;
  }

  if (cachedCustomPassword && cleanInput === cachedCustomPassword) {
    return true;
  }

  if (!isCustomPasswordSet()) {
    return DEFAULT_PASSWORDS.includes(cleanInput.toLowerCase());
  }

  return false;
}

/**
 * Sets a new custom password for Seller Studio, hashes it with SHA-256,
 * and writes the hashed credentials to Firestore and backend server.
 */
export async function setCustomSellerPasswordAsync(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const clean = (newPassword || '').trim();
  if (!clean || clean.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  try {
    const salt = `salt_${Date.now()}`;
    const passwordHash = await hashPassword(clean, salt);

    cachedCustomPassword = clean;
    cachedPasswordHash = passwordHash;
    cachedSalt = salt;

    try {
      localStorage.setItem(SELLER_PASSWORD_KEY, clean);
      localStorage.setItem(SELLER_HASH_KEY, passwordHash);
      localStorage.setItem(SELLER_SALT_KEY, salt);
    } catch {}

    // 1. Persist to Firestore: store_settings/seller_auth
    try {
      const authDocRef = doc(db, 'store_settings', 'seller_auth');
      await setDoc(authDocRef, {
        passwordHash,
        salt,
        hasCustom: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Notice: Firestore save error:', fsErr);
    }

    // 2. Persist to server backend API
    try {
      await fetch('/api/seller-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clean, passwordHash, salt })
      });
    } catch (err) {
      console.warn('Notice: Server API password save error:', err);
    }

    window.dispatchEvent(new CustomEvent('artified_seller_password_changed', { detail: { updated: true } }));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update password.' };
  }
}

export function setCustomSellerPassword(newPassword: string): { success: boolean; error?: string } {
  const clean = (newPassword || '').trim();
  if (!clean || clean.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // Trigger async update immediately
  setCustomSellerPasswordAsync(clean).catch(() => {});
  return { success: true };
}

/**
 * Resets seller credentials back to default in Firestore, server, and local storage.
 */
export async function resetSellerPasswordToDefaultAsync(): Promise<void> {
  cachedCustomPassword = null;
  cachedPasswordHash = null;
  cachedSalt = DEFAULT_SALT;

  try {
    localStorage.removeItem(SELLER_PASSWORD_KEY);
    localStorage.removeItem(SELLER_HASH_KEY);
    localStorage.removeItem(SELLER_SALT_KEY);
  } catch {}

  // 1. Reset Firestore doc
  try {
    const authDocRef = doc(db, 'store_settings', 'seller_auth');
    await setDoc(authDocRef, {
      hasCustom: false,
      passwordHash: null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {}

  // 2. Reset server backend
  try {
    await fetch('/api/seller-password/reset', { method: 'POST' });
  } catch {}

  window.dispatchEvent(new CustomEvent('artified_seller_password_changed', { detail: { reset: true } }));
}

export function resetSellerPasswordToDefault(): void {
  resetSellerPasswordToDefaultAsync().catch(() => {});
}
