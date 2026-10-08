import { useEffect } from "react";

const PHONE_VIDEO =
  "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/phone";

const LAPTOP_VIDEO =
  "https://res.cloudinary.com/kpkj3xqw/video/upload/q_auto,f_auto/laptop_1";

export default function VideoPreloader() {
  useEffect(() => {
    const isMobile = window.matchMedia(
      "(max-width: 768px)"
    ).matches;

    const videoUrl = isMobile
      ? PHONE_VIDEO
      : LAPTOP_VIDEO;

    const video = document.createElement("video");

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    /*
     * Keep video hidden.
     * It starts downloading immediately when App loads.
     */
    video.style.position = "fixed";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";

    video.src = videoUrl;

    document.body.appendChild(video);

    /*
     * Start loading immediately.
     */
    video.load();

    console.log(
      "🎬 Preloading:",
      isMobile ? "PHONE VIDEO" : "LAPTOP VIDEO"
    );

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
  }, []);

  return null;
}