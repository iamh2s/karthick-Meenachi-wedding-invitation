import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type GuideStep = {
  target: string;
  title: string;
  tamilTitle: string;
  message: string;
  tamil: string;
};

type Rect = { x: number; y: number; width: number; height: number };

type Placement = "top" | "bottom" | "left" | "right" | "center";

type Frame = { vw: number; vh: number; target: Rect | null; card: Rect | null };

type CardLayout = {
  placement: Placement;
  offset: number; // distance from the screen edge, in px
  width: number;
  maxHeight: number;
};

type Arrow = { d: string; ex: number; ey: number; angle: number };

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const steps: GuideStep[] = [
  {
    target: "navigation",
    title: "Navigation Bar",
    tamilTitle: "வழிசெலுத்தும் பட்டி",
    message:
      "Use the golden icons on the right to jump between the sections of our invitation.",
    tamil:
      "வலதுபுறத்தில் உள்ள தங்க நிற ஐகான்களைத் தொட்டு அழைப்பிதழின் பகுதிகளுக்குச் செல்லலாம்.",
  },
  {
    target: "contact",
    title: "Contact Button",
    tamilTitle: "தொடர்பு பொத்தான்",
    message:
      "Tap the phone button at the bottom right to see phone numbers and the wedding venue with directions.",
    tamil:
      "கீழ் வலதுபுறத்தில் உள்ள தொலைபேசி பொத்தானைத் தட்டி தொலைபேசி எண்கள் மற்றும் திருமண மண்டப வழியைக் காணலாம்.",
  },
   {
    target: "music",
    title: "Wedding Music",
    tamilTitle: "திருமண இசை",
    message:
      "Tap the speaker button at the bottom left to play or pause the wedding music.",
    tamil:
      "கீழ் இடதுபுறத்தில் உள்ள ஸ்பீக்கர் பொத்தானைத் தட்டி திருமண இசையை இயக்கலாம் அல்லது நிறுத்தலாம்.",
  },
  {
    target: "scroll",
    title: "Explore by Scrolling",
    tamilTitle: "கீழே ஸ்க்ரோல் செய்து பாருங்கள்",
    message:
      "Scroll down to discover our story, family, wedding details, countdown and gallery.",
    tamil:
      "எங்கள் கதை, குடும்பம், திருமண விவரங்கள் மற்றும் புகைப்படங்களைக் காண கீழே ஸ்க்ரோல் செய்யுங்கள்.",
  },
];

/**
 * Selectors tried in order for each target. The data-guide-target / data-guide
 * attributes are optional markers; the rest match common real markup.
 */
const TARGET_SELECTORS: Record<string, string[]> = {
  navigation: [
    '[data-guide-target="navigation"]',
    '[data-guide="nav"]',
    'nav[aria-label="Wedding sections"]',
    "nav",
  ],
  contact: [
    '[data-guide-target="contact"]',
    '[data-guide="contact"]',
    'button[aria-label="Contact and Venue"]',
    'button[aria-label="தொடர்பு"]',
    "button:has(svg.lucide-phone)",
    'a[href^="tel:"]',
  ],
   music: [
    '[data-guide-target="music"]',
    "button.audio-control",
    '[data-guide="music"]',
    "audio + button",
    'button[aria-label*="music" i]',
  ],
};

/** Text used as a last-resort way to find a control by its visible label. */
const TARGET_TEXT: Record<string, string[]> = {
  contact: ["Contact", "தொடர்பு"],
  music: ["Music", "இசை"],
};

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Delay (ms) before the guide opens, counted from when it becomes ready. */
const OPEN_DELAY = 2000;

const GOLD = "#f8d77e";
const PAD = 8; // breathing room around the spotlight
const EDGE = 4; // the highlight never goes closer than this to the screen edge
const MARGIN = 14; // minimum distance from the screen edge
const MIN_CARD_HEIGHT = 230;

const PHONE_MAX = 640; // below this width we use the phone layout
const PHONE_SIDE = 72; // free space kept on each side (side controls)
const PHONE_MIN_CARD = 416; // tall card on phones

const SPRING = { type: "spring", stiffness: 260, damping: 28 } as const;
const SPRING_SOFT = { type: "spring", stiffness: 200, damping: 30 } as const;
const INSTANT = { duration: 0 } as const;

const DIM = "rgba(15,3,5,.62)";
const SHADOW_ON = `0 0 0 9999px ${DIM}, 0 0 26px rgba(248,215,126,.85)`;
const SHADOW_OFF = `0 0 0 9999px ${DIM}, 0 0 0px rgba(248,215,126,0)`;

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const round1 = (n: number) => Math.round(n * 10) / 10;

