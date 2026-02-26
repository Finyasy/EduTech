export default function PostAuthLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-emerald-400 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-300 to-indigo-400 text-sm font-black tracking-tight text-slate-950">
          LB
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Preparing your workspace
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Finishing sign-in and routing you to the correct LearnBridge workspace.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300" />
        </div>
      </div>
    </div>
  );
}
