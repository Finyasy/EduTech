export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-7 w-44 rounded bg-slate-200" />
          <div className="mx-auto h-4 w-56 rounded bg-slate-100" />
          <div className="h-11 rounded-xl bg-slate-100" />
          <div className="h-11 rounded-xl bg-slate-100" />
          <div className="h-11 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
