import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./InvitationIntro.css";

interface InvitationIntroProps {
  onComplete: () => void;
  onAudioReady?: (media: HTMLMediaElement) => void;
}

export default function InvitationIntro({
  onComplete,
  onAudioReady,
}: InvitationIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSkip, setShowSkip] = useState(false);
  const [skipReady, setSkipReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  /*
   * Complete intro only once
   */
  const completeIntro = () => {
    if (completedRef.current) return;

    completedRef.current = true;
    setIsExiting(true);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    exitTimerRef.current = setTimeout(() => {
      onComplete();
    }, 650);
  };

  /*
   * Automatically play video WITH SOUND
   *
   * We do not intentionally mute the video.
   * If Chrome blocks unmuted autoplay, the browser
   * will reject video.play().
   */
  const startVideoAutomatically = async () => {
    const video = videoRef.current;

    if (!video) return;

    // Ensure the video is not muted
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    try {
      await video.play();

      console.log("✅ Video started automatically WITH SOUND");

      onAudioReady?.(video);
    } catch (error) {
      console.error(
        "❌ Browser blocked automatic sound playback:",
        error
      );
    }
  };

  /*
   * Show Skip after 5 seconds
   * Make Skip Intro prominent after 10 seconds
   */
  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.currentTime >= 5) {
      setShowSkip(true);
    }

    if (video.currentTime >= 10) {
      setSkipReady(true);
    }
  };

  /*
   * Video finished
   */
  const handleVideoEnded = () => {
    completeIntro();
  };

  /*
   * Start video automatically
   */
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    startVideoAutomatically();

    return () => {
      video.pause();

      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.main
          className="invitation-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* =====================================================
              BACKGROUND
          ====================================================== */}
          <div className="intro-background">
            <div className="intro-glow intro-glow-one" />
            <div className="intro-glow intro-glow-two" />
            <div className="intro-vignette" />
            <div className="intro-grain" />
          </div>

          {/* =====================================================
              GOLD PARTICLES
          ====================================================== */}
          <div
            className="gold-particles"
            aria-hidden="true"
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className={`particle particle-${index + 1}`}
              />
            ))}
          </div>

          {/* =====================================================
              VIDEO + FRAME CONTAINER
          ====================================================== */}
          <div className="intro-media-container">

            {/* GOLD FRAME */}
            <div
              className="intro-frame"
              aria-hidden="true"
            >
              <span className="frame-corner frame-top-left" />
              <span className="frame-corner frame-top-right" />
              <span className="frame-corner frame-bottom-left" />
              <span className="frame-corner frame-bottom-right" />
            </div>

            {/* VIDEO */}
            <motion.div
              className={`intro-video-wrapper ${
                videoReady ? "video-loaded" : ""
              }`}
              initial={{
                scale: 1.04,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: videoReady ? 1 : 0.85,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
            >
              <video
                ref={videoRef}
                className="intro-video"
                autoPlay
                playsInline
                preload="auto"
                muted={false}
                onCanPlay={() => setVideoReady(true)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
              >
                {/* MOBILE / TABLET */}
                <source
                  src="/Video/phone.mp4"
                  media="(max-width: 768px)"
                  type="video/mp4"
                />

                {/* LAPTOP / DESKTOP */}
                <source
                  src="/Video/laptop.mp4"
                  media="(min-width: 769px)"
                  type="video/mp4"
                />
                <source
          src="/Video/laptop.mp4"
          media="(min-width: 769px)"
          type="video/mp4"
        />

                Your browser does not support video playback.
              </video>

              <div className="video-shine" />
            </motion.div>
          </div>

          {/* =====================================================
              SKIP BUTTON
          ====================================================== */}
          <AnimatePresence>
            {showSkip && (
              <motion.button
                className={`skip-intro-button ${
                  skipReady ? "skip-ready" : ""
                }`}
                onClick={completeIntro}
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 18,
                }}
                transition={{
                  duration: 0.4,
                }}
                type="button"
                aria-label="Skip intro video"
              >
                <span>
                  {skipReady ? "Skip Intro" : "Skip"}
                </span>

                <span className="skip-arrow">
                  →
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.main>
      )}
    </AnimatePresence>
  );
}