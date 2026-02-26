export default function TeachLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 h-16 animate-pulse rounded-2xl bg-white/5" />
        <div className="mb-6 h-40 animate-pulse rounded-3xl bg-white/5" />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-24 animate-pulse rounded-full bg-white/10"
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
