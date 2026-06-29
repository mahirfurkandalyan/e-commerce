"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminOverview,
  getAdminProducts,
  getCategories,
  updateAdminOrder,
  updateAdminProduct,
} from "@/lib/api";
import type { AdminOrder, AdminOverview, AdminProductPayload, Category, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

type ProductDraft = {
  price: string;
  stock: number;
  is_active: boolean;
  category_id: number;
};

type OrderDraft = {
  status: string;
  is_paid: boolean;
};

const orderStatusOptions = [
  { value: "pending", label: "Beklemede" },
  { value: "confirmed", label: "Onaylandı" },
  { value: "shipped", label: "Kargoda" },
  { value: "delivered", label: "Teslim Edildi" },
];

const paymentMethodLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  card: "Kart",
  cash: "Nakit",
};

function buildProductDrafts(products: Product[]) {
  return products.reduce<Record<number, ProductDraft>>((accumulator, product) => {
    accumulator[product.id] = {
      price: String(product.price),
      stock: product.stock,
      is_active: product.is_active,
      category_id: product.category.id,
    };
    return accumulator;
  }, {});
}

function buildOrderDrafts(orders: AdminOrder[]) {
  return orders.reduce<Record<number, OrderDraft>>((accumulator, order) => {
    accumulator[order.id] = {
      status: order.status,
      is_paid: order.is_paid,
    };
    return accumulator;
  }, {});
}

