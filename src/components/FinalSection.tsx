import { images, wedding } from "../data";
import { Divider, GoldFrame, MonogramSeal } from "./Ornaments";
import { Reveal } from "./Reveal";

export default function FinalSection() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="final-heading"
    >
      <div className="relative min-h-[92vh]">
        {/* Temple backdrop */}
        <div className="absolute inset-0">
          <img
            src={images.templePillars}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-maroon-950/62" />

          <div className="absolute inset-0 bg-gradient-to-b from-maroon-950 via-maroon-950/35 to-maroon-950" />

          <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_48%,rgba(240,200,120,0.1),rgba(0,0,0,0)_70%)] mix-blend-screen" />
        </div>

        {/* Decorative frame */}
        <GoldFrame
          inset="inset-3 sm:inset-6 lg:inset-8"
          opacity="opacity-70"
        />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-center px-5 py-28 text-center sm:px-6 sm:py-32">
          {/* Monogram */}
          <Reveal>
            <MonogramSeal
              letters={`${wedding.monogramLeft}·${wedding.monogramRight}`}
              className="mx-auto h-16 w-16"
              letterClassName="text-base"
            />
          </Reveal>

          {/* Blessing */}
          <Reveal delay={0.1}>
            <p className="mx-auto mt-9 max-w-xl text-pretty font-body text-base italic leading-[1.95] text-ivory-100/85 sm:mt-10 sm:text-xl sm:leading-loose">
              {wedding.blessing}
            </p>
          </Reveal>

          {/* Couple names */}
          <Reveal delay={0.18}>
            <h2
              id="final-heading"
              className="mt-10 font-display font-semibold leading-[1.04] tracking-wide [filter:drop-shadow(0_4px_22px_rgba(0,0,0,0.6))] sm:mt-12"
            >
              <span className="block text-[2.7rem] text-gold sm:text-7xl">
                {wedding.groom.name}
              </span>

              <span className="my-1.5 block font-script text-[1.7rem] text-ivory-100/90 sm:my-2 sm:text-4xl">
                and
              </span>

              <span className="block text-[2.7rem] text-gold sm:text-7xl">
                {wedding.bride.name}
              </span>
            </h2>
          </Reveal>

          {/* Wedding message */}
          <Reveal delay={0.26}>
            <Divider className="mt-8 sm:mt-10" />

            <p className="mt-7 pl-[0.42em] font-engraved text-xs tracking-[0.42em] text-ivory-100/90 sm:mt-8 sm:text-base">
              {wedding.dateShort}
            </p>

            <p className="mt-8 text-pretty font-script text-[1.75rem] leading-snug text-gold-200 sm:mt-10 sm:text-[2.6rem]">
              With love, we await the honour
              <br />
              of your presence
            </p>
          </Reveal>

          {/* Highlighted developer details */}
          <Reveal delay={0.34}>
            <div className="mt-14 w-full max-w-md sm:mt-16">
              <div className="relative overflow-hidden rounded-2xl border border-gold-400/35 bg-maroon-950/65 px-6 py-7 shadow-[0_0_35px_rgba(212,164,74,0.12)] backdrop-blur-md sm:px-10 sm:py-8">
                {/* Inner gold border */}
                <div className="pointer-events-none absolute inset-2 rounded-xl border border-gold-300/10" />

                {/* Decorative glow */}
                <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-48 -translate-x-1/2 rounded-full bg-gold-400/10 blur-3xl" />

                <div className="relative z-10">
                  <p className="font-caps text-[0.58rem] uppercase tracking-[0.38em] text-gold-300/75 sm:text-[0.65rem] sm:tracking-[0.45em]">
                    Website Crafted &amp; Developed By
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-wide text-gold-200 sm:text-3xl">
                    {wedding.developer.name}
                  </h3>

                  <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

                  <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-ivory-100/70 sm:text-base">
                    Designed with creativity, elegance, and love to celebrate
                    this beautiful beginning.
                  </p>

                  {/* Developer action buttons */}
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <a
                      href={wedding.developer.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-gold-300/60 bg-gold-400/10 px-5 py-2.5 font-caps text-[0.62rem] uppercase tracking-[0.2em] text-gold-200 transition-all duration-500 hover:border-gold-200 hover:bg-gold-300/20 hover:text-gold-100 hover:shadow-[0_0_20px_rgba(212,164,74,0.18)]"
                    >
                      View Portfolio
                    </a>

                    <a
                      href={wedding.developer.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-ivory-100/20 px-5 py-2.5 font-caps text-[0.62rem] uppercase tracking-[0.2em] text-ivory-100/75 transition-all duration-500 hover:border-gold-300/50 hover:text-gold-200"
                    >
                      Contact Developer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Footer strip */}
        <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-gold-500/15 bg-maroon-950/80 px-6 py-5 text-center backdrop-blur-sm">
          <p className="font-caps text-[0.56rem] uppercase leading-[2] tracking-[0.34em] text-gold-400/65 sm:text-[0.62rem] sm:tracking-[0.42em]">
            {wedding.groom.name} &amp; {wedding.bride.name} · MMXXVI · Crafted
            with love &amp; blessings
          </p>

          <p className="mt-1 font-caps text-[0.56rem] uppercase leading-[2] tracking-[0.26em] text-ivory-300/60 sm:text-[0.6rem] sm:tracking-[0.32em]">
            Website by{" "}
            <a
              href={wedding.developer.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-gold-400/50 pb-0.5 font-semibold text-gold-300 transition-colors duration-500 hover:border-gold-200 hover:text-gold-100"
            >
              {wedding.developer.name}
            </a>
          </p>
        </footer>
      </div>
    </section>
  );
}