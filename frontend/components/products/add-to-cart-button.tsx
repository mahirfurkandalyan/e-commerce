"use client";

import { useState } from "react";

import type { Product } from "@/lib/types";
import { useCartStore } from "@/store";
import { useToastStore } from "@/store/toast";

type AddToCartButtonProps = {
  product: Product;
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled = false }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useToastStore((state) => state.showToast);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    showToast({
      title: "Sepete eklendi",
      description: `${product.name} sepete eklendi.`,
      tone: "success",
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  if (disabled) {
    return (
      <span className="rounded-full border border-black/8 bg-[#f5f5f5] px-5 py-2.5 text-sm font-medium text-[#bbbbbb] cursor-not-allowed select-none">
        Tükendi
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ${
        added
          ? "bg-emerald-500 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.5)]"
          : "bg-[linear-gradient(135deg,#1a1410_0%,#2e1f14_100%)] shadow-[0_6px_20px_-6px_rgba(17,17,17,0.45)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-8px_rgba(17,17,17,0.5)]"
      }`}
    >
      <span className={`flex items-center gap-1.5 transition-all duration-200 ${added ? "scale-95" : "scale-100"}`}>
        {added ? (
          <>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Eklendi
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1.5 1.5h1.8l1.2 6.3a1 1 0 0 0 1 .8h5a1 1 0 0 0 1-.75l.8-3.85H3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.5" cy="10.5" r="1" fill="currentColor" />
              <circle cx="10" cy="10.5" r="1" fill="currentColor" />
            </svg>
            Sepete ekle
          </>
        )}
      </span>
    </button>
  );
}
