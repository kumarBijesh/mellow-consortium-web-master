"use client";

import { useEffect, useRef } from "react";

// Layered on top of the hero's network canvas: a handful of large,
// blurred, hue-drifting color blobs (brand teal/blue/purple/gold) plus a
// radial spotlight that follows the cursor. Everything here is
// transform/opacity/CSS-variable driven — no React re-renders on
// mousemove, just a direct style write via rAF, so it stays cheap even on
// a big above-the-fold section.
export default function HeroAurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let targetX = 50;
    let targetY = 35;
    let curX = 50;
    let curY = 35;

    function onMove(e: PointerEvent) {
      const r = el!.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      targetX = ((e.clientX - r.left) / r.width) * 100;
      targetY = ((e.clientY - r.top) / r.height) * 100;
    }

    function tick() {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      el!.style.setProperty("--mx", `${curX}%`);
      el!.style.setProperty("--my", `${curY}%`);
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <div className="hero-spotlight" />
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="aurora-blob aurora-4" />
    </div>
  );
}
