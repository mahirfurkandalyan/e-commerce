import { cn } from "@/lib/utils";

type SearchFormProps = {
  defaultValue?: string;
  activeCategory?: string;
  activeSort?: string;
};

const SORT_OPTIONS = [
  { label: "Popüler", value: "" },
  { label: "Fiyat: Artan", value: "price_asc" },
  { label: "Fiyat: Azalan", value: "price_desc" },
  { label: "En Yeni", value: "newest" },
];

export function SearchForm({ defaultValue, activeCategory, activeSort }: SearchFormProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-black/6 bg-white/92 p-4 shadow-[0_22px_60px_-42px_rgba(17,17,17,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm sm:rounded-[1.75rem] sm:p-6">
      <div
        className="orb-float-3 pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-45"
        style={{ background: "radial-gradient(circle, rgba(234,219,200,0.7), transparent 70%)" }}
      />

      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#aaaaaa]">Katalogda Ara</p>
            <h3 className="editorial-title mb-4 text-2xl leading-none text-[#111111] sm:text-3xl">Doğru parçayı hızla bulun.</h3>
            <form method="GET" action="/" className="flex flex-col gap-2 min-[420px]:flex-row">
              {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
              {activeSort ? <input type="hidden" name="sort" value={activeSort} /> : null}
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbbbbb]"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  name="search"
                  defaultValue={defaultValue}
                  placeholder="Ürünlerde, kategorilerde ara..."
                  className="w-full rounded-xl border border-black/8 bg-white py-3.5 pl-10 pr-4 text-sm text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_-4px_rgba(17,17,17,0.06)] outline-none placeholder:text-[#c0c0c0] focus:border-[#dcc4aa] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_3px_rgba(220,196,170,0.2)]"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0 !py-3">
                Ara
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/5 pt-4 min-[420px]:flex-row min-[420px]:items-center">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aaaaaa]">Sırala</span>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SORT_OPTIONS.map((option) => {
              const isActive = (option.value === "" && !activeSort) || option.value === activeSort;
              const params = new URLSearchParams();

              if (activeCategory) {
                params.set("category", activeCategory);
              }
              if (defaultValue) {
                params.set("search", defaultValue);
              }
              if (option.value) {
                params.set("sort", option.value);
              }

              const href = params.toString() ? `/?${params.toString()}` : "/";

              return (
                <a
                  key={option.value || "popular"}
                  href={href}
                  className={cn(
                    "inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium transition",
                    isActive
                      ? "min-w-[72px] bg-[linear-gradient(135deg,#1a1410,#2e1f14)] shadow-[0_4px_14px_-4px_rgba(17,17,17,0.4)]"
                      : "border border-black/8 bg-white/70 text-[#555555] hover:-translate-y-0.5 hover:border-[#dcc4aa]/50 hover:bg-white hover:text-[#111111]",
                  )}
                >
                  <span className={cn("relative z-10", isActive ? "text-[#fffdf9]" : "text-[#555555]")}>
                    {option.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
