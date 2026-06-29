"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store";

export function CartIndicator() {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <>
      <Link
        href="/cart"
        className="flex min-w-0 items-center justify-between gap-2 rounded-full bg-[#111111] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:min-w-[112px] sm:px-4"
      >
        <span className="text-sm font-semibold tracking-[0.01em] text-[#fffdf9]">Sepet</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/18 px-2 text-xs font-semibold leading-none text-[#fffdf9]">
          {itemCount}
        </span>
      </Link>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 hidden px-4 sm:hidden">
        <div className="mx-auto max-w-md">
          <Link
            href="/cart"
            className="pointer-events-auto flex items-center justify-between rounded-full border border-black/8 bg-[#111111] px-5 py-3 text-white shadow-[0_22px_55px_-24px_rgba(17,17,17,0.35)] transition hover:opacity-90"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Sepet</span>
              <span className="rounded-full border border-white/10 bg-white/18 px-2 py-1 text-xs font-semibold text-[#fffdf9]">
                {itemCount} ürün
              </span>
            </div>
            <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
