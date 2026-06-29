import Image from "next/image";
import Link from "next/link";

type FooterProps = {
  storeName: string;
  brandColor: string;
  logo?: string | null;
  description?: string;
};

const NAV_LINKS = [
  { label: "Mağaza", href: "/" },
  { label: "Sepet", href: "/cart" },
  { label: "Ödeme", href: "/checkout" },
];

const POLICY_LINKS = [
  { label: "Gizlilik Politikası", href: "#" },
  { label: "Kullanım Şartları", href: "#" },
  { label: "Kargo Bilgisi", href: "#" },
];

export function Footer({ storeName, brandColor, logo, description }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-8 overflow-hidden rounded-[1.35rem] border border-black/6 bg-[linear-gradient(160deg,#111111_0%,#1a1612_55%,#0e0d0b_100%)] text-white sm:mt-12 sm:rounded-[2rem]">
      <div
        className="orb-float-1 pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, rgba(220,196,170,0.9), transparent 65%)" }}
      />
      <div
        className="orb-float-3 pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(234,219,200,0.8), transparent 68%)" }}
      />

      <div className="relative grid gap-8 p-5 sm:gap-10 sm:p-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {logo ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10">
                <Image src={logo} alt={storeName} fill sizes="40px" className="object-cover" />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(17,17,17,0.5)]"
                style={{ background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor}88)` }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold tracking-wide text-white/90">{storeName}</span>
          </div>
          <p className="max-w-xs text-sm leading-7 text-white/50">
            {description || "Güven, ferahlık ve özenle seçilmiş ürünler etrafında tasarlanmış premium mikro e-ticaret deneyimi."}
          </p>
          <div className="flex gap-3">
            {[
              {
                label: "Instagram",
                path: "M7 2C4.24 2 2 4.24 2 7v6c0 2.76 2.24 5 5 5h6c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm6 1.5A3.5 3.5 0 0 1 16.5 7v6A3.5 3.5 0 0 1 13 16.5H7A3.5 3.5 0 0 1 3.5 13V7A3.5 3.5 0 0 1 7 3.5h6zM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm3.75-2a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z",
              },
              {
                label: "Twitter / X",
                path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
              },
              {
                label: "Facebook",
                path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
              },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/50 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/12 hover:text-white/80"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Gezinme</p>
          <nav className="flex flex-col gap-2.5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-white/60 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Yasal</p>
          <nav className="flex flex-col gap-2.5">
            {POLICY_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-white/60 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Haberdar Olun</p>
          <p className="text-sm leading-6 text-white/50">
            Yeni ürünler geldiğinde ve stoklar yenilendiğinde haber alın.
          </p>
          <form className="flex flex-col gap-2.5 sm:flex-row lg:flex-col" action="#">
            <input
              type="email"
              placeholder="eposta@adresiniz.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#dcc4aa]/50 focus:bg-white/12"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-[#dcc4aa]/25 bg-[linear-gradient(135deg,rgba(220,196,170,0.25),rgba(220,196,170,0.12))] px-5 py-3 text-sm font-medium text-[#dcc4aa] transition hover:-translate-y-0.5 hover:border-[#dcc4aa]/40 hover:bg-[linear-gradient(135deg,rgba(220,196,170,0.35),rgba(220,196,170,0.2))]"
            >
              Abone Ol
            </button>
          </form>
        </div>
      </div>

      <div className="relative border-t border-white/8 px-5 py-5 sm:px-10">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/30 sm:flex-row">
          <p>&copy; {year} {storeName}. Tüm hakları saklıdır.</p>
          <p>Micro Commerce ile güçlendirilmiştir · Next.js + Django</p>
        </div>
      </div>
    </footer>
  );
}
