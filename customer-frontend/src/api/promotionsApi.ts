import { axiosClient } from './axiosClient';

export interface CouponItem {
  id: number;
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  min_order_value: string;
  max_discount: string | null;
  is_active: boolean;
  is_valid: boolean;
}

export const promotionsApi = {
  getCoupons: async (): Promise<CouponItem[]> => {
    const res = await axiosClient.get('/promotions/coupons/');
    return res.data.results || res.data;
  },
};
