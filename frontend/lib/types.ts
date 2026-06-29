export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type StoreConfig = {
  id: number;
  name: string;
  logo: string | null;
  primary_color: string;
  phone_number: string;
  address: string;
  description: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock: number;
  image: string | null;
  is_active: boolean;
  created_at?: string;
  category: Category;
};

export type OrderRequest = {
  full_name: string;
  phone: string;
  address: string;
  payment_method: "whatsapp" | "card" | "cash";
  items: Array<{
    product: string;
    quantity: number;
  }>;
};

export type OrderResponse = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  payment_method: "whatsapp" | "card" | "cash";
  is_paid: boolean;
  payment_status?: "not_required" | "pending" | "paid" | "failed";
  payment_provider?: string;
  total_price: string;
  status: string;
  created_at: string;
  payment_flow: "whatsapp" | "card" | "cash";
  payment_message: string;
  whatsapp_message: string | null;
  payment_session?: {
    provider: string | null;
    status: string;
    payment_page_url?: string;
  };
};

export type StoreStats = {
  order_count: number;
  active_product_count: number;
};

export type AdminOverview = {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: string;
};

export type AdminProductPayload = {
  name: string;
  description: string;
  price: string;
  stock: number;
  category_id: number;
  is_active: boolean;
  image?: File | null;
};

export type AdminOrder = OrderResponse & {
  items: Array<{
    id: number;
    product: number;
    product_name: string;
    product_slug: string;
    quantity: number;
    price: string;
    line_total: string;
  }>;
};

export type AuthUser = {
  id: number;
  username: string;
  full_name: string;
  role: "admin" | "customer";
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
