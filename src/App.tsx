import { useState } from "react";

import InvitationCard from "./components/InvitationEnvelope";
import InvitationIntro from "./components/InvitationIntro";
import CoupleReveal from "./components/Couplerevel";
import VideoPreloader from "./components/VideoPreloader";

import BackgroundAudio from "./components/BackgroundAudio";
import TempleOpening from "./components/TempleOpening";
import CoupleSection from "./components/CoupleSection";
import DetailsSection from "./components/DetailsSection";
import TimelineSection from "./components/TimelineSection";
import GallerySection from "./components/GallerySection";
import MessageSection from "./components/MessageSection";
import CountdownSection from "./components/CountdownSection";
import VenueSection from "./components/VenueSection";
import FinalSection from "./components/FinalSection";
import Effects from "./components/Effects";
import { SectionBand } from "./components/Ornaments";

type Stage =
  | "card"
  | "video"
  | "couple"
  | "site";

export default function App() {
  const [stage, setStage] = useState<Stage>("card");

  /*
   * ==========================================================
   * VIDEO URLS
   * ==========================================================
   */

  const PHONE_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";

  const LAPTOP_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";

  /*
   * ==========================================================
   * PART 1
   *
   * User touches "TOUCH TO OPEN"
   *
   * → Part 2 Video
   * ==========================================================
   */

  const handleCardOpen = () => {
    setStage("video");
  };

  /*
   * ==========================================================
   * PART 2
   *
   * Video finishes / Skip Intro
   *
   * → Part 3 Couple
   * ==========================================================
   */

  const handleVideoComplete = () => {
    setStage("couple");
  };

  /*
   * ==========================================================
   * PART 3
   *
   * Groom + Bride animation finishes
   *
   * → Main Website
   *
   * Music continues.
   * ==========================================================
   */

  const handleCoupleComplete = () => {
    setStage("site");
  };

  /*
   * ==========================================================
   * MUSIC
   *
   * BackgroundAudio stays mounted for all stages.
   * ==========================================================
   */

  const musicActive =
    stage === "couple" ||
    stage === "site";

  return (
    <>
      {/* =====================================================
          VIDEO PRELOADER

          IMPORTANT:
          This is ALWAYS mounted.

          Therefore the video starts loading immediately
          when the website opens.

          It does NOT wait for the user to touch
          "TOUCH TO OPEN".
          ===================================================== */}

      <VideoPreloader />

      {/* =====================================================
          PART 1
          OPENING CARD
          ===================================================== */}

      {stage === "card" && (
        <InvitationCard
          onOpen={handleCardOpen}
        />
      )}

      {/* =====================================================
          PART 2
          VIDEO
          ===================================================== */}

      {stage === "video" && (
        <InvitationIntro
          onComplete={handleVideoComplete}
        />
      )}

      {/* =====================================================
          PART 3
          GROOM + BRIDE
          ===================================================== */}

      {stage === "couple" && (
        <CoupleReveal
          onComplete={handleCoupleComplete}
        />
      )}

      {/* =====================================================
          PERSISTENT MUSIC
          ===================================================== */}

      <BackgroundAudio
        autoPlayAfterIntro={musicActive}
      />

      {/* =====================================================
          MAIN WEBSITE
          ===================================================== */}

      {stage === "site" && (
        <main
          className="
            velvet
            relative
            min-h-screen
            font-body
            text-ivory-100
          "
        >

          {/* =================================================
              ACCESSIBILITY
              ================================================= */}

          <a
            href="#story"
            className="
              sr-only
              focus:not-sr-only
              focus:fixed
              focus:left-4
              focus:top-4
              focus:z-[100]
              focus:border
              focus:border-gold-400
              focus:bg-maroon-900
              focus:px-4
              focus:py-2
              focus:text-sm
              focus:text-gold-200
            "
          >
            Skip to content
          </a>

          {/* =================================================
              TEMPLE OPENING
              ================================================= */}

          <TempleOpening />

          {/* =================================================
              WEDDING CONTENT
              ================================================= */}

          <div className="relative z-10">

            <CoupleSection />

            <SectionBand />

            <DetailsSection />

            <SectionBand />

            <TimelineSection />

            <SectionBand />

            <GallerySection />

            <MessageSection />

            <SectionBand />

            <CountdownSection />

            <SectionBand />

            <VenueSection />

            <FinalSection />

          </div>

          {/* =================================================
              EFFECTS
              ================================================= */}

          <Effects />

          {/* =================================================
              NOISE
              ================================================= */}

          <div
            className="
              noise-overlay
              pointer-events-none
              fixed
              inset-0
              z-[34]
            "
            aria-hidden="true"
          />

          {/* =================================================
              VIGNETTE
              ================================================= */}

          <div
            className="
              vignette
              pointer-events-none
              fixed
              inset-0
              z-[36]
            "
            aria-hidden="true"
          />

        </main>
      )}
    </>
  );
}