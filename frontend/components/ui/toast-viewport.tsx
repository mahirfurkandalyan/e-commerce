"use client";

import { useToastStore } from "@/store/toast";

const toneStyles = {
  default: "border-slate-200/80 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-rose-200 bg-rose-50 text-rose-950",
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto toast-enter rounded-[1.25rem] border p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] backdrop-blur ${toneStyles[toast.tone ?? "default"]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="text-sm leading-6 opacity-80">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full px-2 py-1 text-xs font-medium opacity-60 transition hover:opacity-100"
              >
                Kapat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
