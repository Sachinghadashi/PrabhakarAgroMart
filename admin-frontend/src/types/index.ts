export type AdminRole = 'SUPER_ADMIN' | 'PRODUCT_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER' | 'SUPPORT';

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: AdminRole;
  is_staff: boolean;
  date_joined?: string;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardMetrics {
  total_revenue: string;
  period_revenue: string;
  total_orders: number;
  period_orders: number;
  pending_orders: number;
  awaiting_shipment: number;
  total_customers: number;
  total_active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  payment_failures: number;
  cod_pending_amount: string;
  sales_trend: SalesTrendPoint[];
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    status: string;
    payment_status: string;
    total_amount: string;
    created_at: string;
  }>;
  top_products: Array<{
    name: string;
    units_sold: number;
    revenue: string;
  }>;
  range: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent: number | null;
  display_order: number;
  is_active: boolean;
  products_count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  is_active: boolean;
  products_count: number;
}

export interface ProductVariant {
  id: number;
  product: number;
  pack_size: string;
  pack_unit: string;
  sku: string;
  barcode: string | null;
  original_price: string | null;
  selling_price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  discount_percent: number;
  in_stock: boolean;
}

export interface ProductImage {
  id: number;
  product: number;
  image: string;
  external_url?: string | null;
  image_url: string | null;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: number;
  brand_name: string;
  category: number;
  category_name: string;
  sku: string;
  barcode?: string | null;
  description?: string;
  specifications?: Record<string, string>;
  usage_instructions?: string | null;
  safety_info?: string | null;
  suitable_crops: string | null;
  product_type: string;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  primary_image?: string | null;
  images?: ProductImage[];
  variants: ProductVariant[];
  starting_price: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  variant: number;
  product_name: string;
  sku: string;
  pack_display: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  variant_sku: string;
  product_name: string;
  transaction_type: string;
  quantity: number;
  reason: string;
  reference_order: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  pack_size: string;
  unit_price: string;
  quantity: number;
  total_price: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: Record<string, any>;
  subtotal: string;
  discount_amount: string;
  shipping_charge: string;
  tax_amount: string;
  total_amount: string;
  items?: OrderItem[];
  items_count: number;
  tracking_number: string | null;
  courier_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  email: string;
  phone: string | null;
  full_name: string;
  date_joined: string;
  profile?: {
    farm_size_acres: string | null;
    primary_crops: string | null;
  };
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  min_order_value: string;
  max_discount: string | null;
  times_used: number;
  usage_limit: number | null;
  per_customer_limit: number;
  is_active: boolean;
  is_valid: boolean;
  end_date: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  model_name: string;
  object_id: string | null;
  changes: Record<string, any>;
  ip_address: string | null;
  timestamp: string;
}
