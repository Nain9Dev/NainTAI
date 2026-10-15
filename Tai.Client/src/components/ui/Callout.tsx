import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import styles from './Callout.module.css';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const ICONS: Record<Tone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

interface CalloutProps {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  /**
   * Announces the message to assistive technology. Use `assertive` only for something the
   * candidate must act on immediately, such as an error blocking a submission.
   */
  live?: 'off' | 'polite' | 'assertive';
  className?: string;
}

export function Callout({ tone = 'info', title, children, live = 'off', className = '' }: CalloutProps) {
  const Icon = ICONS[tone];

  return (
    <div
      className={[styles.callout, styles[tone], className].filter(Boolean).join(' ')}
      role={tone === 'danger' ? 'alert' : undefined}
      aria-live={live === 'off' ? undefined : live}
    >
      <Icon size={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children}
      </div>
    </div>
  );
}
