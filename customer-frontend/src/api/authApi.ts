import { axiosClient } from './axiosClient';
import { User, Address, CustomerProfile } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await axiosClient.post('/auth/login/', credentials);
    return res.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    password_confirmation: string;
    full_name: string;
    phone?: string;
  }) => {
    const res = await axiosClient.post('/auth/register/', userData);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await axiosClient.get('/auth/me/');
    return res.data;
  },

  updateProfile: async (profileData: Partial<CustomerProfile>) => {
    const res = await axiosClient.patch('/auth/profile/', profileData);
    return res.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const res = await axiosClient.get('/auth/addresses/');
    return res.data.results || res.data;
  },

  createAddress: async (addressData: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
    const res = await axiosClient.post('/auth/addresses/', addressData);
    return res.data;
  },

  updateAddress: async (id: number, addressData: Partial<Address>): Promise<Address> => {
    const res = await axiosClient.patch(`/auth/addresses/${id}/`, addressData);
    return res.data;
  },

  deleteAddress: async (id: number): Promise<void> => {
    await axiosClient.delete(`/auth/addresses/${id}/`);
  },
};
