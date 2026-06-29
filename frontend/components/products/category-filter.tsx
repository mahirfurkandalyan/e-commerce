import Link from "next/link";

import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  activeCategory?: string;
  activeSearch?: string;
  activeSort?: string;
};

export function CategoryFilter({ categories, activeCategory, activeSearch, activeSort }: CategoryFilterProps) {
  const filters = [
    { label: "Tümü", slug: "" },
    ...categories.map((category) => ({ label: category.name, slug: category.slug })),
  ];

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map((filter) => {
        const isActive = filter.slug === activeCategory || (!filter.slug && !activeCategory);
        const params = new URLSearchParams();

        if (filter.slug) {
          params.set("category", filter.slug);
        }
        if (activeSearch) {
          params.set("search", activeSearch);
        }
        if (activeSort) {
          params.set("sort", activeSort);
        }

        const href = params.toString() ? `/?${params.toString()}` : "/";

        return (
          <Link
            key={filter.slug || "all"}
            href={href}
            className={cn(
              "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition duration-200",
              isActive
                ? "bg-[linear-gradient(135deg,#1a1410,#2e1f14)] shadow-[0_6px_20px_-6px_rgba(17,17,17,0.45)]"
                : "border border-black/8 bg-white/80 text-[#555555] shadow-[0_2px_8px_-4px_rgba(17,17,17,0.08)] hover:-translate-y-0.5 hover:border-[#dcc4aa]/60 hover:bg-[#fcf8f4] hover:text-[#111111] hover:shadow-[0_6px_18px_-6px_rgba(17,17,17,0.14)]",
            )}
          >
            <span className={cn(isActive ? "text-[#fffdf9]" : "text-[#555555]")}>{filter.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
