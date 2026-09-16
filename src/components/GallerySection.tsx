import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { gallery } from "../data";
import { GoldFrame } from "./Ornaments";
import { SectionHeading, EASE } from "./Reveal";
import { cn } from "../utils/cn";

export default function GallerySection() {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((i) =>
        i === null ? i : (i + dir + gallery.length) % gallery.length
      ),
    []
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, step]);

  return (
    <section
      id="gallery"
      className="relative py-24 sm:py-32"
      aria-labelledby="gallery-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="Moments in gold"
          title="A Glimpse of the Celebration"
        />

        <div className="mt-16 grid grid-cols-2 gap-3 [grid-auto-rows:150px] sm:mt-20 sm:gap-4 sm:[grid-auto-rows:200px] lg:[grid-auto-rows:230px] md:grid-cols-4">
          {gallery.map((item, i) => (
            <motion.button
              key={item.caption}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "group relative overflow-hidden bg-maroon-950 text-left",
                item.span
              )}
              initial={reduced ? false : { opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.05, delay: (i % 4) * 0.08, ease: EASE }}
              aria-label={`Open photograph — ${item.caption}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.055]"
              />
              <div className="pointer-events-none absolute inset-0 border border-gold-400/25 transition-colors duration-700 group-hover:border-gold-300/60" />
              <div className="pointer-events-none absolute inset-2 border border-gold-400/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/85 via-maroon-950/10 to-transparent opacity-75 transition-opacity duration-700 group-hover:opacity-95" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-5">
                <p className="text-pretty font-display text-[0.82rem] italic leading-snug text-ivory-100/95 sm:text-xl">
                  {item.caption}
                </p>
                <span className="mb-1 hidden h-1.5 w-1.5 rotate-45 bg-gold-400/80 sm:block" aria-hidden="true" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.p
          className="mt-10 text-center font-body text-sm italic text-ivory-300/65"
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          Photographs from our engagement &amp; pre-wedding moments — more to follow the wedding.
        </motion.p>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-maroon-950/94 p-4 backdrop-blur-sm sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`Photograph — ${gallery[active].caption}`}
          >
            <motion.figure
              className="relative max-h-full"
              initial={reduced ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.55, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={gallery[active].src}
                alt={gallery[active].alt}
                className="max-h-[76vh] w-auto max-w-full object-contain shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
              />
              <GoldFrame inset="inset-2" opacity="opacity-90" />
              <figcaption className="mt-5 text-center font-display text-lg italic text-ivory-100 sm:text-xl">
                {gallery[active].caption}
              </figcaption>

              <button
                type="button"
                onClick={close}
                className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full border border-gold-400/50 bg-maroon-900 text-gold-200 transition-colors hover:text-gold-100"
                aria-label="Close gallery"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.figure>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gold-400/40 bg-maroon-900/85 text-gold-200 transition-colors hover:text-gold-100 sm:left-8"
              aria-label="Previous photograph"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gold-400/40 bg-maroon-900/85 text-gold-200 transition-colors hover:text-gold-100 sm:right-8"
              aria-label="Next photograph"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
