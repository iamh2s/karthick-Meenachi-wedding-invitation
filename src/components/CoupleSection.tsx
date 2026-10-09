
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

import { images, wedding } from "../data";
import { Corner, Divider, MonogramSeal } from "./Ornaments";
import { Reveal, RevealImage, SectionHeading } from "./Reveal";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------------ */
/* Memory Reel                                                         */
/* ------------------------------------------------------------------ */

const REEL_PHOTOS: (string | undefined)[] = [
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537758/QbnRb1RjkaDAeC5ZtxV6KgrKTOmC9DPuo65U2U4BasdUr0KUVNul_u4bLbPo97zQnnIqJUnFci_ANmYoUFHFvOWUvtR52VPe6nKjpC7KQ79GMjxmuGcatojqQu9qAamSUQa16zc__566UxasJn1Q72IyhsPHoaRncZpWQNQJuR_ccjEsqZdtJ6wjVKznIBbB.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537707/wq6of5OUq5GAnXnmOfBbiF6tXP3aimrt4Ixn585uk7wq-eMNJFv3PALQ6RBn73LA1wW6A5LSKLF74Q_phEpLm_YLSCIuqQt3qncjv1VdTOLZsQgkLWfairyoS7YG2Gy1D14YfxaH-NaSRgf45TFiTiu5MkqbI1Bc1vMU1zSwq5ssWv67YPSNY9gdcCUEfHzf.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537647/ftbxBzE0Xd_n98n8i0ZhFKtnDFro9IhklKH7Q7Jzl8R9PqJa1vzFR8C5xt_5Y4CtanDB1uNjwqSNBtcvesp9dIYjKs7f5Bkxf5JUWyfSzYK94S61zIQ-SwxynBPWDVkBF4Iq2Aa3NyjaxBa7Zjdtn7GmfLfP5Wg8Uw9zcTZHr_7nAdmLJ4Vs4J4VsmkboIXo.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537617/ub44PYHSJr8il0rYR0d4tyPur1W61gNdJKmRlzNycBR75o4jnhiz_u_lkvWh835UyGhqGMTf2OmAjynRWZaBH3Pt8V5rLXcCqjnCRADHnuxU7nsKxuNuQP6xJlzrZGOQxbrM57fbdNor4K2uMn16sTyiU6ChoD-R0RZ3Q4pFKBPHqoeI5SZtPDOrHekdB2D2.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537565/4WMynmdvr9xZAjTlPDRdJCk9-ph9Zzn21gsllH-p2xF_RrAYDTljLOfY7fnfXsHRt7KzXJA8Swya4BNPEPcLZmyKo8-_aEZh1VeGnaMw1c-YUrUulJTZ7--G9eT3g0CSxXzmxlRmRQaFmdpBR-Q2wrckWl_0-bDTWyjOTLExV12BabFyKboqhCMdp6ZQHmvF.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537530/e_fJ82uNZvrdbJ-BlWjGYOtP5USgW_T8Urh1pA6RfqW1hGV7pvf-zz6Ioqa-RTauRoEUOmy_4yGr_BYwgO_wSKKByhEUFHgAkVNJQiWqyjaiW9KbaTFCH65QCSqojQdK_3gOgI_7XpFbFdtE3ibaRCaWYYdJjKnH4uWHxOhY3V4VTrUtcVWLfwSXrhWLHtcT.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537450/A7llXuZfAdqb1Ks7qi3j10FiEBz22kdhYZGxH_utkVk0Kof8QLedjI-YLxEpi0-herOjrZ4RpmP5zSpwkFTZIGSiVkCOfn-LzMcFjsIZuCzfCAf5ZtWHdsnIVMw3tyUe0E-qbzwoyOAycjPLLLuIIAMqLzA34-9HNEKtRhoSnNa8232yCst5j9vHzxixs0Om.jpg",
  "https://res.cloudinary.com/kpkj3xqw/image/upload/v1791537358/FS-_Dqxi3RO_Gsgvn9U0Qlix-9B97T-jsR-kFqUbQNMSzjKB3VcQKXMFBXdMSFgDvE9d2_HRvPWfINVQj0xKumEF4P6b8BbLKv_ItGW25_5_T2pG7wFbxilCV2nVIq8j-mlwe0hEhCZDZ0O4REW-1MJU6-spWhlCqPmthup6Jsz45RxDQPL_-Pk36dOYwGB_.jpg",
];

