import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Monospaced uppercase label above the title, matching the portfolio's section labels. */
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Flat surface for cards nested inside another panel. */
  flat?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function Card({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  flat = false,
  className = '',
  as: Element = 'section',
}: CardProps) {
  const hasHeader = Boolean(title || subtitle || eyebrow || actions);

  return (
    <Element className={[styles.card, flat ? styles.flat : '', className].filter(Boolean).join(' ')}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.headings}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}

      <div className={styles.body}>{children}</div>
    </Element>
  );
}
