import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { wedding } from "../data";
import { Corner, Divider, Mandala } from "./Ornaments";
import { Reveal, RevealImage, SectionHeading } from "./Reveal";

export default function VenueSection() {
  return (
    <section
      id="venue"
      className="relative py-24 sm:py-32"
      aria-labelledby="venue-heading"
    >
      <Mandala
        className="pointer-events-none absolute -left-40 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 text-gold-500/12 lg:block"
        petals={18}
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading kicker="Where we wed" title="The Venue" />

        <div className="mt-16 grid items-stretch gap-10 sm:mt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          {/* information */}
          <Reveal>
            <div className="ornate-border velvet-panel relative flex h-full flex-col justify-center px-8 py-12 sm:px-12">
              <Corner className="absolute top-2 left-2 h-6 w-6 text-gold-300/80" />
              <Corner className="absolute top-2 right-2 h-6 w-6 rotate-90 text-gold-300/80" />
              <Corner className="absolute bottom-2 right-2 h-6 w-6 rotate-180 text-gold-300/80" />
              <Corner className="absolute bottom-2 left-2 h-6 w-6 -rotate-90 text-gold-300/80" />

              <p className="font-caps text-[0.58rem] uppercase leading-[1.8] tracking-[0.34em] text-gold-400/90 sm:text-[0.62rem] sm:tracking-[0.44em]">
                Sri Kapaleeswarar
              </p>
              <h3 className="text-gold mt-4 text-balance font-display text-[1.8rem] font-semibold leading-tight sm:text-4xl">
                Kalyana Mandapam
              </h3>
              <Divider className="mt-7 justify-start" tone="text-gold-500" />
              <address className="mt-7 space-y-1.5 font-body text-lg not-italic leading-relaxed text-ivory-200/85">
                <p>{wedding.venue.line1}</p>
                <p>{wedding.venue.line2}</p>
              </address>
              <p className="mt-6 font-body text-[0.95rem] italic leading-[1.85] text-ivory-300/72">
                In the sacred shadow of the Mylapore temple tower, our mandapam
                opens its carved doors to you. Valet parking is available at the
                eastern gate.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href={wedding.venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                >
                  <Navigation className="h-4 w-4" strokeWidth={1.5} />
                  <span>Get Directions</span>
                </a>
                <a
                  href={wedding.venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-b border-gold-400/40 pb-1 font-caps text-[0.66rem] uppercase tracking-[0.3em] text-ivory-300/85 transition-colors duration-500 hover:text-gold-200"
                >
                  <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* map */}
          <Reveal delay={0.15}>
            <RevealImage className="h-full">
              <div className="mapframe ornate-border relative h-full min-h-[320px] overflow-hidden sm:min-h-[420px]">
                <iframe
                  title={`Map — ${wedding.venue.name}, ${wedding.venue.line2}`}
                  src={wedding.venue.mapsEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
                <div className="pointer-events-none absolute inset-0 border border-gold-400/30" />
                <div className="pointer-events-none absolute inset-2 border border-gold-400/12" />
              </div>
            </RevealImage>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
