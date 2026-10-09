import { useEffect, useRef, useState } from "react";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

import { CalendarHeart, Clock, MapPin, ExternalLink } from "lucide-react";

import { wedding } from "../data";
import { Divider } from "./Ornaments";
import { SectionHeading } from "./Reveal";

/*
|--------------------------------------------------------------------------
| THEME (dark maroon)
|--------------------------------------------------------------------------
*/

export const PAGE_BG =
  "linear-gradient(180deg,#3f0b17 0%,#2b0710 50%,#3f0b17 100%)";
const CARD_BG = "linear-gradient(160deg,#55101f,#3a0a15)";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/*
|--------------------------------------------------------------------------
| HOW THE CARD CHANGE WORKS
|--------------------------------------------------------------------------
| The section is only 200svh tall (100svh of pinned scroll), so on EVERY device
| a short, single scroll gesture (about a third of the screen) swaps the card.
| The swap itself is a quick timed animation (not scrubbed), so it feels the
| same on phones, tablets and desktops, and it never depends on scroll speed.
*/

const SECTION_HEIGHT = "200svh";
const SWITCH_TO_RECEPTION = 0.22; // scroll progress where card 2 takes over
const SWITCH_TO_VENUE = 0.6; // scroll progress where card 3 takes over

const pickCard = (p: number) =>
  p < SWITCH_TO_RECEPTION ? 0 : p < SWITCH_TO_VENUE ? 1 : 2;

/*
|--------------------------------------------------------------------------
| DETAIL CARD
|--------------------------------------------------------------------------
*/

type CardContent = {
  icon: typeof Clock;
  label: string;
  primary: string;
  lines: string[];
};

function DetailCard({
  icon: Icon,
  label,
  primary,
  lines,
  index,
  active,
}: CardContent & { index: number; active: number }) {
  // current card: visible. earlier cards: leave upward. later cards: wait below.
  const state =
    active === index
      ? { opacity: 1, y: 0, scale: 1 }
      : active > index
        ? { opacity: 0, y: -18, scale: 0.98 }
        : { opacity: 0, y: 20, scale: 0.98 };

  return (
    <motion.article
      initial={false}
      animate={state}
      transition={{ duration: 0.45, ease: EASE }}
      aria-hidden={active !== index}
      style={{
        zIndex: active === index ? 3 : 1,
        pointerEvents: "none",
        background: CARD_BG,
        willChange: "transform, opacity",
      }}
      className="
        ornate-border
        group
        absolute
        inset-0
        flex
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        border
        border-gold-300/60
        px-4
        py-5
        text-center
        shadow-[0_12px_40px_rgba(0,0,0,0.30)]
        sm:px-8
        sm:py-9
        md:px-7
        md:py-10
      "
    >
      <span
        className="
          grid
          h-11
          w-11
          shrink-0
          place-items-center
          rounded-full
          border
          border-gold-300/60
          bg-[rgba(63,11,23,0.9)]
          text-gold-200
          shadow-[0_0_22px_rgba(217,185,104,0.22)]
          sm:h-14
          sm:w-14
        "
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>

      <p className="kicker mt-4 sm:mt-6">{label}</p>

      <h3
        className="
          mt-3
          max-w-full
          break-words
          font-display
          text-balance
          text-lg
          font-semibold
          leading-snug
          text-ivory-50
          sm:text-2xl
          md:text-[1.65rem]
        "
      >
        {primary}
      </h3>

      <Divider className="mt-4 sm:mt-5" tone="text-gold-300/90" />

      <div className="mt-4 space-y-1.5 sm:mt-5">
        {lines.map((line) => (
          <p
            key={line}
            className="
              break-words
              font-body
              text-xs
              italic
              leading-relaxed
              text-ivory-100/90
              sm:text-[0.95rem]
            "
          >
            {line}
          </p>
        ))}
      </div>
    </motion.article>
  );
}

/*
|--------------------------------------------------------------------------
| STATIC CARD — REDUCED MOTION
|--------------------------------------------------------------------------
*/

