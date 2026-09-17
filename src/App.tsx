import { useState } from "react";

import InvitationCard from "./components/InvitationCard";
import InvitationIntro from "./components/InvitationIntro";
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

export default function App() {
  const [cardOpened, setCardOpened] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  /*
   * This function runs when the visitor taps
   * the wedding invitation card.
   */
  const handleCardOpen = () => {
    setCardOpened(true);
  };

  /*
   * This function runs after the intro video ends
   * or when the visitor clicks Skip Intro.
   */
  const handleIntroComplete = () => {
    setIntroFinished(true);
  };

  return (
    <>
      {/* =====================================================
          STEP 1: WEDDING INVITATION CARD
      ====================================================== */}
      {!cardOpened && !introFinished && (
        <InvitationCard onOpen={handleCardOpen} />
      )}

      {/* =====================================================
          STEP 2: INTRO VIDEO
          It appears only after the card is tapped.
      ====================================================== */}
      {cardOpened && !introFinished && (
        <InvitationIntro
          onComplete={handleIntroComplete}
        />
      )}

      {/* =====================================================
          BACKGROUND AUDIO
          Starts after the intro video is completed.
      ====================================================== */}
      <BackgroundAudio
        autoPlayAfterIntro={introFinished}
      />

      {/* =====================================================
          STEP 3: MAIN WEDDING WEBSITE
      ====================================================== */}
      {introFinished && (
        <main className="velvet relative min-h-screen font-body text-ivory-100">
          {/* Skip to content accessibility link */}
          <a
            href="#story"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-gold-400 focus:bg-maroon-900 focus:px-4 focus:py-2 focus:text-sm focus:text-gold-200"
          >
            Skip to content
          </a>

          {/* Temple opening animation */}
          <TempleOpening />

          <div className="relative z-10">
            {/* Couple section */}
            <CoupleSection />

            <SectionBand />

            {/* Wedding details */}
            <DetailsSection />

            <SectionBand />

            {/* Wedding timeline */}
            <TimelineSection />

            <SectionBand />

            {/* Photo gallery */}
            <GallerySection />

            {/* Special message */}
            <MessageSection />

            <SectionBand />

            {/* Countdown */}
            <CountdownSection />

            <SectionBand />

            {/* Venue details */}
            <VenueSection />

            {/* Final section */}
            <FinalSection />
          </div>

          {/* Visual effects */}
          <Effects />

          {/* Noise overlay */}
          <div
            className="noise-overlay pointer-events-none fixed inset-0 z-[34]"
            aria-hidden="true"
          />

          {/* Vignette overlay */}
          <div
            className="vignette pointer-events-none fixed inset-0 z-[36]"
            aria-hidden="true"
          />
        </main>
      )}
    </>
  );
}