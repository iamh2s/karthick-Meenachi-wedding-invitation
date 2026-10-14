
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Gift, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import AdminGiftPanel from "./components/AdminPanel";
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
import GiftPage from "./GiftPage";
import GiftInstructions from "./components/GiftInstructions";

type Stage = "card" | "video" | "couple" | "site";

const ROUTE_SECTIONS: Record<string, string> = {
  home: "home",
  couple: "couple",
  details: "details",
  events: "events",
  gallery: "gallery",
  countdown: "countdown",
  "send-gift": "send-gift",
  developer: "developer",
};

function InvitationSite() {
  const location = useLocation();

  const sectionName = location.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];

  const isSectionRoute = Boolean(ROUTE_SECTIONS[sectionName]);

  const [stage, setStage] = useState<Stage>(() =>
    isSectionRoute ? "site" : "card"
  );

  const handleCardOpen = () => setStage("video");
  const handleVideoComplete = () => setStage("couple");
  const handleCoupleComplete = () => setStage("site");

  const musicActive = stage === "couple" || stage === "site";

  useEffect(() => {
    if (!isSectionRoute) return;

    setStage("site");

    const targetId = ROUTE_SECTIONS[sectionName];

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [location.pathname, isSectionRoute, sectionName]);

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

      <BackgroundAudio autoPlayAfterIntro={musicActive} />

      {stage === "site" && (
        <main className="velvet relative min-h-screen font-body text-ivory-100">
          <a
            href="#story"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-gold-400 focus:bg-maroon-900 focus:px-4 focus:py-2 focus:text-sm focus:text-gold-200"
          >
            Skip to content
          </a>

          <div
            id="home"
            className="pointer-events-none absolute left-0 top-0 h-screen w-full"
            aria-hidden="true"
          />

          <div id="story" className="relative z-10">
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
                  id: "send-gift",
                  band: <SectionBand />,
                  node: (
                    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#210710] px-6 py-20 text-center">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b08a4a]/10 blur-[100px]"
                      />

                      <motion.div
                        className="relative z-10 mx-auto max-w-2xl"
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.9 }}
                      >
                        <span className="mb-5 block text-4xl text-[#d8b878]">
                          ♡
                        </span>

                        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#d8b878]/80">
                          A Little Token of Love
                        </p>

                        <h2
                          className="mb-6 text-4xl font-light leading-tight text-[#f4e6c9] sm:text-6xl"
                          style={{
                            fontFamily:
                              '"Cormorant Garamond", Georgia, serif',
                          }}
                        >
                          Your Blessings Are
                          <br />
                          Our Greatest Gift
                        </h2>

                        <p className="mx-auto mb-9 max-w-xl text-base leading-8 text-[#f4e6c9]/70 sm:text-lg">
                          Your presence and blessings mean the world to us. If
                          you wish to share a gift as we begin our new journey
                          together, we would be truly grateful.
                        </p>

                        <motion.div
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          className="inline-block"
                        >
                          <Link
                            to="/gift-instructions"
                            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border border-[#c6a365] bg-gradient-to-r from-[#572036] to-[#320b19] px-8 py-4 text-sm tracking-[0.16em] text-[#f4dfad] shadow-[0_0_25px_rgba(198,163,101,0.12)] transition-all duration-500 hover:shadow-[0_0_35px_rgba(198,163,101,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c987]"
                          >
                            <motion.span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent"
                              animate={{ left: ["-50%", "130%"] }}
                              transition={{
                                duration: 2.8,
                                repeat: Infinity,
                                repeatDelay: 1.5,
                                ease: "easeInOut",
                              }}
                            />

                            <Gift size={18} strokeWidth={1.5} />

                            <span className="relative">SEND A GIFT</span>

                            <ArrowUpRight size={16} />
                          </Link>
                        </motion.div>

                        <p className="mt-6 text-xs tracking-widest text-[#d8b878]/50">
                          WITH LOVE &amp; GRATITUDE
                        </p>
                      </motion.div>
                    </section>
                  ),
                },
                {
                  id: "developer",
                  node: <FinalSection />,
                },
              ]}
            />
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

          <div data-guide-target="navigation" className="contents">
            <SideNav />
          </div>

          <div data-guide-target="contact" className="contents">
            <ContactButton />
          </div>

          <Guide />
        </main>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationSite />} />

        {/* Wedding gift payment form */}
        <Route path="/gift" element={<GiftPage />} />

        {/* Separate instructions page with 7-second countdown */}
        <Route
          path="/gift-instructions"
          element={<GiftInstructions />}
        />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminGiftPanel />} />

        {/* Invitation sections */}
        <Route path="/home" element={<InvitationSite />} />
        <Route path="/couple" element={<InvitationSite />} />
        <Route path="/details" element={<InvitationSite />} />
        <Route path="/events" element={<InvitationSite />} />
        <Route path="/gallery" element={<InvitationSite />} />
        <Route path="/countdown" element={<InvitationSite />} />
        <Route path="/send-gift" element={<InvitationSite />} />
        <Route path="/developer" element={<InvitationSite />} />

        {/* Fallback */}
        <Route path="*" element={<InvitationSite />} />
      </Routes>
    </BrowserRouter>
  );
}
