import { memo, useMemo, useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

import { images, wedding } from "../data";
import { Corner, Divider, MonogramSeal } from "./Ornaments";
import { Reveal, RevealImage, SectionHeading } from "./Reveal";
import { cn } from "../utils/cn";

/* ------------------------- Couple card entrance ------------------------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type EnterCustom = {
  delay: number;
  reduced: boolean;
};

const ENTER: Variants = {
  out: { opacity: 0, y: 12 },
  in: ({ delay, reduced }: EnterCustom) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reduced ? 0.25 : 0.55,
      ease: EASE,
      delay: reduced ? 0 : delay,
    },
  }),
};

const Entrance = memo(function Entrance({
  show,
  delay = 0,
  reduced,
  className,
  children,
}: {
  show: boolean;
  delay?: number;
  reduced: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      custom={{ delay, reduced }}
      initial="out"
      animate={show ? "in" : "out"}
      variants={ENTER}
    >
      {children}
    </motion.div>
  );
});

/* ----------------------------- Portrait ----------------------------- */

const TEXT_VARIANTS: Record<"normal" | "reduced", Variants> = {
  normal: {
    out: { opacity: 0, y: 10 },
    in: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.5 },
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
  const text = reduced ? TEXT_VARIANTS.reduced : TEXT_VARIANTS.normal;
  const person = wedding[side];
  const img = side === "groom" ? images.groomImg : images.brideImg;

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

      <motion.div variants={text} className="mt-7 text-center sm:mt-8">
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
  const sectionInView = useInView(sectionRef, { amount: 0.05, once: true });

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

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="story-heading"
    >
      {/* Soft decorative glow; no filmstrip or reel animation */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(23,52,35,0.18),rgba(23,52,35,0)_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative">
          <SectionHeading
            kicker="Two souls, one journey"
            title="The Bride & Groom"
          />
        </div>

        <div className="relative mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={sectionInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{ duration: reduced ? 0.2 : 0.5, delay: reduced ? 0 : 0.2 }}
            >
              <MonogramSeal
                letters="&"
                className="h-16 w-16"
                letterClassName="font-script text-3xl"
              />
            </motion.div>
          </div>

          <Entrance show={sectionInView} reduced={reduced}>
            {groomCard}
          </Entrance>

          <Entrance
            show={sectionInView}
            delay={0.1}
            reduced={reduced}
            className="md:mt-16"
          >
            {brideCard}
          </Entrance>
        </div>
      </div>
    </section>
  );
}
