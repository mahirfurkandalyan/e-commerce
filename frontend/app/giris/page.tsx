"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { login, register } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const showToast = useToastStore((state) => state.showToast);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    router.replace(user.role === "admin" ? "/yonetim" : "/hesabim");
  }, [router, token, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response =
        mode === "login"
          ? await login({ username, password })
          : await register({ username, password, full_name: fullName, phone });

      setSession(response.token, response.user);
      showToast({
        title: mode === "login" ? "Giriş başarılı" : "Hesap oluşturuldu",
        description: `${response.user.full_name} için oturum açıldı.`,
        tone: "success",
      });
      router.push(response.user.role === "admin" ? "/yonetim" : "/hesabim");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "İşlem tamamlanamadı.";
      setError(message);
      showToast({
        title: "Auth hatası",
        description: message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-frame mx-auto grid max-w-[1180px] gap-6 overflow-hidden rounded-[2rem] border border-black/5 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <section className="relative overflow-hidden rounded-[1.8rem] border border-black/6 bg-[linear-gradient(145deg,#ffffff_0%,#fdf9f5_42%,#f0e6da_100%)] p-6 sm:p-8">
          <div className="grid-accent pointer-events-none absolute inset-0 opacity-[0.35]" />
          <div className="relative space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3b2f2f]/12 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8b6544]">
              Tek giriş
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c8a27a]" />
              Role göre yönlendirme
            </span>
            <div>
              <h1 className="editorial-title text-5xl leading-[0.92] text-[#2c2119] sm:text-6xl">Tek kapı, doğru panel.</h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-[#5f5650]">
                Yönetici giriş yapınca operasyon paneline, müşteri giriş yapınca kendi sipariş alanına düşer.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="accent-panel rounded-[1.5rem] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">Demo yönetici</p>
                <p className="mt-3 text-lg font-semibold text-[#2c2119]">`yonetici` / `123456`</p>
              </div>
              <div className="accent-panel rounded-[1.5rem] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f8379]">Demo müşteri</p>
                <p className="mt-3 text-lg font-semibold text-[#2c2119]">`musteri` / `123456`</p>
              </div>
            </div>
            <Link href="/" className="inline-flex text-sm text-[#6e645c] underline underline-offset-4">
              Mağazaya geri dön
            </Link>
          </div>
        </section>

        <section className="soft-panel rounded-[1.8rem] p-6 sm:p-8">
          <div className="mb-6 flex gap-3">
            <button type="button" onClick={() => setMode("login")} className={`rounded-full px-5 py-2.5 text-sm font-medium ${mode === "login" ? "bg-[#111111] text-white" : "border border-black/8 bg-white text-[#5b524c]"}`}>
              Giriş yap
            </button>
            <button type="button" onClick={() => setMode("register")} className={`rounded-full px-5 py-2.5 text-sm font-medium ${mode === "register" ? "bg-[#111111] text-white" : "border border-black/8 bg-white text-[#5b524c]"}`}>
              Müşteri hesabı aç
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#2c2119]">Ad soyad</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" minLength={3} required />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#2c2119]">Kullanıcı adı</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" minLength={3} required />
            </label>

            {mode === "register" && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#2c2119]">Telefon</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#2c2119]">Şifre</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#111111]" minLength={6} required />
            </label>

            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? "İşleniyor..." : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
