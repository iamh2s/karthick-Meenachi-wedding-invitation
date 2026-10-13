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
  const coveringRef = useRef<boolean[]>([]);
  const [coveredUpTo, setCoveredUpTo] = useState(0);

  const report = (index: number, covering: boolean) => {
    coveringRef.current[index] = covering;

    let highest = 0;
    coveringRef.current.forEach((value, i) => {
      if (value) highest = i;
    });

    setCoveredUpTo((prev) => (prev === highest ? prev : highest));
  };

  return (
    <>
      {layers.map((layer, index) => (
        <Layer
          key={layer.id}
          index={index}
          id={layer.id}
          band={layer.band}
          reduce={reduce}
          className={layerClassName}
          hidden={index < coveredUpTo}
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

  useLayoutEffect(() => {
    const element = layerRef.current;
    if (!element) return;

    const measure = () => {
      setTop(
        Math.min(0, Math.round(window.innerHeight - element.offsetHeight))
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress: progress } = useScroll({
    target: sentinelRef,
    offset: ["start end", "start start"],
  });

  const animated = index > 0 && !reduce;

  useMotionValueEvent(progress, "change", (value) => {
    if (index > 0) report(index, value >= 0.995);
  });

  useEffect(() => {
    if (index > 0) report(index, progress.get() >= 0.995);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const rotate = useTransform(progress, [0, 1], [2, 0]);
  const veil = useTransform(progress, [0, 0.85], [0.25, 0]);

  const willChange = useTransform(progress, (value) =>
    value > 0 && value < 1 ? "transform" : "auto"
  );

  return (
    <>
      <div
        ref={sentinelRef}
        id={id}
        className="h-0"
        aria-hidden="true"
      />

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
              ? {
                  scale,
                  rotate,
                  willChange,
                  transformOrigin: "50% 0%",
                }
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