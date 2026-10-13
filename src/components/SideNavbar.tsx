
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  House,
  Heart,
  CalendarDays,
  PartyPopper,
  Images,
  Clock,
  Gift,
  Code2,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type PanInfo,
} from "framer-motion";

const SECTIONS = [
  { id: "home", label: "Home", icon: House },
  { id: "couple", label: "Bride & Groom", icon: Heart },
  { id: "details", label: "Wedding Details", icon: CalendarDays },
  { id: "events", label: "Wedding Events", icon: PartyPopper },
  {
    id: "gallery",
    label: "A Glimpse of the Celebration",
    icon: Images,
  },
  {
    id: "countdown",
    label: "Counting the Moments",
    icon: Clock,
  },
  { id: "send-gift", label: "Send Gift", icon: Gift },
  { id: "developer", label: "Developer Details", icon: Code2 },
];

const COUPLE = "Karthick & Meenachi";
const BODY_FONT = '"Cormorant Garamond", Georgia, serif';
const COMPACT_QUERY = "(max-width: 1023px), (max-height: 520px)";

const EDGE_LEFT = "max(1.25rem, calc(env(safe-area-inset-left) + 0.75rem))";
const EDGE_TOP = "max(1.25rem, calc(env(safe-area-inset-top) + 0.75rem))";

const MARKER_SPRING = {
  type: "spring",
  stiffness: 380,
  damping: 30,
} as const;

