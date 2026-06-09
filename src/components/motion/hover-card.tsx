"use client";

import { motion, useReducedMotion } from "motion/react";

type HoverCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function HoverCard({ children, className, style }: HoverCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
