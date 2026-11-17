import axios from 'axios';
import {
  AdminUser,
  DashboardMetrics,
  Product,
  Category,
  Brand,
  InventoryItem,
  InventoryTransaction,
  Order,
  Customer,
  Coupon,
  AuditLogEntry,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const adminAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('pam_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle 401
adminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pam_admin_token');
      localStorage.removeItem('pam_admin_user');
      window.dispatchEvent(new Event('admin:logout'));
    }
    return Promise.reject(err);
  }
);

export const adminApi = {
  // Authentication
  login: async (credentials: { email: string; password: string }) => {
    const res = await adminAxios.post('/auth/admin-login/', credentials);
    return res.data;
  },

  getMe: async (): Promise<AdminUser> => {
    const res = await adminAxios.get('/auth/me/');
    return res.data;
  },

  // Dashboard Metrics
  getDashboardMetrics: async (range: string = '7d'): Promise<DashboardMetrics> => {
    const res = await adminAxios.get('/admin-panel/dashboard/', { params: { range } });
    return res.data;
  },

  // Catalog Products
  getProducts: async (params?: any): Promise<{ results: Product[]; count: number }> => {
    const res = await adminAxios.get('/catalog/products/', { params });
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },

  createProduct: async (productData: any): Promise<Product> => {
    const res = await adminAxios.post('/catalog/products/', productData);
    return res.data;
  },

  updateProduct: async (slug: string, productData: any): Promise<Product> => {
    const res = await adminAxios.patch(`/catalog/products/${slug}/`, productData);
    return res.data;
  },

  deleteProduct: async (slug: string): Promise<void> => {
    await adminAxios.delete(`/catalog/products/${slug}/`);
  },

  createVariant: async (variantData: any) => {
    const res = await adminAxios.post('/catalog/variants/', variantData);
    return res.data;
  },

  // Product Images (Cloudinary & Media)
  uploadProductImage: async (productId: number, payload: { file?: File; external_url?: string; is_primary?: boolean }) => {
    if (payload.file) {
      const formData = new FormData();
      formData.append('product', String(productId));
      formData.append('image', payload.file);
      formData.append('is_primary', payload.is_primary !== false ? 'true' : 'false');
      const res = await adminAxios.post('/catalog/images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else if (payload.external_url) {
      const res = await adminAxios.post('/catalog/images/', {
        product: productId,
        external_url: payload.external_url,
        is_primary: payload.is_primary !== false,
      });
      return res.data;
    }
  },

  deleteProductImage: async (imageId: number) => {
    await adminAxios.delete(`/catalog/images/${imageId}/`);
  },

  // Categories & Brands
  getCategories: async (): Promise<Category[]> => {
    const res = await adminAxios.get('/catalog/categories/');
    return res.data.results || res.data;
  },

  createCategory: async (categoryData: any): Promise<Category> => {
    const res = await adminAxios.post('/catalog/categories/', categoryData);
    return res.data;
  },

  getBrands: async (): Promise<Brand[]> => {
    const res = await adminAxios.get('/catalog/brands/');
    return res.data.results || res.data;
  },

  // Inventory Management
  getInventory: async (statusFilter?: string): Promise<InventoryItem[]> => {
    const res = await adminAxios.get('/catalog/inventory/', {
      params: { status: statusFilter },
    });
    return res.data.results || res.data;
  },

  adjustInventory: async (data: { variant_id: number; quantity_diff: number; reason: string }) => {
    const res = await adminAxios.post('/catalog/inventory/adjust/', data);
    return res.data;
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const res = await adminAxios.get('/catalog/inventory/transactions/');
    return res.data.results || res.data;
  },

  // Orders Fulfillment
  getOrders: async (params?: any): Promise<{ results: Order[]; count: number }> => {
    const res = await adminAxios.get('/orders/admin-orders/', { params });
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },

  transitionOrderStatus: async (orderId: number, data: { target_status: string; tracking_number?: string; courier_name?: string }) => {
    const res = await adminAxios.post(`/orders/admin-orders/${orderId}/transition/`, data);
    return res.data;
  },

  markCODCollected: async (orderId: number) => {
    const res = await adminAxios.post('/payments/cod/mark-collected/', { order_id: orderId });
    return res.data;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    // Fetch customer users
    const res = await adminAxios.get('/auth/addresses/');
    // Fallback/derive customer list or use order customer records
    return [];
  },

  // Coupons
  getCoupons: async (): Promise<Coupon[]> => {
    const res = await adminAxios.get('/promotions/coupons/');
    return res.data.results || res.data;
  },

  createCoupon: async (couponData: any): Promise<Coupon> => {
    const res = await adminAxios.post('/promotions/coupons/', couponData);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    const res = await adminAxios.get('/admin-panel/audit-logs/');
    return res.data.results || res.data;
  },

  // Export URLs
  getSalesExportCSVUrl: () => `${API_BASE_URL}/admin-panel/reports/sales/?format=csv`,
  getInventoryExportCSVUrl: () => `${API_BASE_URL}/admin-panel/reports/inventory/?format=csv`,
};
