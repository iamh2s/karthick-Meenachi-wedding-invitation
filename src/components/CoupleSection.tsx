import { images, wedding } from "../data";
import { Corner, Divider, MonogramSeal } from "./Ornaments";
import { Reveal, RevealImage, SectionHeading } from "./Reveal";
import { cn } from "../utils/cn";

function PortraitCard({
  side,
  className,
}: {
  side: "groom" | "bride";
  className?: string;
}) {
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
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/55 via-transparent to-maroon-950/15" />
          <Corner className="absolute top-2 left-2 h-6 w-6 text-gold-300/90" />
          <Corner className="absolute top-2 right-2 h-6 w-6 rotate-90 text-gold-300/90" />
        </div>
      </RevealImage>

      <div className="mt-7 text-center sm:mt-8">
        <p className="kicker">{side === "groom" ? "The Groom" : "The Bride"}</p>
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
      </div>
    </article>
  );
}

export default function CoupleSection() {
  return (
    <section
      id="story"
      className="relative py-24 sm:py-32"
      aria-labelledby="story-heading"
    >
      {/* whisper of temple green behind */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(23,52,35,0.32),rgba(23,52,35,0)_70%)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="Two souls, one journey"
          title="The Bride & Groom"
        />

        <div className="relative mt-14 grid gap-10 sm:mt-20 md:grid-cols-2 md:gap-14 lg:gap-20">
          {/* central ampersand seal */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <MonogramSeal
              letters="&"
              className="h-16 w-16"
              letterClassName="font-script text-3xl"
            />
          </div>
          <Reveal>
            <PortraitCard side="groom" />
          </Reveal>
          <Reveal delay={0.18} className="md:mt-16">
            <PortraitCard side="bride" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