export default function SideNav() {
  const reduced = !!useReducedMotion();

  const [items, setItems] = useState(SECTIONS);
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(COMPACT_QUERY).matches
  );

  const openBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  /* ---------- Responsive layout ---------- */

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);

    const onChange = () => {
      setCompact(mq.matches);

      if (!mq.matches) {
        setOpen(false);
      }
    };

    onChange();
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* ---------- Scroll progress ---------- */

  const { scrollYProgress } = useScroll();

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  /* ---------- Find available sections ---------- */

  useEffect(() => {
    const updateSections = () => {
      const found = SECTIONS.filter(
        (section) =>
          section.id === "send-gift" ||
          !!document.getElementById(section.id)
      );

      setItems(found);

      setActive((current) =>
        found.some((section) => section.id === current)
          ? current
          : found[0]?.id ?? "home"
      );
    };

    updateSections();

    const timer = window.setTimeout(updateSections, 700);

    return () => window.clearTimeout(timer);
  }, []);

  /* ---------- Track the active section ---------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: 0,
      }
    );

    items.forEach((section) => {
      const element = document.getElementById(section.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  /* ---------- Lock background scrolling for mobile drawer ---------- */

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 80);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  /* ---------- Navigate to a section ---------- */

  const goTo = useCallback(
    (id: string) => {
      setOpen(false);
      setActive(id);

      window.setTimeout(() => {
        const target = document.getElementById(id);

        if (!target) {
          console.warn(
            `Navigation target "${id}" was not found. Check the section ID in App.tsx.`
          );
          return;
        }

        target.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
      }, open ? 250 : 50);
    },
    [open, reduced]
  );

  const onPanelDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -90 || info.velocity.x < -500) {
      setOpen(false);
    }
  };

  /* =========================================================
     DESKTOP NAVIGATION
  ========================================================= */

  if (!compact) {
    return (
      <div
        className="fixed top-1/2 z-40 -translate-y-1/2"
        style={{ left: EDGE_LEFT }}
      >
        <motion.nav
          aria-label="Wedding navigation"
          className="relative"
          initial={{ opacity: 0, x: reduced ? 0 : -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.4,
            ease: "easeOut",
          }}
        >
          {/* Navigation progress track */}
          <span
            aria-hidden="true"
            className="absolute bottom-[7px] left-[9px] top-[7px] w-px bg-gold-300/20"
          />

          <motion.span
            aria-hidden="true"
            className="absolute bottom-[7px] left-[9px] top-[7px] w-px origin-top bg-gradient-to-b from-gold-100 to-gold-300 shadow-[0_0_8px_rgba(244,213,140,0.7)]"
            style={{ scaleY: progress }}
          />

          <ul
            className="relative flex flex-col items-start"
            style={{ gap: "clamp(0.75rem, 2.8vh, 1.5rem)" }}
          >
            {items.map((section, index) => {
              const isActive = section.id === active;
              const Icon = section.icon;

              return (
                <motion.li
                  key={section.id}
                  initial={{
                    opacity: 0,
                    y: reduced ? 0 : -10,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: reduced ? 0 : 0.6 + index * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo(section.id)}
                    aria-label={section.label}
                    aria-current={isActive ? "location" : undefined}
                    className="group flex flex-row-reverse items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
                  >
                    {/* Label */}
                    <span
                      className={`
                        whitespace-nowrap rounded-full border
                        border-gold-300/40 bg-maroon-950/80
                        px-3 py-1 text-sm tracking-wide text-gold-200
                        backdrop-blur-md transition-all duration-300
                        ${
                          isActive
                            ? "translate-x-0 opacity-100 blur-0"
                            : "-translate-x-2 opacity-0 blur-[3px] group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-0 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:blur-0"
                        }
                      `}
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {section.label}
                    </span>

                    {/* Icon */}
                    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={`
                          transition-all duration-300
                          ${
                            isActive
                              ? "text-gold-100 drop-shadow-[0_0_6px_rgba(244,213,140,0.8)]"
                              : "text-gold-300/70 group-hover:text-gold-100"
                          }
                        `}
                      />

                      {isActive && !reduced && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute -inset-1 rounded-full border border-gold-200/60"
                          animate={{
                            scale: [1, 1.5],
                            opacity: [0.7, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
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
     MOBILE / TABLET NAVIGATION
  ========================================================= */

  return (
    <>
      {/* Top scroll progress line */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-gold-300/0 via-gold-300 to-gold-100 shadow-[0_0_10px_rgba(244,213,140,0.8)]"
        style={{ scaleX: progress }}
      />

      {/* Open menu button */}
      <motion.button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open wedding navigation"
        aria-expanded={open}
        className="group fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/60 bg-maroon-950/80 text-gold-200 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
        style={{
          top: EDGE_TOP,
          left: EDGE_LEFT,
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.4,
          ease: "easeOut",
        }}
        whileTap={{ scale: 0.92 }}
      >
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-gold-300/60"
            animate={{
              scale: [1, 1.6],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}

        <span
          className="flex flex-col items-start gap-[5px]"
          aria-hidden="true"
        >
          <span className="block h-px w-5 bg-gold-200" />
          <span className="block h-px w-3 bg-gold-200 transition-all duration-300 group-hover:w-5" />
          <span className="block h-px w-5 bg-gold-200" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
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

            {/* Drawer */}
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label="Wedding navigation menu"
              className="fixed bottom-0 left-0 top-0 z-50 flex w-[84vw] max-w-sm flex-col border-r border-gold-300/50 bg-maroon-950/95 backdrop-blur-xl"
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
              {/* Drawer header */}
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
                    transition={{
                      duration: 0.9,
                      delay: 0.3,
                      ease: "easeOut",
                    }}
                  />
                </div>

                <motion.button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-300/60 text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
                  initial={{
                    rotate: reduced ? 0 : -90,
                    opacity: 0,
                  }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    ease: "easeOut",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Navigation items */}
              <ul className="mt-6 flex-1 overflow-y-auto overscroll-contain px-3">
                {items.map((section, index) => {
                  const isActive = section.id === active;
                  const Icon = section.icon;

                  return (
                    <motion.li
                      key={section.id}
                      initial={{
                        opacity: 0,
                        x: reduced ? 0 : -28,
                      }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: reduced ? 0 : 0.2 + index * 0.07,
                        ease: "easeOut",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => goTo(section.id)}
                        aria-current={isActive ? "location" : undefined}
                        className="relative flex w-full items-center gap-4 rounded-lg px-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
                        style={{
                          paddingBlock: "clamp(0.6rem, 1.9vh, 1rem)",
                        }}
                      >
                        {/* Active item background */}
                        {isActive && (
                          <motion.span
                            layoutId="drawer-pill"
                            aria-hidden="true"
                            className="absolute inset-0 overflow-hidden rounded-lg border-l-2 border-gold-300 bg-gradient-to-r from-gold-300/15 to-transparent"
                            transition={
                              reduced
                                ? { duration: 0 }
                                : MARKER_SPRING
                            }
                          >
                            {!reduced && (
                              <motion.span
                                className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-gold-100/20 to-transparent"
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

                        {/* Every item has its own icon */}
                        <Icon
                          size={19}
                          strokeWidth={isActive ? 2 : 1.5}
                          className={`
                            relative shrink-0 transition-all duration-300
                            ${
                              isActive
                                ? "text-gold-200 drop-shadow-[0_0_6px_rgba(244,213,140,0.7)]"
                                : "text-gold-300/60"
                            }
                          `}
                        />

                        {/* Section label */}
                        <span
                          className={`
                            relative tracking-wide transition-colors duration-300
                            ${
                              isActive
                                ? "text-gold-200"
                                : "text-gold-200/60"
                            }
                          `}
                          style={{
                            fontFamily: BODY_FONT,
                            fontSize: "clamp(1.1rem, 3.3vh, 1.6rem)",
                          }}
                        >
                          {section.label}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>

              {/* Drawer footer */}
              <div className="px-6 pb-3 pt-4">
                <p
                  className="text-center text-sm italic text-gold-300/60"
                  style={{ fontFamily: BODY_FONT }}
                >
                  With love, {COUPLE}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