export function AdminDashboard() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({});
  const [orderDrafts, setOrderDrafts] = useState<Record<number, OrderDraft>>({});
  const [productQuery, setProductQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [isBooting, setIsBooting] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [createForm, setCreateForm] = useState<AdminProductPayload>({
    name: "",
    description: "",
    price: "",
    stock: 1,
    category_id: 0,
    is_active: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(productQuery);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!token || !user) {
        router.replace("/giris");
        return;
      }

      if (user.role !== "admin") {
        router.replace("/hesabim");
        return;
      }

      try {
        const [overviewData, productsData, ordersData, categoriesData] = await Promise.all([
          getAdminOverview(token),
          getAdminProducts(token),
          getAdminOrders(token),
          getCategories(),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewData);
        setProducts(productsData);
        setOrders(ordersData);
        setCategories(categoriesData);
        setProductDrafts(buildProductDrafts(productsData));
        setOrderDrafts(buildOrderDrafts(ordersData));
        setCreateForm((current) => ({
          ...current,
          category_id: current.category_id || categoriesData[0]?.id || 0,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Yönetim paneli yüklenemedi.";
        showToast({
          title: "Panel yüklenemedi",
          description: message,
          tone: "error",
        });
      } finally {
        if (mounted) {
          setIsBooting(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router, showToast, token, user]);

  const filteredProducts = useMemo(() => {
    const query = deferredQuery.trim().toLocaleLowerCase("tr");
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.description || "", product.category.name].some((value) =>
        value.toLocaleLowerCase("tr").includes(query),
      ),
    );
  }, [deferredQuery, products]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === orderFilter);
  }, [orderFilter, orders]);

  function refreshOverview() {
    startTransition(async () => {
      try {
        if (!token) {
          return;
        }
        const overviewData = await getAdminOverview(token);
        setOverview(overviewData);
      } catch {}
    });
  }

  function handleCreateInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = event.target;
    const { name } = target;
    const value = "checked" in target && target.type === "checkbox" ? target.checked : target.value;

    setCreateForm((current) => ({
      ...current,
      [name]:
        name === "stock"
          ? Number(value)
          : name === "category_id"
            ? Number(value)
            : value,
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCreateForm((current) => ({ ...current, image: file }));

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    setImagePreview(null);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (!token) {
        return;
      }
      const created = await createAdminProduct(createForm, token);
      const nextProducts = [created, ...products];
      setProducts(nextProducts);
      setProductDrafts(buildProductDrafts(nextProducts));
      setCreateForm({
        name: "",
        description: "",
        price: "",
        stock: 1,
        category_id: categories[0]?.id || 0,
        is_active: true,
        image: null,
      });
      setImagePreview(null);
      refreshOverview();
      showToast({
        title: "Ürün eklendi",
        description: `${created.name} artık vitrinde yönetilebilir durumda.`,
        tone: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün eklenemedi.";
      showToast({
        title: "Kayıt başarısız",
        description: message,
        tone: "error",
      });
    }
  }

  function updateProductDraft(productId: number, patch: Partial<ProductDraft>) {
    setProductDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...patch,
      },
    }));
  }

  async function handleProductSave(productId: number) {
    const draft = productDrafts[productId];
    if (!draft) {
      return;
    }

    try {
      if (!token) {
        return;
      }
      const updated = await updateAdminProduct(productId, draft, token);
      const nextProducts = products.map((product) => (product.id === productId ? updated : product));
      setProducts(nextProducts);
      setProductDrafts(buildProductDrafts(nextProducts));
      refreshOverview();
      showToast({
        title: "Ürün güncellendi",
        description: `${updated.name} için stok ve fiyat kaydedildi.`,
        tone: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün güncellenemedi.";
      showToast({
        title: "Güncelleme başarısız",
        description: message,
        tone: "error",
      });
    }
  }

  async function handleProductDelete(productId: number) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const confirmed = window.confirm(`"${product.name}" ürününü silmek istediğine emin misin?`);
    if (!confirmed) {
      return;
    }

    try {
      if (!token) {
        return;
      }

      await deleteAdminProduct(productId, token);
      const nextProducts = products.filter((item) => item.id !== productId);
      setProducts(nextProducts);
      setProductDrafts(buildProductDrafts(nextProducts));
      refreshOverview();
      showToast({
        title: "Ürün silindi",
        description: `${product.name} katalogdan kaldırıldı.`,
        tone: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün silinemedi.";
      showToast({
        title: "Silme başarısız",
        description: message,
        tone: "error",
      });
    }
  }

  function updateOrderDraft(orderId: number, patch: Partial<OrderDraft>) {
    setOrderDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        ...patch,
      },
    }));
  }

  async function handleOrderSave(orderId: number) {
    const draft = orderDrafts[orderId];
    if (!draft) {
      return;
    }

    try {
      if (!token) {
        return;
      }
      const updated = await updateAdminOrder(orderId, draft, token);
      const nextOrders = orders.map((order) => (order.id === orderId ? updated : order));
      setOrders(nextOrders);
      setOrderDrafts(buildOrderDrafts(nextOrders));
      refreshOverview();
      showToast({
        title: "Sipariş güncellendi",
        description: `#${updated.id} numaralı siparişin durumu kaydedildi.`,
        tone: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sipariş güncellenemedi.";
      showToast({
        title: "Sipariş kaydedilemedi",
        description: message,
        tone: "error",
      });
    }
  }

  return (
    <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="app-frame mx-auto flex w-full max-w-[1480px] flex-col gap-6 overflow-hidden rounded-[2rem] border border-black/5 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-[linear-gradient(145deg,#ffffff_0%,#fdf9f5_42%,#f0e6da_100%)] p-6 sm:p-8 lg:p-10">
          <div className="grid-accent pointer-events-none absolute inset-0 opacity-[0.35]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3b2f2f]/12 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8b6544]">
                Panel
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c8a27a]" />
                Operasyon Merkezi
              </span>
              <div className="space-y-3">
                <h1 className="editorial-title max-w-4xl text-5xl leading-[0.92] text-[#2c2119] sm:text-6xl lg:text-[4.75rem]">
                  Mağazayı aynı premium dilde yönetin.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[#5f5650] sm:text-lg">
                  Ürünleri fotoğrafıyla ekleyin, stok ve fiyatı tek bakışta güncelleyin, sipariş akışını beklemeden yönetin.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#73675f]">
                <span className="rounded-full border border-black/8 bg-white/85 px-3 py-2">Ürün yayına alma</span>
                <span className="rounded-full border border-black/8 bg-white/85 px-3 py-2">Stok takibi</span>
                <span className="rounded-full border border-black/8 bg-white/85 px-3 py-2">Sipariş durum akışı</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Toplam ürün", value: overview?.total_products ?? 0 },
                { label: "Aktif ürün", value: overview?.active_products ?? 0 },
                { label: "Bekleyen sipariş", value: overview?.pending_orders ?? 0 },
                { label: "Toplam ciro", value: overview ? formatCurrency(overview.total_revenue) : formatCurrency(0) },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`soft-panel rounded-[1.5rem] p-5 ${index === 3 ? "bg-[linear-gradient(180deg,#2e1f14_0%,#1a1410_100%)] text-white" : ""}`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${index === 3 ? "text-white/60" : "text-[#8f8379]"}`}>
                    {item.label}
                  </p>
                  <p className={`mt-3 editorial-title text-4xl leading-none ${index === 3 ? "text-white" : "text-[#1f1711]"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <form onSubmit={handleCreateProduct} className="soft-panel rounded-[1.75rem] p-6 sm:p-7">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f8379]">Yeni ürün</p>
                  <h2 className="editorial-title mt-2 text-4xl leading-none text-[#1f1711]">Koleksiyona yeni parça ekle</h2>
                </div>
                <Link href="/" className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-[#2c2119] shadow-[0_10px_26px_-20px_rgba(17,17,17,0.3)] hover:-translate-y-0.5 hover:border-[#dcc4aa]/70">
                  Vitrine dön
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[#2c2119]">Ürün adı</span>
                  <input name="name" value={createForm.name} onChange={handleCreateInputChange} className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" placeholder="Örn. Dokulu Servis Tepsisi" required />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[#2c2119]">Açıklama</span>
                  <textarea name="description" value={createForm.description} onChange={handleCreateInputChange} rows={4} className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" placeholder="Ürünün malzemesini, kullanım hissini ve premium karakterini kısa anlatın." required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#2c2119]">Kategori</span>
                  <select name="category_id" value={createForm.category_id} onChange={handleCreateInputChange} className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" required>
                    {(categories ?? []).map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#2c2119]">Fiyat</span>
                  <input name="price" type="number" min="0.01" step="0.01" value={createForm.price} onChange={handleCreateInputChange} className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" placeholder="89.90" required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#2c2119]">Stok</span>
                  <input name="stock" type="number" min="0" step="1" value={createForm.stock} onChange={handleCreateInputChange} className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" required />
                </label>
                <label className="flex items-center gap-3 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-[#2c2119]">
                  <input name="is_active" type="checkbox" checked={createForm.is_active} onChange={handleCreateInputChange} className="h-4 w-4 accent-[#3b2f2f]" />
                  Ürün yayında olsun
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[#2c2119]">Ürün fotoğrafı</span>
                  <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-[1rem] border border-dashed border-[#c8a27a]/65 bg-[#fffaf5] px-4 py-3 text-sm text-[#5f5650]" />
                    <div className="relative aspect-[4/4.6] overflow-hidden rounded-[1rem] border border-black/8 bg-[linear-gradient(145deg,#fdf8f2,#f1e8dc)]">
                      {imagePreview ? <Image src={imagePreview} alt="Yeni ürün önizleme" fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center px-6 text-center text-xs uppercase tracking-[0.18em] text-[#a38f7e]">Fotoğraf önizleme</div>}
                    </div>
                  </div>
                </label>
              </div>

              <button type="submit" className="btn-primary w-full justify-center" disabled={isPending}>
                Ürünü kaydet
              </button>
            </div>
          </form>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Düşük stok alarmı", value: overview?.low_stock_products ?? 0, note: "5 adet ve altındaki aktif ürünler" },
              { label: "Toplam sipariş", value: overview?.total_orders ?? 0, note: "Şimdiye kadar oluşan siparişler" },
              { label: "Panel durumu", value: isBooting ? "..." : "Hazır", note: "Ürün ve sipariş yönetimi aktif" },
            ].map((item) => (
              <div key={item.label} className="accent-panel rounded-[1.75rem] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">{item.label}</p>
                <p className="editorial-title mt-4 text-4xl leading-none text-[#2d221a]">{item.value}</p>
                <p className="mt-4 text-sm leading-6 text-[#6f645c]">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="soft-panel rounded-[1.75rem] p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f8379]">Ürün yönetimi</p>
                <h2 className="editorial-title mt-2 text-4xl leading-none text-[#1f1711]">Stok, fiyat ve yayın durumu</h2>
              </div>
              <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} className="w-full rounded-full border border-black/8 bg-white px-4 py-3 text-sm text-[#111111] sm:max-w-[280px]" placeholder="Ürün ara" />
            </div>

            <div className="grid gap-4">
              {(filteredProducts ?? []).map((product) => {
                const draft = productDrafts[product.id];
                if (!draft) return null;

                return (
                  <article key={product.id} className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/90 shadow-[0_24px_64px_-42px_rgba(17,17,17,0.16)]">
                    <div className="grid gap-4 p-4 sm:grid-cols-[148px_1fr] sm:p-5">
                      <div className="relative aspect-[4/4.8] overflow-hidden rounded-[1.25rem] bg-[linear-gradient(145deg,#fdf8f2,#efe6db)]">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="148px" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-5 text-center text-xs uppercase tracking-[0.18em] text-[#a38f7e]">
                            Görsel yok
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f8379]">{product.category.name}</p>
                            <h3 className="editorial-title mt-2 text-3xl leading-none text-[#1f1711]">{product.name}</h3>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6a625b]">{product.description}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${draft.is_active ? "bg-[#efe7dc] text-[#3b2f2f]" : "bg-[#f2f2f2] text-[#8a8a8a]"}`}>
                            {draft.is_active ? "Yayında" : "Taslak"}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <label className="space-y-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8f8379]">Fiyat</span>
                            <input type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => updateProductDraft(product.id, { price: event.target.value })} className="w-full rounded-[0.95rem] border border-black/8 bg-[#fffdfa] px-3 py-2.5 text-sm text-[#111111]" />
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8f8379]">Stok</span>
                            <input type="number" min="0" step="1" value={draft.stock} onChange={(event) => updateProductDraft(product.id, { stock: Number(event.target.value) })} className="w-full rounded-[0.95rem] border border-black/8 bg-[#fffdfa] px-3 py-2.5 text-sm text-[#111111]" />
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8f8379]">Kategori</span>
                            <select value={draft.category_id} onChange={(event) => updateProductDraft(product.id, { category_id: Number(event.target.value) })} className="w-full rounded-[0.95rem] border border-black/8 bg-[#fffdfa] px-3 py-2.5 text-sm text-[#111111]">
                              {(categories ?? []).map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-3 rounded-[0.95rem] border border-black/8 bg-[#fffdfa] px-3 py-2.5 text-sm text-[#2c2119]">
                            <input type="checkbox" checked={draft.is_active} onChange={(event) => updateProductDraft(product.id, { is_active: event.target.checked })} className="h-4 w-4 accent-[#3b2f2f]" />
                            Aktif
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-4">
                          <div className="flex flex-wrap gap-2 text-xs text-[#7a7068]">
                            <span className="rounded-full bg-[#f7f2eb] px-3 py-1">{formatCurrency(draft.price)}</span>
                            <span className="rounded-full bg-[#f7f2eb] px-3 py-1">{draft.stock} adet stok</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => handleProductDelete(product.id)} className="rounded-full border border-[#d9b8b1] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#8b3d31] transition hover:-translate-y-0.5 hover:border-[#c88e83] hover:bg-[#ffe9e4]" disabled={isPending}>
                              Ürünü sil
                            </button>
                            <button type="button" onClick={() => handleProductSave(product.id)} className="btn-secondary" disabled={isPending}>
                              Değişiklikleri kaydet
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!filteredProducts.length && (
                <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/70 p-10 text-center text-[#7a7068]">
                  Aramaya uygun ürün bulunamadı.
                </div>
              )}
            </div>
          </div>

          <div className="soft-panel rounded-[1.75rem] p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f8379]">Sipariş yönetimi</p>
                <h2 className="editorial-title mt-2 text-4xl leading-none text-[#1f1711]">Durum akışını buradan yönetin</h2>
              </div>
              <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm text-[#111111] sm:min-w-[200px]">
                <option value="all">Tüm siparişler</option>
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4">
              {(filteredOrders ?? []).map((order) => {
                const draft = orderDrafts[order.id];
                if (!draft) return null;

                return (
                  <article key={order.id} className="rounded-[1.5rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,242,0.98))] p-5 shadow-[0_22px_58px_-44px_rgba(17,17,17,0.2)]">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f8379]">Sipariş #{order.id}</p>
                          <h3 className="mt-2 text-lg font-semibold text-[#1f1711]">{order.full_name}</h3>
                          <p className="mt-1 text-sm text-[#6a625b]">{order.phone}</p>
                          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6a625b]">{order.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="editorial-title text-3xl leading-none text-[#2c2119]">{formatCurrency(order.total_price)}</p>
                          <p className="mt-2 text-sm text-[#7d736b]">{paymentMethodLabels[order.payment_method] || order.payment_method}</p>
                        </div>
                      </div>

                      <div className="rounded-[1.15rem] border border-black/6 bg-white/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f8379]">Sipariş kalemleri</p>
                        <div className="mt-3 space-y-2">
                          {(order.items ?? []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-[#2c2119]">
                              <span>{item.product_name} x {item.quantity}</span>
                              <span className="text-[#6d645d]">{formatCurrency(item.line_total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8f8379]">Durum</span>
                            <select value={draft.status} onChange={(event) => updateOrderDraft(order.id, { status: event.target.value })} className="w-full rounded-[0.95rem] border border-black/8 bg-white px-3 py-2.5 text-sm text-[#111111]">
                              {orderStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>

                          <label className="flex items-center gap-3 rounded-[0.95rem] border border-black/8 bg-white px-3 py-2.5 text-sm text-[#2c2119]">
                            <input type="checkbox" checked={draft.is_paid} onChange={(event) => updateOrderDraft(order.id, { is_paid: event.target.checked })} className="h-4 w-4 accent-[#3b2f2f]" />
                            Ödeme alındı
                          </label>
                        </div>

                        <button type="button" onClick={() => handleOrderSave(order.id)} className="btn-secondary self-end" disabled={isPending}>
                          Siparişi güncelle
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!filteredOrders.length && (
                <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/70 p-10 text-center text-[#7a7068]">
                  Seçilen filtre için sipariş görünmüyor.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
