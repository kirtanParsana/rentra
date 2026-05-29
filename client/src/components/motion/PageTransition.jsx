import { motion } from "framer-motion";
import { pageTransition } from "../../motion/variants";

export default function PageTransition({ children }) {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
