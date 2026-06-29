import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
};

/** Deterministic display rating 4.1–5.0 based on product id */
function getDisplayRating(id: number) {
  const h1 = ((id * 2654435761) >>> 0) % 1000;
  const h2 = ((id * 1234567891) >>> 0) % 489;
  return {
    rating: (4.1 + (h1 / 1000) * 0.85).toFixed(1),
    count: 13 + h2,
  };
}

/** Render star SVGs (filled / half / empty) */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <span className="flex items-center gap-[2px]" aria-hidden="true">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} width="11" height="11" viewBox="0 0 11 11" fill="#dcc4aa">
          <path d="M5.5.8l1.24 2.56 2.76.4-2 1.96.47 2.75L5.5 7.2 3.03 8.47l.47-2.75L1.5 3.76l2.76-.4z" />
        </svg>
      ))}
      {half === 1 && (
        <svg width="11" height="11" viewBox="0 0 11 11">
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="#dcc4aa" />
              <stop offset="50%" stopColor="#e8e8e8" />
            </linearGradient>
          </defs>
          <path d="M5.5.8l1.24 2.56 2.76.4-2 1.96.47 2.75L5.5 7.2 3.03 8.47l.47-2.75L1.5 3.76l2.76-.4z" fill="url(#half-grad)" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} width="11" height="11" viewBox="0 0 11 11" fill="#e8e8e8">
          <path d="M5.5.8l1.24 2.56 2.76.4-2 1.96.47 2.75L5.5 7.2 3.03 8.47l.47-2.75L1.5 3.76l2.76-.4z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { rating, count } = getDisplayRating(product.id);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock < 1;

  return (
    <article className="shimmer-card group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-black/6 bg-white shadow-[0_24px_64px_-42px_rgba(17,17,17,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] transition duration-300 hover:-translate-y-1.5 hover:border-[#dcc4aa]/40 hover:shadow-[0_44px_96px_-40px_rgba(17,17,17,0.26),inset_0_1px_0_rgba(255,255,255,0.95)]">
      {/* ── Image ─────────────────────────────────────────────────── */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.8] overflow-hidden bg-[#f8f5f1]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            /* Premium placeholder */
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-[linear-gradient(145deg,#fdfaf7_0%,#f0e9e0_50%,#e8ddd4_100%)]">
              <div
                className="orb-float-1 pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-60"
                style={{ background: "radial-gradient(circle, rgba(220,196,170,0.7), transparent 70%)" }}
              />
              <div
                className="orb-float-2 pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, rgba(234,219,200,0.8), transparent 70%)" }}
              />
              <svg className="relative text-[#c8a87a] opacity-50" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M6 32l10-10 8 8 6-6 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="relative text-xs font-medium uppercase tracking-[0.18em] text-[#b89878]">
                Stüdyo görseli hazırlanıyor
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/14 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          {/* Quick view overlay */}
          <div className="quick-view-overlay">
            <span className="quick-view-btn inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/92 px-4 py-2 text-sm font-medium text-[#111111] shadow-[0_8px_24px_-8px_rgba(17,17,17,0.25)] backdrop-blur-sm">
              Hızlı Bakış
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          {/* Top badges row */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3.5">
            <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#555555] shadow-[0_2px_8px_-2px_rgba(17,17,17,0.12)] backdrop-blur-sm">
              {product.category.name}
            </span>
            <span className="rounded-full bg-[#111111]/90 px-3 py-1 text-[13px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(17,17,17,0.45)] backdrop-blur-sm">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
              <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#999999] shadow-sm">
                Tükendi
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <WishlistButton productId={product.id} />
        </div>
      </Link>

      {/* ── Card Body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex-1 space-y-2.5">
          {/* Rating row */}
          <div className="flex items-center gap-2">
            <Stars rating={parseFloat(rating)} />
            <span className="text-[12px] font-medium text-[#dcc4aa]">{rating}</span>
            <span className="text-[11px] text-[#aaaaaa]">({count})</span>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="editorial-title block text-[1.7rem] leading-[1.06] text-[#111111] transition hover:text-[#3d2d1e]"
          >
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm leading-6 text-[#666666]">
            {product.description || "Stüdyo görselleri ve daha güçlü ürün anlatımı için hazır premium katalog kaydı."}
          </p>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-4">
          <div className="flex items-center gap-1.5">
            {isLowStock ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                Son {product.stock} ürün!
              </span>
            ) : !isOutOfStock ? (
              <>
                <span className="dot-ping inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                <span className="text-[13px] text-[#888888]">{product.stock} adet sevke hazır</span>
              </>
            ) : (
              <span className="text-[13px] text-[#aaaaaa]">Şu anda stokta yok</span>
            )}
          </div>
          <AddToCartButton product={product} disabled={isOutOfStock} />
        </div>
      </div>
    </article>
  );
}
