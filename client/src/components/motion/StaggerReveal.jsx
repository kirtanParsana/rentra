import { motion } from "framer-motion";
import { viewport } from "../../motion/constants";
import { scaleReveal, stagger } from "../../motion/variants";

export function StaggerReveal({ children, className = "" }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div className={className} variants={scaleReveal}>
      {children}
    </motion.div>
  );
}
