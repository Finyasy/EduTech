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
        <div className="mb-8 rounded-3xl border border-white/80 bg-white/92 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Staff workspace
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-slate-900">
            Loading lesson planning and learner progress.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            The classroom shell is ready while we connect assignments, session status, and course alignment.
          </p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/92 p-6 shadow-sm">
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
