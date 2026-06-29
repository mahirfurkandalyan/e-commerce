"use client";

import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <section className="soft-panel rounded-[1.5rem] p-6 text-center sm:rounded-[2rem] sm:p-10">
        <h2 className="editorial-title text-3xl text-[#111111] sm:text-4xl">Sepetiniz boş.</h2>
        <p className="mt-4 text-sm leading-7 text-[#666666]">
          Ödeme adımına geçmek için birkaç ürün ekleyin.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
          Alışverişe devam et
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.2rem] border border-black/6 bg-white p-4 shadow-[0_24px_60px_-42px_rgba(17,17,17,0.12)] sm:p-5"
          >
            <div className="flex flex-col gap-4 min-[420px]:flex-row">
              <div className="relative aspect-[4/3.2] w-full shrink-0 overflow-hidden rounded-[1rem] bg-[#f5f5f5] min-[420px]:h-28 min-[420px]:w-24 sm:h-32 sm:w-28">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(234,219,200,0.72),transparent_34%),linear-gradient(135deg,#fffdfb_0%,#f5f5f5_100%)] text-xs text-[#888888]">
                    Görsel yok
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="space-y-2">
                  <Link href={`/products/${item.slug}`} className="editorial-title block text-2xl leading-[1.05] text-[#111111] sm:text-3xl">
                    {item.name}
                  </Link>
                  <p className="text-sm text-[#888888]">{formatCurrency(item.price)} / adet</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex w-fit items-center rounded-full border border-black/8 bg-[#fafafa]">
                    <button type="button" onClick={() => decreaseItem(item.id)} className="px-4 py-2 text-sm text-[#555555] hover:bg-white">
                      -
                    </button>
                    <span className="min-w-10 text-center text-sm font-medium text-[#111111]">{item.quantity}</span>
                    <button type="button" onClick={() => increaseItem(item.id)} className="px-4 py-2 text-sm text-[#555555] hover:bg-white">
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#111111]">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-[#888888] transition hover:text-[#111111]">
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="dark-panel h-fit rounded-[1.35rem] border border-black/10 p-5 text-white shadow-[0_30px_70px_-36px_rgba(17,17,17,0.34)] sm:rounded-[1.6rem] sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/50">Sipariş Özeti</p>
        <h3 className="editorial-title mt-4 text-3xl text-white sm:text-4xl">Son kontrol.</h3>
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-white/72">
            <span>Ürün</span>
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-white/72">
            <span>Teslimat</span>
            <span>Daha sonra hesaplanır</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-semibold">
            <span>Ara toplam</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        <Link href="/checkout" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold !text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition hover:opacity-90">
          Ödemeye geç
        </Link>
      </aside>
    </section>
  );
}
