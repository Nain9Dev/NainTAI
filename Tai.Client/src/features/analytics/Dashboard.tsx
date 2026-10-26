import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Metric } from '../../components/ui/Metric';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { MasteryBar } from '../../components/ui/MasteryBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useBorrarHistorial, useEstadisticas, useHistorial } from '../../hooks/useProgress';
import { useAnalyticsStore } from '../../store/useAnalyticsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { blockDisplayName } from '../../types/domain';
import { ConsistencyCalendar } from './ConsistencyCalendar';
import { TrendLineChart } from './TrendLineChart';
import styles from './Dashboard.module.css';

const PASS_MARK = 5;

export function Dashboard() {
  const { estadisticas, isLoading, error } = useEstadisticas();
  const isGuest = useAuthStore((state) => state.isGuest);
  // The demo banner already says the data is an example; repeating it here would be noise.
  const isDemo = useAuthStore((state) => state.isDemo);
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const borrar = useBorrarHistorial();

  // The calendar needs dates, which the statistics summary does not carry: the server's recent
  // history plus whatever only exists in this browser, as the statistics themselves are merged.
  const history = useHistorial(1, 100);
  const localAttempts = useAnalyticsStore((state) => state.historial);
  const attempts = useMemo(
    () => [...(history.data?.items ?? []), ...localAttempts],
    [history.data, localAttempts],
  );

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <LoadingSkeleton variant="title" label="Cargando tu rendimiento" />
        <LoadingSkeleton variant="metric" count={4} />
      </div>
    );
  }

  const hasData = estadisticas.totalIntentos > 0;

  return (
    <div className={styles.dashboard}>
      <Card
        eyebrow="Rendimiento"
        title="Tu progreso"
        subtitle={
          hasData
            ? `${estadisticas.totalIntentos} ${estadisticas.totalIntentos === 1 ? 'simulacro completado' : 'simulacros completados'} · ${estadisticas.totalPreguntas} preguntas`
            : 'Aún no hay datos suficientes.'
        }
        actions={
          hasData ? <ClearHistory isPending={borrar.isPending} onConfirm={() => borrar.mutate()} /> : undefined
        }
      >
        {error && (
          <Callout tone="warning" title="No se pudieron cargar los datos del servidor">
            Se muestran los simulacros guardados en este dispositivo.
          </Callout>
        )}

        {isGuest && !isDemo && hasData && (
          <Callout tone="info" title="Estás usando el modo invitado">
            Tu progreso se guarda solo en este navegador. <Link to="/register">Crea una cuenta</Link>{' '}
            para conservarlo y consultarlo desde cualquier dispositivo.
          </Callout>
        )}

        {!hasData ? (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>Todavía no has hecho ningún simulacro</span>
            <p className={styles.emptyText}>
              En cuanto completes el primero verás aquí tu nota media, tu tasa de acierto y en qué
              bloque conviene que insistas.
            </p>
            <Link to="/">
              <Button>Empezar un simulacro</Button>
            </Link>
          </div>
        ) : (
          <div className={`metric-grid ${error || (isGuest && !isDemo) ? styles.spaced : ''}`}>
            <Metric
              label="Nota media"
              value={<AnimatedNumber value={estadisticas.notaMedia} decimals={2} />}
              unit="/ 10"
              tone={estadisticas.notaMedia >= PASS_MARK ? 'success' : 'danger'}
              caption="Baremo oficial INAP"
            />
            <Metric
              label="Tasa de acierto"
              value={<AnimatedNumber value={estadisticas.tasaAcierto} />}
              unit="%"
              tone="accent"
              caption={`${estadisticas.aciertos} de ${estadisticas.totalPreguntas}`}
            />
            <Metric
              label="Mejor nota"
              value={<AnimatedNumber value={estadisticas.mejorNota} decimals={2} />}
              unit="/ 10"
              tone="success"
            />
            <Metric
              label="Última nota"
              value={<AnimatedNumber value={estadisticas.ultimaNota} decimals={2} />}
              unit="/ 10"
              tone={estadisticas.ultimaNota >= PASS_MARK ? 'success' : 'danger'}
              caption={formatDate(estadisticas.ultimaActividad)}
            />
          </div>
        )}
      </Card>

      {hasData && (
        <div className={styles.charts}>
          {estadisticas.tendencia.length > 1 && (
            <Card
              eyebrow="Evolución"
              title="Tus últimos simulacros"
              subtitle="Nota obtenida, del más antiguo al más reciente."
            >
              <TrendLineChart points={estadisticas.tendencia} passMark={PASS_MARK} />
            </Card>
          )}

          <Card eyebrow="Constancia" title="Tu práctica por días" subtitle="Preguntas respondidas cada día.">
            <ConsistencyCalendar attempts={attempts} />
          </Card>
        </div>
      )}

      {hasData && estadisticas.rendimientoPorBloque.length > 0 && (
        <Card
          eyebrow="Por bloque"
          title="Dónde conviene insistir"
          subtitle={
            estadisticas.bloqueMasDebil
              ? `El bloque ${estadisticas.bloqueMasDebil} es tu punto más débil con datos suficientes.`
              : 'Ordenado de menor a mayor precisión.'
          }
        >
          <div className={styles.blocks}>
            {estadisticas.rendimientoPorBloque.map((block) => (
              <MasteryBar
                key={block.bloque}
                label={blockDisplayName(block.bloque)}
                percent={block.precision}
                detail={`${format(block.precision)}% · ${block.aciertos}/${block.total} · nota ${format(block.notaMedia)}`}
                ariaLabel={`Precisión en el bloque ${block.bloque}`}
                highlight={estadisticas.bloqueMasDebil === block.bloque}
              />
            ))}
          </div>
        </Card>
      )}

      {!isAuthenticated && !isGuest && (
        <Callout tone="info" title="Inicia sesión para sincronizar">
          Tu progreso se guardará en la nube y estará disponible desde cualquier dispositivo.
        </Callout>
      )}
    </div>
  );
}

function ClearHistory({ isPending, onConfirm }: { isPending: boolean; onConfirm: () => void }) {
  return (
    <Button
      variant="danger"
      size="small"
      icon={<Trash2 size={15} aria-hidden="true" />}
      isLoading={isPending}
      onClick={() => {
        if (window.confirm('¿Seguro que quieres borrar todo tu historial? Esta acción no se puede deshacer.')) {
          onConfirm();
        }
      }}
    >
      Borrar historial
    </Button>
  );
}

function format(value: number): string {
  return value.toFixed(2).replace('.', ',').replace(',00', '');
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
