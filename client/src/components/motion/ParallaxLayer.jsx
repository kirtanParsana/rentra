import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxLayer({ children, className = "", distance = 32 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || window.innerWidth < 768) {
      return undefined;
    }

    const tween = gsap.fromTo(
      ref.current,
      { y: -distance / 2 },
      {
        y: distance / 2,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.7,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [distance]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
