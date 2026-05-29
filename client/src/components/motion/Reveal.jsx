import { motion } from "framer-motion";
import { viewport } from "../../motion/constants";
import { reveal } from "../../motion/variants";

export default function Reveal({ children, className = "", delay = 0, as = "div" }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </Component>
  );
}
