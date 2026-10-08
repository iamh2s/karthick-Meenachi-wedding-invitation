import {
  CalendarHeart,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";

import { wedding } from "../data";
import { Divider } from "./Ornaments";
import { SectionHeading } from "./Reveal";

/*
|--------------------------------------------------------------------------
| DETAIL CARD
|--------------------------------------------------------------------------
|
| Individual wedding detail card.
|
| AOS animations:
|
| Left card   → fade-right
| Center card → fade-up
| Right card  → fade-left
|
*/

function DetailCard({
  icon: Icon,
  label,
  primary,
  lines,
  animation,
  delay = 0,
}: {
  icon: typeof Clock;
  label: string;
  primary: string;
  lines: string[];
  animation: "fade-right" | "fade-up" | "fade-left";
  delay?: number;
}) {
  return (
    <article
      data-aos={animation}
      data-aos-delay={delay}
      data-aos-duration="650"
      data-aos-easing="ease-out-cubic"
      className="
        ornate-border
        velvet-panel
        group
        relative
        flex
        h-full
        flex-col
        items-center
        px-7
        py-11
        text-center
        transition-transform
        duration-700
        hover:-translate-y-1.5
      "
    >
      {/* =========================================================
          ICON
      ========================================================= */}

      <span
        className="
          grid
          h-14
          w-14
          place-items-center
          rounded-full
          border
          border-gold-400/45
          bg-maroon-900/70
          text-gold-300
          shadow-[0_0_22px_rgba(217,185,104,0.14)]
          transition-shadow
          duration-500
          group-hover:shadow-[0_0_30px_rgba(217,185,104,0.3)]
        "
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={1.5}
        />
      </span>

      {/* =========================================================
          LABEL
      ========================================================= */}

      <p className="kicker mt-6">
        {label}
      </p>

      {/* =========================================================
          PRIMARY TITLE
      ========================================================= */}

      <h3
        className="
          mt-3.5
          text-balance
          font-display
          text-[1.4rem]
          font-semibold
          leading-snug
          text-ivory-50
          sm:text-[1.65rem]
        "
      >
        {primary}
      </h3>

      {/* =========================================================
          DIVIDER
      ========================================================= */}

      <Divider
        className="mt-5"
        tone="text-gold-500/80"
      />

      {/* =========================================================
          DETAILS
      ========================================================= */}

      <div className="mt-5 space-y-1.5">
        {lines.map((line) => (
          <p
            key={line}
            className="
              font-body
              text-[0.95rem]
              italic
              leading-relaxed
              text-ivory-200/78
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
| DETAILS SECTION
|--------------------------------------------------------------------------
*/

export default function DetailsSection() {
  return (
    <section
      id="details"
      className="relative py-24 sm:py-32"
      aria-labelledby="details-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* =======================================================
            SECTION HEADING
        ======================================================= */}

        <SectionHeading
          kicker="The auspicious occasion"
          title="Wedding Details"
        />

        {/* =======================================================
            DETAIL CARDS
        ======================================================= */}

        <div className="mt-16 grid gap-7 sm:mt-20 md:grid-cols-3">

          {/* =====================================================
              LEFT CARD

              Animation:
              Comes from LEFT → CENTER
          ===================================================== */}

          <DetailCard
            icon={Clock}
            label="Kalyana Muhurtham"
            primary={wedding.dateDisplay}
            lines={[
              `Muhurtham ${wedding.muhurtham}`,
              "Guests are requested to be seated by 8:45 AM",
            ]}
            animation="fade-right"
            delay={0}
          />

          {/* =====================================================
              CENTER CARD

              Animation:
              Comes from BOTTOM → CENTER
          ===================================================== */}

          <DetailCard
            icon={CalendarHeart}
            label="Grand Reception"
            primary="Sunday Evening"
            lines={[
              "6:30 PM onwards",
              "Dinner & blessings with the newly-wed couple",
            ]}
            animation="fade-up"
            delay={100}
          />

          {/* =====================================================
              RIGHT CARD

              Animation:
              Comes from RIGHT → CENTER
          ===================================================== */}

          <DetailCard
            icon={MapPin}
            label="The Venue"
            primary={wedding.venue.name}
            lines={[
              wedding.venue.line1,
              wedding.venue.line2,
            ]}
            animation="fade-left"
            delay={0}
          />

        </div>

        {/* =======================================================
            GOOGLE MAPS BUTTON
        ======================================================= */}

        <div
          data-aos="fade-up"
          data-aos-delay="150"
          data-aos-duration="600"
          data-aos-easing="ease-out-cubic"
          className="mt-14 text-center"
        >
          <a
            href={wedding.venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            <MapPin
              className="h-4 w-4"
              strokeWidth={1.5}
            />

            <span>
              View on Google Maps
            </span>

            <ExternalLink
              className="h-3.5 w-3.5 opacity-70"
              strokeWidth={1.5}
            />
          </a>
        </div>

      </div>
    </section>
  );
}