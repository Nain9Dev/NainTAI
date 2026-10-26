import { useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Check, ChevronDown, Compass, X } from 'lucide-react';
import { GUIDE_STEPS, guideProgress } from '../../demo/guide';
import { useLeaveDemo } from '../../demo/useStartDemo';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useDemoStore } from '../../store/useDemoStore';
import styles from './DemoGuide.module.css';

/**
 * A checklist of what to try, which ticks itself as the visitor does it (REQ-068).
 *
 * It lists every function in the order that tells the product's story, so a visitor who does
 * not know where to start has a next step, and one who does can ignore it: it folds into a
 * pill and can be closed for good.
 */
export function DemoGuide() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const done = useDemoStore((state) => state.done);
  const collapsed = useDemoStore((state) => state.collapsed);
  const dismissed = useDemoStore((state) => state.dismissed);
  const complete = useDemoStore((state) => state.complete);
  const toggle = useDemoStore((state) => state.toggle);
  const dismiss = useDemoStore((state) => state.dismiss);
  const leave = useLeaveDemo();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Two steps are plain visits; the others are marked by the action itself where it happens.
  useEffect(() => {
    if (!isDemo) return;
    if (pathname === '/analytics') complete('performance');
    if (pathname === '/perfil') complete('profile');
  }, [isDemo, pathname, complete]);

  if (!isDemo || dismissed) {
    return null;
  }

  const { done: count, total, share } = guideProgress(done);
  const finished = count === total;

  if (collapsed) {
    return (
      <button
        type="button"
        className={styles.pill}
        onClick={toggle}
        aria-expanded={false}
        aria-controls="demo-guide-panel"
      >
        <Compass size={15} aria-hidden="true" />
        Recorrido de la demo
        <span className={styles.count}>
          {count}/{total}
        </span>
      </button>
    );
  }

  return (
    <aside id="demo-guide-panel" className={styles.panel} aria-label="Recorrido de la demo">
      <header className={styles.header}>
        <div>
          <span className="eyebrow">Qué probar</span>
          <h2 className={styles.title}>Recorrido de la demo</h2>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.icon} onClick={toggle} aria-label="Minimizar el recorrido">
            <ChevronDown size={17} aria-hidden="true" />
          </button>
          <button type="button" className={styles.icon} onClick={dismiss} aria-label="Cerrar el recorrido">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className={styles.progress}
        role="meter"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Pasos del recorrido completados"
      >
        <div className={styles.progressFill} style={{ width: `${share * 100}%` }} />
      </div>

      <ol className={styles.steps}>
        {GUIDE_STEPS.map((step) => {
          const isDone = done.includes(step.id);

          return (
            <li key={step.id}>
              <Link to={step.to} className={`${styles.step} ${isDone ? styles.stepDone : ''}`}>
                <span className={styles.check} aria-hidden="true">
                  {isDone && <Check size={13} />}
                </span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>
                    {step.title}
                    {isDone && <span className="visually-hidden"> (hecho)</span>}
                  </span>
                  <span className={styles.stepHint}>{step.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {finished && (
        <div className={styles.finish}>
          <strong>Recorrido completo.</strong> Con una cuenta, tu progreso se guarda y viaja contigo.
          <Button size="small" onClick={() => void leave('/register')}>
            Crear una cuenta
          </Button>
        </div>
      )}
    </aside>
  );
}
