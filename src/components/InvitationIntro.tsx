import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "./InvitationIntro.css";

interface InvitationIntroProps {
  onComplete: () => void;
  onAudioReady?: (media: HTMLMediaElement) => void;
}

const PHONE_VIDEO =
  "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";
const LAPTOP_VIDEO =
  "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";

// Known sizes of the two files (phone 1080x1620, laptop 1920x1080).
// Used until the real size is read from the video metadata.
const PHONE_ASPECT = 1080 / 1620;
const LAPTOP_ASPECT = 1920 / 1080;

// Phones and any portrait / square screen get the vertical cut.
const PHONE_QUERY = "(max-width: 768px), (max-aspect-ratio: 1/1)";

const EXIT_MS = 900;
const DOOR_SECONDS = 1.7; // how long the doors take to open
const DOOR_EASE = [0.7, 0, 0.2, 1] as const;
const DUST_COUNT = 22;

// Ornaments. Phones show the middle 11 toran pieces and 5 diyas (see CSS).
const TORAN_COUNT = 27;
const DIYA_COUNT = 9;
const KOLAM_PATH = "M0 8q10-8 20 0" + " t20 0".repeat(39);

// --i = index (sway phase), --o = distance from centre (entrance order)
const orn = (i: number, count: number) =>
  ({ "--i": i, "--o": Math.abs(i - (count - 1) / 2) }) as CSSProperties;

// Flower shower: marigold, rose, pink rose, jasmine
const PETAL_COLORS = [
  ["#ffbf3b", "#e0701a"],
  ["#d93a4d", "#7a0f1f"],
  ["#ffb42e", "#d85f12"],
  ["#f27a99", "#b8345c"],
  ["#fff6e2", "#e6d3a3"],
];

// Bigger petals are "closer": they fall faster and are slightly out of focus.
const makePetals = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const [c1, c2] = PETAL_COLORS[i % PETAL_COLORS.length];
    const size = 11 + Math.random() * 15;
    return {
      x: Math.random() * 100,
      size,
      near: size > 20,
      fall: 7 + (26 - size) * 0.35 + Math.random() * 3,
      delay: Math.random() * 7,
      sway: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 60),
      tumble: 3 + Math.random() * 3,
      c1,
      c2,
    };
  });

const makeDust = (count: number) =>
  Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5,
    duration: 10 + Math.random() * 10,
    delay: -Math.random() * 20, // negative = already drifting on first frame
    drift: (Math.random() - 0.5) * 90,
    opacity: 0.35 + Math.random() * 0.45,
  }));

/* ------------------------------------------------------------
   Ornament artwork (gradients are defined once in <Defs />)
------------------------------------------------------------ */

