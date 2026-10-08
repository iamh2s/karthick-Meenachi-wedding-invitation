import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import "./BackgroundAudio.css";

type BackgroundAudioProps = {
  autoPlayAfterIntro: boolean;
};

export default function BackgroundAudio({
  autoPlayAfterIntro,
}: BackgroundAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  /* Start music after couple intro */
  useEffect(() => {
    if (!autoPlayAfterIntro) return;

    const audio = audioRef.current;

    if (!audio) return;

    const startAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn("Audio autoplay was blocked:", error);
      }
    };

    startAudio();
  }, [autoPlayAfterIntro]);

  /* Play / Pause */
  const toggleAudio = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.warn("Audio playback failed:", error);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/Audio/Audio.mpeg"
        preload="auto"
        loop
      />

      <button
        type="button"
        className="audio-control"
        onClick={toggleAudio}
        aria-label={
          isPlaying
            ? "Pause wedding music"
            : "Play wedding music"
        }
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <Volume2
            className="audio-icon"
            size={21}
            strokeWidth={1.6}
          />
        ) : (
          <VolumeX
            className="audio-icon"
            size={21}
            strokeWidth={1.6}
          />
        )}
      </button>
    </>
  );
}