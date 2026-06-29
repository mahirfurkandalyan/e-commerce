import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/products/add-to-cart-button";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type ProductDetailProps = {
  product: Product;
};

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[1.4rem] border border-black/6 bg-white shadow-[0_24px_60px_-42px_rgba(17,17,17,0.14)]">
          <div className="relative aspect-[4/4.9] bg-[#f5f5f5]">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(234,219,200,0.72),transparent_34%),linear-gradient(135deg,#fffdfb_0%,#f5f5f5_100%)] text-sm text-[#888888]">
                Ürün görseli hazırlanıyor
              </div>
            )}
          </div>
        </div>

        <div className="soft-panel rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <Link href="/" className="inline-flex text-sm text-[#888888] transition hover:text-[#111111]">
                Koleksiyona dön
              </Link>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#888888]">{product.category.name}</p>
              <h2 className="editorial-title text-4xl leading-[0.98] text-[#111111] sm:text-6xl sm:leading-[0.94]">{product.name}</h2>
              <p className="max-w-xl text-sm leading-7 text-[#666666] sm:text-base">
                {product.description || "Bu ürün, daha güçlü anlatım, malzeme detayı ve editoryal fotoğraf kullanımı için hazır."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="accent-panel rounded-[1.2rem] p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#7c6d5b]">Fiyat</p>
                <p className="editorial-title mt-2 text-4xl leading-none text-[#111111]">{formatCurrency(product.price)}</p>
              </div>
              <div className="luxury-outline rounded-[1.2rem] bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#888888]">Stok Durumu</p>
                <p className="mt-2 text-sm text-[#555555]">
                  {product.stock > 0 ? `${product.stock} adet gönderime hazır` : "Şu anda stokta yok"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.2rem] bg-[#f5f5f5] p-4 text-sm text-[#555555] sm:grid-cols-3 sm:p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888888]">Tasarım Amacı</p>
                <p className="mt-2">Ürün odaklı, sakin ve güven veren bir alışveriş deneyimi.</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888888]">Teslimat</p>
                <p className="mt-2">Sepete eklemeden ödeme adımına kadar sipariş özeti net kalır.</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888888]">Ödeme</p>
                <p className="mt-2">Masaüstü ve mobilde doğrudan, sade etkileşim için tasarlandı.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <AddToCartButton product={product} disabled={product.stock < 1} />
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#faf7f3]"
              >
                Sepeti incele
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-3 lg:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-lg flex-col gap-3 rounded-[1.25rem] border border-black/8 bg-white/94 px-4 py-3 shadow-[0_28px_60px_-28px_rgba(17,17,17,0.25)] backdrop-blur min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:rounded-full">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#888888]">Satın almaya hazır</p>
            <p className="text-sm font-semibold text-[#111111]">{formatCurrency(product.price)}</p>
          </div>
          <AddToCartButton product={product} disabled={product.stock < 1} />
        </div>
      </div>
    </section>
  );
}
