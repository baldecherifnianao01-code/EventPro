import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export function ScrollProgressBar() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none bg-transparent"
    >
      <motion.div
        className="h-full w-full bg-gradient-to-r from-[#A8821B] via-[#D4AF37] to-[#E5C665] origin-left rtl:origin-right will-change-transform"
        style={{
          scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress,
        }}
      />
    </div>
  );
}
