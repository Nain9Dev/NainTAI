import { RefreshCw, WifiOff } from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import styles from './ConnectionBanner.module.css';

/**
 * Tells the candidate when their work is not reaching the server.
 *
 * Driven by the connection store rather than a timer. The previous version polled
 * `apiClient.getMode()` every two seconds while the header polled it every second, so the
 * two could contradict each other and both re-rendered forever with nothing to show.
 */
export function ConnectionBanner() {
  const mode = useConnectionStore((state) => state.mode);
  const pendingWrites = useConnectionStore((state) => state.pendingWrites);
  const isSyncing = useConnectionStore((state) => state.isSyncing);

  const isOffline = mode === 'offline';

  // Nothing to say while everything is reaching the server.
  if (!isOffline && !isSyncing && pendingWrites === 0) {
    return null;
  }

  const tone = isOffline ? styles.offline : styles.syncing;

  return (
    <div className={`${styles.banner} ${tone}`} role="status" aria-live="polite">
      {isOffline ? (
        <WifiOff size={18} className={styles.icon} aria-hidden="true" />
      ) : (
        <RefreshCw
          size={18}
          className={`${styles.icon} ${isSyncing ? styles.spin : ''}`}
          aria-hidden="true"
        />
      )}

      <div className={styles.content}>
        <span className={styles.title}>
          {isOffline
            ? 'Sin conexión con el servidor'
            : isSyncing
              ? 'Sincronizando tu progreso…'
              : 'Cambios pendientes de enviar'}
        </span>

        <span className={styles.detail}>
          {pendingWrites > 0
            ? `${pendingWrites} ${pendingWrites === 1 ? 'simulacro guardado' : 'simulacros guardados'} en este dispositivo. Se ${pendingWrites === 1 ? 'enviará' : 'enviarán'} al recuperar la conexión.`
            : 'Puedes seguir practicando: el temario está disponible sin conexión.'}
        </span>
      </div>
    </div>
  );
}
