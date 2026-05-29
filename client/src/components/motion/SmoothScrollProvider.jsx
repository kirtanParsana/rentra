import { useEffect } from "react";
import Lenis from "lenis";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined" || prefersReducedMotion() || window.innerWidth < 768) {
      document.documentElement.classList.add("native-scroll");
      return () => document.documentElement.classList.remove("native-scroll");
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      syncTouch: false,
    });

    let frameId = 0;
    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return children;
}
