import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { ChevronDown } from "lucide-react";

import { images, wedding } from "../data";

import {
  Divider,
  GoldFrame,
  MonogramSeal,
} from "./Ornaments";

export default function Hero({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();

  /* =========================================================
     PARALLAX + REVEAL
  ========================================================= */

  const bgScale = useTransform(
    progress,
    [0, 1],
    reduced ? [1, 1] : [1.22, 1]
  );

  const bgY = useTransform(
    progress,
    [0, 1],
    reduced ? ["0%", "0%"] : ["-3%", "2%"]
  );

  const contentOpacity = useTransform(
    progress,
    [0.18, 0.5],
    [0, 1]
  );

  const contentY = useTransform(
    progress,
    [0.18, 0.55],
    reduced ? [0, 0] : [42, 0]
  );

  const glowOpacity = useTransform(
    progress,
    [0.08, 0.55, 1],
    [0, 0.85, 0.6]
  );

  const cueOpacity = useTransform(
    progress,
    [0.82, 0.97],
    [0, 1]
  );


  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* =====================================================
          HERO IMAGE
      ===================================================== */}

      <motion.div
        className="absolute inset-0"
        style={{
          scale: bgScale,
          y: bgY,
        }}
      >
        <img
          src={images.coupleHero}
          alt="Karthik and Meenakshi in the temple corridor, dressed for their wedding"
          className="
            h-full
            w-full
            object-cover
            object-center
          "
          loading="eager"
        />
      </motion.div>


      {/* =====================================================
          CINEMATIC GRADING
      ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-maroon-950/82
          via-maroon-950/42
          to-maroon-950/92
        "
      />

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(90%_65%_at_50%_45%,rgba(0,0,0,0)_30%,rgba(16,3,7,0.72)_100%)]
        "
      />


      {/* =====================================================
          LIVING GOLDEN LIGHT
      ===================================================== */}

      <motion.div
        className="
          absolute
          inset-0
          mix-blend-screen
        "
        style={{
          opacity: glowOpacity,
        }}
        aria-hidden="true"
      >
        <div
          className="
            animate-soft-glow
            absolute
            left-1/2
            top-[8%]
            h-[55vh]
            w-[85vw]
            -translate-x-1/2
            rounded-full
            bg-[radial-gradient(closest-side,rgba(240,200,120,0.28),rgba(240,200,120,0)_70%)]
          "
        />
      </motion.div>


      {/* =====================================================
          ORNAMENTAL FRAME
      ===================================================== */}

      <GoldFrame
        inset="inset-3 sm:inset-5 lg:inset-7"
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-3
          z-30
          flex
          justify-center
          sm:top-5
          lg:top-7
        "
      >
        <MonogramSeal
          letters={`${wedding.monogramLeft}·${wedding.monogramRight}`}
          className="
            h-11
            w-11
            -translate-y-1/2
            sm:h-14
            sm:w-14
          "
          letterClassName="
            text-[0.8rem]
            sm:text-base
          "
        />
      </div>


      {/* =====================================================
          SCROLL DOWN
      ===================================================== */}

      <motion.div
        className="
          absolute
          inset-x-0
          bottom-[max(1.5rem,env(safe-area-inset-bottom))]
          z-30
          flex
          flex-col
          items-center
          gap-2
        "
        style={{
          opacity: cueOpacity,
        }}
        aria-label="Scroll down to continue"
      >

        {/* TEXT */}

        <motion.span
          className="
            font-serif
            text-[10px]
            uppercase
            tracking-[0.35em]
            text-gold-200/90
            drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]
            sm:text-xs
          "
          animate={
            reduced
              ? {}
              : {
                  opacity: [0.55, 1, 0.55],
                }
          }
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Scroll Down
        </motion.span>


        {/* LINE */}

        <motion.span
          className="
            scroll-line
            block
            h-8
            w-px
            bg-gradient-to-b
            from-gold-300/80
            to-gold-400/10
          "
          animate={
            reduced
              ? {}
              : {
                  scaleY: [0.6, 1, 0.6],
                  opacity: [0.4, 1, 0.4],
                }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "top",
          }}
        />


        {/* ARROW */}

        <motion.div
          animate={
            reduced
              ? {}
              : {
                  y: [0, 6, 0],
                }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown
            className="
              h-5
              w-5
              text-gold-300/90
              drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]
            "
          />
        </motion.div>

      </motion.div>

    </div>
  );
}