"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function HoverLift({
  children,
  className,
  lift = 8,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
  scale?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, scale }}
      whileTap={{ scale: scale > 1 ? 0.99 : scale }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
