import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";

type PaymentResultPageProps = {
  searchParams: Promise<{
    status?: string;
    order?: string;
    reason?: string;
  }>;
};

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
  const params = await searchParams;
  const isSuccess = params.status === "success";

  return (
    <SiteShell
      eyebrow="Odeme Sonucu"
      title={isSuccess ? "Odeme tamamlandi." : "Odeme tamamlanamadi."}
      description={
        isSuccess
          ? "Iyzico test odemesi basarili oldu ve siparisiniz onaylandi."
          : "Iyzico test odemesi basarisiz oldu veya iptal edildi."
      }
      heroTone="compact"
    >
      <section className="soft-panel rounded-[2rem] p-8 text-center">
        <p className={`text-sm font-semibold ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}>
          {isSuccess ? "Basarili" : "Basarisiz"}
        </p>
        {params.order ? <p className="mt-3 text-sm text-[#666666]">Siparis no: #{params.order}</p> : null}
        {params.reason ? <p className="mt-3 text-sm text-[#666666]">Neden: {params.reason}</p> : null}
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-[#111111] px-5 py-3 text-sm font-medium text-white">
            Magazaya don
          </Link>
          <Link href="/hesabim" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#111111]">
            Hesabim
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
