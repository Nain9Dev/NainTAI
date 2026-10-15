import type { ReactNode } from 'react';
import styles from './Metric.module.css';

type Tone = 'default' | 'success' | 'danger' | 'warning' | 'accent';

interface MetricProps {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: ReactNode;
  tone?: Tone;
}

/** A single figure with its label. The unit is separated so it does not compete with the number. */
export function Metric({ label, value, unit, caption, tone = 'default' }: MetricProps) {
  return (
    <div className={styles.metric}>
      <span className={styles.label}>{label}</span>
      <span className={[styles.value, tone === 'default' ? '' : styles[tone]].filter(Boolean).join(' ')}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}
