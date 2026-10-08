import { useMemo } from "react";

import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { ChevronDown } from "lucide-react";

import { images, wedding } from "../data";

import { GoldFrame, MonogramSeal } from "./Ornaments";

/* =========================================================
   TEXT
========================================================= */

const TAGLINE = "Together with their families";

const NAME_WORDS = [
  "Karthik",
  "&",
  "Meenakshi",
];

const SUBLINE = "Invite you to celebrate their wedding";


/* =========================================================
   FONTS
========================================================= */

const TITLE_FONT =
  '"Cinzel Decorative", "Cormorant Garamond", Georgia, serif';

const BODY_FONT =
  '"Cormorant Garamond", Georgia, serif';


/* =========================================================
   GOLD DUST
========================================================= */

const DUST_COUNT = 18;


const makeDust = (count: number) =>
  Array.from(
    { length: count },
    () => ({
      x: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 9 + Math.random() * 9,
      delay: -Math.random() * 14,
      drift: (Math.random() - 0.5) * 80,
      peak: 0.35 + Math.random() * 0.5,
    })
  );


/* =========================================================
   LETTER REVEAL
========================================================= */

function Letter({
  char,
  index,
  total,
  progress,
  reduced,
}: {
  char: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const start =
    0.24 + (index / total) * 0.26;

  const end = start + 0.14;

  const opacity = useTransform(
    progress,
    [start, end],
    [0, 1]
  );

  const y = useTransform(
    progress,
    [start, end],
    reduced ? [0, 0] : [26, 0]
  );

  const filter = useTransform(
    progress,
    [start, end],
    reduced
      ? ["blur(0px)", "blur(0px)"]
      : ["blur(10px)", "blur(0px)"]
  );

  return (
    <motion.span
      className="inline-block"
      style={{
        opacity,
        y,
        filter,
      }}
      aria-hidden="true"
    >
      {char}
    </motion.span>
  );
}


/* =========================================================
   HERO
========================================================= */

export default function Hero({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const reduced = !!useReducedMotion();

  const dust = useMemo(
    () =>
      makeDust(
        reduced
          ? 0
          : DUST_COUNT
      ),
    [reduced]
  );


  /* =======================================================
     SCROLL ANIMATION
  ======================================================= */

  const bgScale = useTransform(
    progress,
    [0, 1],
    reduced ? [1, 1] : [1.22, 1]
  );

  const bgY = useTransform(
    progress,
    [0, 1],
    reduced
      ? ["0%", "0%"]
      : ["-3%", "2%"]
  );

  const bgBlur = useTransform(
    progress,
    [0, 0.45],
    reduced
      ? ["blur(0px)", "blur(0px)"]
      : ["blur(12px)", "blur(0px)"]
  );


  /* =======================================================
     CINEMA BARS
  ======================================================= */

  const barScale = useTransform(
    progress,
    [0, 0.4],
    reduced ? [0, 0] : [1, 0]
  );


  /* =======================================================
     GOLD LIGHT
  ======================================================= */

  const flareX = useTransform(
    progress,
    [0.25, 0.85],
    reduced
      ? ["-60vw", "-60vw"]
      : ["-60vw", "140vw"]
  );

  const flareOpacity = useTransform(
    progress,
    [0.25, 0.4, 0.75, 0.85],
    [0, 1, 1, 0]
  );

  const glowOpacity = useTransform(
    progress,
    [0.08, 0.55, 1],
    [0, 0.85, 0.6]
  );


  /* =======================================================
     TITLE
  ======================================================= */

  const contentY = useTransform(
    progress,
    [0.18, 0.7],
    reduced ? [0, 0] : [40, 0]
  );

  const taglineOpacity = useTransform(
    progress,
    [0.18, 0.4],
    [0, 1]
  );

  const lineScale = useTransform(
    progress,
    [0.5, 0.75],
    [0, 1]
  );

  const sublineOpacity = useTransform(
    progress,
    [0.7, 0.9],
    [0, 1]
  );


  /* =======================================================
     SCROLL CUE
  ======================================================= */

  const cueOpacity = useTransform(
    progress,
    [0.82, 0.97],
    [0, 1]
  );


  /* =======================================================
     LETTER COUNT
  ======================================================= */

  const totalLetters =
    NAME_WORDS.reduce(
      (n, word) => n + word.length,
      0
    );

  let offset = 0;


  return (
    <div
      className="
        absolute
        inset-0
        overflow-hidden
        bg-maroon-950
      "
    >

      {/* ===================================================
          HERO IMAGE
      =================================================== */}

      <motion.div
        className="
          absolute
          inset-0
          will-change-transform
        "
        style={{
          scale: bgScale,
          y: bgY,
          filter: bgBlur,
        }}
      >

        <motion.div
          className="
            absolute
            inset-0
          "
          animate={
            reduced
              ? {}
              : {
                  scale: [1, 1.06, 1],
                }
          }
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
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

              sm:object-center

              md:object-center

              lg:object-center
            "
            loading="eager"
          />

        </motion.div>

      </motion.div>


      {/* ===================================================
          CINEMATIC GRADING
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-maroon-950/85
          via-maroon-950/40
          to-maroon-950/95
        "
      />


      <motion.div
        className="
          absolute
          inset-0
          bg-[radial-gradient(90%_65%_at_50%_45%,rgba(0,0,0,0)_30%,rgba(16,3,7,0.72)_100%)]
        "
        animate={
          reduced
            ? {}
            : {
                opacity: [
                  0.85,
                  1,
                  0.85,
                ],
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      {/* ===================================================
          GOLDEN GLOW
      =================================================== */}

      <motion.div
        className="
          pointer-events-none
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

            top-[5%]

            h-[45vh]
            w-[100vw]

            -translate-x-1/2

            rounded-full

            bg-[radial-gradient(closest-side,rgba(240,200,120,0.28),rgba(240,200,120,0)_70%)]

            sm:top-[8%]
            sm:h-[55vh]
            sm:w-[85vw]
          "
        />

      </motion.div>


      {/* ===================================================
          LIGHT SWEEP
      =================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
          mix-blend-screen
        "
        style={{
          opacity: flareOpacity,
        }}
        aria-hidden="true"
      >

        <motion.div
          className="
            absolute

            -top-[30%]
            left-0

            h-[160%]
            w-[55vw]

            -skew-x-12

            bg-gradient-to-r
            from-transparent
            via-gold-200/20
            to-transparent

            blur-xl

            sm:w-[38vw]
          "
          style={{
            x: flareX,
          }}
        />

      </motion.div>


      {/* ===================================================
          GOLD DUST
      =================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
        aria-hidden="true"
      >

        {dust.map((p, i) => (
          <motion.span
            key={i}
            className="
              absolute
              bottom-0
              rounded-full
              bg-gold-200
            "
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              boxShadow:
                "0 0 8px rgba(244,213,140,0.9), 0 0 18px rgba(217,173,91,0.45)",
            }}
            initial={{
              y: 0,
              x: 0,
              opacity: 0,
            }}
            animate={{
              y: [
                "0vh",
                "-105vh",
              ],
              x: [
                0,
                p.drift,
              ],
              opacity: [
                0,
                p.peak,
                p.peak,
                0,
              ],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

      </div>


      {/* ===================================================
          TITLE
      =================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-x-0

          bottom-[18%]

          z-20

          flex
          flex-col
          items-center

          px-4

          text-center

          sm:bottom-[20%]
          sm:px-6

          md:bottom-[21%]

          lg:bottom-[22%]
        "
        style={{
          y: contentY,
        }}
      >

        {/* TAGLINE */}

        <motion.p
          className="
            max-w-[90vw]

            font-serif

            text-[9px]
            uppercase

            leading-relaxed

            tracking-[0.22em]

            text-gold-200/90

            drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]

            sm:text-[10px]
            sm:tracking-[0.3em]

            md:text-xs

            lg:tracking-[0.35em]
          "
          style={{
            opacity: taglineOpacity,
            fontFamily: BODY_FONT,
          }}
        >
          {TAGLINE}
        </motion.p>


        {/* =================================================
            NAMES
        ================================================= */}

        <h1
          className="
            mt-3

            flex
            max-w-[95vw]

            flex-col
            items-center

            text-center

            text-[clamp(2rem,10vw,4.5rem)]

            font-bold

            leading-[1.08]

            tracking-[0.035em]

            text-gold-200

            drop-shadow-[0_4px_20px_rgba(0,0,0,0.75)]

            sm:mt-4

            sm:text-[clamp(2.8rem,8vw,5rem)]

            md:text-[clamp(3.5rem,7vw,5.5rem)]

            lg:flex-row
            lg:gap-6
            lg:text-[clamp(4rem,6vw,7rem)]

            xl:gap-8
          "
          style={{
            fontFamily: TITLE_FONT,
          }}
          aria-label={NAME_WORDS.join(" ")}
        >

          {NAME_WORDS.map(
            (word, wi) => {
              const wordOffset =
                offset;

              offset += word.length;

              return (
                <span
                  key={wi}
                  className="
                    block
                    whitespace-nowrap
                  "
                >
                  {word
                    .split("")
                    .map(
                      (ch, ci) => (
                        <Letter
                          key={ci}
                          char={ch}
                          index={
                            wordOffset +
                            ci
                          }
                          total={
                            totalLetters
                          }
                          progress={
                            progress
                          }
                          reduced={
                            reduced
                          }
                        />
                      )
                    )}
                </span>
              );
            }
          )}

        </h1>


        {/* =================================================
            GOLD DIVIDER
        ================================================= */}

        <motion.span
          className="
            mt-4

            block
            h-px

            w-24

            bg-gradient-to-r
            from-transparent
            via-gold-300
            to-transparent

            sm:mt-5
            sm:w-40

            md:w-52

            lg:mt-6
            lg:w-64
          "
          style={{
            scaleX: lineScale,
          }}
        />


        {/* =================================================
            SUBLINE
        ================================================= */}

        <motion.p
          className="
            mt-3

            max-w-[88vw]

            text-[13px]

            italic

            leading-relaxed

            tracking-wide

            text-gold-100/90

            drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]

            sm:mt-4
            sm:text-base

            md:text-lg

            lg:text-xl
          "
          style={{
            opacity: sublineOpacity,
            fontFamily: BODY_FONT,
          }}
        >
          {SUBLINE}
        </motion.p>

      </motion.div>


      {/* ===================================================
          CINEMA TOP BAR
      =================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-10

          h-[9vh]
          min-h-[42px]
          max-h-[100px]

          origin-top

          bg-maroon-950

          sm:h-[12vh]

          md:h-[13vh]

          lg:h-[14vh]
        "
        style={{
          scaleY: barScale,
        }}
        aria-hidden="true"
      />


      {/* ===================================================
          CINEMA BOTTOM BAR
      =================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          z-10

          h-[9vh]
          min-h-[42px]
          max-h-[100px]

          origin-bottom

          bg-maroon-950

          sm:h-[12vh]

          md:h-[13vh]

          lg:h-[14vh]
        "
        style={{
          scaleY: barScale,
        }}
        aria-hidden="true"
      />


      {/* ===================================================
          ORNAMENTAL FRAME
      =================================================== */}

      <GoldFrame
        inset="
          inset-2
          sm:inset-3
          md:inset-5
          lg:inset-7
        "
      />


      {/* ===================================================
          MONOGRAM
      =================================================== */}

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

          md:top-6

          lg:top-7
        "
      >

        <MonogramSeal
          letters={`${wedding.monogramLeft}·${wedding.monogramRight}`}
          className="
            h-9
            w-9

            -translate-y-1/2

            sm:h-11
            sm:w-11

            md:h-14
            md:w-14
          "
          letterClassName="
            text-[0.65rem]

            sm:text-[0.8rem]

            md:text-base
          "
        />

      </div>


      {/* ===================================================
          SCROLL DOWN
      =================================================== */}

      <motion.div
        className="
          absolute
          inset-x-0

          bottom-[max(0.75rem,env(safe-area-inset-bottom))]

          z-30

          flex
          flex-col
          items-center
          gap-1.5

          px-4

          sm:gap-2
          sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))]

          md:bottom-[max(1.5rem,env(safe-area-inset-bottom))]
        "
        style={{
          opacity: cueOpacity,
        }}
        aria-label="Scroll down to continue"
      >

        <motion.span
          className="
            font-serif

            text-[8px]

            uppercase

            tracking-[0.25em]

            text-gold-200/90

            drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]

            sm:text-[10px]
            sm:tracking-[0.3em]

            md:text-xs
          "
          animate={
            reduced
              ? {}
              : {
                  opacity: [
                    0.55,
                    1,
                    0.55,
                  ],
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


        <motion.span
          className="
            scroll-line

            block

            h-5
            w-px

            bg-gradient-to-b
            from-gold-300/80
            to-gold-400/10

            sm:h-7

            md:h-8
          "
          animate={
            reduced
              ? {}
              : {
                  scaleY: [
                    0.6,
                    1,
                    0.6,
                  ],
                  opacity: [
                    0.4,
                    1,
                    0.4,
                  ],
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


        <motion.div
          animate={
            reduced
              ? {}
              : {
                  y: [
                    0,
                    6,
                    0,
                  ],
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
              h-4
              w-4

              text-gold-300/90

              drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]

              sm:h-5
              sm:w-5
            "
          />

        </motion.div>

      </motion.div>

    </div>
  );
}