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
import SideNav from "./components/SideNavbar";

/*
 * CONTACT
 *
 * This is ONLY the floating contact button.
 * Clicking it scrolls to the existing Contact section.
 */
import ContactButton from "./components/ContactButton";


type Stage =
  | "card"
  | "video"
  | "couple"
  | "site";


export default function App() {

  const [stage, setStage] = useState<Stage>("card");


  /* ==========================================================
     VIDEO URLS
  ========================================================== */

  const PHONE_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";

  const LAPTOP_VIDEO =
    "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";


  /*
   * Prevent unused-variable warning if these URLs are
   * currently handled by VideoPreloader / InvitationIntro.
   */
  void PHONE_VIDEO;
  void LAPTOP_VIDEO;


  /* ==========================================================
     PART 1
     
     TOUCH TO OPEN
     
     → VIDEO
  ========================================================== */

  const handleCardOpen = () => {
    setStage("video");
  };


  /* ==========================================================
     PART 2
     
     VIDEO FINISH / SKIP
     
     → COUPLE
  ========================================================== */

  const handleVideoComplete = () => {
    setStage("couple");
  };


  /* ==========================================================
     PART 3
     
     COUPLE REVEAL
     
     → MAIN WEBSITE
  ========================================================== */

  const handleCoupleComplete = () => {
    setStage("site");
  };


  /* ==========================================================
     MUSIC
     
     Music starts during Couple Reveal and continues
     into the main website.
  ========================================================== */

  const musicActive =
    stage === "couple" ||
    stage === "site";


  return (
    <>
      {/* =====================================================
          VIDEO PRELOADER

          Always mounted so Cloudinary video begins loading
          immediately when the website opens.
      ===================================================== */}

      <VideoPreloader />


      {/* =====================================================
          PART 1
          
          INVITATION CARD
      ===================================================== */}

      {stage === "card" && (
        <InvitationCard
          onOpen={handleCardOpen}
        />
      )}


      {/* =====================================================
          PART 2
          
          CINEMATIC VIDEO
      ===================================================== */}

      {stage === "video" && (
        <InvitationIntro
          onComplete={handleVideoComplete}
        />
      )}


      {/* =====================================================
          PART 3
          
          GROOM + BRIDE REVEAL
      ===================================================== */}

      {stage === "couple" && (
        <CoupleReveal
          onComplete={handleCoupleComplete}
        />
      )}


      {/* =====================================================
          PERSISTENT MUSIC
          
          BackgroundAudio remains mounted.
      ===================================================== */}

      <BackgroundAudio
        autoPlayAfterIntro={musicActive}
      />


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
              HOME ANCHOR
          ================================================= */}

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
              TEMPLE OPENING
          ================================================= */}

          <TempleOpening />


          {/* =================================================
              WEDDING CONTENT
          ================================================= */}

          <div className="relative z-10">


            {/* =================================================
                COUPLE
            ================================================= */}

            <div id="couple">
              <CoupleSection />
            </div>


            <SectionBand />


            {/* =================================================
                DETAILS
            ================================================= */}

            <div id="details">
              <DetailsSection />
            </div>


            <SectionBand />


            {/* =================================================
                EVENTS
            ================================================= */}

            <div id="events">
              <TimelineSection />
            </div>


            <SectionBand />


            {/* =================================================
                GALLERY + MESSAGE
            ================================================= */}

            <div id="gallery">

              <GallerySection />

              <MessageSection />

            </div>


            <SectionBand />


            {/* =================================================
                COUNTDOWN
            ================================================= */}

            <div id="countdown">
              <CountdownSection />
            </div>


            <SectionBand />


            {/* =================================================
                VENUE
            ================================================= */}

            <div id="venue">
              <VenueSection />
            </div>


            {/* =================================================
                CONTACT
                 
                IMPORTANT:
                Your existing Contact component/section
                should be here.

                If your Contact section is already inside
                FinalSection, keep it there instead.
            ================================================= */}

            <div id="contact">

              {/* 
                 Put your existing Contact component here.

                 Example:

                 <Contact />

                 Do NOT add it if Contact is already rendered
                 somewhere else in your application.
              */}

            </div>


            {/* =================================================
                FINAL SECTION
            ================================================= */}

            <div id="developer">
              <FinalSection />
            </div>

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


          {/* =================================================
              SIDE NAV
          ================================================= */}

          <SideNav />


          {/* =================================================
              CONTACT BUTTON
              
              Clicking this scrolls to:
              
              #contact
          ================================================= */}

          <ContactButton />

        </main>
      )}

    </>
  );
}