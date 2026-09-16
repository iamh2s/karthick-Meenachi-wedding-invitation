import { cn } from "../utils/cn";

/* ---------------- Lotus blossom ---------------- */
export function Lotus({ className }: { className?: string }) {
  const petal =
    "M24 3 C29.5 10.5 29.5 18 24 24.5 C18.5 18 18.5 10.5 24 3 Z";
  return (
    <svg
      viewBox="0 0 48 32"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <g>
        <use href="#lotus-petal" transform="rotate(-64 24 27)" opacity="0.55" />
        <use href="#lotus-petal" transform="rotate(-32 24 27)" opacity="0.8" />
        <use href="#lotus-petal" />
        <use href="#lotus-petal" transform="rotate(32 24 27)" opacity="0.8" />
        <use href="#lotus-petal" transform="rotate(64 24 27)" opacity="0.55" />
        <path d={petal} id="lotus-petal" />
        <path
          d="M6 27.5 Q24 34.5 42 27.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

/* ---------------- Ornamental divider ---------------- */
export function Divider({
  className,
  tone = "text-gold-400",
}: {
  className?: string;
  tone?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden="true">
      <span className="h-px w-16 sm:w-24 gold-hairline" />
      <span className={cn("h-1.5 w-1.5 rotate-45 bg-gold-500/80", tone)} />
      <Lotus className={cn("h-6 w-9", tone)} />
      <span className={cn("h-1.5 w-1.5 rotate-45 bg-gold-500/80", tone)} />
      <span className="h-px w-16 sm:w-24 gold-hairline" />
    </div>
  );
}

/* ---------------- Section-divider: temple band ---------------- */
export function SectionBand({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center py-10", className)} aria-hidden="true">
      <span className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 gold-hairline opacity-60" />
      <span className="relative flex items-center gap-3 bg-transparent px-6">
        <span className="h-1 w-1 rotate-45 bg-gold-500/70" />
        <Lotus className="h-7 w-10 text-gold-400/90" />
        <span className="h-1 w-1 rotate-45 bg-gold-500/70" />
      </span>
    </div>
  );
}

/* ---------------- Corner flourish for frames ---------------- */
export function Corner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M2.5 61.5 V22 C2.5 10.4 10.4 2.5 22 2.5 H61.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 61.5 V28 C11 17.8 17.8 11 28 11 H61.5" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
      <path d="M21 13.5 L28.5 21 L21 28.5 L13.5 21 Z" fill="currentColor" opacity="0.9" />
      <circle cx="40" cy="6.5" r="1.7" fill="currentColor" />
      <circle cx="6.5" cy="40" r="1.7" fill="currentColor" />
    </svg>
  );
}

/* ---------------- Generated mandala medallion ---------------- */
export function Mandala({
  className,
  petals = 16,
}: {
  className?: string;
  petals?: number;
}) {
  const items = Array.from({ length: petals }, (_, i) => (360 / petals) * i);
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="120" cy="120" r="104" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      {items.map((a) => (
        <path
          key={a}
          d="M120 24 C130 40 130 56 120 70 C110 56 110 40 120 24 Z"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.75"
          transform={`rotate(${a} 120 120)`}
        />
      ))}
      {items.map((a) => (
        <circle
          key={`d${a}`}
          cx="120"
          cy="86"
          r="1.6"
          fill="currentColor"
          opacity="0.8"
          transform={`rotate(${a + 360 / petals / 2} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="34" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <circle cx="120" cy="120" r="28" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

/* ---------------- Monogram seal (wax-seal inspired) ---------------- */
export function MonogramSeal({
  letters,
  className,
  letterClassName,
}: {
  letters: string;
  className?: string;
  letterClassName?: string;
}) {
  const ticks = Array.from({ length: 24 }, (_, i) => (360 / 24) * i);
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-full",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-gold-400">
        <circle cx="50" cy="50" r="47.5" fill="rgba(21,3,8,0.72)" stroke="currentColor" strokeWidth="1" opacity="0.95" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
        {ticks.map((a) => (
          <line
            key={a}
            x1="50"
            y1="8.5"
            x2="50"
            y2="13"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.7"
            transform={`rotate(${a} 50 50)`}
          />
        ))}
      </svg>
      <span
        className={cn(
          "relative font-engraved engraved select-none",
          letterClassName
        )}
      >
        {letters}
      </span>
    </div>
  );
}

/* ---------------- Gold frame overlay (inside a relative parent) ---------------- */
export function GoldFrame({
  inset = "inset-3 sm:inset-5",
  corner = "h-7 w-7 sm:h-9 sm:w-9",
  opacity = "opacity-80",
}: {
  inset?: string;
  corner?: string;
  opacity?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute z-20", inset, opacity)} aria-hidden="true">
      <div className="absolute inset-0 border border-gold-400/40" />
      <div className="absolute inset-[5px] border border-gold-400/15" />
      <Corner className={cn("absolute -top-px -left-px text-gold-300", corner)} />
      <Corner className={cn("absolute -top-px -right-px rotate-90 text-gold-300", corner)} />
      <Corner className={cn("absolute -bottom-px -right-px rotate-180 text-gold-300", corner)} />
      <Corner className={cn("absolute -bottom-px -left-px -rotate-90 text-gold-300", corner)} />
    </div>
  );
}

/* ---------------- Thin framed image treatment ---------------- */
export function FramedImage({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <div className={cn("relative overflow-hidden bg-maroon-950", className)}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
      <div className="pointer-events-none absolute inset-0 border border-gold-400/25" />
      <div className="pointer-events-none absolute inset-2 border border-gold-400/10" />
    </div>
  );
}
