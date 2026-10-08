import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CoupleRevealProps {
  onComplete: () => void;
  /**
   * Optional: a single transparent PNG of the couple already holding hands.
   * If given, it cross-fades in at the moment they meet. Without it, the
   * two figures lean toward each other and the hand-clasp is sold with
   * light, shockwaves and hearts at the point where their hands meet.
   */
  joinedSrc?: string;
}

/* ───────────── Timeline (seconds) ─────────────
   0.0  black screen, curtain bars open to a full-screen picture
   0.4  golden light blooms, rays fade in
   0.9  groom & bride glide in from either side (blur → sharp)
   3.7  HANDS JOIN: flash, lens streak, light orb, shock rings,
        burst of hearts + sparks, couple leans in
   3.9  names appear letter by letter
   4.0  heart outline starts drawing around the couple
   4.2  hearts begin floating up through the whole frame
   5.3  heart beats in, divider draws, Tamil line rises
   9.6  outro: slow push-in + fade
   10.6 onComplete
*/
const T = {
  enter: 0.9,
  meet: 3.7,
  names: 3.9,
  heart: 5.3,
  leave: 9.6,
  done: 10.6,
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_CINEMA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HEART_COLORS = ["#ff5a7a", "#ff8fa3", "#e8b94f", "#ffd98a", "#ff3d68"];

// Heart outline in a 100 x 90 box, starts at the bottom tip
const HEART_PATH =
  "M50 84 C14 58 0 40 5 24 C10 8 34 2 50 22 C66 2 90 8 95 24 C100 40 86 58 50 84 Z";

function Letters({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="cr-letters" aria-label={text}>
      {Array.from(text).map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: 36, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.075, duration: 1, ease: EASE_OUT }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

interface PersonProps {
  side: -1 | 1; // -1 = enters from the left (groom), 1 = from the right (bride)
  src: string;
  alt: string;
  enterDelay: number;
  floatAmp: number;
  floatDur: number;
  floatDelay: number;
  reduce: boolean;
  swapOut: boolean; // fade out when a joined-hands image takes over
}

function Person({
  side,
  src,
  alt,
  enterDelay,
  floatAmp,
  floatDur,
  floatDelay,
  reduce,
  swapOut,
}: PersonProps) {
  return (
    <motion.div
      className={`cr-char ${side === -1 ? "cr-groom" : "cr-bride"}`}
      initial={{ x: `${side * 55}vw`, opacity: 0, scale: 0.9, filter: "blur(18px)" }}
      animate={{ x: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        delay: reduce ? 0 : enterDelay,
        duration: reduce ? 0.01 : 2.8,
        ease: EASE_CINEMA,
      }}
    >
      {/* lean toward each other the moment hands join */}
      <motion.div
        className="cr-char-inner"
        initial={{ x: 0, rotate: 0, opacity: 1 }}
        animate={{
          x: reduce ? 0 : -side * 12,
          rotate: reduce ? 0 : -side * 1.4,
          opacity: swapOut ? 0 : 1,
        }}
        transition={{
          x: { delay: T.meet, duration: 1.4, ease: EASE_OUT },
          rotate: { delay: T.meet, duration: 1.4, ease: EASE_OUT },
          opacity: { delay: T.meet + 0.15, duration: 0.6 },
        }}
      >
        <motion.div
          className="cr-float"
          animate={reduce ? undefined : { y: [0, -floatAmp, 0] }}
          transition={{ delay: floatDelay, duration: floatDur, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={src} alt={alt} draggable={false} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function CoupleReveal({ onComplete, joinedSrc }: CoupleRevealProps) {
  const reduce = !!useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(() => doneRef.current(), reduce ? 200 : 900);
  }, [reduce]);

  // Single timer drives the whole sequence (cleaned up on unmount)
  useEffect(() => {
    const id = window.setTimeout(finish, (reduce ? 3 : T.leave) * 1000);
    return () => window.clearTimeout(id);
  }, [finish, reduce]);

  // Tap / click / key to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  // Lock page scroll while the full-screen intro is showing
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  // Gold dust: stable random values
  const dust = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 6 + Math.random() * 7,
        delay: 0.6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 120,
        key: i,
      })),
    []
  );

  // Hearts + sparks that burst outward from the joined hands
  const burst = useMemo(() => {
    const hearts = Array.from({ length: 22 }).map((_, i) => {
      const a = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.5;
      const dist = 90 + Math.random() * 190;
      return {
        key: `h${i}`,
        glyph: "♥",
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.8 - 70, // bias upward
        size: 12 + Math.random() * 22,
        rot: (Math.random() - 0.5) * 50,
        delay: Math.random() * 0.35,
        color: HEART_COLORS[i % HEART_COLORS.length],
      };
    });
    const sparks = Array.from({ length: 16 }).map((_, i) => {
      const a = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 150;
      return {
        key: `s${i}`,
        glyph: "✦",
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist - 20,
        size: 8 + Math.random() * 10,
        rot: Math.random() * 90,
        delay: Math.random() * 0.25,
        color: "#fff3c4",
      };
    });
    return [...hearts, ...sparks];
  }, []);

  // Hearts that keep floating up after the hands join
  const floaters = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        key: i,
        left: Math.random() * 100,
        size: 10 + Math.random() * 20,
        dur: 5 + Math.random() * 5,
        delay: T.meet + 0.5 + Math.random() * 4.5,
        drift: (Math.random() - 0.5) * 160,
        color: HEART_COLORS[i % HEART_COLORS.length],
      })),
    []
  );

  const d = (n: number) => (reduce ? 0 : n); // delay helper
  const dur = (n: number) => (reduce ? 0.01 : n);

  return (
    <motion.div
      className="cr-root"
      role="dialog"
      aria-label="Karthick and Meenachi"
      onClick={finish}
      initial={{ opacity: 1, scale: 1 }}
      animate={
        leaving
          ? { opacity: 0, scale: reduce ? 1 : 1.08, filter: "blur(6px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: leaving ? 0.9 : 0, ease: "easeInOut" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Noto+Serif+Tamil:wght@400;500&display=swap');

        .cr-root {
          --bar: max(env(safe-area-inset-bottom, 0px), 14px);
          /* The whole composition (couple + heart + names) is built on one "stage"
             with a fixed shape, so every device shows the same picture, just scaled. */
          --stage-h: clamp(110px, min(64dvh, calc(94vw / 2.16)), 760px);
          --stage-w: calc(var(--stage-h) * 2.16);
          --hand-y: 50%;               /* heart centre / hand-light height inside the stage (0% = top) */
          --cy: calc((100dvh - var(--bar)) / 2 - var(--stage-h) * 0.155); /* screen y of the heart centre */
          --names-size: max(20px, calc(var(--stage-h) * 0.2216));
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          z-index: 9999;
          overflow: hidden;
          overscroll-behavior: contain;
          touch-action: manipulation;
          background: #120208;
          color: #f4d47d;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          font-family: "Cormorant Garamond", Georgia, serif;
        }

        /* camera: one slow push-in over the whole shot */
        .cr-camera {
          position: absolute;
          inset: 0;
          transform-origin: 50% 55%;
          will-change: transform;
        }

        .cr-bg {
          position: absolute;
          inset: -2px;                 /* bleed past every edge so no seam shows */
          background-color: #25050e;
          background:
            radial-gradient(circle at 50% var(--cy), rgba(125, 22, 46, 0.55), transparent 46%),
            radial-gradient(circle at 50% 105%, rgba(221, 177, 75, 0.14), transparent 50%),
            linear-gradient(145deg, #25050e, #3c0717 48%, #150207);
        }

        /* rotating light rays */
        .cr-rays {
          position: absolute;
          left: 50%;
          top: var(--cy);
          width: 170vmax;
          height: 170vmax;
          margin: -85vmax 0 0 -85vmax;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(244, 210, 117, 0.16) 0deg 4deg,
            transparent 4deg 16deg
          );
          -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 38%);
                  mask-image: radial-gradient(circle, #000 0%, transparent 38%);
          animation: cr-spin 60s linear infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        @keyframes cr-spin { to { transform: rotate(360deg); } }

        .cr-glow {
          position: absolute;
          left: 50%;
          top: var(--cy);
          width: min(88vw, calc(var(--stage-h) * 1.8));
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(244, 210, 117, 0.7),
            rgba(210, 157, 54, 0.2) 36%,
            transparent 70%
          );
          filter: blur(22px);
          pointer-events: none;
        }

        /* gold dust rising */
        .cr-dust { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
        .cr-dust i {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff3c4, #e7c66d 60%, transparent 70%);
          opacity: 0;
          animation: cr-rise var(--dur) ease-in infinite;
          animation-delay: var(--delay);
        }
        @keyframes cr-rise {
          0%   { opacity: 0; transform: translate3d(0, 0, 0) scale(.6); }
          15%  { opacity: .9; }
          100% { opacity: 0; transform: translate3d(var(--drift), -105dvh, 0) scale(1.2); }
        }

        /* floating hearts (after hands join) */
        .cr-floaters { position: absolute; inset: 0; pointer-events: none; z-index: 3; overflow: hidden; }
        .cr-floaters i {
          position: absolute;
          bottom: -30px;
          font-style: normal;
          line-height: 1;
          font-size: var(--size);
          color: var(--color);
          text-shadow: 0 0 14px var(--color);
          opacity: 0;
          animation: cr-heart-rise var(--dur) ease-in-out var(--delay) infinite backwards;
        }
        @keyframes cr-heart-rise {
          0%   { opacity: 0; transform: translate3d(0, 0, 0) scale(.6) rotate(-8deg); }
          12%  { opacity: .95; }
          50%  { transform: translate3d(calc(var(--drift) * .5 + 18px), -55dvh, 0) scale(1) rotate(8deg); }
          100% { opacity: 0; transform: translate3d(var(--drift), -108dvh, 0) scale(1.15) rotate(-6deg); }
        }

        /* layout: stage (couple) + names, centred as one group */
        .cr-layout {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: env(safe-area-inset-top, 0px) 0 var(--bar);
          pointer-events: none;
        }
        .cr-pair {
          position: relative;
          flex: none;
          width: var(--stage-w);
          height: var(--stage-h);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .cr-char {
          position: relative;
          z-index: 1;
          width: 32.9%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .cr-char-inner, .cr-float { width: 100%; height: 100%; }
        .cr-char img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom center;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
          filter: drop-shadow(0 28px 34px rgba(0, 0, 0, 0.5));
        }

        /* optional single "holding hands" image */
        .cr-joined {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }
        .cr-joined img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
          object-position: bottom center;
          filter: drop-shadow(0 28px 34px rgba(0, 0, 0, 0.5));
        }

        /* big heart drawn around the couple */
        .cr-frame-wrap {
          position: absolute;
          left: 0;
          right: 0;
          top: var(--hand-y);          /* heart centre = hand point */
          height: 0;
          z-index: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cr-frame {
          width: calc(var(--stage-h) * 1.25);
          aspect-ratio: 108 / 98;
        }
        .cr-frame svg { width: 100%; height: 100%; overflow: visible; display: block; }

        /* the point where the hands meet */
        .cr-hands {
          position: absolute;
          z-index: 5;
          left: 50%;
          top: var(--hand-y);
          width: 0;
          height: 0;
        }
        .cr-orb {
          position: absolute;
          left: -70px;
          top: -70px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, #fffbe6 0%, rgba(255, 217, 138, .85) 25%, rgba(255, 90, 122, .35) 55%, transparent 72%);
          filter: blur(5px);
          mix-blend-mode: screen;
        }
        .cr-ring {
          position: absolute;
          left: -30px;
          top: -30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(255, 214, 130, .9);
          box-shadow: 0 0 18px rgba(255, 214, 130, .7), inset 0 0 14px rgba(255, 143, 163, .5);
        }
        .cr-bit {
          position: absolute;
          left: 0;
          top: 0;
          line-height: 1;
          font-style: normal;
          color: var(--color);
          text-shadow: 0 0 14px var(--color);
        }

        /* floor reflection of light */
        .cr-floor {
          position: absolute;
          z-index: 0;
          left: 6%;
          right: 6%;
          bottom: -2%;
          height: 12%;
          background: radial-gradient(ellipse, rgba(244, 210, 117, 0.35), transparent 70%);
          filter: blur(10px);
          pointer-events: none;
        }

        /* anamorphic lens streak + flash */
        .cr-streak {
          position: absolute;
          left: -50vw;
          width: 100vw;
          top: -1px;
          height: 2px;
          transform-origin: center;
          background: linear-gradient(90deg, transparent, #fff3c4 30%, #fff 50%, #fff3c4 70%, transparent);
          box-shadow: 0 0 24px 6px rgba(244, 210, 117, 0.7);
          pointer-events: none;
        }
        .cr-flash {
          position: absolute;
          inset: 0;
          z-index: 9;
          background: radial-gradient(circle at 50% var(--cy), #fff3c4, rgba(244,210,117,.5) 40%, transparent 75%);
          pointer-events: none;
        }

        /* names */
        .cr-names {
          position: relative;
          z-index: 10;
          flex: none;
          width: 96vw;
          margin-top: calc(var(--stage-h) * -0.14);   /* names overlap the feet, like the reference */
          text-align: center;
          pointer-events: none;
        }
        .cr-small {
          margin: 0 0 calc(var(--stage-h) * 0.03);
          color: rgba(255, 232, 168, 0.7);
          font-family: Georgia, serif;
          font-size: max(7px, calc(var(--stage-h) * 0.034));
          letter-spacing: clamp(2px, 0.5vw, 5px);
          white-space: nowrap;
        }
        .cr-row {
          display: flex;
          flex-wrap: nowrap;
          white-space: nowrap;
          align-items: center;
          justify-content: center;
          column-gap: calc(var(--stage-h) * 0.06);
          font-size: var(--names-size);
          font-weight: 500;
          line-height: 1.02;
          text-shadow: 0 0 28px rgba(238, 191, 76, 0.45), 0 4px 18px rgba(0, 0, 0, 0.6);
        }
        .cr-letters { display: inline-flex; }
        .cr-letters span { display: inline-block; }
        .cr-heart {
          display: inline-block;
          color: #e8b94f;
          font-size: 0.5em;
          text-shadow: 0 0 20px rgba(238, 191, 76, 0.8);
        }
        .cr-line {
          display: flex;
          justify-content: center;
          align-items: center;
          width: calc(var(--stage-h) * 0.65);
          margin: calc(var(--stage-h) * 0.045) auto calc(var(--stage-h) * 0.025);
          gap: 8px;
        }
        .cr-line span { flex: 1; height: 1px; }
        .cr-line span:first-child { background: linear-gradient(90deg, transparent, #cba452); transform-origin: right; }
        .cr-line span:last-child  { background: linear-gradient(90deg, #cba452, transparent); transform-origin: left; }
        .cr-tamil {
          margin: 0;
          color: rgba(255, 233, 175, 0.88);
          font-family: "Noto Serif Tamil", "Latha", Georgia, serif;
          font-size: max(11px, calc(var(--stage-h) * 0.06));
          letter-spacing: 2px;
          white-space: nowrap;
        }

        /* letterbox bars */
        .cr-bar {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 30;
          background: #000;
          pointer-events: none;
        }
        .cr-bar.top { top: 0; }
        .cr-bar.bottom { bottom: 0; }

        .cr-vignette {
          position: absolute;
          inset: 0;
          z-index: 20;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.62) 100%);
        }

        /* film grain */
        .cr-grain {
          position: absolute;
          inset: -50%;
          z-index: 25;
          pointer-events: none;
          opacity: 0.09;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          animation: cr-grain 0.8s steps(6) infinite;
        }
        @keyframes cr-grain {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(-6%, 4%); }
          40%  { transform: translate(5%, -7%); }
          60%  { transform: translate(-4%, -3%); }
          80%  { transform: translate(7%, 5%); }
          100% { transform: translate(0, 0); }
        }

        /* ───── Responsive ─────
           The stage keeps one shape on every screen, so only short landscape
           screens need a tweak: a slightly smaller stage so the names fit below. */
        @media (max-height: 520px) and (orientation: landscape) {
          .cr-root {
            --bar: max(env(safe-area-inset-bottom, 0px), 6px);
            --stage-h: clamp(110px, min(56dvh, calc(94vw / 2.16)), 760px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cr-rays, .cr-dust i, .cr-grain, .cr-floaters i { animation: none; }
        }
      `}</style>

      {/* ── Camera layer: slow cinematic push-in ── */}
      <motion.div
        className="cr-camera"
        initial={{ scale: reduce ? 1 : 1.14 }}
        animate={{ scale: 1 }}
        transition={{ duration: dur(T.leave + 1), ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="cr-bg" />

        <motion.div
          className="cr-rays"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 1] }}
          transition={{ delay: d(0.6), duration: dur(3.5), times: [0, 0.4, 1] }}
        />

        <motion.div
          className="cr-glow"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.35, 0.6, 0.85], scale: [0.4, 0.8, 1.2, 1] }}
          transition={{ delay: d(0.4), duration: dur(3.6), times: [0, 0.3, 0.75, 1], ease: "easeOut" }}
        />

        <div className="cr-dust" aria-hidden="true">
          {!reduce &&
            dust.map((p) => (
              <i
                key={p.key}
                style={
                  {
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size,
                    "--dur": `${p.dur}s`,
                    "--delay": `${p.delay}s`,
                    "--drift": `${p.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
        </div>

        {/* hearts floating up through the frame after the hands join */}
        <div className="cr-floaters" aria-hidden="true">
          {!reduce &&
            floaters.map((h) => (
              <i
                key={h.key}
                style={
                  {
                    left: `${h.left}%`,
                    "--size": `${h.size}px`,
                    "--dur": `${h.dur}s`,
                    "--delay": `${h.delay}s`,
                    "--drift": `${h.drift}px`,
                    "--color": h.color,
                  } as CSSProperties
                }
              >
                ♥
              </i>
            ))}
        </div>

        {/* ── Layout: couple stage + names, centred as one group ── */}
        <div className="cr-layout">
        <div className="cr-pair">
          <motion.div
            className="cr-floor"
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: d(T.meet - 0.3), duration: dur(1.6), ease: EASE_OUT }}
          />
          {/* big heart drawn around the couple, behind them */}
          <div className="cr-frame-wrap" aria-hidden="true">
            <motion.div
              className="cr-frame"
              animate={reduce ? undefined : { scale: [1, 1.04, 1, 1.05, 1] }}
              transition={{
                delay: T.heart + 1.2,
                duration: 1.6,
                times: [0, 0.2, 0.4, 0.6, 1],
                repeat: Infinity,
                repeatDelay: 0.7,
                ease: "easeInOut",
              }}
            >
              <svg viewBox="-4 -4 108 98">
                <defs>
                  <linearGradient id="crGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff3c4" />
                    <stop offset="0.5" stopColor="#e8b94f" />
                    <stop offset="1" stopColor="#ff8fa3" />
                  </linearGradient>
                  <radialGradient id="crFill" cx="0.5" cy="0.4" r="0.6">
                    <stop offset="0" stopColor="#ff5a7a" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#ff5a7a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <motion.path
                  d={HEART_PATH}
                  fill="url(#crFill)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: d(T.names + 1.4), duration: dur(1.8) }}
                />
                <motion.path
                  d={HEART_PATH}
                  fill="none"
                  stroke="url(#crGold)"
                  strokeWidth={0.7}
                  strokeLinecap="round"
                  initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: d(T.meet + 0.3), duration: dur(2.6), ease: EASE_OUT }}
                  style={{ filter: "drop-shadow(0 0 1.2px rgba(244,210,117,.9))" }}
                />
              </svg>
            </motion.div>
          </div>

          <Person
            side={-1}
            src="/images/groom-transparent.png"
            alt="Groom"
            enterDelay={T.enter}
            floatAmp={7}
            floatDur={5}
            floatDelay={T.enter + 3}
            reduce={reduce}
            swapOut={!!joinedSrc}
          />
          <Person
            side={1}
            src="/images/bride-transparent.png"
            alt="Bride"
            enterDelay={T.enter + 0.15}
            floatAmp={9}
            floatDur={5.6}
            floatDelay={T.enter + 3.4}
            reduce={reduce}
            swapOut={!!joinedSrc}
          />

          {/* optional: couple already holding hands, fades in at the meeting moment */}
          {joinedSrc && (
            <motion.div
              className="cr-joined"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: d(T.meet + 0.1), duration: dur(0.9), ease: EASE_OUT }}
            >
              <img src={joinedSrc} alt="Karthick and Meenachi holding hands" draggable={false} />
            </motion.div>
          )}

          {/* ── HANDS JOIN: orb, shock rings, hearts + sparks ── */}
          {!reduce && (
            <div className="cr-hands" aria-hidden="true">
              <motion.span
                className="cr-streak"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1.15, 1.2] }}
                transition={{ delay: T.meet, duration: 1.8, times: [0, 0.25, 0.6, 1], ease: "easeOut" }}
              />
              <motion.span
                className="cr-orb"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.55, 0.85, 0.5], scale: [0, 1.5, 1, 1.25, 1] }}
                transition={{ delay: T.meet, duration: 3.2, times: [0, 0.12, 0.4, 0.62, 1], ease: "easeOut" }}
              />

              {[0, 0.28].map((extra, i) => (
                <motion.span
                  key={i}
                  className="cr-ring"
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1, 7] }}
                  transition={{ delay: T.meet + extra, duration: 1.9, times: [0, 0.15, 1], ease: "easeOut" }}
                />
              ))}

              {burst.map((b) => (
                <motion.i
                  key={b.key}
                  className="cr-bit"
                  style={
                    {
                      fontSize: b.size,
                      marginLeft: -b.size / 2,
                      marginTop: -b.size / 2,
                      "--color": b.color,
                    } as CSSProperties
                  }
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: b.x,
                    y: [0, b.y, b.y - 50],
                    scale: [0, 1.25, 1, 0.7],
                    rotate: b.rot,
                  }}
                  transition={{
                    delay: T.meet + 0.05 + b.delay,
                    duration: 2.4,
                    times: [0, 0.2, 0.7, 1],
                    ease: "easeOut",
                  }}
                >
                  {b.glyph}
                </motion.i>
              ))}
            </div>
          )}
        </div>

        {/* ── Names ── */}
        <div className="cr-names">
          <motion.p
            className="cr-small"
            initial={{ opacity: 0, letterSpacing: "14px" }}
            animate={{ opacity: 1, letterSpacing: "4px" }}
            transition={{ delay: d(T.names - 0.3), duration: dur(1.8), ease: EASE_OUT }}
          >
            TWO HEARTS • ONE JOURNEY
          </motion.p>

          <div className="cr-row">
            <Letters text="Karthick" delay={d(T.names)} />

            <motion.b
              className="cr-heart"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reduce
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 1, scale: [0, 1.5, 1, 1.18, 1, 1.18, 1] }
              }
              transition={{
                delay: d(T.heart),
                duration: dur(2.2),
                times: [0, 0.22, 0.38, 0.55, 0.7, 0.85, 1],
                ease: "easeOut",
              }}
            >
              ♥
            </motion.b>

            <Letters text="Meenachi" delay={d(T.names + 0.35)} />
          </div>

          <div className="cr-line">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: d(T.heart - 0.2), duration: dur(1.2), ease: EASE_OUT }}
            />
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: d(T.heart - 0.2), duration: dur(1.2), ease: EASE_OUT }}
            />
          </div>

          <motion.p
            className="cr-tamil"
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: d(T.heart + 0.3), duration: dur(1.2), ease: EASE_OUT }}
          >
            கார்த்திக் ♥ மீனாட்சி
          </motion.p>
        </div>
        </div>

        {/* ── The moment they meet: flash ── */}
        {!reduce && (
          <>
            <motion.div
              className="cr-flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ delay: T.meet, duration: 1.3, times: [0, 0.18, 1], ease: "easeOut" }}
            />
          </>
        )}

      </motion.div>

      <div className="cr-vignette" />
      <div className="cr-grain" aria-hidden="true" />

      {/* Letterbox bars: start huge, open like a theatre curtain */}
      <motion.div
        className="cr-bar top"
        initial={{ height: reduce ? "0%" : "50.5%" }}
        animate={{ height: "0%" }}
        transition={{ delay: d(0.2), duration: dur(1.8), ease: EASE_CINEMA }}
      />
      <motion.div
        className="cr-bar bottom"
        initial={{ height: reduce ? "0%" : "50.5%" }}
        animate={{ height: "0%" }}
        transition={{ delay: d(0.2), duration: dur(1.8), ease: EASE_CINEMA }}
      />
    </motion.div>
  );
}