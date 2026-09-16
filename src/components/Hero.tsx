import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { images, wedding } from "../data";
import { Divider, GoldFrame, MonogramSeal } from "./Ornaments";

export default function Hero({ progress }: { progress: MotionValue<number> }) {
  const reduced = useReducedMotion();

  /* parallax + reveal driven by the door-opening progress */
  const bgScale = useTransform(progress, [0, 1], reduced ? [1, 1] : [1.22, 1]);
  const bgY = useTransform(progress, [0, 1], reduced ? ["0%", "0%"] : ["-3%", "2%"]);
  const contentOpacity = useTransform(progress, [0.18, 0.5], [0, 1]);
  const contentY = useTransform(progress, [0.18, 0.55], reduced ? [0, 0] : [42, 0]);
  const glowOpacity = useTransform(progress, [0.08, 0.55, 1], [0, 0.85, 0.6]);
  const cueOpacity = useTransform(progress, [0.82, 0.97], [0, 1]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* backdrop image */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale, y: bgY }}>
        <img
          src={images.coupleHero}
          alt="Karthik and Meenakshi in the temple corridor, dressed for their wedding"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </motion.div>

      {/* cinematic grading */}
      <div className="absolute inset-0 bg-gradient-to-b from-maroon-950/82 via-maroon-950/42 to-maroon-950/92" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_65%_at_50%_45%,rgba(0,0,0,0)_30%,rgba(16,3,7,0.72)_100%)]" />

      {/* living golden light */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{ opacity: glowOpacity }}
        aria-hidden="true"
      >
        <div className="animate-soft-glow absolute left-1/2 top-[8%] h-[55vh] w-[85vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,200,120,0.28),rgba(240,200,120,0)_70%)]" />
      </motion.div>

      

      {/* ornamental frame */}
      <GoldFrame inset="inset-3 sm:inset-5 lg:inset-7" />
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center sm:top-5 lg:top-7">
        <MonogramSeal
          letters={`${wedding.monogramLeft}·${wedding.monogramRight}`}
          className="h-11 w-11 -translate-y-1/2 sm:h-14 sm:w-14"
          letterClassName="text-[0.8rem] sm:text-base"
        />
      </div>

      {/* continue cue — appears once doors have opened */}
      <motion.div
        className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2"
        style={{ opacity: cueOpacity }}
        aria-hidden="true"
      >
      
        <span className="scroll-line block h-8 w-px bg-gold-400/30" />
        <ChevronDown className="h-4 w-4 animate-drift text-gold-300/90" />
      </motion.div>
    </div>
  );
}
