import type { CSSProperties, PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";

import { AccountNav } from "@/components/auth/account-nav";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { Footer } from "@/components/layout/footer";
import { getStoreConfig } from "@/lib/api";

type SiteShellProps = PropsWithChildren<{
  title?: string;
  description?: string;
  eyebrow?: string;
  heroTone?: "feature" | "compact";
}>;

const fallbackStore = {
  name: "Micro Commerce",
  logo: null,
  primary_color: "#3B2F2F",
  description: "Günlük yaşam için özenle seçilmiş ürünler",
};

const trustPills = [
  { label: "Kolay iade", icon: "↩" },
  { label: "Güvenli ödeme", icon: "•" },
  { label: "Hızlı teslimat", icon: "⚡" },
];

const marqueeItems = [
  { icon: "↩", label: "Kolay İade" },
  { icon: "◈", label: "Güvenli Ödeme" },
  { icon: "◆", label: "Hızlı Teslimat" },
  { icon: "★", label: "4.9 / 5 Puan" },
  { icon: "◉", label: "2.400+ Sipariş" },
  { icon: "◇", label: "Özenle Seçilmiş" },
  { icon: "◈", label: "Ücretsiz Kargo" },
];

export async function SiteShell({
  children,
  title = "Daha rafine ve daha sakin bir mağaza için seçkin parçalar.",
  description = "Netlik, hız ve zarif bir alışveriş deneyimine önem veren butik markalar için tasarlandı.",
  eyebrow = "Yeni Sezon Seçkisi",
  heroTone = "feature",
}: SiteShellProps) {
  const store = await getStoreConfig().catch(() => null);
  const storeName = store?.name || fallbackStore.name;
  const storeDescription = store?.description || fallbackStore.description;
  const brandColor = store?.primary_color || fallbackStore.primary_color;
  const isFeatureHero = heroTone === "feature";

  return (
    <main className="flex min-h-screen flex-1 px-0 py-0 sm:px-6 sm:py-6 lg:px-8">
      <div
        className="app-frame mx-auto flex w-full max-w-[1440px] flex-col overflow-hidden rounded-none border-0 p-3 sm:rounded-[2rem] sm:border sm:border-black/5 sm:p-6 lg:p-8"
        style={{ "--brand-color": brandColor } as CSSProperties}
      >
        <header className="sticky top-0 z-30 mb-4 rounded-[1rem] border border-white/65 bg-white/95 px-3 py-3 shadow-[0_18px_45px_-34px_rgba(17,17,17,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:top-4 sm:mb-8 sm:rounded-[1.25rem] sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
              {store?.logo ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_10px_24px_-16px_rgba(17,17,17,0.22)]">
                  <Image src={store.logo} alt={storeName} fill sizes="44px" className="object-cover" />
                </div>
              ) : (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-[0_12px_32px_-16px_rgba(17,17,17,0.45)] sm:h-11 sm:w-11"
                  style={{ background: `linear-gradient(145deg, ${brandColor}ee, ${brandColor}bb)` }}
                >
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.3em]" style={{ color: brandColor }}>
                  {storeName}
                </p>
                <p className="truncate text-xs text-[#888888] sm:text-sm">{storeDescription}</p>
              </div>
            </Link>

            <nav className="flex w-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:gap-3 sm:overflow-visible">
              <Link
                href="/"
                className="shrink-0 rounded-full border border-black/8 bg-white/80 px-3.5 py-2 text-sm text-[#111111] shadow-[0_2px_8px_-4px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5 hover:border-[#dcc4aa]/60 hover:bg-white hover:shadow-[0_6px_18px_-6px_rgba(17,17,17,0.14)] sm:px-4"
              >
                Mağaza
              </Link>
              <AccountNav />
              <CartIndicator />
            </nav>
          </div>
        </header>

        <section
          className={`relative rounded-[1.25rem] border border-black/6 sm:overflow-hidden sm:rounded-[2rem] ${
            isFeatureHero
              ? "mb-6 bg-[linear-gradient(145deg,#ffffff_0%,#fdf9f5_42%,#f0e6da_100%)] p-5 sm:mb-10 sm:p-8 lg:p-12"
              : "mb-5 bg-[linear-gradient(145deg,#ffffff_0%,#faf7f3_100%)] p-5 sm:mb-8 sm:p-8"
          }`}
        >
          {/* Grid accent */}
          <div className="grid-accent pointer-events-none absolute inset-0 opacity-[0.35]" />

          {/* Ambient floating orbs */}
          {isFeatureHero && (
            <>
              <div className="orb-float-1 pointer-events-none absolute -left-36 -top-36 h-[480px] w-[480px] rounded-full bg-[#eadbc8] opacity-[0.26] blur-[96px]" />
              <div className="orb-float-2 pointer-events-none absolute -right-24 -top-8 h-80 w-80 rounded-full bg-[#f0dece] opacity-[0.22] blur-[72px]" />
              <div className="orb-float-4 pointer-events-none absolute -bottom-8 left-[38%] h-72 w-72 rounded-full bg-[#e8d4bc] opacity-[0.18] blur-[64px]" />
            </>
          )}

          {/* Decorative rings (desktop only) */}
          {isFeatureHero && (
            <div className="pointer-events-none absolute -right-10 top-[4%] hidden lg:block">
              <div className="h-[460px] w-[460px] rounded-full border border-[#dcc4aa]/16" />
              <div className="absolute left-[10%] top-[10%] h-[360px] w-[360px] rounded-full border border-[#dcc4aa]/10" />
            </div>
          )}

          <div className={`relative grid gap-8 ${isFeatureHero ? "lg:grid-cols-[1.15fr_0.85fr] lg:items-center" : "lg:grid-cols-[1fr_0.5fr]"}`}>
            {/* ── Left: text content ── */}
            <div className="max-w-4xl space-y-5 sm:space-y-6">
              <span
                className="animate-reveal-up delay-0 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] sm:px-3.5 sm:text-[11px] sm:tracking-[0.26em]"
                style={{ borderColor: `${brandColor}35`, backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                <span className="dot-ping inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brandColor, opacity: 0.7 }} />
                {eyebrow}
              </span>

              <h1 className={`animate-reveal-up delay-100 editorial-title gradient-text ${isFeatureHero ? "max-w-5xl text-[2.35rem] leading-[0.98] sm:text-6xl lg:text-[5rem]" : "text-3xl leading-[0.98] sm:text-5xl"}`}>
                {title}
              </h1>

              <p className={`animate-reveal-up delay-200 max-w-2xl text-[#5a5550] ${isFeatureHero ? "text-sm leading-7 sm:text-lg sm:leading-8" : "text-sm leading-7 sm:text-base"}`}>
                {description}
              </p>

              <div className="animate-reveal-up delay-300 flex flex-col gap-3 min-[460px]:flex-row">
                <Link href="/" className="btn-primary w-full min-[460px]:w-auto">
                  Koleksiyonu İncele
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/checkout" className="btn-secondary w-full min-[460px]:w-auto">
                  Güvenli Ödeme
                </Link>
              </div>

              {/* Trust section: scrolling marquee for feature hero, pills for compact */}
              {isFeatureHero ? (
                <div className="animate-reveal-fade delay-500 overflow-hidden pt-1 sm:pt-2">
                  <div className="pointer-events-none relative">
                    <div className="absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#fdfaf6] to-transparent" />
                    <div className="absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#f7ede2] to-transparent" />
                    <div className="marquee-track">
                      {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-5 text-[12px] text-[#888888]">
                          <span style={{ color: `${brandColor}90` }}>{item.icon}</span>
                          {item.label}
                          <span className="ml-2 text-[#dcc4aa]/50">◆</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-reveal-fade delay-500 flex items-center gap-5 pt-1">
                  {trustPills.map((pill) => (
                    <div key={pill.label} className="flex items-center gap-1.5 text-[12px] text-[#888888]">
                      <span className="text-xs">{pill.icon}</span>
                      {pill.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: bento grid (hiç absolute yok, üst üste binme imkansız) ── */}
            <div className={isFeatureHero ? "hidden md:block" : "hidden lg:block"}>
              <div className="grid h-[400px] grid-cols-[1fr_1.45fr] grid-rows-2 gap-3 lg:h-[440px]">

                {/* Sol üst — sipariş sayacı */}
                <div className="animate-reveal-scale delay-200 flex flex-col justify-center gap-1 rounded-[1.25rem] border border-[#dcc4aa]/35 bg-white/90 px-5 py-4 shadow-[0_12px_32px_-16px_rgba(17,17,17,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm">
                  <div className="relative self-start">
                    <span className="anim-pulse-ring pointer-events-none absolute -inset-[5px] rounded-full border border-[#dcc4aa]/50" />
                    <span className="relative inline-block h-2 w-2 rounded-full bg-[#c9a880]" />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b6544]">Güvenen</p>
                  <p className="editorial-title text-[1.6rem] leading-none text-[#111111]">2.400+</p>
                  <p className="text-xs text-[#888888]">mutlu sipariş</p>
                </div>

                {/* Sağ — ana ürün (2 satır kaplıyor) */}
                <div className="animate-reveal-scale delay-300 shimmer-card row-span-2 overflow-hidden rounded-[1.25rem] border border-black/8 bg-[#f5f1eb] shadow-[0_24px_56px_-28px_rgba(17,17,17,0.20),inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="relative h-[calc(100%-56px)]">
                    <Image
                      src="/images/products/transit-tote.png"
                      alt="Şehir Tote Çanta"
                      fill
                      sizes="260px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6544]">Öne Çıkan</p>
                    <p className="mt-0.5 text-sm font-medium text-[#111111]">Şehir Tote Çanta</p>
                  </div>
                </div>

                {/* Sol alt — ikincil ürün */}
                <div className="animate-reveal-scale delay-400 shimmer-card overflow-hidden rounded-[1.25rem] border border-black/8 bg-[#f5f1eb] shadow-[0_12px_32px_-16px_rgba(17,17,17,0.14),inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="relative h-[calc(100%-44px)]">
                    <Image
                      src="/images/products/stone-candle.png"
                      alt="Taş Aromaterapi Mum"
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6544]">Çok Satan</p>
                    <p className="mt-0.5 text-xs font-medium text-[#111111]">Aromaterapi Mum</p>
                  </div>
                </div>

              </div>

              {/* Rating — gridin altında, sağa yaslanmış */}
              <div className="animate-reveal-fade delay-500 mt-3 flex justify-end">
                <div className="flex items-center gap-2 rounded-full border border-[#dcc4aa]/30 bg-white/96 px-3.5 py-2 shadow-[0_8px_20px_-8px_rgba(17,17,17,0.12)] backdrop-blur-sm">
                  <span className="text-xs text-[#c9a880]">★★★★★</span>
                  <span className="text-[12px] font-semibold text-[#111111]">4.9</span>
                  <span className="text-[11px] text-[#888888]">/ 5 puan</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {children}

        <Footer storeName={storeName} brandColor={brandColor} logo={store?.logo} description={storeDescription} />
      </div>
    </main>
  );
}
