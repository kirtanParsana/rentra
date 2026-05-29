// import { useRef, useState } from "react";
// import { motion, useMotionValue, useSpring } from "framer-motion";
// import { ease } from "../../motion/constants";

// function canUseMagnet() {
//   return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;
// }

// export default function MagneticButton({
//   children,
//   className = "",
//   as = "button",
//   strength = 0.18,
//   type = "button",
//   ...props
// }) {
//   const ref = useRef(null);
//   const [enabled, setEnabled] = useState(false);
//   const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 22, mass: 0.45 });
//   const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 22, mass: 0.45 });
//   const Component = motion[as] || motion.button;

//   const reset = () => {
//     x.set(0);
//     y.set(0);
//   };

//   const move = (event) => {
//     if (!enabled || !ref.current) return;
//     const rect = ref.current.getBoundingClientRect();
//     x.set((event.clientX - rect.left - rect.width / 2) * strength);
//     y.set((event.clientY - rect.top - rect.height / 2) * strength);
//   };

//   const componentProps = as === "button" ? { type } : {};

//   return (
//     <Component
//       ref={ref}
//       className={className}
//       style={{ x, y }}
//       whileTap={{ scale: 0.97 }}
//       whileHover={{ scale: 1.015 }}
//       transition={{ duration: 0.2, ease: ease.crisp }}
//       onPointerEnter={() => setEnabled(canUseMagnet())}
//       onPointerMove={move}
//       onPointerLeave={reset}
//       {...componentProps}
//       {...props}
//     >
//       {children}
//     </Component>
//   );
// }
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ease } from "../../motion/constants";

function canUseMagnet() {
  if (typeof window === "undefined") return false;

  return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;
}

export default function MagneticButton({
  children,
  className = "",
  as = "button",
  strength = 0.18,
  type = "button",
  ...props
}) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);

  const x = useSpring(useMotionValue(0), {
    stiffness: 260,
    damping: 22,
    mass: 0.45,
  });

  const y = useSpring(useMotionValue(0), {
    stiffness: 260,
    damping: 22,
    mass: 0.45,
  });

  // Safe dynamic motion component handling
  const Component =
    typeof as === "string"
      ? motion[as] || motion.button
      : motion(as);

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const move = (event) => {
    if (!enabled || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    x.set((event.clientX - rect.left - rect.width / 2) * strength);

    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const componentProps =
    typeof as === "string" && as === "button"
      ? { type }
      : {};

  return (
    <Component
      ref={ref}
      className={className}
      style={{ x, y }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.015 }}
      transition={{
        duration: 0.2,
        ease: ease?.crisp || "easeOut",
      }}
      onPointerEnter={() => setEnabled(canUseMagnet())}
      onPointerMove={move}
      onPointerLeave={reset}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  );
}