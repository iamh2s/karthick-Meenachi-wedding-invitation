import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { Divider, Lotus } from "./Ornaments";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 34,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-70px" }}
      transition={{ duration: 1.05, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* image-focused reveal with gentle scale — cinematic entrances */
export function RevealImage({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={cn("overflow-hidden", className)}>{children}</div>;
  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.25, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  kicker,
  title,
  align = "center",
  className,
}: {
  kicker: string;
  title: string;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered ? "text-center" : "text-left", className)}>
      <Reveal>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1",
            centered && "justify-center"
          )}
        >
          <Lotus className="h-5 w-7 shrink-0 text-gold-500/80" aria-hidden="true" />
          <p className="kicker">{kicker}</p>
          <Lotus className="h-5 w-7 shrink-0 -scale-x-100 text-gold-500/80" aria-hidden="true" />
        </div>
      </Reveal>
      <Reveal delay={0.12}>
        <h2 className="mx-auto mt-5 max-w-[18ch] text-balance font-display text-[2rem] font-semibold leading-[1.12] tracking-wide text-ivory-50 sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={0.22}>
        <Divider className={cn("mt-6 sm:mt-7", !centered && "justify-start")} />
      </Reveal>
    </div>
  );
}

export { EASE };
