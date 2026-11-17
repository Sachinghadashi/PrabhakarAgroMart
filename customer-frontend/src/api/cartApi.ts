import { axiosClient } from './axiosClient';
import { CartSummary } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartSummary> => {
    const res = await axiosClient.get('/cart/');
    return res.data;
  },

  addItem: async (variantId: number, quantity: number = 1): Promise<CartSummary> => {
    const res = await axiosClient.post('/cart/items/', {
      variant_id: variantId,
      quantity,
    });
    return res.data;
  },

  updateQuantity: async (itemId: number, quantity: number): Promise<CartSummary> => {
    const res = await axiosClient.patch(`/cart/items/${itemId}/`, { quantity });
    return res.data;
  },

  removeItem: async (itemId: number): Promise<CartSummary> => {
    const res = await axiosClient.delete(`/cart/items/${itemId}/`);
    return res.data;
  },

  clearCart: async (): Promise<CartSummary> => {
    const res = await axiosClient.delete('/cart/');
    return res.data;
  },

  applyCoupon: async (code: string): Promise<CartSummary> => {
    const res = await axiosClient.post('/cart/apply-coupon/', { code });
    return res.data;
  },

  removeCoupon: async (): Promise<CartSummary> => {
    const res = await axiosClient.post('/cart/remove-coupon/');
    return res.data;
  },
};
