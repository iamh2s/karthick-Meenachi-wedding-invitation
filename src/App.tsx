import { useState } from "react";

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
  const [introFinished, setIntroFinished] = useState(false);

  const handleIntroComplete = () => {
    setIntroFinished(true);
  };

  return (
    <>
      {!introFinished && (
        <InvitationIntro onComplete={handleIntroComplete} />
      )}

      <BackgroundAudio autoPlayAfterIntro={introFinished} />

      {introFinished && (
        <main className="velvet relative min-h-screen font-body text-ivory-100">
          <a
            href="#story"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-gold-400 focus:bg-maroon-900 focus:px-4 focus:py-2 focus:text-sm focus:text-gold-200"
          >
            Skip to content
          </a>

          <TempleOpening />

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

          <Effects />

          <div
            className="noise-overlay pointer-events-none fixed inset-0 z-[34]"
            aria-hidden="true"
          />

          <div
            className="vignette pointer-events-none fixed inset-0 z-[36]"
            aria-hidden="true"
          />
        </main>
      )}
    </>
  );
}