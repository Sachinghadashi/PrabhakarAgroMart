import { axiosClient } from './axiosClient';

export interface ServiceabilityResponse {
  pincode: string;
  is_serviceable: boolean;
  zone: string;
  estimated_delivery_time: string;
  cod_available: boolean;
  free_shipping_eligible: boolean;
  carrier: string;
}

export const shippingApi = {
  checkServiceability: async (pincode: string): Promise<ServiceabilityResponse> => {
    const res = await axiosClient.get('/shipping/check-serviceability/', {
      params: { pincode },
    });
    return res.data;
  },
};
