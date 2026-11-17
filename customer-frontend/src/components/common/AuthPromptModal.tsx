import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, X, LogIn, UserPlus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const AuthPromptModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal } = useCart();
  const navigate = useNavigate();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#1B4D3E] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-7 h-7 text-[#1B4D3E]" />
          </div>

          <h3 className="text-xl font-extrabold text-gray-900 mb-2">
            Sign In Required
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Please sign in or create a farmer account to add items to your persistent cart, access exclusive discounts, and place orders.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setShowAuthModal(false);
                navigate('/login');
              }}
              className="w-full py-3 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Sign In to Your Account
            </button>

            <button
              onClick={() => {
                setShowAuthModal(false);
                navigate('/register');
              }}
              className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Create New Farmer Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
