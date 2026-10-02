import React from 'react';
import { ShoppingBag, Heart, Sparkles, Truck, Compass, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const MobileBottomBar: React.FC = () => {
  const { 
    cartCount, 
    setIsCartOpen, 
    wishlist, 
    setIsWishlistOpen, 
    setSelectedCategory,
    openTracker,
    openAccountModal,
    loyaltyPointsBalance
  } = useCart();

  const scrollToShop = () => {
    setSelectedCategory('all');
    const el = document.getElementById('shop-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#141312]/95 backdrop-blur-md border-t border-[#E8DFD8] dark:border-[#2D2B28] lg:hidden shadow-[0_-4px_20px_rgba(28,27,26,0.06)] px-2 py-1.5 transition-colors duration-200">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Explore Shop */}
        <button
          type="button"
          onClick={scrollToShop}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-[#5E5955] dark:text-[#A8A096] hover:text-[#1C1B1A] dark:hover:text-white"
        >
          <Compass className="w-5 h-5 text-[#1C1B1A] dark:text-[#F5F2EB]" />
          <span className="text-[10px] font-medium tracking-wider uppercase mt-0.5">Explore</span>
        </button>

        {/* Loyalty Rewards */}
        <button
          type="button"
          onClick={() => openAccountModal('rewards')}
          className="relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-[#5E5955] dark:text-[#A8A096] hover:text-[#D4AF37]"
        >
          <div className="relative">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <span className="absolute -top-1 -right-2 bg-[#D4AF37] text-[#1C1B1A] text-[8px] font-black px-1 rounded-full">
              {loyaltyPointsBalance}
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5 text-[#1C1B1A] dark:text-[#FAF8F5]">Rewards</span>
        </button>

        {/* Live Order Tracker */}
        <button
          type="button"
          onClick={() => openTracker()}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-[#5E5955] dark:text-[#A8A096] hover:text-[#C5A880] dark:hover:text-[#D4AF37]"
        >
          <Truck className="w-5 h-5 text-[#C5A880] dark:text-[#D4AF37]" />
          <span className="text-[10px] font-medium tracking-wider uppercase mt-0.5">Track</span>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => setIsWishlistOpen(true)}
          className="relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-[#5E5955] dark:text-[#A8A096] hover:text-[#1C1B1A] dark:hover:text-white"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-[#1C1B1A] dark:text-[#F5F2EB]'}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase mt-0.5">Wishlist</span>
        </button>

        {/* Shopping Bag */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-[#1C1B1A] dark:text-[#F5F2EB]"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-[#1C1B1A] dark:text-[#F5F2EB]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#C5A880] dark:bg-[#D4AF37] text-[#1C1B1A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5">Bag ({cartCount})</span>
        </button>

      </div>
    </div>
  );
};
