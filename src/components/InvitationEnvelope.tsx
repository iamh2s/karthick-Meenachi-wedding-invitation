import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { playInvitationOpen } from "./InvitationSound";
import "./InvitationEnvelope.css";

interface InvitationEnvelopeProps {
  onOpen: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_CINEMA: [number, number, number, number] = [0.16, 1, 0.3, 1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function InvitationEnvelope({ onOpen }: InvitationEnvelopeProps) {
  const reduce = useReducedMotion();
  const k = reduce ? 0.01 : 1; // duration multiplier

  const [opened, setOpened] = useState(false);
  const [flapBehind, setFlapBehind] = useState(false);
  const [letterFront, setLetterFront] = useState(false);
  const [burst, setBurst] = useState(false);

  const envRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const stageCtl = useAnimationControls();
  const envCtl = useAnimationControls();
  const sealCtl = useAnimationControls();
  const flapCtl = useAnimationControls();
  const letterCtl = useAnimationControls();
  const lightCtl = useAnimationControls();

  // Fade the whole screen in on mount (stageCtl must be started explicitly)
  useEffect(() => {
    stageCtl.start({ opacity: 1, transition: { duration: 0.8 * k, ease: "easeOut" } });
  }, [stageCtl, k]);

  // sparkle directions when the seal breaks
  const sparks = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 50 + Math.random() * 60;
        return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, s: 3 + Math.random() * 4, i };
      }),
    []
  );

  const open = useCallback(async () => {
    if (opened) return;
    setOpened(true);

    // Premium opening sound (synthesised live; starts on the tap so browsers allow it)
    if (!reduce) playInvitationOpen();

    // 1. Seal cracks and falls away
    setBurst(true);
    await sealCtl.start({
      scale: [1, 1.3, 1],
      opacity: [1, 1, 0],
      y: [0, -4, 40],
      rotate: [0, -6, 24],
      transition: { duration: 0.8 * k, times: [0, 0.3, 1], ease: "easeInOut" },
    });

    // 2. Flap swings open; goes behind the letter halfway through
    lightCtl.start({ opacity: 1, scale: 1.2, transition: { duration: 1.6 * k, ease: "easeOut" } });
    const flapDone = flapCtl.start({
      rotateX: 180,
      transition: { duration: 1.1 * k, ease: EASE_CINEMA },
    });
    window.setTimeout(() => setFlapBehind(true), 480 * k);
    await flapDone;

    // 3. Letter slides out of the envelope
    await letterCtl.start({
      y: "-64%",
      transition: { duration: 1.2 * k, ease: EASE_CINEMA },
    });

    // 4. Letter comes forward and grows; envelope sinks away
    setLetterFront(true);
    const l = letterRef.current?.getBoundingClientRect();
    const baseW = l?.width ?? 320;
    const baseH = l?.height ?? 220;
    const scale = Math.max(
      1,
      Math.min(1.7, (window.innerWidth * 0.9) / baseW, (window.innerHeight * 0.78) / baseH)
    );

    await Promise.all([
      letterCtl.start({
        y: "-4%",
        scale,
        transition: { duration: 1.3 * k, ease: EASE_CINEMA },
      }),
      envCtl.start({
        opacity: 0,
        y: 90,
        scale: 0.88,
        transition: { duration: 1.1 * k, ease: "easeIn" },
      }),
    ]);

    // 5. Hold a beat, then fade into the invitation
    await sleep(500 * k);
    await stageCtl.start({ opacity: 0, transition: { duration: 0.8 * k, ease: "easeInOut" } });
    onOpen();
  }, [opened, k, reduce, onOpen, sealCtl, flapCtl, letterCtl, lightCtl, envCtl, stageCtl]);

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <motion.div className="env-screen" initial={{ opacity: 0 }} animate={stageCtl} exit={{ opacity: 0 }}>

      <div className="env-bg" />
      <div className="env-petals" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="env-wrap">
        {/* Message bubble */}
        <motion.div
          className="env-bubble"
          initial={{ opacity: 0, y: 16, scale: 0.6 }}
          animate={opened ? { opacity: 0, y: -10, scale: 0.8 } : { opacity: 1, y: 0, scale: 1 }}
          transition={
            opened
              ? { duration: 0.4 * k }
              : { delay: reduce ? 0 : 1.6, type: "spring", stiffness: 260, damping: 16 }
          }
        >
          <motion.div
            className="env-bubble-in"
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={{ delay: 2.6, duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="env-bubble-heart">♥</span>
            A message for you
          </motion.div>
        </motion.div>

        {/* Envelope */}
        <motion.div animate={envCtl} style={{ transformOrigin: "50% 100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.9, rotate: reduce ? 0 : -3, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0, filter: "blur(0px)" }}
            transition={{ delay: reduce ? 0 : 0.5, duration: 1.6 * k, ease: EASE_CINEMA }}
          >
            <motion.div
              animate={!opened && !reduce ? { y: [0, -7, 0] } : { y: 0 }}
              transition={
                !opened && !reduce
                  ? { delay: 2.2, duration: 4.6, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.4 }
              }
            >
              <div
                className="env"
                ref={envRef}
                role="button"
                tabIndex={0}
                aria-label="Open the wedding invitation"
                onClick={open}
                onKeyDown={onKey}
              >
                <div className="env-shadow" />
                <div className="env-back" />

                <motion.div
                  className="env-light"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={lightCtl}
                />

                {/* Letter */}
                <motion.div
                  ref={letterRef}
                  className={`env-letter${letterFront ? " front" : ""}`}
                  animate={letterCtl}
                  style={{ transformOrigin: "50% 50%" }}
                >
                  <div className="env-letter-in">
                    <span className="env-om">ॐ</span>
                    <p className="env-tamil">திருமண அழைப்பிதழ்</p>
                    <h1>Two Hearts</h1>
                    <h2>One Journey</h2>
                    <p className="env-invited">You are warmly invited</p>
                    <span className="env-heart">♥</span>
                  </div>
                </motion.div>

                {/* Pocket */}
                <div className="env-pocket" aria-hidden="true">
                  <svg viewBox="0 0 100 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="envSide" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#5e0e25" />
                        <stop offset="1" stopColor="#3a0717" />
                      </linearGradient>
                      <linearGradient id="envBottom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#6d1229" />
                        <stop offset="1" stopColor="#420818" />
                      </linearGradient>
                    </defs>
                    <polygon points="0,0 50,46 0,80" fill="url(#envSide)" stroke="rgba(244,212,125,.6)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <polygon points="100,0 50,46 100,80" fill="url(#envSide)" stroke="rgba(244,212,125,.6)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <polygon points="0,80 50,36 100,80" fill="url(#envBottom)" stroke="rgba(244,212,125,.7)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>

                {/* Flap */}
                <motion.div
                  className={`env-flap${flapBehind ? " behind" : ""}`}
                  animate={flapCtl}
                  initial={{ rotateX: 0 }}
                  aria-hidden="true"
                >
                  <div className="env-face">
                    <svg viewBox="0 0 100 46" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="envFlap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#7a1431" />
                          <stop offset="1" stopColor="#4c0a1d" />
                        </linearGradient>
                      </defs>
                      <polygon points="0,0 100,0 50,46" fill="url(#envFlap)" stroke="rgba(244,212,125,.8)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  <div className="env-face back">
                    <svg viewBox="0 0 100 46" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="envLining" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#d8b45a" />
                          <stop offset="1" stopColor="#a67c2a" />
                        </linearGradient>
                      </defs>
                      <polygon points="0,0 100,0 50,46" fill="url(#envLining)" stroke="rgba(255,240,170,.9)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </motion.div>

                {/* Wax seal */}
                <div className="env-seal-pos">
                  <motion.div animate={sealCtl} initial={{ scale: 1, opacity: 1 }} style={{ width: "100%", height: "100%" }}>
                    <button
                      type="button"
                      className={`env-seal${opened ? " done" : ""}`}
                      aria-label="Break the seal and open"
                      onClick={(e) => {
                        e.stopPropagation();
                        open();
                      }}
                    >
                      ♥
                    </button>
                  </motion.div>

                  {burst &&
                    !reduce &&
                    sparks.map((s) => (
                      <motion.span
                        key={s.i}
                        className="env-spark"
                        style={{ width: s.s, height: s.s, marginLeft: -s.s / 2, marginTop: -s.s / 2 }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: s.x, y: s.y, opacity: 0, scale: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.p
        className="env-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: opened ? 0 : 0.8 }}
        transition={{ delay: opened ? 0 : reduce ? 0 : 2.4, duration: 0.8 }}
      >
        TAP THE ENVELOPE TO OPEN
      </motion.p>
    </motion.div>
  );
}