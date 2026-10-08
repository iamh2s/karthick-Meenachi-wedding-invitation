import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/*
 * ScrollStack  (performance-debugged)
 *
 * Each layer is `position: sticky`; the next layer slides over it.
 *
 * Fixes for lag:
 *  1. CULLING: once a layer is completely covered by a later layer it is
 *     set to `visibility: hidden`, so the browser stops painting it and
 *     its animations/images/video no longer cost anything. It is made
 *     visible again BEFORE the cover starts to leave (scroll up).
 *  2. will-change: transform is applied only WHILE a layer is sliding in
 *     (not permanently), so the browser keeps one stable GPU texture
 *     during the move instead of re-rasterizing tall text every frame,
 *     without wasting memory the rest of the time.
 *  3. min-height: 100vh on every layer, so a short section can never
 *     reveal the layer underneath it.
 *  4. Removed the nested parallax layer (a second huge composited layer
 *     per section). Only scale + rotate + a light veil remain.
 */

export type StackLayer = {
  id: string;
  node: ReactNode;
  band?: ReactNode;
};

type Props = {
  layers: StackLayer[];
  layerClassName?: string;
};

export default function ScrollStack({
  layers,
  layerClassName = "velvet",
}: Props) {
  const reduce = !!useReducedMotion();

  /* highest layer index that is fully covering the screen */
  const coveringRef = useRef<boolean[]>([]);
  const [coveredUpTo, setCoveredUpTo] = useState(0);

  const report = (index: number, covering: boolean) => {
    coveringRef.current[index] = covering;
    let highest = 0;
    coveringRef.current.forEach((v, i) => {
      if (v) highest = i;
    });
    setCoveredUpTo((prev) => (prev === highest ? prev : highest));
  };

  return (
    <>
      {layers.map((layer, i) => (
        <Layer
          key={layer.id}
          index={i}
          id={layer.id}
          band={layer.band}
          reduce={reduce}
          className={layerClassName}
          hidden={i < coveredUpTo}
          report={report}
        >
          {layer.node}
        </Layer>
      ))}
    </>
  );
}

function Layer({
  index,
  id,
  band,
  reduce,
  className,
  hidden,
  report,
  children,
}: {
  index: number;
  id: string;
  band?: ReactNode;
  reduce: boolean;
  className: string;
  hidden: boolean;
  report: (index: number, covering: boolean) => void;
  children: ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);

  /* tall layers pin by their bottom edge */
  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () =>
      setTop(Math.min(0, Math.round(window.innerHeight - el.offsetHeight)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress: p } = useScroll({
    target: sentinelRef,
    offset: ["start end", "start start"],
  });

  const animated = index > 0 && !reduce;

  /* report "I fully cover the screen" only when it flips (not per frame) */
  useMotionValueEvent(p, "change", (v) => {
    if (index > 0) report(index, v >= 0.995);
  });
  useEffect(() => {
    if (index > 0) report(index, p.get() >= 0.995);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = useTransform(p, [0, 1], [0.94, 1]);
  const rotate = useTransform(p, [0, 1], [2, 0]);
  const veil = useTransform(p, [0, 0.85], [0.25, 0]);
  const willChange = useTransform(p, (v) =>
    v > 0 && v < 1 ? "transform" : "auto"
  );

  return (
    <>
      <div ref={sentinelRef} id={id} className="h-0" aria-hidden="true" />

      <div
        ref={layerRef}
        className="relative"
        style={{
          position: "sticky",
          top,
          zIndex: index + 1,
          visibility: hidden ? "hidden" : "visible",
        }}
      >
        <motion.div
          className={`relative ${index > 0 ? className : ""}`}
          style={{
            minHeight: "100vh",
            ...(animated
              ? { scale, rotate, willChange, transformOrigin: "50% 0%" }
              : {}),
          }}
        >
          {band}
          {children}

          {animated && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-screen bg-black"
              style={{ opacity: veil }}
              aria-hidden="true"
            />
          )}
        </motion.div>
      </div>
    </>
  );
}