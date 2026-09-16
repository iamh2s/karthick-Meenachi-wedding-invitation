import { wedding } from "../data";
import { Divider, GoldFrame, MonogramSeal } from "./Ornaments";
import { Reveal } from "./Reveal";

export default function MessageSection() {
  return (
    <section
      className="relative py-24 sm:py-36"
      aria-labelledby="message-heading"
    >
      {/* candle-glow halo */}
      <div
        className="animate-soft-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,200,120,0.14),rgba(240,200,120,0)_72%)] mix-blend-screen"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <div className="ornate-border velvet-panel relative px-5 py-14 text-center sm:px-14 sm:py-20">
            <GoldFrame inset="inset-2.5 sm:inset-3.5" />
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2">
              <MonogramSeal
                letters={`${wedding.monogramLeft}·${wedding.monogramRight}`}
                className="h-14 w-14"
                letterClassName="text-sm"
              />
            </div>

            <p className="kicker mt-2">The Invitation</p>
            <h2 className="mt-5 text-balance font-display text-[1.75rem] font-semibold italic text-ivory-50 sm:text-4xl">
              A Word from Our Hearts
            </h2>

            <Divider className="mt-8 sm:mt-9" />

            <blockquote className="mx-auto mt-8 max-w-xl sm:mt-10">
              <p className="text-pretty font-body text-lg leading-[1.9] text-ivory-100/88 sm:text-[1.4rem] sm:leading-[2]">
                “{wedding.message}”
              </p>
            </blockquote>

            <p className="mt-10 text-balance font-script text-[1.7rem] leading-snug text-gold-300/95 sm:mt-12 sm:text-4xl">
              The Families of {wedding.groom.name} &amp; {wedding.bride.name}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
