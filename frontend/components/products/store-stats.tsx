import type { StoreStats } from "@/lib/types";

type StoreStatsProps = {
  stats: StoreStats;
};

export function StoreStatsPanel({ stats }: StoreStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="animate-reveal-scale delay-100 accent-panel relative overflow-hidden rounded-[1.75rem] p-5">
        <div
          className="orb-float-2 pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(220,196,170,0.8), transparent 70%)" }}
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7c6d5b]">Siparişler</p>
        <p className="editorial-title relative mt-2 text-5xl leading-none text-[#111111]">{stats.order_count}</p>
        <p className="relative mt-3 text-sm leading-6 text-[#6e5d4d]">
          Güveni ve devam eden talebi gösteren tamamlanmış siparişler.
        </p>
      </div>

      <div className="animate-reveal-scale delay-200 relative overflow-hidden rounded-[1.75rem] border border-black/6 bg-white/90 p-5 shadow-[0_22px_60px_-42px_rgba(17,17,17,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm">
        <div
          className="orb-float-3 pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(234,219,200,0.9), transparent 70%)" }}
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-[#888888]">Aktif Ürünler</p>
        <p className="editorial-title relative mt-2 text-5xl leading-none text-[#111111]">{stats.active_product_count}</p>
        <p className="relative mt-3 text-sm leading-6 text-[#666666]">
          Sonsuz ve yorucu bir katalog yerine küçük ve kontrollü bir seçki.
        </p>
      </div>
    </div>
  );
}
