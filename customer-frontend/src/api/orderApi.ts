import { axiosClient } from './axiosClient';
import { Order, InvoiceData } from '../types';

export const orderApi = {
  checkout: async (data: { address_id: number; payment_method: 'RAZORPAY' | 'COD'; notes?: string }): Promise<Order> => {
    const res = await axiosClient.post('/orders/checkout/', data);
    return res.data;
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await axiosClient.get('/orders/history/');
    return res.data.results || res.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const res = await axiosClient.get(`/orders/history/${id}/`);
    return res.data;
  },

  cancelOrder: async (id: number, reason?: string): Promise<Order> => {
    const res = await axiosClient.post(`/orders/history/${id}/cancel/`, { reason });
    return res.data;
  },

  getInvoice: async (id: number): Promise<InvoiceData> => {
    const res = await axiosClient.get(`/orders/history/${id}/invoice/`);
    return res.data;
  },
};
