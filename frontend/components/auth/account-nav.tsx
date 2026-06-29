"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

export function AccountNav() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);

  async function handleLogout() {
    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Session cleanup still proceeds locally.
    } finally {
      clearSession();
      showToast({
        title: "Çıkış yapıldı",
        description: "Hesap oturumu kapatıldı.",
        tone: "success",
      });
      router.push("/");
    }
  }

  if (!user) {
    return (
      <Link
        href="/giris"
        className="rounded-full border border-black/8 bg-white/80 px-3.5 py-2 text-sm text-[#111111] shadow-[0_2px_8px_-4px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5 hover:border-[#dcc4aa]/60 hover:bg-white hover:shadow-[0_6px_18px_-6px_rgba(17,17,17,0.14)] sm:px-4"
      >
        Giriş
      </Link>
    );
  }

  const href = user.role === "admin" ? "/yonetim" : "/hesabim";
  const label = user.role === "admin" ? "Yönetim" : "Hesabım";

  return (
    <>
      <Link
        href={href}
        className="rounded-full border border-black/8 bg-white/80 px-3.5 py-2 text-sm text-[#111111] shadow-[0_2px_8px_-4px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5 hover:border-[#dcc4aa]/60 hover:bg-white hover:shadow-[0_6px_18px_-6px_rgba(17,17,17,0.14)] sm:px-4"
      >
        {label}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-black/8 bg-white/80 px-3.5 py-2 text-sm text-[#111111] shadow-[0_2px_8px_-4px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5 hover:border-[#dcc4aa]/60 hover:bg-white hover:shadow-[0_6px_18px_-6px_rgba(17,17,17,0.14)] sm:px-4"
      >
        Çıkış
      </button>
    </>
  );
}
