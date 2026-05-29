import { duration, ease } from "./constants";

export const pageTransition = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.slow, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: duration.fast, ease: ease.crisp },
  },
};

export const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.slow, ease: ease.premium },
  },
};

export const scaleReveal = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.base, ease: ease.premium },
  },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast, ease: ease.crisp } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.crisp } },
};

export const modalPanel = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: duration.base, ease: ease.premium } },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: duration.fast, ease: ease.crisp } },
};
