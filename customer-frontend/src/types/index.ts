export interface CustomerProfile {
  id: number;
  avatar: string | null;
  alternate_phone: string | null;
  farm_size_acres: string | null;
  primary_crops: string | null;
}

export interface User {
  id: number;
  email: string;
  phone: string | null;
  full_name: string;
  role: 'CUSTOMER' | 'SUPER_ADMIN' | 'PRODUCT_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER' | 'SUPPORT';
  date_joined: string;
  profile?: CustomerProfile;
}

export interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  village_town: string;
  district: string;
  state: string;
  pin_code: string;
  delivery_instructions?: string | null;
  is_default: boolean;
  address_type: 'HOME' | 'FARM' | 'WAREHOUSE';
  created_at?: string;
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
  subcategories?: Category[];
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
  pack_unit: 'KG' | 'GM' | 'LTR' | 'ML' | 'PACK' | 'PIECE';
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
  image: string;
  image_url: string | null;
  alt_text: string | null;
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
  category_slug: string;
  sku: string;
  product_type: 'ORGANIC' | 'CHEMICAL' | 'BIO' | 'HYBRID';
  suitable_crops: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  primary_image: string | null;
  variants: ProductVariant[];
  starting_price: string | null;
  created_at: string;
}

export interface ProductDetail extends Product {
  description: string;
  specifications: Record<string, string>;
  usage_instructions: string | null;
  safety_info: string | null;
  images: ProductImage[];
  related_products: Product[];
}

export interface CartItemData {
  id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  brand_name: string;
  sku: string;
  pack_size: string;
  pack_unit: string;
  unit_price: string;
  original_price: string | null;
  quantity: number;
  line_total: string;
  available_stock: number;
  is_available: boolean;
  primary_image: string | null;
}

export interface CartSummary {
  cart_id: number;
  items: CartItemData[];
  total_items_count: number;
  subtotal: string;
  coupon_code: string | null;
  coupon_discount: string;
  coupon_error: string | null;
  shipping_fee: string;
  free_shipping_threshold: string;
  qualifies_for_free_shipping: boolean;
  tax_amount: string;
  total_amount: string;
  has_out_of_stock: boolean;
}

export interface OrderItem {
  id: number;
  variant: number;
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
  customer?: User;
  customer_name?: string;
  customer_email?: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: 'RAZORPAY' | 'COD';
  shipping_address: Address;
  subtotal: string;
  discount_amount: string;
  shipping_charge: string;
  tax_amount: string;
  total_amount: string;
  items?: OrderItem[];
  items_count?: number;
  tracking_number?: string | null;
  courier_name?: string | null;
  notes?: string | null;
  can_cancel?: boolean;
  created_at: string;
}

export interface InvoiceData {
  invoice_number: string;
  order_number: string;
  date: string;
  company: {
    name: string;
    tagline: string;
    gstin: string;
    address: string;
    support_email: string;
    support_phone: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  shipping_address: Address;
  payment: {
    method: string;
    status: string;
  };
  items: Array<{
    product_name: string;
    sku: string;
    pack_size: string;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
  financials: {
    subtotal: string;
    discount_amount: string;
    shipping_charge: string;
    tax_amount: string;
    total_amount: string;
  };
}