const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    near(a.x, b.x) &&
    near(a.y, b.y) &&
    near(a.width, b.width) &&
    near(a.height, b.height));

const toRect = (r: DOMRect): Rect => ({
  x: r.left,
  y: r.top,
  width: r.width,
  height: r.height,
});

function unionRects(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((r) => r.x));
  const top = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * The highlight box for a target: padded, then kept fully inside the screen so
 * edge controls are never cut off.
 */
function spotRect(t: Rect, vw: number, vh: number): Rect {
  const left = Math.max(EDGE, t.x - PAD);
  const top = Math.max(EDGE, t.y - PAD);
  const right = Math.min(vw - EDGE, t.x + t.width + PAD);
  const bottom = Math.min(vh - EDGE, t.y + t.height + PAD);

  return {
    x: left,
    y: top,
    width: Math.max(right - left, 36),
    height: Math.max(bottom - top, 36),
  };
}

/**
 * Measure an element. `display: contents` wrappers have no box of their own,
 * so we measure their children instead. Full-screen containers are treated the
 * same way, so the spotlight hugs the real control and not the whole page.
 */
function measureElement(
  el: Element,
  vw: number,
  vh: number,
  depth = 0
): Rect | null {
  if (getComputedStyle(el).display === "none") return null;

  const r = el.getBoundingClientRect();
  const hasBox = r.width >= 1 && r.height >= 1;
  const isHuge = r.width > vw * 0.8 && r.height > vh * 0.8;

  if (hasBox && !isHuge) {
    const onScreen = r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
    return onScreen ? toRect(r) : null;
  }

  if (depth >= 4) return null;

  const rects = Array.from(el.children)
    .map((child) => measureElement(child, vw, vh, depth + 1))
    .filter((rect): rect is Rect => rect !== null);

  return rects.length ? unionRects(rects) : null;
}

function locateTarget(
  name: string,
  vw: number,
  vh: number,
  cache: { current: Element | null }
): Rect | null {
  // "scroll" has no element: point at a spot near the bottom of the screen.
  if (name === "scroll") {
    return { x: vw / 2 - 20, y: vh - 150, width: 40, height: 64 };
  }

  if (cache.current && cache.current.isConnected) {
    const cached = measureElement(cache.current, vw, vh);
    if (cached) return cached;
  }
  cache.current = null;

  const selectors = TARGET_SELECTORS[name] ?? [`[data-guide-target="${name}"]`];

  for (const selector of selectors) {
    let nodes: Element[] = [];
    try {
      nodes = Array.from(document.querySelectorAll(selector));
    } catch {
      continue; // an unsupported selector (e.g. :has) is simply skipped
    }

    for (const node of nodes) {
      if (node.closest("[data-wedding-guide]")) continue;
      const rect = measureElement(node, vw, vh);
      if (rect) {
        cache.current = node;
        return rect;
      }
    }
  }

  // Last resort: find a button / link by its visible text or label.
  const texts = TARGET_TEXT[name];
  if (texts) {
    const candidates = Array.from(document.querySelectorAll("button, a"));

    for (const node of candidates) {
      if (node.closest("[data-wedding-guide]")) continue;

      const label = `${node.textContent ?? ""} ${node.getAttribute("aria-label") ?? ""}`;
      if (!texts.some((t) => label.includes(t))) continue;

      const rect = measureElement(node, vw, vh);
      if (rect) {
        cache.current = node;
        return rect;
      }
    }
  }

  return null;
}

/**
 * Decide where the card sits so it never covers the highlighted element:
 *  - phones: a narrow, tall card centred between the left and right controls
 *  - phones in landscape and wide screens with side targets: card beside it
 *  - everything else: card above or below it, whichever side has more room
 */
