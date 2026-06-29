"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCustomerOrders } from "@/lib/api";
import type { AdminOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

export default function AccountPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      if (!token || !user) {
        router.replace("/giris");
        return;
      }

      if (user.role !== "customer") {
        router.replace("/yonetim");
        return;
      }

      try {
        const data = await getCustomerOrders(token);
        if (mounted) {
          setOrders(data);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Siparişler yüklenemedi.";
        showToast({
          title: "Panel yüklenemedi",
          description: message,
          tone: "error",
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, [router, showToast, token, user]);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-frame mx-auto flex max-w-[1280px] flex-col gap-6 overflow-hidden rounded-[2rem] border border-black/5 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-[linear-gradient(145deg,#ffffff_0%,#fdf9f5_42%,#f0e6da_100%)] p-6 sm:p-8">
          <div className="grid-accent pointer-events-none absolute inset-0 opacity-[0.35]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3b2f2f]/12 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8b6544]">
                Müşteri Alanı
              </span>
              <h1 className="editorial-title mt-4 text-5xl leading-[0.92] text-[#2c2119] sm:text-6xl">
                {user?.full_name || "Hesabım"}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-[#5f5650]">
                Sipariş akışını, toplam harcamanı ve teslimat durumlarını tek ekrandan izle.
              </p>
            </div>
            <Link href="/" className="btn-secondary">
              Mağazaya dön
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="accent-panel rounded-[1.5rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">Toplam sipariş</p>
            <p className="editorial-title mt-4 text-4xl leading-none text-[#2d221a]">{orders.length}</p>
          </div>
          <div className="accent-panel rounded-[1.5rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">Bekleyen sipariş</p>
            <p className="editorial-title mt-4 text-4xl leading-none text-[#2d221a]">{orders.filter((order) => order.status === "pending").length}</p>
          </div>
          <div className="accent-panel rounded-[1.5rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">Toplam harcama</p>
            <p className="editorial-title mt-4 text-4xl leading-none text-[#2d221a]">
              {formatCurrency(orders.reduce((sum, order) => sum + Number(order.total_price), 0))}
            </p>
          </div>
        </section>

        <section className="soft-panel rounded-[1.75rem] p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f8379]">Siparişlerim</p>
            <h2 className="editorial-title mt-2 text-4xl leading-none text-[#1f1711]">Geçmiş ve aktif siparişler</h2>
          </div>

          {loading ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/70 p-10 text-center text-[#7a7068]">
              Siparişler yükleniyor...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/70 p-10 text-center text-[#7a7068]">
              Henüz hesabına bağlı sipariş görünmüyor.
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-[1.5rem] border border-black/6 bg-white/90 p-5 shadow-[0_22px_58px_-44px_rgba(17,17,17,0.2)]">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f8379]">Sipariş #{order.id}</p>
                        <p className="mt-2 text-sm text-[#6a625b]">{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="editorial-title text-3xl leading-none text-[#2c2119]">{formatCurrency(order.total_price)}</p>
                        <p className="mt-2 text-sm text-[#7d736b]">{statusLabels[order.status] || order.status}</p>
                      </div>
                    </div>

                    <div className="rounded-[1.15rem] border border-black/6 bg-[#fffdfa] p-4">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-[#2c2119]">
                            <span>{item.product_name} x {item.quantity}</span>
                            <span className="text-[#6d645d]">{formatCurrency(item.line_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
