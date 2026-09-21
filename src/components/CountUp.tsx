import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

/** Number that counts up from zero when it appears. Updates the DOM directly, with no re-renders. */
export const CountUp = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
};
