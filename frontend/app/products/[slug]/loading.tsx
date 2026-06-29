import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Skeleton className="aspect-[4/4.9] rounded-[1.4rem]" />
      <div className="space-y-4 rounded-[1.6rem] border border-black/6 bg-white p-8 shadow-[0_18px_45px_-32px_rgba(17,17,17,0.12)]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-4 h-24 rounded-[1.5rem]" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}
