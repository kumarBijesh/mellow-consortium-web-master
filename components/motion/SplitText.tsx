"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// Splits text into words, each masked in an overflow-hidden box and
// animated up from below — the classic "kinetic type" entrance used on
// agency/product-launch sites. Falls back to a plain fade for anyone with
// prefers-reduced-motion set.
export default function SplitText({
  text,
  className,
  startDelay = 0,
  stagger = 0.055,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  startDelay?: number;
  stagger?: number;
  as?: "span" | "div";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} style={{ display: Tag === "span" ? "inline" : "block" }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em" }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "115%", rotate: 5 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 0.85, delay: startDelay + i * stagger, ease: EASE }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
