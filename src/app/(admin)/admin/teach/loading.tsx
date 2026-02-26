export default function TeachLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-sky-50 pb-24">
      <div className="sticky top-0 z-20 border-b border-amber-100/80 bg-amber-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="h-11 w-44 animate-pulse rounded-full bg-white/80" />
          <div className="h-10 w-64 animate-pulse rounded-full bg-white/80" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-orange-100" />
          <div className="h-10 w-full max-w-3xl animate-pulse rounded-2xl bg-white/80" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-white/70" />
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-24 animate-pulse rounded-full bg-amber-100"
              />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-amber-100 bg-amber-50/70"
              />
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-600">Loading teacher workspace...</p>
        </div>
      </main>
    </div>
  );
}
