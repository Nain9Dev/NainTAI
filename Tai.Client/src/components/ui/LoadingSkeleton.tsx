import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'metric' | 'question';
  count?: number;
  /** Described to assistive technology, which cannot see a shimmering placeholder. */
  label?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 1, label = 'Cargando…' }: LoadingSkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`${styles.skeleton} ${styles[variant]}`} aria-hidden="true" />
      ))}
    </div>
  );
}
