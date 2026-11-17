import { axiosClient } from './axiosClient';

export interface RazorpayCheckoutData {
  gateway_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  company_name: string;
  order_number: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export const paymentApi = {
  createRazorpayOrder: async (orderId: number): Promise<RazorpayCheckoutData> => {
    const res = await axiosClient.post('/payments/razorpay/create-order/', { order_id: orderId });
    return res.data;
  },

  verifyRazorpayPayment: async (data: {
    order_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const res = await axiosClient.post('/payments/razorpay/verify/', data);
    return res.data;
  },

  confirmCOD: async (orderId: number) => {
    const res = await axiosClient.post('/payments/cod/confirm/', { order_id: orderId });
    return res.data;
  },
};
