import { axiosClient } from './axiosClient';
import { Category, Brand, Product, ProductDetail } from '../types';

export interface ProductQueryFilters {
  category_slug?: string;
  brand_slug?: string;
  crop?: string;
  product_type?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  ordering?: string;
  page?: number;
}

export const catalogApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await axiosClient.get('/catalog/categories/');
    return res.data.results || res.data;
  },

  getBrands: async (): Promise<Brand[]> => {
    const res = await axiosClient.get('/catalog/brands/');
    return res.data.results || res.data;
  },

  getCrops: async (): Promise<string[]> => {
    const res = await axiosClient.get('/catalog/crops/');
    return res.data;
  },

  getProducts: async (filters: ProductQueryFilters = {}): Promise<{ count: number; results: Product[]; next: string | null; previous: string | null }> => {
    const res = await axiosClient.get('/catalog/products/', { params: filters });
    if (Array.isArray(res.data)) {
      return { count: res.data.length, results: res.data, next: null, previous: null };
    }
    return res.data;
  },

  getProductBySlug: async (slug: string): Promise<ProductDetail> => {
    const res = await axiosClient.get(`/catalog/products/${slug}/`);
    return res.data;
  },
};

