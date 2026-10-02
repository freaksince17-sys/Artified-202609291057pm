// Service to manage Seller Studio authentication and custom secure password

const SELLER_PASSWORD_KEY = 'artified_seller_studio_password';
const DEFAULT_PASSWORDS = ['1234', 'artified', 'admin'];

export function getCustomSellerPassword(): string | null {
  try {
    const saved = localStorage.getItem(SELLER_PASSWORD_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // localStorage not accessible
  }
  return null;
}

export function isCustomPasswordSet(): boolean {
  return getCustomSellerPassword() !== null;
}

export function validateSellerPassword(input: string): boolean {
  const cleanInput = (input || '').trim();
  if (!cleanInput) return false;

  const customPassword = getCustomSellerPassword();
  if (customPassword) {
    // If user has set a custom password, that is the primary valid password.
    // Also accept the custom password or default emergency master password
    return cleanInput === customPassword || cleanInput === 'artified2025!';
  }

  // If no custom password has been set yet, accept the initial defaults
  return DEFAULT_PASSWORDS.includes(cleanInput.toLowerCase());
}

export function setCustomSellerPassword(newPassword: string): { success: boolean; error?: string } {
  const clean = (newPassword || '').trim();
  if (!clean || clean.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  try {
    localStorage.setItem(SELLER_PASSWORD_KEY, clean);
    window.dispatchEvent(new CustomEvent('artified_seller_password_changed', { detail: { updated: true } }));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to save password to browser storage.' };
  }
}

export function resetSellerPasswordToDefault(): void {
  try {
    localStorage.removeItem(SELLER_PASSWORD_KEY);
    window.dispatchEvent(new CustomEvent('artified_seller_password_changed', { detail: { reset: true } }));
  } catch {
    // ignore
  }
}
