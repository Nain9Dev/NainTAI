import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './MasteryBar.module.css';

interface MasteryBarProps {
  label: ReactNode;
  /** Accuracy as a percentage, 0 to 100. */
  percent: number;
  detail?: ReactNode;
  /** Names the meter for assistive technology, including what is being measured. */
  ariaLabel: string;
  /** Marks the block that deserves the next study session. */
  highlight?: boolean;
}

/**
 * A horizontal meter with three bands instead of a continuous gradient: the point is to say
 * "leave it" or "work on this", and a precise hue does not help make that call. The band also
 * changes the track's border, so the verdict never depends on colour alone (REQ-052).
 */
export function MasteryBar({ label, percent, detail, ariaLabel, highlight = false }: MasteryBarProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  const band = percent >= 70 ? 'strong' : percent >= 50 ? 'medium' : 'weak';

  return (
    <div className={`${styles.item} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.detail}>{detail}</span>
      </div>

      <div
        className={`${styles.track} ${styles[band]}`}
        role="meter"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div className={styles.fill} style={{ width: `${Math.min(Math.max(shown, 0), 100)}%` }} />
      </div>
    </div>
  );
}
