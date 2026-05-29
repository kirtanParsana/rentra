import { motion } from "framer-motion";
import { ease } from "../../motion/constants";

export default function MotionCard({ children, className = "", as = "div" }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={`rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-glass backdrop-blur-xl ${className}`}
      whileHover={{ y: -5, scale: 1.01, borderColor: "rgba(34,211,238,0.28)" }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.28, ease: ease.premium }}
    >
      {children}
    </Component>
  );
}