const FRAME_EMOJI = ["💍", "🌸", "🪔", "💐", "💞", "🕊️", "✨", "🎞️"];
const FRAMES = FRAME_EMOJI.length;

const GOLD = "#c9a24b";
const BAND_BG =
  "linear-gradient(180deg,#3f0b17,#2b0710 50%,#3f0b17)";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const GAP = 14;
const PERF_H = 16;
const EDGE_H = 14;
const BAND_CHROME =
  2 * (PERF_H + 12) + 2 * EDGE_H + 20 + 3;

const DONE_AT = 0.97;

const KEYFRAMES = `
@keyframes reel-weave {
  0% { transform: translate3d(0,-1.5px,0) rotate(-0.12deg); }
  50% { transform: translate3d(0,1px,0) rotate(0.1deg); }
  100% { transform: translate3d(0,-0.5px,0) rotate(-0.06deg); }
}

@keyframes reel-flicker {
  0% { opacity: 1; }
  50% { opacity: .955; }
  100% { opacity: 1; }
}
`;

const PERF = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 16' preserveAspectRatio='none'><rect x='4' y='2.5' width='18' height='11' rx='2.6' fill='%23f3e2b4' fill-opacity='.9'/><rect x='4' y='2.5' width='18' height='11' rx='2.6' fill='none' stroke='%23000' stroke-opacity='.35' stroke-width='1'/></svg>")`;

const clamp = (n: number, lo: number, hi: number) =>
  n < lo ? lo : n > hi ? hi : n;

const soft = (p: number) => {
  const t = clamp(p, 0, 1);
  const s = t * t * (3 - 2 * t);
  return t * 0.45 + s * 0.55;
};

const HEAD_RESERVE = 190;
const TILT_DEG = -2;

/* --------------------------- Reel pieces ---------------------------- */

