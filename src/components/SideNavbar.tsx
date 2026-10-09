import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type PanInfo,
} from "framer-motion";
import { X } from "lucide-react";

/* =========================================================
   EDIT THIS: one entry per section of your invitation.
   `id` must match the id="" on that section's element.
   Entries whose id is not found on the page are hidden.
========================================================= */

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "couple", label: "Bride & Groom" },
  { id: "details", label: "Wedding Details" },
  { id: "events", label: "Wedding Events" },
  { id: "gallery", label: "A Glimpse of the Celebration" },
  { id: "countdown", label: "Counting the Moments" },
  { id: "developer", label: "Developer Details" },
];

const COUPLE = "Karthik & Meenakshi";
const BODY_FONT = '"Cormorant Garamond", Georgia, serif';

// Rail on big, tall screens. Drawer on phones, tablets and short windows.
const COMPACT_QUERY = "(max-width: 1023px), (max-height: 520px)";

const EDGE_LEFT = "max(1.25rem, calc(env(safe-area-inset-left) + 0.75rem))";
const EDGE_TOP = "max(1.25rem, calc(env(safe-area-inset-top) + 0.75rem))";

const MARKER_SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

export default function SideNav() {
  const reduced = !!useReducedMotion();

  const [items, setItems] = useState(SECTIONS);
  const [active, setActive] = useState(SECTIONS[0].id);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches
  );

  const openBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  /* ---------- layout mode follows the real space available ---------- */

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const onChange = () => {
      setCompact(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* ---------- scroll progress (smoothed) ---------- */

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  /* ---------- keep only sections that exist on the page ---------- */

  useEffect(() => {
    const t = setTimeout(() => {
      const found = SECTIONS.filter((s) => document.getElementById(s.id));
      if (found.length) {
        setItems(found);
        setActive((a) => (found.some((s) => s.id === a) ? a : found[0].id));
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  /* ---------- scroll-spy ---------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    items.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  /* ---------- drawer: Esc, scroll lock, focus ---------- */

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 80);
    const openBtn = openBtnRef.current;

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(focusTimer);
      openBtn?.focus({ preventScroll: true });
    };
  }, [open]);

  const goTo = useCallback(
    (id: string) => {
      setOpen(false);
      setActive(id);
      // wait a beat so the scroll lock is released first
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
      }, 60);
    },
    [reduced]
  );

  const onPanelDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -90 || info.velocity.x < -500) setOpen(false);
  };

  /* =========================================================
     DESKTOP RAIL
  ========================================================= */

  if (!compact) {
    return (
      // outer div owns the centering, inner motion.nav owns the animation
      <div
        className="fixed top-1/2 z-40 -translate-y-1/2"
        style={{ left: EDGE_LEFT }}
      >
        <motion.nav
          aria-label="Sections"
          className="relative"
          initial={{ opacity: 0, x: reduced ? 0 : -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
        >
          {/* line: dim track + gold fill that follows the scroll */}
          <span
            aria-hidden="true"
            className="absolute bottom-[7px] left-[7px] top-[7px] w-px bg-gold-300/20"
          />
          <motion.span
            aria-hidden="true"
            className="
              absolute bottom-[7px] left-[7px] top-[7px] w-px origin-top
              bg-gradient-to-b from-gold-100 to-gold-300
              shadow-[0_0_8px_rgba(244,213,140,0.7)]
            "
            style={{ scaleY: progress }}
          />

          <ul
            className="relative flex flex-col items-start"
            style={{ gap: "clamp(0.75rem, 2.8vh, 1.5rem)" }}
          >
            {items.map((s, i) => {
              const isActive = s.id === active;
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: reduced ? 0 : -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: reduced ? 0 : 0.6 + i * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-label={s.label}
                    aria-current={isActive ? "true" : undefined}
                    className="group flex flex-row-reverse items-center gap-3 focus:outline-none"
                  >
                    <span
                      className={`
                        pointer-events-none whitespace-nowrap rounded-full
                        border border-gold-300/40 bg-maroon-950/70
                        px-3 py-1 text-sm tracking-wide text-gold-200
                        backdrop-blur-md transition-all duration-300
                        group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-0
                        group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:blur-0
                        ${
                          isActive
                            ? "translate-x-0 opacity-100 blur-0"
                            : "-translate-x-2 opacity-0 blur-[3px]"
                        }
                      `}
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {s.label}
                    </span>

                    {/* diamond slot: 15px box, line passes through its centre */}
                    <span className="relative block h-[15px] w-[15px] shrink-0">
                      <span
                        className="
                          absolute inset-[2px] rotate-45 border border-gold-300/70
                          bg-maroon-950/80 transition-colors duration-300
                          group-hover:bg-gold-300/40
                          group-focus-visible:ring-2 group-focus-visible:ring-gold-200
                        "
                      />

                      {/* one glowing marker glides between sections */}
                      {isActive && (
                        <motion.span
                          layoutId="rail-marker"
                          className="absolute -inset-[3px]"
                          transition={reduced ? { duration: 0 } : MARKER_SPRING}
                        >
                          <span className="absolute inset-[3px] rotate-45">
                            <span
                              className="
                                block h-full w-full border border-gold-100 bg-gold-300
                                shadow-[0_0_16px_rgba(244,213,140,0.9)]
                              "
                            />
                          </span>
                          {!reduced && (
                            <span className="absolute inset-[3px] rotate-45">
                              <motion.span
                                className="block h-full w-full border border-gold-200"
                                animate={{ scale: [1, 2.3], opacity: [0.7, 0] }}
                                transition={{
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                              />
                            </span>
                          )}
                        </motion.span>
                      )}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </motion.nav>
      </div>
    );
  }

  /* =========================================================
     PHONE / TABLET / SHORT WINDOW: top progress + drawer
  ========================================================= */

  return (
    <>
      {/* thin gold progress line along the top edge */}
      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none fixed inset-x-0 top-0 z-40 h-[2px] origin-left
          bg-gradient-to-r from-gold-300/0 via-gold-300 to-gold-100
          shadow-[0_0_10px_rgba(244,213,140,0.8)]
        "
        style={{ scaleX: progress }}
      />

      {/* menu button with a slow pulsing ring */}
      <motion.button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="
          group fixed z-40 flex h-11 w-11 items-center justify-center
          rounded-full border border-gold-300/60
          bg-maroon-950/60 text-gold-200 backdrop-blur-md
          shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200
        "
        style={{ top: EDGE_TOP, left: EDGE_LEFT }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-gold-300/60"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className="flex flex-col items-start gap-[5px]" aria-hidden="true">
          <span className="block h-px w-5 bg-gold-200" />
          <span className="block h-px w-3 bg-gold-200 transition-all duration-300 group-hover:w-5" />
          <span className="block h-px w-5 bg-gold-200" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="
                fixed bottom-0 left-0 top-0 z-50 flex w-[84vw] max-w-sm flex-col
                border-r border-gold-300/50 bg-maroon-950/95 backdrop-blur-xl
              "
              style={{
                paddingTop: "max(1.25rem, env(safe-area-inset-top))",
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
                paddingLeft: "env(safe-area-inset-left)",
                touchAction: "pan-y",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                duration: reduced ? 0.2 : 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.6, right: 0 }}
              onDragEnd={onPanelDragEnd}
            >
              {/* header: names, drawn gold line, close button */}
              <div className="flex items-start justify-between px-6">
                <div>
                  <p
                    className="text-xl italic text-gold-200"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {COUPLE}
                  </p>
                  <motion.span
                    aria-hidden="true"
                    className="mt-3 block h-px w-28 origin-left bg-gradient-to-r from-gold-300 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                  />
                </div>

                <motion.button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                    border border-gold-300/60 text-gold-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200
                  "
                  initial={{ rotate: reduced ? 0 : -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* items: scrolls on very short screens */}
              <ul className="mt-6 flex-1 overflow-y-auto overscroll-contain px-3">
                {items.map((s, i) => {
                  const isActive = s.id === active;
                  return (
                    <motion.li
                      key={s.id}
                      initial={{ opacity: 0, x: reduced ? 0 : -28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: reduced ? 0 : 0.2 + i * 0.07,
                        ease: "easeOut",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => goTo(s.id)}
                        aria-current={isActive ? "true" : undefined}
                        className="
                          relative flex w-full items-center gap-4 rounded-lg
                          px-4 text-left focus:outline-none
                          focus-visible:ring-2 focus-visible:ring-gold-200
                        "
                        style={{ paddingBlock: "clamp(0.6rem, 1.9vh, 1rem)" }}
                      >
                        {/* highlight glides between items, with a light sweep */}
                        {isActive && (
                          <motion.span
                            layoutId="drawer-pill"
                            aria-hidden="true"
                            className="
                              absolute inset-0 overflow-hidden rounded-lg
                              border-l-2 border-gold-300
                              bg-gradient-to-r from-gold-300/15 to-transparent
                            "
                            transition={reduced ? { duration: 0 } : MARKER_SPRING}
                          >
                            {!reduced && (
                              <motion.span
                                className="
                                  absolute inset-y-0 w-1/3 -skew-x-12
                                  bg-gradient-to-r from-transparent via-gold-100/20 to-transparent
                                "
                                initial={{ x: "-120%" }}
                                animate={{ x: "380%" }}
                                transition={{
                                  duration: 2.6,
                                  repeat: Infinity,
                                  repeatDelay: 1.4,
                                  ease: "easeInOut",
                                }}
                              />
                            )}
                          </motion.span>
                        )}

                        <span
                          aria-hidden="true"
                          className={`
                            relative block h-2.5 w-2.5 shrink-0 rotate-45 border
                            transition-all duration-300
                            ${
                              isActive
                                ? "border-gold-200 bg-gold-300 shadow-[0_0_10px_rgba(244,213,140,0.8)]"
                                : "border-gold-300/50"
                            }
                          `}
                        />
                        <span
                          className={`relative tracking-wide transition-colors duration-300 ${
                            isActive ? "text-gold-200" : "text-gold-200/60"
                          }`}
                          style={{
                            fontFamily: BODY_FONT,
                            fontSize: "clamp(1.1rem, 3.3vh, 1.6rem)",
                          }}
                        >
                          {s.label}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}