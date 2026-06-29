import { getApiBaseUrl, getBackendBaseUrl, getWhatsAppNumber } from "@/lib/env";
import type {
  AdminOrder,
  AdminOverview,
  AdminProductPayload,
  AuthResponse,
  AuthUser,
  Category,
  OrderRequest,
  OrderResponse,
  PaginatedResponse,
  Product,
  StoreConfig,
  StoreStats,
} from "@/lib/types";

const fallbackProductImages: Record<string, string> = {
  "walnut-desk-stand": "/images/products/walnut-desk-stand.png",
  "soft-task-lamp": "/images/products/soft-task-lamp.png",
  "slate-bottle": "/images/products/slate-bottle.png",
  "transit-tote": "/images/products/transit-tote.png",
  "stone-aroma-candle": "/images/products/stone-candle.png",
  "textured-throw": "/images/products/textured-throw.png",
};

const translatedCategoryNames: Record<string, string> = {
  "Home Office": "Ev Ofisi",
  "Daily Carry": "Günlük Yaşam",
  Living: "Yaşam",
};

const translatedProducts: Record<string, { name: string; description: string }> = {
  "walnut-desk-stand": {
    name: "Ceviz Laptop Standı",
    description: "Daha temiz bir laptop ergonomisi ve daha sakin bir masa düzeni için yükseltilmiş ahşap stand.",
  },
  "soft-task-lamp": {
    name: "Yumuşak Masa Lambası",
    description: "Odaklı çalışma seansları için sade silüetli, sıcak ambiyans veren masa lambası.",
  },
  "slate-bottle": {
    name: "Mat Çelik Şişe",
    description: "Günlük kullanım için tasarlanmış, mat yüzeyli ve ısı korumalı metal şişe.",
  },
  "transit-tote": {
    name: "Şehir Tote Çanta",
    description: "Laptop, kablolar ve temel eşyalar için düzenli bölmelere sahip yapılandırılmış tote çanta.",
  },
  "stone-aroma-candle": {
    name: "Taş Aromaterapi Mum",
    description: "Premium bir ev atmosferi için sedir ve narenciye notalarını dengeleyen dekoratif mum.",
  },
  "textured-throw": {
    name: "Dokulu Koltuk Şalı",
    description: "Modern iç mekanlara uyum sağlayan nötr tonlarda, kalın örgülü koltuk şalı.",
  },
};

const translatedStoreDescription = "Hızlı ve rafine bir alışveriş akışı için seçilmiş premium günlük ürünler.";

function buildUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

function extractErrorMessage(data: unknown) {
  if (typeof data === "string") {
    return data;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const payload = record.detail ?? data;

  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const firstEntry = Object.values(payload as Record<string, unknown>)[0];
    if (Array.isArray(firstEntry)) {
      return String(firstEntry[0]);
    }
    if (typeof firstEntry === "string") {
      return firstEntry;
    }
    if (firstEntry && typeof firstEntry === "object") {
      return JSON.stringify(firstEntry);
    }
  }

  return JSON.stringify(data);
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}.`;
  const rawBody = await response.text();

  if (!rawBody) {
    return fallback;
  }

  try {
    return extractErrorMessage(JSON.parse(rawBody)) ?? fallback;
  } catch {
    return rawBody || fallback;
  }
}

function getImageUrl(image: string | null) {
  if (!image) {
    return null;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${getBackendBaseUrl()}${image}`;
}

