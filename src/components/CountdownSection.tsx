import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { wedding } from "../data";
import { Divider, Lotus } from "./Ornaments";
import { Reveal, SectionHeading } from "./Reveal";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: number): Parts {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1_000) % 60,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  const reduced = useReducedMotion();
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-[4.3rem] w-[4.3rem] place-items-center sm:h-24 sm:w-24">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="text-gold font-engraved text-3xl tabular-nums sm:text-5xl"
            initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, y: -12, filter: "blur(5px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2.5 font-caps text-[0.55rem] uppercase tracking-[0.34em] pl-[0.34em] text-ivory-300/75 sm:text-[0.62rem] sm:tracking-[0.38em] sm:pl-[0.38em]">
        {label}
      </span>
    </div>
  );
}

export default function CountdownSection() {
  const target = new Date(wedding.dateISO).getTime();
  const [parts, setParts] = useState<Parts>(() => diff(target));
  const done = target - Date.now() <= 0;

  useEffect(() => {
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <section
      className="relative py-24 sm:py-32"
      aria-label="Countdown to the wedding"
    >
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <SectionHeading
          kicker="Save the auspicious date"
          title="Counting the Moments"
        />
        <Reveal delay={0.1}>
          <p className="mt-6 font-body text-base italic leading-relaxed text-ivory-200/80 sm:text-lg">
            {wedding.dateLong} · Muhurtham at 9:15 AM
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 sm:mt-14">
          <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-8 sm:gap-x-8">
            <Unit value={parts.days} label="Days" />
            <Lotus className="mt-8 hidden h-4 w-6 shrink-0 text-gold-500/70 sm:block" aria-hidden="true" />
            <Unit value={parts.hours} label="Hours" />
            <Lotus className="mt-8 hidden h-4 w-6 shrink-0 text-gold-500/70 sm:block" aria-hidden="true" />
            <Unit value={parts.minutes} label="Minutes" />
            <Lotus className="mt-8 hidden h-4 w-6 shrink-0 text-gold-500/70 sm:block" aria-hidden="true" />
            <Unit value={parts.seconds} label="Seconds" />
          </div>
        </Reveal>

        <Divider className="mt-12 sm:mt-14" />
        <Reveal delay={0.1}>
          <p className="mt-8 font-script text-2xl text-gold-300/90 sm:text-3xl">
            {done ? "The celebration has begun" : "until two hearts become one"}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
