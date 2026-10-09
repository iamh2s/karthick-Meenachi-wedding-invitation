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

/* Floating contact button — scrolls to #contact */
import ContactButton from "./components/ContactButton";

/* NEW: scroll-driven stacked sections */
import ScrollStack from "./components/ScrollCover";


type Stage = "card" | "video" | "couple" | "site";


export default function App() {

  const [stage, setStage] = useState<Stage>("card");


  /* ==========================================================
     VIDEO URLS
  ========================================================== */

  const PHONE_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";

  const LAPTOP_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";

  void PHONE_VIDEO;
  void LAPTOP_VIDEO;


  /* ==========================================================
     STAGE FLOW (unchanged)

     card → video → couple → site
  ========================================================== */

  const handleCardOpen = () => setStage("video");
  const handleVideoComplete = () => setStage("couple");
  const handleCoupleComplete = () => setStage("site");


  /* Music starts during Couple Reveal and continues into the site. */
  const musicActive = stage === "couple" || stage === "site";


  return (
    <>
      {/* Always mounted so Cloudinary video starts loading immediately */}
      <VideoPreloader />


      {/* PART 1 — INVITATION CARD */}
      {stage === "card" && (
        <InvitationCard onOpen={handleCardOpen} />
      )}


      {/* PART 2 — CINEMATIC VIDEO */}
      {stage === "video" && (
        <InvitationIntro onComplete={handleVideoComplete} />
      )}


      {/* PART 3 — GROOM + BRIDE REVEAL */}
      {stage === "couple" && (
        <CoupleReveal onComplete={handleCoupleComplete} />
      )}


      {/* PERSISTENT MUSIC */}
      <BackgroundAudio autoPlayAfterIntro={musicActive} />


      {/* =====================================================
          MAIN WEDDING WEBSITE
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

          {/* ACCESSIBILITY */}
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


          {/* HOME ANCHOR */}
          <div
            id="home"
            className="
              pointer-events-none
              absolute
              left-0
              top-0
              h-screen
              w-full
            "
            aria-hidden="true"
          />


          {/* =================================================
              WEDDING CONTENT
          ================================================= */}

          <div className="relative z-10">

            {/* =============================================
                SCROLL STACK
                Each module slides up over the previous one:
                Hero → Couple → Details → Events → Gallery →
                Countdown → Venue → Final
            ============================================= */}

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
                { id: "couple", node: <CoupleSection /> },
                { id: "details", band: <SectionBand />, node: <DetailsSection /> },
                { id: "events", band: <SectionBand />, node: <TimelineSection /> },
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
                { id: "countdown", band: <SectionBand />, node: <CountdownSection /> },

                /* If you have a Contact component, add it as its own
                   layer here and remove the #contact anchor below:
                   { id: "contact", band: <SectionBand />, node: <Contact /> }, */

                { id: "developer", node: <FinalSection /> },
              ]}
            />

            {/* CONTACT anchor (target of ContactButton) */}
            <div id="contact" />

          </div>


          {/* EFFECTS */}
          <Effects />


          {/* NOISE */}
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


          {/* VIGNETTE */}
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


          {/* SIDE NAV */}
          <SideNav />


          {/* CONTACT BUTTON — scrolls to #contact */}
          <ContactButton />

        </main>
      )}

    </>
  );
}