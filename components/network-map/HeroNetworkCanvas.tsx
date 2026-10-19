"use client";

import { useEffect, useRef } from "react";

type HeroSite = { lat: number; lon: number; isHQ: boolean };

// Animated network background for the hero, built from the same real
// institution data as GlobalNetworkMap further down the page — no
// hardcoded/decorative hub positions. Uses a simple equirectangular
// projection (lat/lon -> x/y as a % of canvas) rather than the full
// orthographic globe GlobalNetworkMap uses, since this is a blurred,
// non-interactive background layer where exact projection fidelity
// doesn't matter — only that the dots are real.
function toPercent(lat: number, lon: number) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

// Hub-and-spoke: every site connects to the HQ site, same derivation as
// GlobalNetworkMap's deriveLinks — no hardcoded index pairs.
function deriveLinks(hubs: { hq: boolean }[]): [number, number][] {
  const hqIndex = hubs.findIndex((h) => h.hq);
  if (hqIndex === -1) return [];
  return hubs.map((_, i) => i).filter((i) => i !== hqIndex).map((i) => [hqIndex, i] as [number, number]);
}

export default function HeroNetworkCanvas({ sites }: { sites: HeroSite[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sites.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const HUBS = sites.map((s) => ({ ...toPercent(s.lat, s.lon), hq: s.isHQ }));
    const LINKS = deriveLinks(HUBS);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;

    const pulses = LINKS.map((l) => ({ l, t: Math.random(), sp: 0.0016 + Math.random() * 0.0018 }));

    function P(h: { x: number; y: number }) {
      return { x: (h.x / 100) * W, y: (h.y / 100) * H };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawGraticule() {
      ctx!.strokeStyle = "rgba(170,203,196,0.06)";
      ctx!.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const y = (H * i) / 8;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }
      for (let i = 1; i < 12; i++) {
        const x = (W * i) / 12;
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
    }

    function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.16;
      return { mx, my };
    }

    function pt(a: { x: number; y: number }, b: { x: number; y: number }, m: { mx: number; my: number }, t: number) {
      const u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * m.mx + t * t * b.x, y: u * u * a.y + 2 * u * t * m.my + t * t * b.y };
    }

    function frame() {
      ctx!.clearRect(0, 0, W, H);
      drawGraticule();
      LINKS.forEach((l) => {
        const a = P(HUBS[l[0]]);
        const b = P(HUBS[l[1]]);
        const m = arc(a, b);
        ctx!.strokeStyle = "rgba(44,194,149,0.18)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(m.mx, m.my, b.x, b.y);
        ctx!.stroke();
      });
      pulses.forEach((p) => {
        p.t += p.sp;
        if (p.t > 1) p.t -= 1;
        const a = P(HUBS[p.l[0]]);
        const b = P(HUBS[p.l[1]]);
        const m = arc(a, b);
        const q = pt(a, b, m, p.t);
        const g = ctx!.createRadialGradient(q.x, q.y, 0, q.x, q.y, 6);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(1, "rgba(0,223,129,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(q.x, q.y, 6, 0, Math.PI * 2);
        ctx!.fill();
      });
      const now = Date.now() / 1000;
      HUBS.forEach((h, i) => {
        const p = P(h);
        const pulse = Math.sin(now * 1.6 + i) * 0.5 + 0.5;
        const r = h.hq ? 4.5 : 3;
        ctx!.fillStyle = h.hq ? `rgba(0,223,129,${0.1 + pulse * 0.14})` : `rgba(44,194,149,${0.08 + pulse * 0.1})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r + 8 + pulse * 5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = h.hq ? "#00DF81" : "#8fe8cf";
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fill();
      });
      raf = requestAnimationFrame(frame);
    }

    function staticFrame() {
      ctx!.clearRect(0, 0, W, H);
      drawGraticule();
      LINKS.forEach((l) => {
        const a = P(HUBS[l[0]]);
        const b = P(HUBS[l[1]]);
        const m = arc(a, b);
        ctx!.strokeStyle = "rgba(44,194,149,0.22)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(m.mx, m.my, b.x, b.y);
        ctx!.stroke();
      });
      HUBS.forEach((h) => {
        const p = P(h);
        ctx!.fillStyle = h.hq ? "#00DF81" : "#8fe8cf";
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, h.hq ? 4.5 : 3, 0, Math.PI * 2);
        ctx!.fill();
      });
    }

    function init() {
      resize();
      cancelAnimationFrame(raf);
      if (reduce) staticFrame();
      else frame();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    }

    init();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
