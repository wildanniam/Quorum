"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

type RevealProps = {
  as?: "div" | "section" | "article" | "li";
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const components = {
  article: motion.article,
  div: motion.div,
  li: motion.li,
  section: motion.section,
};

export function Reveal({
  as = "div",
  children,
  className,
  delay = 0,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const Component = components[as];

  if (reduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        ...revealVariants,
        visible: {
          ...revealVariants.visible,
          transition: {
            ...(revealVariants.visible as { transition: object }).transition,
            delay,
          },
        },
      }}
    >
      {children}
    </Component>
  );
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