function computeLayout(vw: number, vh: number, target: Rect | null): CardLayout {
  const baseWidth = vw >= 1600 ? 520 : vw >= 1280 ? 490 : 460;
  const fullHeight = Math.max(vh - MARGIN * 2, 160);

  const phone = vw < PHONE_MAX;
  const phoneWidth = Math.min(
    baseWidth,
    Math.max(vw - PHONE_SIDE * 2, 200),
    vw - MARGIN * 2
  );

  if (!target) {
    return {
      placement: "center",
      offset: 0,
      width: phone ? phoneWidth : Math.min(baseWidth, vw - MARGIN * 2),
      maxHeight: fullHeight,
    };
  }

  const gap = vw < 640 ? 34 : 48;
  const landscapeShort = vh < 520 && vw > vh * 1.15;
  const wide = vw >= 860;
  const cx = target.x + target.width / 2;

  // Phone: side controls (nav, contact, music) -> card stays centred between them
  if (phone && Math.abs(cx - vw / 2) >= vw * 0.2) {
    return {
      placement: "center",
      offset: 0,
      width: phoneWidth,
      maxHeight: fullHeight,
    };
  }

  const spaceAbove = target.y - PAD - gap;
  const spaceBelow = vh - (target.y + target.height + PAD) - gap;
  const spaceLeft = target.x - PAD - gap;
  const spaceRight = vw - (target.x + target.width + PAD) - gap;

  const useSide =
    !phone && (landscapeShort || (wide && (cx < vw * 0.3 || cx > vw * 0.7)));

  if (useSide) {
    const width = Math.min(
      landscapeShort ? Math.min(400, vw * 0.46) : baseWidth,
      vw - MARGIN * 2
    );

    if (spaceRight >= spaceLeft) {
      const raw = target.x + target.width + PAD + gap - MARGIN;
      return {
        placement: "right",
        offset: clamp(raw, 0, Math.max(vw - width - MARGIN * 2, 0)),
        width,
        maxHeight: fullHeight,
      };
    }

    const raw = vw - (target.x - PAD - gap) - MARGIN;
    return {
      placement: "left",
      offset: clamp(raw, 0, Math.max(vw - width - MARGIN * 2, 0)),
      width,
      maxHeight: fullHeight,
    };
  }

  const width = phone ? phoneWidth : Math.min(baseWidth, vw - MARGIN * 2);
  const maxOffset = Math.max(vh - MARGIN * 2 - MIN_CARD_HEIGHT, 0);

  if (spaceBelow >= spaceAbove) {
    const offset = clamp(
      target.y + target.height + PAD + gap - MARGIN,
      0,
      maxOffset
    );
    return {
      placement: "bottom",
      offset,
      width,
      maxHeight: Math.max(vh - offset - MARGIN * 2, MIN_CARD_HEIGHT),
    };
  }

  const offset = clamp(vh - (target.y - PAD - gap) - MARGIN, 0, maxOffset);
  return {
    placement: "top",
    offset,
    width,
    maxHeight: Math.max(vh - offset - MARGIN * 2, MIN_CARD_HEIGHT),
  };
}

/** A curved arrow from the nearest card edge to the edge of the highlight box. */
function buildArrow(card: Rect, spot: Rect): Arrow | null {
  const L = spot.x;
  const T = spot.y;
  const R = spot.x + spot.width;
  const B = spot.y + spot.height;

  const cL = card.x;
  const cT = card.y;
  const cR = card.x + card.width;
  const cB = card.y + card.height;

  const INSET = 30;
  const TIP = 5;

  let ux = 0;
  let uy = 0;
  let sx = 0;
  let sy = 0;
  let ex = 0;
  let ey = 0;

  if (T >= cB - 2) {
    ux = 0;
    uy = 1;
    sx = clamp((L + R) / 2, cL + INSET, cR - INSET);
    sy = cB;
    ex = clamp(sx, L + 10, R - 10);
    ey = T;
  } else if (B <= cT + 2) {
    ux = 0;
    uy = -1;
    sx = clamp((L + R) / 2, cL + INSET, cR - INSET);
    sy = cT;
    ex = clamp(sx, L + 10, R - 10);
    ey = B;
  } else if (L >= cR - 2) {
    ux = 1;
    uy = 0;
    sx = cR;
    sy = clamp((T + B) / 2, cT + INSET, cB - INSET);
    ex = L;
    ey = clamp(sy, T + 10, B - 10);
  } else if (R <= cL + 2) {
    ux = -1;
    uy = 0;
    sx = cL;
    sy = clamp((T + B) / 2, cT + INSET, cB - INSET);
    ex = R;
    ey = clamp(sy, T + 10, B - 10);
  } else {
    return null; // card and target overlap: no room for an arrow
  }

  ex -= ux * TIP;
  ey -= uy * TIP;

  const dist = Math.abs((ex - sx) * ux + (ey - sy) * uy);
  if (dist < 14) return null;

  const bend = clamp(dist * 0.45, 22, 120);

  const d = [
    `M ${round1(sx)} ${round1(sy)}`,
    `C ${round1(sx + ux * bend)} ${round1(sy + uy * bend)},`,
    `${round1(ex - ux * bend)} ${round1(ey - uy * bend)},`,
    `${round1(ex)} ${round1(ey)}`,
  ].join(" ");

  return {
    d,
    ex: round1(ex),
    ey: round1(ey),
    angle: (Math.atan2(uy, ux) * 180) / Math.PI,
  };
}

