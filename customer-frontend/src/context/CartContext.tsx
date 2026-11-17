import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartSummary } from '../types';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartSummary | null;
  isLoading: boolean;
  totalItemsCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, refreshCart]);

  const addToCart = async (variantId: number, quantity: number = 1): Promise<boolean> => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.addItem(variantId, quantity);
      setCart(updatedCart);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.updateQuantity(itemId, quantity);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.clearCart();
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.applyCoupon(code);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = async () => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.removeCoupon();
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        totalItemsCount: cart?.total_items_count || 0,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
