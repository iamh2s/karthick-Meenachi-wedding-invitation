import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import Hero from "./Hero";
import { Lotus, MonogramSeal } from "./Ornaments";
import { wedding } from "../data";
import { cn } from "../utils/cn";

/* One half of the temple doorway */
function Door({
  side,
  progress,
  reduced,
}: {
  side: "left" | "right";
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  const isLeft = side === "left";

  const rotate = useTransform(
    progress,
    [0, 0.62],
    [0, isLeft ? -101 : 101]
  );
  const fade = useTransform(progress, [0.58, 0.82], [1, 0]);
  const reducedFade = useTransform(progress, [0, 0.42], [1, 0]);
  const drift = useTransform(progress, [0, 0.62], ["0%", isLeft ? "-4%" : "4%"]);

  return (
    <motion.div
      className={cn(
        "relative h-full w-1/2 will-change-transform",
        isLeft ? "origin-left" : "origin-right"
      )}
      style={
        reduced
          ? { opacity: reducedFade }
          : {
              rotateY: rotate,
              x: drift,
              opacity: fade,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }
      }
      aria-hidden="true"
    >
      {/* engraved face */}
      <div className="door-face absolute inset-0 overflow-hidden">
        {/* embossed border system */}
        <div className="absolute inset-2 border border-gold-400/45 sm:inset-3" />
        <div className="absolute inset-[9px] border border-gold-400/20 sm:inset-[15px]" />
        <div className="absolute inset-4 border-l border-r border-gold-500/10 sm:inset-6" />

        {/* brass studs */}
        <div className="door-studs absolute left-6 right-6 top-[18px] h-[11px] opacity-80 sm:left-8 sm:right-8 sm:top-[26px]" />
        <div className="door-studs absolute bottom-[18px] left-6 right-6 h-[11px] opacity-80 sm:bottom-[26px] sm:left-8 sm:right-8" />
        <div
          className={cn(
            "door-studs-v absolute bottom-8 top-8 w-[11px] opacity-70",
            isLeft ? "left-[18px] sm:left-[26px]" : "right-[18px] sm:right-[26px]"
          )}
        />

        {/* kolam lattice near the seam (hidden on the smallest screens) */}
        <div
          className={cn(
            "kolam-band absolute bottom-10 top-10 hidden w-7 opacity-45 sm:block sm:w-9",
            isLeft ? "right-6 sm:right-9" : "left-6 sm:left-9"
          )}
        />

        {/* seam ridge */}
        <div
          className={cn(
            "absolute bottom-0 top-0 w-[3px] bg-gradient-to-b from-gold-700 via-gold-300 to-gold-700",
            isLeft ? "right-0" : "left-0"
          )}
        />
        {/* door handle */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2",
            isLeft ? "right-5 sm:right-14" : "left-5 sm:left-14"
          )}
        >
          <div className="mx-auto h-24 w-[2.5px] rounded-full bg-gradient-to-b from-gold-600 via-gold-200 to-gold-600 opacity-90 sm:h-44" />
          <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold-200 bg-maroon-800 shadow-[0_0_12px_rgba(217,185,104,0.5)] sm:h-4 sm:w-4" />
        </div>

        {/* frieze — lotus row */}
        <div className="absolute inset-x-0 top-[44px] flex justify-center gap-2 opacity-80 sm:top-[60px] sm:gap-4">
          <Lotus className="h-3.5 w-5 text-gold-400 sm:h-4 sm:w-6" />
          <Lotus className="h-3.5 w-5 text-gold-400 sm:h-4 sm:w-6" />
          <Lotus className="h-3.5 w-5 text-gold-400 sm:h-4 sm:w-6" />
        </div>

        {/* engraved names — the cover of the invitation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-2 sm:gap-6 sm:px-4">
          <MonogramSeal
            letters={isLeft ? wedding.monogramLeft : wedding.monogramRight}
            className="h-16 w-16 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
            letterClassName="text-2xl sm:text-3xl lg:text-4xl"
          />
          <p className="engraved max-w-[86%] text-center font-engraved text-[clamp(0.72rem,2.9vw,2.05rem)] leading-[1.5] tracking-[0.16em] pl-[0.16em] sm:tracking-[0.32em] sm:pl-[0.32em]">
            {(isLeft ? wedding.groom.name : wedding.bride.name).toUpperCase()}
          </p>
          <div className="h-px w-14 gold-hairline sm:w-16" />
          <p className="text-center font-script text-[1.05rem] text-gold-300/90 sm:text-2xl">
            Wedding Invitation
          </p>
        </div>

        {/* base inscription */}
        <p className="absolute inset-x-0 bottom-[44px] px-2 text-center font-caps text-[0.5rem] uppercase leading-[2] tracking-[0.28em] pl-[0.28em] text-gold-400/70 sm:bottom-[64px] sm:text-[0.62rem] sm:tracking-[0.5em] sm:pl-[0.5em]">
          Shubha Kalyanam
        </p>

        {/* moving sheen + grain */}
        <div className="door-sheen pointer-events-none absolute inset-0" />
        <div className="noise-overlay pointer-events-none absolute inset-0" />
      </div>
    </motion.div>
  );
}

export default function TempleOpening() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  /* sacred light spilling from the seam */
  const seamGlow = useTransform(scrollYProgress, [0, 0.35, 0.7], [0.15, 0.85, 0.35]);
  const seamWidth = useTransform(scrollYProgress, [0, 0.6], ["2%", "85%"]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative"
      style={{ height: "260vh" }}
      aria-label="Wedding invitation"
    >
      <div className="vh-full sticky top-0 overflow-hidden">
        {/* the invitation behind the doors */}
        <Hero progress={scrollYProgress} />

        {/* golden light through the opening seam */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2 mix-blend-screen"
          style={{ opacity: seamGlow, width: seamWidth }}
          aria-hidden="true"
        >
          <div className="h-full w-full bg-[radial-gradient(closest-side,rgba(255,224,150,0.5),rgba(215,160,80,0.18)_55%,rgba(215,160,80,0)_78%)]" />
        </motion.div>

        {/* the twin temple doors */}
        <div
          className="absolute inset-0 z-20 flex"
          style={{ perspective: reduced ? undefined : 1500 }}
        >
          <Door side="left" progress={scrollYProgress} reduced={!!reduced} />
          <Door side="right" progress={scrollYProgress} reduced={!!reduced} />
        </div>

        {/* invitation to scroll */}
        <motion.div
          className="absolute inset-x-0 bottom-[max(1.6rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2.5 px-8"
          style={{ opacity: hintOpacity }}
        >
          <Lotus className="h-5 w-7 text-gold-300/90" />
          <span className="max-w-md text-center font-caps text-[0.55rem] uppercase leading-[2] tracking-[0.3em] pl-[0.3em] text-gold-100/85 sm:text-[0.68rem] sm:tracking-[0.45em] sm:pl-[0.45em]">
            Scroll to unveil the invitation
          </span>
          <ChevronDown className="h-4 w-4 animate-drift text-gold-300" />
        </motion.div>

        {/* soft top shading while doors are closed */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-maroon-950/85 to-transparent" />
      </div>
    </section>
  );
}
