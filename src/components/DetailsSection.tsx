import { CalendarHeart, Clock, MapPin, ExternalLink } from "lucide-react";
import { wedding } from "../data";
import { Divider } from "./Ornaments";
import { Reveal, SectionHeading } from "./Reveal";

function DetailCard({
  icon: Icon,
  label,
  primary,
  lines,
  delay,
}: {
  icon: typeof Clock;
  label: string;
  primary: string;
  lines: string[];
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <article className="ornate-border velvet-panel group relative flex h-full flex-col items-center px-7 py-11 text-center transition-transform duration-700 hover:-translate-y-1.5">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-gold-400/45 bg-maroon-900/70 text-gold-300 shadow-[0_0_22px_rgba(217,185,104,0.14)] transition-all duration-700 group-hover:shadow-[0_0_30px_rgba(217,185,104,0.3)]">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <p className="kicker mt-6">{label}</p>
        <h3 className="mt-3.5 text-balance font-display text-[1.4rem] font-semibold leading-snug text-ivory-50 sm:text-[1.65rem]">
          {primary}
        </h3>
        <Divider className="mt-5" tone="text-gold-500/80" />
        <div className="mt-5 space-y-1.5">
          {lines.map((l) => (
            <p key={l} className="font-body text-[0.95rem] italic leading-relaxed text-ivory-200/78">
              {l}
            </p>
          ))}
        </div>
      </article>
    </Reveal>
  );
}

export default function DetailsSection() {
  return (
    <section
      id="details"
      className="relative py-24 sm:py-32"
      aria-labelledby="details-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="The auspicious occasion"
          title="Wedding Details"
        />

        <div className="mt-16 grid gap-7 sm:mt-20 md:grid-cols-3">
          <DetailCard
            icon={Clock}
            label="Kalyana Muhurtham"
            primary={wedding.dateDisplay}
            lines={[`Muhurtham ${wedding.muhurtham}`, "Guests are requested to be seated by 8:45 AM"]}
            delay={0}
          />
          <DetailCard
            icon={CalendarHeart}
            label="Grand Reception"
            primary="Sunday Evening"
            lines={["6:30 PM onwards", "Dinner & blessings with the newly-wed couple"]}
            delay={0.14}
          />
          <DetailCard
            icon={MapPin}
            label="The Venue"
            primary={wedding.venue.name}
            lines={[wedding.venue.line1, wedding.venue.line2]}
            delay={0.28}
          />
        </div>

        <Reveal delay={0.2} className="mt-14 text-center">
          <a
            href={wedding.venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
            <span>View on Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" strokeWidth={1.5} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
