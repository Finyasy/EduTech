export default function TeachLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Teacher workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Loading your class tools</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                Preparing lessons, learners, assignments, and progress signals.
              </p>
            </div>
            <div className="hidden h-14 w-14 animate-pulse rounded-2xl bg-cyan-300/20 sm:block" />
          </div>
        </div>
        <div className="mb-6 h-40 animate-pulse rounded-3xl bg-white/10" />
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-24 animate-pulse rounded-full bg-white/15"
              />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
