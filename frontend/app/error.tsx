"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <main className="flex min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-10">
      <div className="app-frame mx-auto flex w-full max-w-3xl flex-col items-start rounded-[2rem] border border-black/5 p-8">
        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
          Bir sorun oluştu
        </span>
        <h1 className="editorial-title mt-5 text-4xl leading-none text-[#111111]">Mağaza yüklenemedi.</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#666666]">
          Backend bağlantısını kontrol edin ya da tekrar deneyin. Arayüz bu hatayı yakalayarak uygulamanın çökmesini engelledi.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-[#111111] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Tekrar Dene
        </button>
      </div>
    </main>
  );
}
