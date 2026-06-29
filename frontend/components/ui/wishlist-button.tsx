"use client";

import { useSyncExternalStore } from "react";

type WishlistButtonProps = {
  productId: number;
};

function subscribe(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === "wishlist") {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getSnapshot(productId: number) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const list: number[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");
    return list.includes(productId);
  } catch {
    return false;
  }
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const saved = useSyncExternalStore(
    subscribe,
    () => getSnapshot(productId),
    () => false,
  );

  function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const list: number[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");
      const updated = saved ? list.filter((id) => id !== productId) : [...list, productId];
      localStorage.setItem("wishlist", JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent("storage", { key: "wishlist" }));
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      data-saved={saved}
      className="wishlist-btn"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill={saved ? "#e74c3c" : "none"}
        aria-hidden="true"
        style={{ transition: "fill 200ms ease" }}
      >
        <path
          d="M8 13.5S2 9.8 2 5.8C2 4 3.3 2.5 5 2.5c1 0 1.9.5 2.5 1.3L8 4.4l.5-.6C9.1 3 10 2.5 11 2.5c1.7 0 3 1.5 3 3.3 0 4-6 7.7-6 7.7z"
          stroke={saved ? "#e74c3c" : "#555555"}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