function buildAuthHeaders(token?: string, headers?: HeadersInit) {
  return {
    ...(headers ?? {}),
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function apiFormFetch<T>(path: string, body: FormData, method = "POST", headers?: HeadersInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method,
    body,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

function normalizeProduct(product: Product): Product {
  const translated = translatedProducts[product.slug];

  return {
    ...product,
    name: translated?.name || product.name,
    description: translated?.description || product.description,
    category: {
      ...product.category,
      name: translatedCategoryNames[product.category.name] || product.category.name,
    },
    image: getImageUrl(product.image) || fallbackProductImages[product.slug] || null,
  };
}

function normalizeStore(store: StoreConfig): StoreConfig {
  return {
    ...store,
    description: store.description || translatedStoreDescription,
    logo: getImageUrl(store.logo),
  };
}

export async function getProducts(category?: string, search?: string) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch<PaginatedResponse<Product> | Product[]>(`/products/${query}`);
  const products = Array.isArray(response) ? response : (response.results ?? []);
  return products.map(normalizeProduct);
}

export async function getCategories() {
  const response = await apiFetch<PaginatedResponse<Category> | Category[]>("/categories/");
  const categories = Array.isArray(response) ? response : (response.results ?? []);
  return categories.map((category) => ({
    ...category,
    name: translatedCategoryNames[category.name] || category.name,
  }));
}

export async function getStoreConfig() {
  const store = await apiFetch<StoreConfig>("/store/");
  return normalizeStore(store);
}

export async function getProduct(slug: string) {
  const product = await apiFetch<Product>(`/products/${slug}/`);
  return normalizeProduct(product);
}

export async function getStoreStats() {
  return apiFetch<StoreStats>("/stats/");
}

export async function createOrder(payload: OrderRequest) {
  return apiFetch<OrderResponse>("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAuthenticatedOrder(payload: OrderRequest, token: string) {
  return apiFetch<OrderResponse>("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(token),
  });
}

export async function login(payload: { username: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: { username: string; password: string; full_name: string; phone?: string }) {
  return apiFetch<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string) {
  return apiFetch<AuthUser>("/auth/me/", {
    headers: buildAuthHeaders(token),
  });
}

export async function logout(token: string) {
  return apiFetch<{ detail: string }>("/auth/logout/", {
    method: "POST",
    body: JSON.stringify({}),
    headers: buildAuthHeaders(token),
  });
}

export async function getAdminOverview(token: string) {
  return apiFetch<AdminOverview>("/admin/overview/", {
    headers: buildAuthHeaders(token),
  });
}

export async function getAdminProducts(token: string) {
  const response = await apiFetch<PaginatedResponse<Product> | Product[]>("/admin/products/", {
    headers: buildAuthHeaders(token),
  });
  const products = Array.isArray(response) ? response : (response.results ?? []);
  return products.map(normalizeProduct);
}

export async function createAdminProduct(payload: AdminProductPayload, token: string) {
  const formData = new FormData();
  formData.set("name", payload.name);
  formData.set("description", payload.description);
  formData.set("price", payload.price);
  formData.set("stock", String(payload.stock));
  formData.set("category_id", String(payload.category_id));
  formData.set("is_active", String(payload.is_active));
  if (payload.image) {
    formData.set("image", payload.image);
  }

  const product = await apiFormFetch<Product>("/admin/products/", formData, "POST", buildAuthHeaders(token));
  return normalizeProduct(product);
}

export async function updateAdminProduct(productId: number, payload: Partial<AdminProductPayload>, token: string) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.set("name", payload.name);
  if (payload.description !== undefined) formData.set("description", payload.description);
  if (payload.price !== undefined) formData.set("price", payload.price);
  if (payload.stock !== undefined) formData.set("stock", String(payload.stock));
  if (payload.category_id !== undefined) formData.set("category_id", String(payload.category_id));
  if (payload.is_active !== undefined) formData.set("is_active", String(payload.is_active));
  if (payload.image) formData.set("image", payload.image);

  const product = await apiFormFetch<Product>(`/admin/products/${productId}/`, formData, "PATCH", buildAuthHeaders(token));
  return normalizeProduct(product);
}

export async function deleteAdminProduct(productId: number, token: string) {
  return apiFetch<{ detail?: string }>(`/admin/products/${productId}/`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
}

export async function getAdminOrders(token: string) {
  const response = await apiFetch<PaginatedResponse<AdminOrder> | AdminOrder[]>("/admin/orders/", {
    headers: buildAuthHeaders(token),
  });
  const orders = Array.isArray(response) ? response : (response.results ?? []);
  return orders.map((order) => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
  }));
}

export async function updateAdminOrder(orderId: number, payload: { status?: string; is_paid?: boolean }, token: string) {
  return apiFetch<AdminOrder>(`/admin/orders/${orderId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(token),
  });
}

export async function getCustomerOrders(token: string) {
  const response = await apiFetch<PaginatedResponse<AdminOrder> | AdminOrder[]>("/customer/orders/", {
    headers: buildAuthHeaders(token),
  });
  return Array.isArray(response) ? response : response.results;
}

export function buildWhatsAppUrl(message: string) {
  const phone = getWhatsAppNumber().replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);

  if (phone) {
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}
