/**
 * ArtisanCardSkeleton — pulse placeholder matching ArtisanCard layout.
 * Used as the Suspense fallback while artisan data streams from the server.
 */
export function ArtisanCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-(--color-surface) p-6 text-center shadow-(--shadow-soft) animate-pulse">
      {/* Avatar circle */}
      <div className="h-24 w-24 rounded-full bg-(--color-sand)" />

      {/* Name + location */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="h-4 w-32 rounded bg-(--color-sand)" />
        <div className="h-3 w-20 rounded bg-(--color-sand-light)" />
      </div>

      {/* Bio lines */}
      <div className="flex w-full flex-col gap-2">
        <div className="h-3 w-full rounded bg-(--color-sand-light)" />
        <div className="h-3 w-5/6 rounded bg-(--color-sand-light)" />
        <div className="h-3 w-4/6 rounded bg-(--color-sand-light)" />
      </div>

      {/* Badge */}
      <div className="mt-auto h-6 w-24 rounded-full bg-(--color-sand)" />
    </div>
  );
}

/** Grid of N skeleton cards matching the artisan listing layout */
export function ArtisanGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ArtisanCardSkeleton key={i} />
      ))}
    </div>
  );
}