function Defs() {
  return (
    <svg className="intro-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <linearGradient id="introGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4d58c" />
          <stop offset="0.55" stopColor="#d9ad5b" />
          <stop offset="1" stopColor="#9a6a24" />
        </linearGradient>
        <linearGradient id="introFlame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffc24d" />
          <stop offset="1" stopColor="#e8741a" />
        </linearGradient>
        <radialGradient id="introGlow">
          <stop offset="0" stopColor="#ffd37a" stopOpacity="0.65" />
          <stop offset="1" stopColor="#ffd37a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="introMarigold" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#ffc247" />
          <stop offset="1" stopColor="#c9610f" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Toran() {
  return (
    <div className="intro-toran" aria-hidden="true">
      {Array.from({ length: TORAN_COUNT }, (_, i) => (
        <span key={i} className="intro-leaf" style={orn(i, TORAN_COUNT)}>
          <span className="intro-leaf-swing">
            <i className="intro-string" />
            {i % 2 === 0 ? (
              <svg className="intro-leaf-art" viewBox="0 0 24 56">
                <path
                  d="M12 2C22 14 22 40 12 54C2 40 2 14 12 2Z"
                  fill="url(#introGold)"
                />
                <path
                  d="M12 8V50"
                  stroke="#4a1118"
                  strokeOpacity="0.55"
                  fill="none"
                />
              </svg>
            ) : (
              <svg className="intro-flower-art" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="url(#introMarigold)" />
                <circle cx="12" cy="12" r="4" fill="#f4d58c" fillOpacity="0.85" />
              </svg>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

function Base() {
  return (
    <div className="intro-base" aria-hidden="true">
      {Array.from({ length: DIYA_COUNT }, (_, i) => (
        <span key={i} className="intro-diya" style={orn(i, DIYA_COUNT)}>
          <svg className="intro-diya-art" viewBox="0 0 40 40">
            <circle
              className="intro-flame-glow"
              cx="20"
              cy="15"
              r="16"
              fill="url(#introGlow)"
            />
            <path
              className="intro-flame"
              d="M20 3C27 12 27 18 20 23C13 18 13 12 20 3Z"
              fill="url(#introFlame)"
            />
            <path
              d="M4 25H36C35 33 28 37 20 37C12 37 5 33 4 25Z"
              fill="url(#introGold)"
            />
            <path d="M4 25H36" stroke="#4a1118" strokeOpacity="0.4" />
          </svg>
        </span>
      ))}
      <svg
        className="intro-kolam"
        viewBox="0 0 800 16"
        preserveAspectRatio="none"
      >
        <path d={KOLAM_PATH} pathLength={1} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function InvitationIntro({
  onComplete,
  onAudioReady,
}: InvitationIntroProps) {
  const reduceMotion = useReducedMotion();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  const triedPlayRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `media` on <source> is ignored by most browsers, so pick the file in JS.
  const [isPhone] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches
  );
  const src = isPhone ? PHONE_VIDEO : LAPTOP_VIDEO;

  const [started, setStarted] = useState(false); // video is actually playing
  const [doorsGone, setDoorsGone] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [soundOff, setSoundOff] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [duration, setDuration] = useState(24);

  // Shape of the inner screen. Starts from the known ratio of the chosen
  // file, then locks to the real one once the video metadata loads.
  const [aspect, setAspect] = useState(isPhone ? PHONE_ASPECT : LAPTOP_ASPECT);

  const dust = useMemo(
    () => makeDust(reduceMotion ? 0 : DUST_COUNT),
    [reduceMotion]
  );
  const petals = useMemo(
    () => makePetals(reduceMotion ? 0 : 16),
    [reduceMotion]
  );

  // Exit: keep the picture moving while the sound fades out
  const completeIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);

    const video = videoRef.current;

    if (video && !video.muted) {
      const from = video.volume;
      const t0 = performance.now();
      const fade = (now: number) => {
        const t = Math.min((now - t0) / EXIT_MS, 1);
        video.volume = from * (1 - t);
        if (t < 1) requestAnimationFrame(fade);
      };
      requestAnimationFrame(fade);
    }

    exitTimerRef.current = setTimeout(() => {
      video?.pause();
      onComplete();
    }, EXIT_MS);
  }, [onComplete]);

  // Playback: sound -> muted -> tap to open
  const startVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || completedRef.current || triedPlayRef.current) return;
    triedPlayRef.current = true;

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      onAudioReady?.(video);
    } catch {
      try {
        video.muted = true;
        await video.play();
        setSoundOff(true);
      } catch {
        setNeedsTap(true);
      }
    }
  }, [onAudioReady]);

  const handleTapToOpen = async () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      onAudioReady?.(video);
    } catch {
      setVideoError(true);
    }
  };

  const handleEnableSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setSoundOff(false);
    onAudioReady?.(video);
  };

  // Progress line along the bottom edge of the frame (rAF, no re-renders)
  useEffect(() => {
    if (!started || isExiting) return;

    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      const bar = progressRef.current;
      if (video && bar && video.duration) {
        bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [started, isExiting]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      video?.pause();
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const startScale = reduceMotion ? 1 : 1.16;
  const doorSeconds = reduceMotion ? 0.5 : DOOR_SECONDS;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.main
          className={`invitation-intro${started ? " is-playing" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.05 }}
          transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
        >
          <Defs />

          {/* THE SCREEN INSIDE THE SCREEN — exact video ratio, never cropped */}
          <div className="intro-stage">
            <div
              className="intro-screen"
              style={{ "--ar": aspect } as CSSProperties}
            >
              <motion.div
                className="intro-zoom"
                initial={{ scale: startScale }}
                animate={{ scale: started ? 1 : startScale }}
                transition={{
                  duration: reduceMotion ? 0.4 : 2.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
              >
                <video
                  ref={videoRef}
                  className="intro-video"
                  src={src}
                  style={{ "--kb-duration": `${duration}s` } as CSSProperties}
                  playsInline
                  preload="auto"
                  controls={false}
                  disablePictureInPicture
                  onCanPlay={startVideo}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    setDuration(v.duration || 24);
                    if (v.videoWidth && v.videoHeight) {
                      setAspect(v.videoWidth / v.videoHeight);
                    }
                  }}
                  onPlaying={() => setStarted(true)}
                  onTimeUpdate={(e) => {
                    if (e.currentTarget.currentTime >= 2) setShowSkip(true);
                  }}
                  onEnded={completeIntro}
                  onError={() => setVideoError(true)}
                />
              </motion.div>
              <div className="intro-fx intro-vignette" aria-hidden="true" />
            </div>
          </div>

          {/* REAL-LIFE LIGHT: sunbeams and out-of-focus lamp lights */}
          <div className="intro-fx intro-rays" aria-hidden="true">
            <i className="intro-ray" />
            <i className="intro-ray" />
            <i className="intro-ray" />
          </div>
          <div className="intro-fx intro-bokeh" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} className="intro-bokeh-dot" />
            ))}
          </div>

          <div className="intro-fx intro-dust-field" aria-hidden="true">
            {dust.map((p, i) => (
              <span
                key={i}
                className="intro-dust"
                style={
                  {
                    "--x": `${p.x}%`,
                    "--s": `${p.size}px`,
                    "--d": `${p.duration}s`,
                    "--delay": `${p.delay}s`,
                    "--dx": `${p.drift}px`,
                    "--o": p.opacity,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          {/* warm light cast by the diyas onto the picture */}
          <div className="intro-fx intro-lamplight" aria-hidden="true" />

          <div className="intro-fx intro-frame" aria-hidden="true">
            <i className="intro-corner intro-corner-tl" />
            <i className="intro-corner intro-corner-tr" />
            <i className="intro-corner intro-corner-bl" />
            <i className="intro-corner intro-corner-br" />
          </div>
          <div className="intro-fx intro-grain" aria-hidden="true" />

          {/* TOP + BOTTOM ANIMATION */}
          <Toran />
          <Base />

          {/* FLOWER SHOWER: tumbling petals in front of everything */}
          <div className="intro-fx intro-petal-field" aria-hidden="true">
            {petals.map((p, i) => (
              <span
                key={i}
                className={`intro-petal${p.near ? " is-near" : ""}`}
                style={
                  {
                    "--x": `${p.x}%`,
                    "--s": `${p.size}px`,
                    "--fall": `${p.fall}s`,
                    "--delay": `${p.delay}s`,
                    "--sway": `${p.sway}px`,
                    "--tumble": `${p.tumble}s`,
                    "--c1": p.c1,
                    "--c2": p.c2,
                  } as CSSProperties
                }
              >
                <i className="intro-petal-body" />
              </span>
            ))}
          </div>

          {/* DOORS — the opening moment: they part when the video starts */}
          {!doorsGone && (
            <>
              <motion.div
                className="intro-door intro-door-left"
                aria-hidden="true"
                initial={{ x: "0%" }}
                animate={{ x: started ? "-101%" : "0%" }}
                transition={{
                  duration: doorSeconds,
                  ease: DOOR_EASE,
                  delay: 0.15,
                }}
              />
              <motion.div
                className="intro-door intro-door-right"
                aria-hidden="true"
                initial={{ x: "0%" }}
                animate={{ x: started ? "101%" : "0%" }}
                transition={{
                  duration: doorSeconds,
                  ease: DOOR_EASE,
                  delay: 0.15,
                }}
                onAnimationComplete={() => {
                  if (started) setDoorsGone(true);
                }}
              />

              {!reduceMotion && (
                <motion.div
                  className="intro-seam"
                  aria-hidden="true"
                  initial={{ opacity: 0.4 }}
                  animate={
                    started
                      ? { opacity: [1, 1, 0], scaleX: [1, 14, 40] }
                      : { opacity: [0.4, 1, 0.4], scaleX: 1 }
                  }
                  transition={
                    started
                      ? { duration: 1.5, ease: "easeOut", delay: 0.1 }
                      : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
                  }
                />
              )}

              {!videoError && !needsTap && (
                <div className={`intro-loading${started ? " is-hidden" : ""}`}>
                  <div className="intro-loader" />
                  <span>Preparing your invitation…</span>
                </div>
              )}
            </>
          )}

          {needsTap && (
            <button
              type="button"
              className="intro-pill intro-tap"
              onClick={handleTapToOpen}
            >
              Open invitation
            </button>
          )}

          {videoError && (
            <div className="intro-error">
              The video could not be loaded. You can continue to the invitation.
            </div>
          )}

          <div className="intro-progress" aria-hidden="true">
            <div ref={progressRef} className="intro-progress-fill" />
          </div>

          <AnimatePresence>
            {soundOff && started && (
              <motion.button
                key="sound"
                type="button"
                className="intro-pill intro-sound"
                onClick={handleEnableSound}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span className="intro-sound-dot" />
                <span>Tap for sound</span>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(showSkip || videoError) && (
              <motion.button
                key="skip"
                type="button"
                className="intro-pill intro-skip"
                onClick={completeIntro}
                aria-label="Skip intro video"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span>{videoError ? "Continue" : "Skip intro"}</span>
                <span className="intro-skip-arrow">→</span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.main>
      )}
    </AnimatePresence>
  );
}