function StaticDetailCard({ icon: Icon, label, primary, lines }: CardContent) {
  return (
    <article
      style={{ background: CARD_BG }}
      className="
        ornate-border
        flex
        h-full
        flex-col
        items-center
        rounded-2xl
        border
        border-gold-300/60
        px-5
        py-9
        text-center
        shadow-[0_12px_40px_rgba(0,0,0,0.30)]
        sm:px-7
        sm:py-11
      "
    >
      <span
        className="
          grid
          h-14
          w-14
          shrink-0
          place-items-center
          rounded-full
          border
          border-gold-300/60
          bg-[rgba(63,11,23,0.9)]
          text-gold-200
        "
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>

      <p className="kicker mt-6">{label}</p>

      <h3
        className="
          mt-3.5
          max-w-full
          break-words
          font-display
          text-xl
          font-semibold
          leading-snug
          text-ivory-50
          sm:text-2xl
        "
      >
        {primary}
      </h3>

      <Divider className="mt-5" tone="text-gold-300/90" />

      <div className="mt-5 space-y-1.5">
        {lines.map((line) => (
          <p
            key={line}
            className="
              break-words
              font-body
              text-sm
              italic
              leading-relaxed
              text-ivory-100/90
            "
          >
            {line}
          </p>
        ))}
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| GOOGLE MAPS BUTTON
|--------------------------------------------------------------------------
*/

function GoogleMapsLink() {
  return (
    <div className="mt-6 text-center sm:mt-8">
      <a
        href={wedding.venue.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          btn-gold
          inline-flex
          max-w-full
          items-center
          justify-center
          gap-2
          text-sm
        "
      >
        <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />

        <span>View on Google Maps</span>

        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
      </a>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TOP LOTUS BAND (optional, OFF by default)
|--------------------------------------------------------------------------
| Your slide-over wrapper already draws a lotus band above this section, so
| the default is no band (otherwise there would be two lotus dividers).
| Use <DetailsSection topBand /> only if the wrapper has no band of its own.
*/

function TopBand() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 sm:h-20"
      style={{
        background: "linear-gradient(180deg,#4a0f1e 0%,rgba(74,15,30,0) 100%)",
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-5 sm:px-8">
        <Divider tone="text-gold-300/90" />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CONTENT
|--------------------------------------------------------------------------
*/

const CARDS: CardContent[] = [
  {
    icon: Clock,
    label: "Kalyana Muhurtham",
    primary: wedding.dateDisplay,
    lines: [
      `Muhurtham ${wedding.muhurtham}`,
      "Guests are requested to be seated by 8:45 AM",
    ],
  },
  {
    icon: CalendarHeart,
    label: "Grand Reception",
    primary: "Sunday Evening",
    lines: ["6:30 PM onwards", "Dinner & blessings with the newly-wed couple"],
  },
  {
    icon: MapPin,
    label: "The Venue",
    primary: wedding.venue.name,
    lines: [wedding.venue.line1, wedding.venue.line2],
  },
];

/*
|--------------------------------------------------------------------------
| MAIN DETAILS SECTION
|--------------------------------------------------------------------------
*/

export default function DetailsSection({ topBand = false }: { topBand?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // State changes only when the card actually changes (twice in total),
  // never on every scroll frame.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = pickCard(p);
    setActive((cur) => (cur === next ? cur : next));
  });

  // Correct card if the page loads (or jumps via the side nav) mid-section
  useEffect(() => {
    setActive(pickCard(scrollYProgress.get()));
  }, [scrollYProgress]);

  const heading = (
    <SectionHeading
      kicker="The auspicious occasion"
      title="Wedding Details"
      showTopLotus={false}
      showBottomDivider={true}
    />
  );

  /* REDUCED-MOTION FALLBACK */

  if (prefersReducedMotion) {
    return (
      <section
        id="details"
        className="relative overflow-hidden py-24 sm:py-32 lg:py-36"
        aria-label="Wedding Details"
      >
        {topBand && <TopBand />}
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {heading}

          <div className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-3">
            {CARDS.map((c) => (
              <StaticDetailCard key={c.label} {...c} />
            ))}
          </div>

          <GoogleMapsLink />
        </div>
      </section>
    );
  }

  return (
    <section
      id="details"
      ref={sectionRef}
      style={{ height: SECTION_HEIGHT }}
      className="relative isolate"
      aria-label="Wedding Details"
    >
      {topBand && <TopBand />}

      {/* PINNED SCENE */}

      <div
        className="
          sticky
          top-0
          flex
          h-[100svh]
          min-h-[560px]
          flex-col
          items-center
          justify-center
          overflow-hidden
        "
      >
        {/* BRIGHT WARM GLOW */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-[radial-gradient(ellipse_at_50%_50%,rgba(126,36,59,0.38),transparent_62%)]
          "
        />

        {/* SOFT ANTIQUE-GOLD LIGHT */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-[radial-gradient(ellipse_at_50%_55%,rgba(217,185,104,0.09),transparent_50%)]
          "
        />

        <div
          className="
            relative
            z-10
            mx-auto
            flex
            w-full
            max-w-6xl
            flex-col
            justify-center
            px-5
            py-10
            sm:px-8
            sm:py-12
            lg:py-16
          "
        >
          {heading}

          {/* CARD STACK: one card at a time, swapped by a short scroll */}

          <div
            className="
              relative
              mx-auto
              mt-7
              h-[240px]
              w-full
              max-w-xl
              sm:mt-10
              sm:h-[285px]
              md:mt-12
            "
          >
            {CARDS.map((c, i) => (
              <DetailCard key={c.label} {...c} index={i} active={active} />
            ))}
          </div>

          <GoogleMapsLink />

          {/* SCROLL HINT: fades once the first card has changed */}

          <motion.p
            initial={false}
            animate={{ opacity: active === 0 ? 0.85 : 0 }}
            transition={{ duration: 0.3 }}
            className="
              mt-4
              text-center
              font-body
              text-[10px]
              uppercase
              tracking-[0.2em]
              text-gold-200/90
              sm:mt-6
              sm:tracking-[0.22em]
            "
          >
            Scroll to discover
            <span className="ml-2" aria-hidden="true">
              ↓
            </span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}