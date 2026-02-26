export default function DashboardRoutesLoading() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="sticky top-0 z-20 border-b border-amber-100/80 bg-amber-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="h-11 w-44 animate-pulse rounded-2xl bg-white/80" />
          <div className="flex gap-3">
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/80" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-white/80" />
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/80" />
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-white/80" />
          <div className="h-10 w-72 animate-pulse rounded bg-white/80" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/80" />
        </div>
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <article
              key={index}
              className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm"
            >
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/80" />
              <div className="mt-4 h-6 w-32 animate-pulse rounded-full bg-slate-200/80" />
              <div className="mt-3 h-3 w-44 animate-pulse rounded-full bg-slate-200/80" />
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
