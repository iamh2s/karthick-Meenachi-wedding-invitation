
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
import FinalSection from "./components/FinalSection";
import Effects from "./components/Effects";
import { SectionBand } from "./components/Ornaments";
import SideNav from "./components/SideNavbar";
import ContactButton from "./components/ContactButton";
import ScrollStack from "./components/ScrollCover";
import Guide from "./components/Guide";

type Stage = "card" | "video" | "couple" | "site";

export default function App() {
  const [stage, setStage] = useState<Stage>("card");

  const PHONE_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";

  const LAPTOP_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";

  void PHONE_VIDEO;
  void LAPTOP_VIDEO;

  const handleCardOpen = () => setStage("video");
  const handleVideoComplete = () => setStage("couple");
  const handleCoupleComplete = () => setStage("site");

  const musicActive = stage === "couple" || stage === "site";

  return (
    <>
      <VideoPreloader />

      {stage === "card" && (
        <InvitationCard onOpen={handleCardOpen} />
      )}

      {stage === "video" && (
        <InvitationIntro onComplete={handleVideoComplete} />
      )}

      {stage === "couple" && (
        <CoupleReveal onComplete={handleCoupleComplete} />
      )}

      {/* Keep the audio component mounted across stages. */}
      <BackgroundAudio autoPlayAfterIntro={musicActive} />

      {stage === "site" && (
        <main
          className="
            velvet relative min-h-screen
            font-body text-ivory-100
          "
        >
          <a
            href="#story"
            className="
              sr-only focus:not-sr-only focus:fixed
              focus:left-4 focus:top-4 focus:z-[100]
              focus:border focus:border-gold-400
              focus:bg-maroon-900 focus:px-4
              focus:py-2 focus:text-sm focus:text-gold-200
            "
          >
            Skip to content
          </a>

          <div
            id="home"
            className="
              pointer-events-none absolute left-0
              top-0 h-screen w-full
            "
            aria-hidden="true"
          />

          <div className="relative z-10">
            <ScrollStack
              layers={[
                {
                  id: "hero-layer",
                  node: (
                    <div className="h-screen overflow-hidden">
                      <TempleOpening />
                    </div>
                  ),
                },
                {
                  id: "couple",
                  node: <CoupleSection />,
                },
                {
                  id: "details",
                  band: <SectionBand />,
                  node: <DetailsSection />,
                },
                {
                  id: "events",
                  band: <SectionBand />,
                  node: <TimelineSection />,
                },
                {
                  id: "gallery",
                  band: <SectionBand />,
                  node: (
                    <>
                      <GallerySection />
                      <MessageSection />
                    </>
                  ),
                },
                {
                  id: "countdown",
                  band: <SectionBand />,
                  node: <CountdownSection />,
                },
                {
                  id: "developer",
                  node: <FinalSection />,
                },
              ]}
            />

            <div id="contact" />
          </div>

          <Effects />

          <div
            className="
              noise-overlay pointer-events-none
              fixed inset-0 z-[34]
            "
            aria-hidden="true"
          />

          <div
            className="
              vignette pointer-events-none
              fixed inset-0 z-[36]
            "
            aria-hidden="true"
          />

          {/* The guide finds the real interactive elements
              inside these component wrappers. */}
          <div data-guide-target="navigation" className="contents">
            <SideNav />
          </div>

          <div data-guide-target="phone" className="contents">
            <ContactButton />
          </div>

          <div data-guide-target="music" className="contents">
            {/* BackgroundAudio is mounted above.
                This wrapper is only a target fallback. */}
          </div>

          <Guide />
        </main>
      )}
    </>
  );
}
