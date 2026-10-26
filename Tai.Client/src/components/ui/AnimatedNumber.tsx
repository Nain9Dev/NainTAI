import { useCountUp } from '../../hooks/useMotion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
}

/**
 * A figure that counts up to its value, in Spanish decimal notation.
 *
 * The final text is always the exact value: the animation only changes what is shown on the
 * way there, and `useCountUp` reports the target at once under reduced motion.
 */
export function AnimatedNumber({ value, decimals = 0 }: AnimatedNumberProps) {
  const current = useCountUp(value);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{current.toFixed(decimals).replace('.', ',')}</span>;
}