function Perfs({ width }: { width: number }) {
  const size = width / (FRAMES * 3);

  return (
    <div
      aria-hidden
      style={{
        height: PERF_H,
        margin: "6px 0",
        backgroundImage: PERF,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${size}px ${PERF_H}px`,
      }}
    />
  );
}

function Frame({
  src,
  emoji,
  index,
  fw,
  fh,
}: {
  src?: string;
  emoji: string;
  index: number;
  fw: number;
  fh: number;
}) {
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{
        position: "relative",
        width: fw,
        height: fh,
        borderRadius: 2,
        border: "1px solid rgba(243,226,180,.7)",
        background: "linear-gradient(160deg,#6d1a2c,#2a0711)",
        boxShadow:
          "inset 0 0 14px rgba(43,7,16,.45), 0 0 0 2px #4a0f1e",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={
            index === 0
              ? "Lord Shiva and Goddess Parvati together"
              : `Memory ${index + 1}`
          }
          draggable={false}
          decoding="async"
          loading="eager"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center"
          style={{ fontSize: fw * 0.38 }}
        >
          {emoji}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Film grain ---------------------------- */

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 .9 0 0 0 0 .7 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function EdgePrint({
  fw,
  flip,
}: {
  fw: number;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="flex items-center font-display uppercase"
      style={{
        height: EDGE_H,
        gap: GAP,
        padding: `0 ${GAP / 2}px`,
        fontSize: Math.max(7, Math.min(10, fw * 0.05)),
        letterSpacing: "0.22em",
        color: "rgba(255,196,92,.8)",
        whiteSpace: "nowrap",
      }}
    >
     {FRAME_EMOJI.map((_, i) => {
  const number = FRAMES - i;

  return (
    <span
      key={i}
      className="flex shrink-0 items-center justify-between"
      style={{ width: fw }}
    >
      <span>
        {flip
          ? `${String(number).padStart(2, "0")}A ◂`
          : `▸ ${String(number).padStart(2, "0")}`}
      </span>

      <span style={{ opacity: 0.7 }}>
        {flip ? "35" : "400"}
      </span>
    </span>
  );
})}
    </div>
  );
}

/* ------------------------ Complete film reel ------------------------ */

const Film = memo(function Film({
  fw,
  fh,
  width,
  live,
}: {
  fw: number;
  fh: number;
  width: number;
  live: boolean;
}) {
  return (
    <div
      style={{
        width,
        animation: live
          ? "reel-weave 2.6s ease-in-out infinite alternate"
          : undefined,
        willChange: live ? "transform" : undefined,
      }}
    >
      {/* Rounded filmstrip ends */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width,
          background: BAND_BG,

          border: `1.5px solid ${GOLD}`,
          borderRadius: 40,

          boxShadow:
            "0 18px 44px rgba(63,11,23,.35), 0 0 36px rgba(201,162,75,.22)",

          backfaceVisibility: "hidden",

          animation: live
            ? "reel-flicker 0.14s steps(1) infinite"
            : undefined,
        }}
      >
        <Perfs width={width} />

        <EdgePrint fw={fw} />

        <div
          className="flex items-center"
          style={{
            gap: GAP,
            padding: `10px ${GAP / 2}px`,
          }}
        >
          {FRAME_EMOJI.map((emoji, i) => (
            <Frame
              key={i}
              src={REEL_PHOTOS[i]}
              emoji={emoji}
              index={i}
              fw={fw}
              fh={fh}
            />
          ))}
        </div>

        <EdgePrint fw={fw} flip />

        <Perfs width={width} />

        {/* Subtle film grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN,
            opacity: 0.07,
          }}
        />

        {/* Soft golden film reflection */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg,rgba(255,240,200,0) 30%,rgba(255,240,200,.07) 48%,rgba(255,240,200,0) 62%)",
          }}
        />
      </div>
    </div>
  );
});

/* ------------------- Card entrance wrapper ------------------- */

type EnterCustom = {
  dir: -1 | 1;
  delay: number;
  reduced: boolean;
};

const ENTER: Variants = {
  out: ({ dir, reduced }: EnterCustom) => ({
    opacity: 0,
    x: reduced ? 0 : dir * 56,
  }),

  in: ({ delay, reduced }: EnterCustom) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: reduced ? 0.3 : 0.7,
      ease: EASE,
      delay: reduced ? 0 : delay,
    },
  }),
};

const Entrance = memo(function Entrance({
  dir,
  show,
  delay = 0,
  reduced,
  className,
  children,
}: {
  dir: -1 | 1;
  show: boolean;
  delay?: number;
  reduced: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.1, once: true });

  const custom = useMemo<EnterCustom>(
    () => ({ dir, delay, reduced }),
    [dir, delay, reduced]
  );

  return (
    <div ref={ref} className={className}>
      <motion.div
        custom={custom}
        initial="out"
        animate={show && seen ? "in" : "out"}
        variants={ENTER}
      >
        {children}
      </motion.div>
    </div>
  );
});

/* ----------------------------- Portrait ----------------------------- */

const TEXT_VARIANTS: Record<"normal" | "reduced", Variants> = {
  normal: {
    out: { opacity: 0, y: 10 },
    in: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.25,
        duration: 0.5,
      },
    },
  },

  reduced: {
    out: { opacity: 1, y: 0 },
    in: { opacity: 1, y: 0 },
  },
};

const PortraitCard = memo(function PortraitCard({
  side,
  className,
}: {
  side: "groom" | "bride";
  className?: string;
}) {
  const reduced = !!useReducedMotion();

  const text = reduced
    ? TEXT_VARIANTS.reduced
    : TEXT_VARIANTS.normal;

  const person = wedding[side];

  const img =
    side === "groom"
      ? images.groomImg
      : images.brideImg;

  return (
    <article
      className={cn(
        "ornate-border velvet-panel group relative p-4 pb-8 sm:p-6 sm:pb-10",
        className
      )}
    >
      <RevealImage className="relative">
        <div className="relative overflow-hidden">
          <img
            src={img}
            alt={`Portrait of ${person.fullName}`}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:scale-[1.04]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/55 via-transparent to-maroon-950/15" />

          <Corner className="absolute top-2 left-2 h-6 w-6 text-gold-300/90" />

          <Corner className="absolute top-2 right-2 h-6 w-6 rotate-90 text-gold-300/90" />
        </div>
      </RevealImage>

      <motion.div
        variants={text}
        className="mt-7 text-center sm:mt-8"
      >
        <p className="kicker">
          {side === "groom" ? "The Groom" : "The Bride"}
        </p>

        <h3 className="text-gold mt-4 text-balance font-display text-[1.85rem] font-semibold tracking-wide sm:text-4xl">
          {person.fullName}
        </h3>

        <p className="mx-auto mt-3 max-w-xs text-pretty font-body text-sm italic leading-relaxed text-ivory-300/85">
          {person.parents}
        </p>

        <Divider className="mt-6" tone="text-gold-500" />

        <p className="mx-auto mt-6 max-w-sm text-pretty font-body text-[0.95rem] leading-[1.85] text-ivory-200/78">
          {person.blurb}
        </p>
      </motion.div>
    </article>
  );
});

/* ------------------------------ Section ----------------------------- */

export default function CoupleSection() {
  const reduced = !!useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({
    w: 1280,
    h: 800,
  });

  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  // Responsive viewport measurement.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let raf = 0;

    const apply = () => {
      raf = 0;

      const w = Math.round(el.clientWidth) || 1280;
      const h = Math.round(el.clientHeight) || 800;

      setSize((s) =>
        Math.abs(s.w - w) < 4 &&
        Math.abs(s.h - h) < 80
          ? s
          : { w, h }
      );
    };

    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(apply);
    });

    ro.observe(el);
    apply();

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Warm up couple portrait images.
  useEffect(() => {
    const t = window.setTimeout(() => {
      [images.groomImg, images.brideImg].forEach((src) => {
        const im = new Image();
        im.decoding = "async";
        im.src = src;
        im.decode?.().catch(() => undefined);
      });
    }, 200);

    return () => window.clearTimeout(t);
  }, []);

  /* --------------------------------------------------------------- */
  /* Larger responsive reel                                          */
  /* --------------------------------------------------------------- */

  const { w: vw, h: vh } = size;

  const fwByWidth =
    vw < 768
      ? Math.min(Math.round(vw * 0.55), 260)
      : Math.max(
          180,
          Math.min(300, Math.floor((vw - 40) / FRAMES - GAP))
        );

  const reserve =
    vw < 768
      ? HEAD_RESERVE - 30
      : HEAD_RESERVE;

  const fhMax = Math.max(
    120,
    Math.floor(
      Math.min(
        vh - reserve - BAND_CHROME - 20,
        vh * 0.62
      )
    )
  );

  const fw = Math.max(
    100,
    Math.min(fwByWidth, Math.floor((fhMax * 3) / 4))
  );

  const fh = Math.round((fw * 4) / 3);

  const S = FRAMES * (fw + GAP);
  const travel = vw + S;

  const runwayH = reduced
    ? 64
    : Math.round(
        clamp(travel * 0.7, vh * 0.9, vh * 2.2)
      );

  /* ------------------------- Scroll animation --------------------- */

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start 0.9", "end 0.3"],
  });

  const filmX = useTransform(
    scrollYProgress,
    (p) => -S + travel * soft(p)
  );

  const filmOpacity = useTransform(
    scrollYProgress,
    (p) => {
      if (p < 0.03) return p / 0.03;
      if (p > 0.97) return Math.max(0, (1 - p) / 0.03);
      return 1;
    }
  );

  // Reveal the couple when the reel finishes.
  useMotionValueEvent(
    scrollYProgress,
    "change",
    (p) => {
      if (!doneRef.current && p >= DONE_AT) {
        doneRef.current = true;
        setDone(true);
      }
    }
  );

  useEffect(() => {
    if (
      !doneRef.current &&
      (reduced || scrollYProgress.get() >= DONE_AT)
    ) {
      doneRef.current = true;
      setDone(true);
    }
  }, [reduced, scrollYProgress]);

  const groomCard = useMemo(
    () => (
      <Reveal>
        <PortraitCard side="groom" />
      </Reveal>
    ),
    []
  );

  const brideCard = useMemo(
    () => (
      <Reveal delay={0.1}>
        <PortraitCard side="bride" />
      </Reveal>
    ),
    []
  );

  /* ------------------------------ Render -------------------------- */

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="story-heading"
    >
      <style>{KEYFRAMES}</style>

      {/* Subtle temple-green glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(23,52,35,0.32),rgba(23,52,35,0)_70%)]"
        aria-hidden="true"
      />

      <div
        className="grid"
        style={{ overflowX: "clip" }}
      >
        {/* Filmstrip stage */}
        <div
          ref={stageRef}
          aria-hidden="true"
          className="pointer-events-none sticky top-0 z-0 self-start overflow-hidden"
          style={{
            gridArea: "1 / 1",
            height: "100svh",
            contain: "layout paint",
          }}
        >
          {reduced ? (
            <div
              className="absolute left-1/2"
              style={{
                top: `calc(50% + ${reserve / 2}px)`,
                transform: "translate(-50%,-50%)",
              }}
            >
              <Film
                fw={fw}
                fh={fh}
                width={S}
                live={false}
              />
            </div>
          ) : (
            <motion.div
              className="absolute left-0"
              style={{
                top: `calc(50% + ${reserve / 2}px)`,
                x: filmX,
                y: "-50%",
                rotate: TILT_DEG,
                opacity: filmOpacity,
                width: S,
                willChange: "transform, opacity",
              }}
            >
              <Film
                fw={fw}
                fh={fh}
                width={S}
                live={inView}
              />
            </motion.div>
          )}
        </div>

        {/* Main section content */}
        <div
          className="relative z-10 min-w-0"
          style={{ gridArea: "1 / 1" }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="relative">
              <div className="sticky top-16 z-20 sm:top-20">
                <SectionHeading
                  kicker="Two souls, one journey"
                  title="The Bride & Groom"
                />
              </div>

              {/* Scroll runway */}
              <div
                ref={runwayRef}
                aria-hidden="true"
                style={{ height: runwayH }}
              />
            </div>

            {/* Couple cards */}
            <div className="relative grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.6,
                  }}
                  animate={
                    done
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.6 }
                  }
                  transition={{
                    duration: 0.5,
                    delay: done && !reduced ? 0.5 : 0,
                  }}
                >
                  <MonogramSeal
                    letters="&"
                    className="h-16 w-16"
                    letterClassName="font-script text-3xl"
                  />
                </motion.div>
              </div>

              <Entrance
                dir={-1}
                show={done}
                reduced={reduced}
              >
                {groomCard}
              </Entrance>

              <Entrance
                dir={1}
                show={done}
                delay={0.1}
                reduced={reduced}
                className="md:mt-16"
              >
                {brideCard}
              </Entrance>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
