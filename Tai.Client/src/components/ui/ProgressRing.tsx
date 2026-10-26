import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ringDash } from '../../utils/chart';
import styles from './ProgressRing.module.css';

const RADIUS = 42;

type Tone = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressRingProps {
  /** Share of the circle to fill, 0 to 1. */
  value: number;
  /** Text read by assistive technology: the ring itself carries no text a screen reader can use. */
  label: string;
  /** Shown in the middle. */
  center: ReactNode;
  caption?: ReactNode;
  tone?: Tone;
  /** Rendered size in rem. */
  size?: number;
}

/**
 * A circular gauge.
 *
 * The arc starts empty and is set to its value one frame after mounting, so the stroke
 * transition has something to run from. Under reduced motion the global override collapses
 * the transition to nothing, which leaves the final state with no animation at all.
 */
export function ProgressRing({ value, label, center, caption, tone = 'primary', size = 8 }: ProgressRingProps) {
  const gradientId = useId();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div
      className={`${styles.ring} ${styles[tone]}`}
      // The label is sized in em so the whole ring scales from this one number.
      style={{ width: `${size}rem`, height: `${size}rem`, fontSize: `${size / 8}rem` }}
    >
      <svg className={styles.svg} viewBox="0 0 100 100" role="img" aria-label={label}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className={styles.stopFrom} />
            <stop offset="100%" className={styles.stopTo} />
          </linearGradient>
        </defs>
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
        <circle
          className={styles.fill}
          cx="50"
          cy="50"
          r={RADIUS}
          stroke={`url(#${gradientId})`}
          strokeDasharray={ringDash(shown, RADIUS)}
        />
      </svg>

      <span className={styles.label} aria-hidden="true">
        <span className={styles.center}>{center}</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </span>
    </div>
  );
}
