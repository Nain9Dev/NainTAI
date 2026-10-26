import { LogOut, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLeaveDemo, useStartDemo } from '../../demo/useStartDemo';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './DemoBanner.module.css';

/**
 * Says, on every screen, that what the visitor sees is example data (REQ-065).
 *
 * A demo that passed itself off as a real account would be misleading, and one that hid its
 * exits would feel like a trap. So the notice is persistent, plain about what it is, and
 * carries the three things a visitor might want next: start over, make an account, or leave.
 */
export function DemoBanner() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const { start, isStarting } = useStartDemo();
  const leave = useLeaveDemo();

  if (!isDemo) {
    return null;
  }

  return (
    <div className={styles.banner} role="region" aria-label="Aviso del modo demo">
      <div className={`shell ${styles.inner}`}>
        <span className={styles.badge}>
          <Sparkles size={13} aria-hidden="true" />
          Demo
        </span>

        <p className={styles.text}>
          Estás viendo <strong>datos de ejemplo</strong>. Lo que hagas se guarda solo en este navegador.
        </p>

        <div className={styles.actions}>
          <Button
            size="small"
            variant="ghost"
            icon={<RotateCcw size={14} aria-hidden="true" />}
            isLoading={isStarting}
            onClick={() => void start('/')}
            title="Vuelve a cargar los datos de ejemplo"
          >
            Reiniciar
          </Button>
          <Button size="small" variant="secondary" onClick={() => void leave('/register')}>
            Crear cuenta
          </Button>
          <Button
            size="small"
            variant="ghost"
            icon={<LogOut size={14} aria-hidden="true" />}
            onClick={() => void leave('/')}
          >
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
}
