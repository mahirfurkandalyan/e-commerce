import type { Metadata } from "next";

import { SiteShell } from "@/components/layout/site-shell";
import { CategoryFilter } from "@/components/products/category-filter";
import { ProductCard } from "@/components/products/product-card";
import { SearchForm } from "@/components/products/search-form";
import { StoreStatsPanel } from "@/components/products/store-stats";
import { getCategories, getProducts, getStoreStats } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mağaza | Micro Commerce",
  description: "Ürünleri inceleyin, kategoriye göre filtreleyin ve sade bir mağaza deneyimiyle sipariş verin.",
};

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
  }>;
};

const WHY_ITEMS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 2L13.5 8.5H20.5L14.7 12.8L17 19.5L11 15.2L5 19.5L7.3 12.8L1.5 8.5H8.5L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Özenle Seçilmiş Ürünler",
    body: "Her ürün kalite için özenle seçilir; böylece güven veren, seçkin bir katalog oluşur.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 11h16M3 11l5-5M3 11l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 4v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Hızlı Ödeme",
    body: "Sepetten onaya kadar minimum adım. Gereksiz üyelikler ya da yavaş yönlendirmeler yok.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 6V5a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="11.5" r="1" fill="currentColor" />
      </svg>
    ),
    title: "Güvenli Sipariş",
    body: "Verileriniz paylaşılmaz. Her sipariş, gizliliği önceleyen güvenli bir altyapıda işlenir.",
  },
];

export default async function Home({ searchParams }: HomePageProps) {
  const { category, search, sort } = await searchParams;
  const [products, categories, stats] = await Promise.all([
    getProducts(category, search),
    getCategories(),
    getStoreStats(),
  ]);

  const sorted = [...products];
  if (sort === "price_asc") {
    sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sort === "price_desc") {
    sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else if (sort === "newest") {
    sorted.sort((a, b) => b.id - a.id);
  }

  return (
    <SiteShell
      eyebrow="Yeni Sezon Seçkisi"
      title="Daha rafine ve daha sakin bir mağaza için seçkin parçalar."
      description="Netlik, hız ve zarif bir alışveriş deneyimine önem veren butik markalar için tasarlandı."
      heroTone="feature"
    >
      <section className="space-y-6 sm:space-y-8">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SearchForm defaultValue={search} activeCategory={category} activeSort={sort} />
          <StoreStatsPanel stats={stats} />
        </div>

        <CategoryFilter categories={categories} activeCategory={category} activeSearch={search} activeSort={sort} />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#888888]">Öne Çıkan Ürünler</p>
            <h2 className="editorial-title mt-2 text-3xl leading-none text-[#111111] sm:text-5xl">
              Günlük yaşam için özenle seçildi.
            </h2>
          </div>
          <p className="hidden max-w-md text-sm leading-7 text-[#666666] lg:block">
            Her kart; görsel, net fiyat ve hızlı sepete ekleme akışıyla sade ve doğrudan bir deneyim sunar.
          </p>
        </div>

        {sorted.length > 0 ? (
          <div className="product-grid grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="soft-panel rounded-[1.5rem] p-6 text-center sm:rounded-[2rem] sm:p-10">
            <h2 className="editorial-title text-3xl text-[#111111]">Ürün bulunamadı.</h2>
            <p className="mt-3 text-sm leading-6 text-[#666666]">
              Aramayı değiştirin, başka kategori seçin ya da Django yönetiminden ürün ekleyin.
            </p>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-black/6 bg-[linear-gradient(145deg,#fdfbf8_0%,#f4ece3_100%)] p-5 sm:rounded-[2rem] sm:p-10">
          <div className="mb-6 text-center sm:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7c6d5b]">Neden Bizi Tercih Ediyorlar</p>
            <h2 className="editorial-title mt-3 text-3xl text-[#111111] sm:text-4xl">
              Gürültü değil, güven odaklı.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#666666]">
              Size faydası olmayan her şeyi kaldırdık: baskıcı satış taktikleri, karanlık desenler ve yavaş sayfalar yok.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHY_ITEMS.map((item, index) => (
              <div
                key={index}
                className="animate-reveal-scale rounded-[1.25rem] border border-black/6 bg-white/80 p-5 shadow-[0_12px_40px_-28px_rgba(17,17,17,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm sm:rounded-[1.5rem] sm:p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(145deg,rgba(234,219,200,0.6),rgba(220,196,170,0.35))] text-[#8b6544]">
                  {item.icon}
                </span>
                <h3 className="mb-2 text-base font-semibold text-[#111111]">{item.title}</h3>
                <p className="text-sm leading-6 text-[#666666]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