const initialFrame = (): Frame => ({
  vw: typeof window !== "undefined" ? window.innerWidth : 1024,
  vh: typeof window !== "undefined" ? window.innerHeight : 768,
  target: null,
  card: null,
});

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function ScrollHint({ animate }: { animate: boolean }) {
  return (
    <div className="wg-mouse" aria-hidden="true">
      <motion.span
        className="wg-wheel"
        animate={animate ? { y: [0, 14, 0], opacity: [1, 0.2, 1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type GuideProps = {
  /** The guide only opens once this is true (e.g. after the invitation opens). */
  ready?: boolean;
};

export default function WeddingGuide({ ready = true }: GuideProps) {
  const reduce = !!useReducedMotion();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [frame, setFrame] = useState<Frame>(initialFrame);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const targetCache = useRef<Element | null>(null);

  const finished = step >= steps.length;
  const current = steps[Math.min(step, steps.length - 1)];

  /* Open OPEN_DELAY ms after `ready` becomes true. No storage: shows every time. */
  useEffect(() => {
    if (!ready) return;

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const finishGuide = useCallback(() => {
    setOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setDir(1);
    setStep((s) => Math.min(s + 1, steps.length));
  }, []);

  const goBack = useCallback(() => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  /* Keyboard: Esc closes, arrow keys move between steps. */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishGuide();
      else if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goBack();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finishGuide, goNext, goBack]);

  /*
   * Track the target and the card on every frame while the guide is open.
   * This keeps the spotlight and arrow correct through resizes, rotation,
   * mobile address-bar changes, scrolling and the page's own animations.
   * State only changes when a measurement actually moves.
   */
  useEffect(() => {
    if (!open) return;

    targetCache.current = null;
    let raf = 0;

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const target = finished
        ? null
        : locateTarget(current.target, vw, vh, targetCache);

      const cardEl = cardRef.current;
      let card: Rect | null = null;
      if (cardEl) {
        const r = cardEl.getBoundingClientRect();
        if (r.height > 10) card = toRect(r);
      }

      setFrame((prev) => {
        const nextCard = card ?? prev.card;
        if (
          prev.vw === vw &&
          prev.vh === vh &&
          sameRect(prev.target, target) &&
          sameRect(prev.card, nextCard)
        ) {
          return prev;
        }
        return { vw, vh, target, card: nextCard };
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, finished, current.target]);

  /* Let the card body grow and shrink smoothly between steps. */
  useEffect(() => {
    const el = measureRef.current;
    if (!open || !el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const h = Math.round(entries[0].contentRect.height);
      if (h > 24) setBodyHeight(h);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  /* Focus the primary button as soon as it appears (keyboard users). */
  const focusOnMount = useCallback((el: HTMLButtonElement | null) => {
    el?.focus({ preventScroll: true });
  }, []);

  const layout = useMemo(
    () => computeLayout(frame.vw, frame.vh, finished ? null : frame.target),
    [frame.vw, frame.vh, frame.target, finished]
  );

  const spot = useMemo(
    () =>
      !finished && frame.target
        ? spotRect(frame.target, frame.vw, frame.vh)
        : null,
    [finished, frame.target, frame.vw, frame.vh]
  );

  const arrow = useMemo(
    () => (spot && frame.card ? buildArrow(frame.card, spot) : null),
    [spot, frame.card]
  );

  const isPhone = frame.vw < PHONE_MAX;

  /* Motion definitions (all collapse to plain fades if motion is reduced). */
  const slide = useMemo<Variants>(
    () => ({
      enter: (d: number) =>
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: d * 28, filter: "blur(4px)" },
      center: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: reduce
          ? INSTANT
          : {
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
              when: "beforeChildren",
              staggerChildren: 0.06,
            },
      },
      exit: (d: number) =>
        reduce
          ? { opacity: 0, transition: INSTANT }
          : {
              opacity: 0,
              x: d * -28,
              filter: "blur(4px)",
              transition: { duration: 0.18 },
            },
    }),
    [reduce]
  );

  const item = useMemo<Variants>(
    () => ({
      enter: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
      center: {
        opacity: 1,
        y: 0,
        transition: reduce ? INSTANT : SPRING,
      },
    }),
    [reduce]
  );

  const rule = useMemo<Variants>(
    () => ({
      enter: reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0 },
      center: {
        opacity: 1,
        scaleX: 1,
        transition: reduce
          ? INSTANT
          : { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      },
    }),
    [reduce]
  );

  const enterFrom = reduce
    ? { x: 0, y: 0 }
    : layout.placement === "top"
      ? { x: 0, y: -26 }
      : layout.placement === "left"
        ? { x: 26, y: 0 }
        : layout.placement === "right"
          ? { x: -26, y: 0 }
          : { x: 0, y: 22 };

  /* Where the card sits on screen. */
  const hostStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    boxSizing: "border-box",
    pointerEvents: "none",
    padding: `max(${MARGIN}px, env(safe-area-inset-top)) max(${MARGIN}px, env(safe-area-inset-right)) max(${MARGIN}px, env(safe-area-inset-bottom)) max(${MARGIN}px, env(safe-area-inset-left))`,
    alignItems:
      layout.placement === "top"
        ? "flex-end"
        : layout.placement === "bottom"
          ? "flex-start"
          : "center",
    justifyContent:
      layout.placement === "right"
        ? "flex-start"
        : layout.placement === "left"
          ? "flex-end"
          : "center",
  };

  const cardStyle: CSSProperties = {
    width: layout.width,
    maxHeight: layout.maxHeight,
    // Phones: a tall card (never taller than the space available)
    minHeight: isPhone ? Math.min(PHONE_MIN_CARD, layout.maxHeight) : undefined,
    marginTop: layout.placement === "bottom" ? layout.offset : 0,
    marginBottom: layout.placement === "top" ? layout.offset : 0,
    marginLeft: layout.placement === "right" ? layout.offset : 0,
    marginRight: layout.placement === "left" ? layout.offset : 0,
  };

  /* Spotlight box. With no target it collapses to the centre and just dims. */
  const collapsed = {
    left: frame.vw / 2,
    top: frame.vh / 2,
    width: 0,
    height: 0,
    borderWidth: 0,
    borderColor: "rgba(248,215,126,0)",
    boxShadow: SHADOW_OFF,
  };

  const spotlight = spot
    ? {
        left: spot.x,
        top: spot.y,
        width: spot.width,
        height: spot.height,
        borderWidth: 2,
        borderColor: GOLD,
        boxShadow: SHADOW_ON,
      }
    : collapsed;

  const progress = finished ? 1 : (step + 1) / steps.length;
  const stepLabel = finished
    ? "Your guide is complete"
    : `Step ${step + 1} of ${steps.length}`;

  const showScrollLabel = !finished && current.target === "scroll";

  if (typeof document === "undefined") return null;

  /*
   * Rendered through a portal into document.body so that `position: fixed`
   * is always relative to the viewport, even if a parent uses transform,
   * filter, perspective or contain.
   */
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="wedding-guide"
          className="wg-root"
          data-wedding-guide=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            pointerEvents: "none",
          }}
        >
          <style>{GUIDE_CSS}</style>

          {/* Spotlight: one element that glides between targets */}
          <motion.div
            className="wg-spot"
            aria-hidden="true"
            initial={{ ...collapsed, opacity: 0 }}
            animate={{ ...spotlight, opacity: 1 }}
            transition={reduce ? INSTANT : SPRING_SOFT}
          >
            {spot && <span key={step} className="wg-pulse" />}
            {spot && current.target === "scroll" && (
              <ScrollHint animate={!reduce} />
            )}
          </motion.div>

          {/* Scroll Down words (English + Tamil) on the scroll step */}
          {showScrollLabel && (
            <motion.div
              aria-hidden="true"
              className="wg-scroll-wrap"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? INSTANT : { duration: 0.4, delay: 0.2 }}
            >
              <div className="wg-scroll-pill">
                <span className="wg-scroll-en">Scroll Down</span>
                <span className="wg-tamil wg-scroll-ta">
                  கீழே ஸ்க்ரோல் செய்யுங்கள்
                </span>
              </div>
            </motion.div>
          )}

          {/* Arrow from the card to the spotlight */}
          {arrow && (
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              <g key={`${step}-${layout.placement}`}>
                <motion.path
                  d={arrow.d}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  style={{
                    filter: "drop-shadow(0 0 5px rgba(248,215,126,.7))",
                  }}
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={
                    reduce
                      ? INSTANT
                      : {
                          pathLength: {
                            duration: 0.75,
                            delay: 0.3,
                            ease: "easeInOut",
                          },
                          opacity: { duration: 0.2, delay: 0.3 },
                        }
                  }
                />

                <g
                  transform={`translate(${arrow.ex} ${arrow.ey}) rotate(${arrow.angle})`}
                >
                  <motion.path
                    d="M 0 0 L -13 -7.5 L -9 0 L -13 7.5 Z"
                    fill={GOLD}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={
                      reduce ? INSTANT : { duration: 0.2, delay: 0.95 }
                    }
                  />
                </g>

                {!reduce && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.15 }}
                  >
                    <circle
                      r={3.4}
                      fill="#fff6d2"
                      style={{ filter: `drop-shadow(0 0 4px ${GOLD})` }}
                    >
                      <animateMotion
                        dur="1.9s"
                        repeatCount="indefinite"
                        path={arrow.d}
                      />
                    </circle>
                  </motion.g>
                )}
              </g>
            </svg>
          )}

          {/* Guide card */}
          <div style={hostStyle}>
            <motion.div
              ref={cardRef}
              layout="position"
              role="dialog"
              aria-modal="false"
              aria-labelledby="wg-title"
              aria-describedby="wg-desc"
              className="wg-card"
              style={cardStyle}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.94, ...enterFrom }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 10 }}
              transition={
                reduce
                  ? INSTANT
                  : {
                      default: { ...SPRING, delay: 0.05 },
                      layout: { type: "spring", stiffness: 230, damping: 30 },
                    }
              }
            >
              <div className="wg-inner">
                {/* Header */}
                <div className="wg-hdr">
                  <div className="wg-hdr-left">
                    <div className="wg-badge">
                      <svg
                        viewBox="0 0 40 40"
                        width="100%"
                        height="100%"
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          transform: "rotate(-90deg)",
                        }}
                      >
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="rgba(217,184,110,.28)"
                          strokeWidth="1.5"
                        />
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="#f1cf7f"
                          strokeWidth="2"
                          strokeLinecap="round"
                          initial={false}
                          animate={{ pathLength: progress }}
                          transition={reduce ? INSTANT : SPRING_SOFT}
                        />
                      </svg>

                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={finished ? "done" : step}
                          style={{ display: "grid", placeItems: "center" }}
                          initial={
                            reduce
                              ? { opacity: 0 }
                              : { opacity: 0, scale: 0.4, rotate: -25 }
                          }
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: reduce ? 1 : 0.5 }}
                          transition={reduce ? INSTANT : SPRING}
                        >
                          {finished ? <Check size={20} /> : step + 1}
                        </motion.span>
                      </AnimatePresence>

                      {finished &&
                        !reduce &&
                        Array.from({ length: 12 }).map((_, i) => {
                          const angle = (i / 12) * Math.PI * 2;
                          return (
                            <motion.span
                              key={i}
                              className="wg-spark"
                              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                              animate={{
                                x: Math.cos(angle) * 28,
                                y: Math.sin(angle) * 28,
                                opacity: 0,
                                scale: [0, 1.3, 0],
                              }}
                              transition={{
                                duration: 0.9,
                                delay: 0.2,
                                ease: "easeOut",
                              }}
                            />
                          );
                        })}
                    </div>

                    <div className="wg-hdr-text">
                      <div className="wg-eyebrow">
                        AJAY &amp; SUSMI · வழிகாட்டி
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={stepLabel}
                          className="wg-step-label"
                          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                          transition={{ duration: reduce ? 0 : 0.18 }}
                        >
                          {stepLabel}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="wg-btn wg-ghost wg-close"
                    onClick={finishGuide}
                    aria-label="Skip wedding guide"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Body: height follows the content */}
                <motion.div
                  className="wg-body"
                  initial={false}
                  animate={{ height: bodyHeight ?? "auto" }}
                  transition={reduce ? INSTANT : SPRING_SOFT}
                  aria-live="polite"
                >
                  <div ref={measureRef}>
                    <AnimatePresence mode="wait" initial={false} custom={dir}>
                      <motion.div
                        key={finished ? "done" : step}
                        custom={dir}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                      >
                        {finished ? (
                          <div className="wg-done">
                            <motion.h2
                              id="wg-title"
                              variants={item}
                              className="wg-title wg-done-title"
                            >
                              You're all set!
                            </motion.h2>

                            <motion.p
                              id="wg-desc"
                              variants={item}
                              className="wg-text"
                            >
                              Enjoy exploring our wedding invitation and
                              discovering every special detail.
                            </motion.p>

                            <motion.p
                              variants={item}
                              className="wg-tamil wg-text-ta"
                            >
                              தயாராகிவிட்டீர்கள்! எங்கள் திருமண அழைப்பிதழை
                              ரசித்துப் பாருங்கள்.
                            </motion.p>

                            <motion.div variants={item} className="wg-done-cta">
                              <button
                                ref={focusOnMount}
                                type="button"
                                className="wg-btn wg-primary wg-full"
                                onClick={finishGuide}
                              >
                                Start Exploring <ChevronRight size={17} />
                              </button>
                            </motion.div>
                          </div>
                        ) : (
                          <>
                            <motion.h2
                              id="wg-title"
                              variants={item}
                              className="wg-title"
                            >
                              {current.title}
                            </motion.h2>

                            <motion.div
                              variants={item}
                              className="wg-tamil wg-title-ta"
                            >
                              {current.tamilTitle}
                            </motion.div>

                            <motion.div variants={rule} className="wg-rule" />

                            <motion.p
                              id="wg-desc"
                              variants={item}
                              className="wg-text"
                            >
                              {current.message}
                            </motion.p>

                            <motion.p
                              variants={item}
                              className="wg-tamil wg-text-ta"
                            >
                              {current.tamil}
                            </motion.p>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Footer: pinned to the bottom, collapses away on the final screen */}
                <AnimatePresence initial={false}>
                  {!finished && (
                    <motion.div
                      key="footer"
                      className="wg-footer-wrap"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? INSTANT : { duration: 0.28 }}
                    >
                      <div className="wg-footer">
                        <div className="wg-dots" aria-hidden="true">
                          {steps.map((s, index) => (
                            <motion.span
                              key={`${s.target}-${index}`}
                              className="wg-dot"
                              initial={false}
                              animate={{
                                width: index === step ? 24 : 8,
                                backgroundColor:
                                  index === step
                                    ? "#e9c775"
                                    : index < step
                                      ? "rgba(232,201,137,.65)"
                                      : "rgba(232,201,137,.3)",
                              }}
                              transition={reduce ? INSTANT : SPRING}
                            />
                          ))}
                        </div>

                        <div className="wg-actions">
                          {step > 0 && (
                            <button
                              type="button"
                              className="wg-btn wg-ghost wg-back"
                              onClick={goBack}
                              aria-label="Previous step"
                            >
                              <ChevronLeft size={17} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="wg-btn wg-ghost"
                            onClick={finishGuide}
                          >
                            Skip
                          </button>

                          <button
                            ref={focusOnMount}
                            type="button"
                            className="wg-btn wg-primary"
                            onClick={goNext}
                          >
                            {step === steps.length - 1 ? "Finish" : "Next"}
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const GUIDE_CSS = `
  .wg-root, .wg-root * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  .wg-spot {
    position: absolute;
    border-style: solid;
    border-radius: 14px;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .wg-pulse {
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    animation: wg-pulse 1.9s ease-out infinite;
  }

  .wg-mouse {
    position: relative;
    width: 26px;
    height: 42px;
    border: 2px solid #f8d77e;
    border-radius: 14px;
  }

  .wg-wheel {
    position: absolute;
    left: 50%;
    top: 7px;
    width: 4px;
    height: 8px;
    margin-left: -2px;
    border-radius: 2px;
    background: #f8d77e;
  }

  .wg-scroll-wrap {
    position: absolute;
    left: 0;
    right: 0;
    bottom: max(18px, env(safe-area-inset-bottom));
    display: flex;
    justify-content: center;
    padding: 0 12px;
    pointer-events: none;
  }

  .wg-scroll-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 20px;
    text-align: center;
    background: rgba(45, 9, 19, .88);
    border: 1px solid rgba(217, 187, 121, .6);
    border-radius: 999px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, .8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .wg-scroll-en {
    color: #f6dfa0;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.4px;
    text-transform: uppercase;
  }

  .wg-scroll-ta {
    color: #fff4dd;
    font-size: 12.5px;
    line-height: 1.5;
  }

  .wg-card {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #f8ecd1;
    background: linear-gradient(145deg, #48151d, #25090e);
    border: 1px solid #c6a45e;
    border-radius: 18px;
    box-shadow:
      0 18px 55px rgba(0,0,0,.5),
      inset 0 0 0 3px rgba(207,171,97,.08);
    pointer-events: auto;
  }

  .wg-card::before {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(223,190,119,.28);
    border-radius: 13px;
    pointer-events: none;
  }

  .wg-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    padding: 22px 22px 18px;
  }

  .wg-hdr {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .wg-hdr-left {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .wg-hdr-text { min-width: 0; }

  .wg-badge {
    position: relative;
    flex: none;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    color: #f6dfa0;
    font-family: Georgia, serif;
    font-size: 16px;
  }

  .wg-spark {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: #f8d77e;
    pointer-events: none;
  }

  .wg-eyebrow {
    color: #d9b76b;
    font-size: 10px;
    letter-spacing: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wg-step-label {
    margin-top: 3px;
    color: #f7e7b8;
    font-family: Georgia, serif;
    font-size: 17px;
  }

  .wg-body {
    flex: 0 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }
  .wg-body::-webkit-scrollbar { display: none; }

  .wg-title {
    margin: 0 0 6px;
    color: #f6dfa0;
    font-family: Georgia, serif;
    font-size: clamp(22px, 5.4vw, 29px);
    font-weight: 500;
    line-height: 1.25;
    overflow-wrap: break-word;
  }

  .wg-done-title { text-align: center; margin: 4px 0 12px; }

  .wg-tamil {
    font-family: "Noto Serif Tamil", "Latha", "Nirmala UI", serif;
    line-height: 1.9;
    overflow-wrap: break-word;
  }

  .wg-title-ta {
    margin-bottom: 12px;
    color: #dfbb78;
    font-size: 15px;
  }

  .wg-rule {
    height: 1px;
    margin: 0 0 14px;
    background: linear-gradient(90deg, #aa8647, transparent);
    transform-origin: left center;
  }

  .wg-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.75;
    overflow-wrap: break-word;
  }

  .wg-text-ta {
    margin: 8px 0 0;
    color: #e8d3ad;
    font-size: 14px;
  }

  .wg-done { text-align: center; }
  .wg-done .wg-text-ta { color: #e8c989; }
  .wg-done-cta { margin-top: 16px; }

  .wg-footer-wrap {
    flex: none;
    margin-top: auto;
    overflow: hidden;
  }

  .wg-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 4px 4px;
  }

  .wg-dots { display: flex; align-items: center; gap: 5px; }
  .wg-dot { display: block; height: 4px; border-radius: 10px; }

  .wg-actions { display: flex; align-items: center; gap: 9px; }

  .wg-btn {
    min-height: 44px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform .2s, box-shadow .25s, background .25s;
  }
  .wg-btn:active { transform: scale(.96); }
  .wg-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(248,215,126,.55);
  }

  .wg-primary {
    color: #351016;
    background: linear-gradient(135deg, #f8e6a5, #d6ad54);
    border: 1px solid #ffe9ac;
  }

  .wg-ghost {
    color: #f5dda2;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(210,177,106,.55);
  }

  .wg-close { flex: none; width: 40px; min-height: 40px; padding: 0; }
  .wg-back { width: 44px; padding: 0; }
  .wg-full { width: 100%; }

  @media (hover: hover) {
    .wg-primary:hover { box-shadow: 0 6px 22px rgba(248,215,126,.35); transform: translateY(-1px); }
    .wg-ghost:hover { background: rgba(255,255,255,.1); }
  }

  @keyframes wg-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(248,215,126,.55); }
    100% { box-shadow: 0 0 0 16px rgba(248,215,126,0); }
  }

  /* Phones: narrow, tall card between the left and right controls */
  @media (max-width: 639px) {
    .wg-inner { padding: 18px 14px 14px; }
    .wg-hdr { margin-bottom: 12px; gap: 8px; }
    .wg-hdr-left { gap: 8px; }
    .wg-badge { width: 36px; height: 36px; font-size: 14px; }
    .wg-eyebrow {
      white-space: normal;
      font-size: 9px;
      line-height: 1.5;
      letter-spacing: 1.2px;
    }
    .wg-step-label { font-size: 14px; }
    .wg-title { font-size: 20px; }
    .wg-title-ta { font-size: 14px; }
    .wg-text, .wg-text-ta { font-size: 13px; line-height: 1.7; }
  }

  @media (max-width: 480px) {
    .wg-footer { flex-direction: column; align-items: stretch; gap: 12px; padding-top: 14px; }
    .wg-dots { justify-content: center; }
    .wg-actions { width: 100%; gap: 6px; }
    .wg-actions .wg-btn { flex: 1; padding: 0 8px; font-size: 13px; }
    .wg-actions .wg-primary { flex: 1.5; }
    .wg-actions .wg-back { flex: 0 0 40px; padding: 0; }
  }

  /* Very narrow phones */
  @media (max-width: 340px) {
    .wg-eyebrow { font-size: 8.5px; letter-spacing: .8px; }
  }

  /* Phones in landscape, small windows */
  @media (max-height: 560px) {
    .wg-inner { padding: 12px 18px 10px; }
    .wg-hdr { margin-bottom: 8px; }
    .wg-badge { width: 34px; height: 34px; font-size: 14px; }
    .wg-step-label { font-size: 15px; }
    .wg-title { font-size: 20px; }
    .wg-title-ta { margin-bottom: 8px; font-size: 13px; }
    .wg-rule { margin-bottom: 8px; }
    .wg-text, .wg-text-ta { font-size: 13px; line-height: 1.55; }
    .wg-tamil { line-height: 1.6; }
    .wg-footer { flex-direction: row; align-items: center; padding-top: 10px; }
    .wg-btn { min-height: 40px; }
    .wg-done-cta { margin-top: 10px; }
  }

  /* Large desktops and TVs */
  @media (min-width: 1600px) {
    .wg-title { font-size: 33px; }
    .wg-title-ta { font-size: 17px; }
    .wg-text, .wg-text-ta { font-size: 15.5px; }
    .wg-btn { font-size: 15px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .wg-root *, .wg-root *::before, .wg-root *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;