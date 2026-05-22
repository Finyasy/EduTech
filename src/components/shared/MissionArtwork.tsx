import Image from "next/image";

type MissionArtworkProps = {
  className?: string;
  imageClassName?: string;
  label?: string;
  priority?: boolean;
};

export default function MissionArtwork({
  className = "",
  imageClassName = "",
  label = "AI, coding, and maths learning studio",
  priority = false,
}: MissionArtworkProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)] ${className}`}
    >
      <Image
        src="/images/learnbridge-mission-studio.png"
        alt={label}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 560px"
        className={`h-full w-full object-cover ${imageClassName}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(7,20,45,0.72)_100%)]" />
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/30 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
          Mission studio
        </span>
        <span className="rounded-full border border-emerald-200/80 bg-emerald-50/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-900 shadow-sm">
          Learn + build + share
        </span>
      </div>
    </div>
  );
}
