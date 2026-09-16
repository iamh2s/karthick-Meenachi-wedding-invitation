import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Dust = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
};

type Petal = {
  x: number;
  y: number;
  size: number;
  vy: number;
  sway: number;
  swaySpeed: number;
  angle: number;
  spin: number;
  hue: number; // 0 rose, 1 ivory, 2 gold
  alpha: number;
};

const PETAL_COLORS = [
  [238, 190, 178], // soft rose
  [244, 227, 204], // warm ivory
  [233, 201, 122], // muted gold
];

export default function Effects() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let dust: Dust[] = [];
    let petals: Petal[] = [];

    const spawn = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = width < 768;
      const dustCount = mobile ? 26 : 52;
      const petalCount = mobile ? 7 : 13;

      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.9,
      }));

      petals = Array.from({ length: petalCount }, () => ({
        x: Math.random() * width,
        y: -30 + Math.random() * height,
        size: 6 + Math.random() * 7,
        vy: 0.35 + Math.random() * 0.5,
        sway: 14 + Math.random() * 26,
        swaySpeed: 0.004 + Math.random() * 0.004,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.012,
        hue: Math.floor(Math.random() * 3),
        alpha: 0.35 + Math.random() * 0.4,
      }));
    };

    let t = 0;
    const draw = () => {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, width, height);

      /* golden dust */
      for (const d of dust) {
        d.x += d.vx;
        d.y += d.vy;
        d.phase += 0.012 * d.speed;
        if (d.y < -6) {
          d.y = height + 6;
          d.x = Math.random() * width;
        }
        if (d.x < -6) d.x = width + 6;
        if (d.x > width + 6) d.x = -6;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(d.phase));
        const a = 0.55 * tw;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3.2);
        g.addColorStop(0, `rgba(248, 226, 163, ${a})`);
        g.addColorStop(0.5, `rgba(217, 185, 104, ${a * 0.45})`);
        g.addColorStop(1, "rgba(217,185,104,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* petals */
      for (const p of petals) {
        p.angle += p.spin;
        p.y += p.vy;
        const x = p.x + Math.sin(t * p.swaySpeed * 10 + p.spin * 900) * p.sway * 0.06 * 10;
        if (p.y > height + 30) {
          p.y = -30;
          p.x = Math.random() * width;
        }
        const [r, gcol, b] = PETAL_COLORS[p.hue];
        ctx.save();
        ctx.translate(x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = `rgba(${r},${gcol},${b},${p.alpha * 0.5})`;
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.9, s * 0.55, 0, s);
        ctx.bezierCurveTo(-s * 0.9, s * 0.55, -s * 0.9, -s * 0.55, 0, -s);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };

    spawn();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", spawn);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", spawn);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
