
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

export default function AudioAmbience() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/Audio/Audio.mp3");

    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";

    audioRef.current = audio;

    const playAudio = async () => {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        // Autoplay was blocked. Wait for the visitor's first interaction.
      }
    };

    const unlockAudio = async () => {
      try {
        await audio.play();
        setPlaying(true);

        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("wheel", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    };

    // Try to play automatically when the page starts.
    void playAudio();

    // Fallback when the browser blocks autoplay.
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("wheel", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      audio.pause();
      audio.currentTime = 0;

      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("wheel", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);

      audioRef.current = null;
    };
  }, []);

  const toggleAudio = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggleAudio}
      className="fixed bottom-5 right-5 z-[80] grid h-12 w-12 place-items-center rounded-full border border-gold-400/40 bg-maroon-950/75 text-gold-300 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-500 hover:border-gold-300/80 hover:text-gold-100 hover:shadow-[0_8px_32px_rgba(217,185,104,0.25)] sm:bottom-7 sm:right-7"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 1.2,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      aria-pressed={playing}
      aria-label={playing ? "Pause wedding music" : "Play wedding music"}
      title={playing ? "Pause music" : "Play music"}
    >
      {!playing && (
        <span
          aria-hidden="true"
          className="animate-soft-glow absolute -inset-[5px] rounded-full border border-gold-400/45"
        />
      )}

      {playing ? (
        <span className="eq-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <Music className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </motion.button>
  );
}