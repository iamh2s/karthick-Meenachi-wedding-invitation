import { motion, useReducedMotion } from "framer-motion";
import {
  Flame,
  Gem,
  Music,
  Sparkles,
  UtensilsCrossed,
  MapPin,
  Clock,
} from "lucide-react";
import { events, type WeddingEvent } from "../data";
import { SectionHeading, EASE } from "./Reveal";
import { cn } from "../utils/cn";

const ICONS = {
  rings: Gem,
  music: Music,
  flame: Flame,
  feast: UtensilsCrossed,
  sparkles: Sparkles,
} as const;

function TimelineItem({
  event,
  index,
}: {
  event: WeddingEvent;
  index: number;
}) {
  const reduced = useReducedMotion();
  const Icon = ICONS[event.icon];
  const left = index % 2 === 0;

  const card = (
    <motion.article
      className="ornate-border velvet-panel relative px-7 py-8 transition-transform duration-700 hover:-translate-y-1 sm:px-9 sm:py-9"
      initial={reduced ? false : { opacity: 0, y: 38 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, ease: EASE }}
    >
      <p className="font-caps text-[0.58rem] uppercase leading-[1.8] tracking-[0.32em] text-gold-400/90 sm:text-[0.62rem] sm:tracking-[0.4em]">
        {event.subtitle}
      </p>
      <h3 className="text-gold mt-3 text-balance font-display text-[1.55rem] font-semibold leading-tight sm:text-3xl">
        {event.title}
      </h3>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-[0.85rem] italic text-ivory-200/85 sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rotate-45 bg-gold-400" />
          {event.date}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
          {event.time}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
          {event.venue}
        </span>
      </div>
      <p className="mt-5 font-body text-[0.95rem] leading-[1.85] text-ivory-200/72">
        {event.description}
      </p>
    </motion.article>
  );

  return (
    <li className="relative grid items-center gap-6 md:grid-cols-2 md:gap-0">
      {/* node */}
      <motion.span
        className={cn(
          "absolute z-10 grid h-12 w-12 place-items-center rounded-full border border-gold-400/50 bg-maroon-900 text-gold-300 shadow-[0_0_24px_rgba(217,185,104,0.18)]",
          "left-5 md:left-1/2 md:-translate-x-1/2"
        )}
        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: EASE }}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" strokeWidth={1.4} />
      </motion.span>

      <div
        className={cn(
          "pl-20 md:pl-0",
          left ? "md:col-start-1 md:pr-16" : "md:col-start-2 md:pl-16"
        )}
      >
        {card}
      </div>
      {left ? <div className="hidden md:col-start-2 md:block" /> : null}
    </li>
  );
}

export default function TimelineSection() {
  return (
    <section
      id="events"
      className="relative py-24 sm:py-32"
      aria-labelledby="events-heading"
    >
      <div
        className="pointer-events-none absolute right-[-10%] top-1/3 h-[70vh] w-[55vw] rounded-full bg-[radial-gradient(closest-side,rgba(104,22,39,0.28),rgba(104,22,39,0)_72%)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          kicker="Four days of festivity"
          title="Wedding Events"
        />

        <div className="relative mt-20">
          {/* the golden thread */}
          <span
            className="absolute bottom-6 left-5 top-2 w-px -translate-x-1/2 gold-hairline-v md:left-1/2"
            aria-hidden="true"
          />
          <ol className="space-y-14 md:space-y-20">
            {events.map((e, i) => (
              <TimelineItem key={e.title} event={e} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
