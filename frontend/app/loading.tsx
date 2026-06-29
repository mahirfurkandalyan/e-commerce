import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-10">
      <div className="app-frame mx-auto w-full max-w-[1440px] rounded-[2rem] border border-black/5 p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          <Skeleton className="h-14 rounded-[1.2rem]" />
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-80 rounded-[2rem]" />
            <div className="grid gap-4">
              <Skeleton className="h-36 rounded-[1.6rem]" />
              <Skeleton className="h-36 rounded-[1.6rem]" />
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-40 rounded-[1.6rem]" />
            <Skeleton className="h-40 rounded-[1.6rem]" />
          </div>
          <Skeleton className="h-12 rounded-full" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[1rem] border border-black/6 bg-white p-4 shadow-[0_18px_45px_-32px_rgba(17,17,17,0.12)]"
              >
                <Skeleton className="aspect-[4/4.8] rounded-[1rem]" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
