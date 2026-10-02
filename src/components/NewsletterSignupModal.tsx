import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Sparkles, 
  Check, 
  Gift, 
  Tag, 
  Copy, 
  ArrowRight, 
  Crown, 
  Bell, 
  ShieldCheck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ArtifiedLogo } from './ArtifiedLogo';

export const NewsletterSignupModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const { applyPromoCode, setSelectedCategory, setActiveNavTab } = useCart();

  const VIP_PROMO_CODE = 'FIRSTDROP10';

  useEffect(() => {
    // Check if user has already seen or closed the modal in this session, or already subscribed
    const alreadySeen = sessionStorage.getItem('artified_newsletter_modal_seen');
    const alreadySubscribed = localStorage.getItem('artified_newsletter_subscribed');

    if (alreadySeen || alreadySubscribed) {
      return;
    }

    // Modal appears once after exactly 15 seconds of browsing the boutique
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem('artified_newsletter_modal_seen', 'true');
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('artified_newsletter_modal_seen', 'true');
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(VIP_PROMO_CODE);
      setCopiedCode(true);
      applyPromoCode(VIP_PROMO_CODE);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      applyPromoCode(VIP_PROMO_CODE);
      setCopiedCode(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save directly to Firestore collection 'newsletter_subscribers'
      const subscriberId = `sub_${Date.now()}_${trimmed.replace(/[^a-z0-9]/g, '_').slice(0, 30)}`;
      const subData = {
        id: subscriberId,
        email: trimmed,
        subscribedAt: new Date().toISOString(),
        source: 'popup_modal_15s',
        discountCode: VIP_PROMO_CODE
      };

      try {
        await setDoc(doc(db, 'newsletter_subscribers', subscriberId), subData);
      } catch (firestoreErr) {
        console.warn('Firestore write notice:', firestoreErr);
      }

      // 2. Save locally so user is never prompted again
      const stored = localStorage.getItem('artified_newsletter_subscribers');
      const list = stored ? JSON.parse(stored) : [];
      const alreadyInList = list.some((item: { email: string }) => item.email === trimmed);

      if (!alreadyInList) {
        list.push(subData);
        localStorage.setItem('artified_newsletter_subscribers', JSON.stringify(list));
      }

      localStorage.setItem('artified_newsletter_subscribed', 'true');
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to store newsletter subscriber', err);
      setIsSubmitting(false);
      setIsSuccess(true); // Graceful recovery
    }
  };

  const handleExploreShop = () => {
    handleClose();
    setActiveNavTab('home');
    setSelectedCategory('all');
    const el = document.getElementById('shop-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
    >
      <div 
        className="relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl bg-[#1C1B1A] border-2 border-[#D4AF37]/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-[#FAF8F5] transition-all animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative ambient background glows */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#C5A880]/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#E8DFD8] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close newsletter modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 p-6 sm:p-8">
          {!isSuccess ? (
            <div className="space-y-4 text-center">
              {/* Brand Logo & VIP Tag */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <ArtifiedLogo variant="light" size="sm" />
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#C5A880]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-semibold tracking-widest uppercase mt-1">
                  <Crown className="w-3 h-3" />
                  <span>Private Drop Register</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div>
                <h2 
                  id="newsletter-modal-title" 
                  className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-wide"
                >
                  Be First For Upcoming Drops
                </h2>
                <p className="text-xs sm:text-sm text-[#A69E96] mt-2 leading-relaxed max-w-sm mx-auto">
                  Get private release alerts for new handmade pearl evening bags, baroque chokers, and secret boutique collections before they sell out.
                </p>
              </div>

              {/* Luxury Benefit Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 text-left">
                <div className="p-2.5 rounded-2xl bg-[#282624]/80 border border-[#3E3A36] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 text-[#D4AF37]">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-white leading-tight">First Notice</span>
                    <span className="text-[9px] text-[#A69E96]">Early drop alerts</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#282624]/80 border border-[#3E3A36] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 text-[#D4AF37]">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-white leading-tight">10% Off</span>
                    <span className="text-[9px] text-[#A69E96]">First order gift</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#282624]/80 border border-[#3E3A36] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 text-[#D4AF37]">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-white leading-tight">Free Gift Wrap</span>
                    <span className="text-[9px] text-[#A69E96]">Wax-sealed card</span>
                  </div>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A69E96]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter your email for private drop access..."
                    className="w-full pl-10 pr-4 py-3 bg-[#282624] border border-[#3E3A36] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-xs sm:text-sm text-white placeholder-[#736C65] outline-none transition-all"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 font-medium text-left">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] hover:from-[#c49f2c] hover:to-[#b3956e] text-[#1C1B1A] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Securing Your Access...</span>
                  ) : (
                    <>
                      <span>Get VIP Early Access & 10% Off</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Non-intrusive dismiss option */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-[#736C65]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>No spam. Unsubscribe anytime.</span>
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="hover:text-[#FAF8F5] underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif text-2xl text-white font-normal">
                  Welcome to the Inner Circle ✨
                </h3>
                <p className="text-xs sm:text-sm text-[#A69E96] mt-2 max-w-sm mx-auto leading-relaxed">
                  You are registered for early notifications on our next handmade creations. Here is your 10% welcome coupon:
                </p>
              </div>

              {/* Coupon Code Display Box */}
              <div className="p-4 rounded-2xl bg-[#282624] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-sm mx-auto">
                <div className="text-left">
                  <span className="text-[10px] text-[#8C847E] uppercase font-bold tracking-wider block">
                    Your 10% Off Voucher
                  </span>
                  <span className="font-mono text-lg font-bold text-[#D4AF37]">
                    {VIP_PROMO_CODE}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#D4AF37] hover:bg-[#c49f2c] text-[#1C1B1A]'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy & Apply</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExploreShop}
                  className="w-full py-3 px-6 bg-white hover:bg-[#FAF8F5] text-[#1C1B1A] font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Explore Handcrafted Collections
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
