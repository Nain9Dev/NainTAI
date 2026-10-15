import { Link } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Metric } from '../../components/ui/Metric';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useBorrarHistorial, useEstadisticas } from '../../hooks/useProgress';
import { useAuthStore } from '../../store/useAuthStore';
import { blockDisplayName } from '../../types/domain';
import type { BloqueRendimiento, TendenciaPunto } from '../../types/domain';
import styles from './Dashboard.module.css';

const PASS_MARK = 5;

export function Dashboard() {
  const { estadisticas, isLoading, error } = useEstadisticas();
  const isGuest = useAuthStore((state) => state.isGuest);
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const borrar = useBorrarHistorial();

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
          hasData ? (
            <Button
              variant="danger"
              size="small"
              icon={<Trash2 size={15} aria-hidden="true" />}
              isLoading={borrar.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    '¿Seguro que quieres borrar todo tu historial? Esta acción no se puede deshacer.',
                  )
                ) {
                  borrar.mutate();
                }
              }}
            >
              Borrar historial
            </Button>
          ) : undefined
        }
      >
        {error && (
          <Callout tone="warning" title="No se pudieron cargar los datos del servidor">
            Se muestran los simulacros guardados en este dispositivo.
          </Callout>
        )}

        {isGuest && hasData && (
          <Callout tone="info" title="Estás usando el modo invitado">
            Tu progreso se guarda solo en este navegador.{' '}
            <Link to="/register">Crea una cuenta</Link> para conservarlo y consultarlo desde
            cualquier dispositivo.
          </Callout>
        )}

        {!hasData ? (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>Todavía no has hecho ningún simulacro</span>
            <p style={{ margin: '0 0 1.25rem' }}>
              En cuanto completes el primero verás aquí tu nota media, tu tasa de acierto y en
              qué bloque conviene que insistas.
            </p>
            <Link to="/">
              <Button>Empezar un simulacro</Button>
            </Link>
          </div>
        ) : (
          <div className="metric-grid" style={{ marginTop: error || isGuest ? '1.5rem' : 0 }}>
            <Metric
              label="Nota media"
              value={format(estadisticas.notaMedia)}
              unit="/ 10"
              tone={estadisticas.notaMedia >= PASS_MARK ? 'success' : 'danger'}
              caption="Baremo oficial INAP"
            />
            <Metric
              label="Tasa de acierto"
              value={format(estadisticas.tasaAcierto)}
              unit="%"
              tone="accent"
              caption={`${estadisticas.aciertos} de ${estadisticas.totalPreguntas}`}
            />
            <Metric
              label="Mejor nota"
              value={format(estadisticas.mejorNota)}
              unit="/ 10"
              tone="success"
            />
            <Metric
              label="Última nota"
              value={format(estadisticas.ultimaNota)}
              unit="/ 10"
              tone={estadisticas.ultimaNota >= PASS_MARK ? 'success' : 'danger'}
              caption={formatDate(estadisticas.ultimaActividad)}
            />
          </div>
        )}
      </Card>

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
              <BlockBar key={block.bloque} block={block} />
            ))}
          </div>
        </Card>
      )}

      {hasData && estadisticas.tendencia.length > 1 && (
        <Card
          eyebrow="Evolución"
          title="Tus últimos simulacros"
          subtitle="Nota obtenida, del más antiguo al más reciente."
        >
          <TrendChart points={estadisticas.tendencia} />
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

function BlockBar({ block }: { block: BloqueRendimiento }) {
  // Three bands rather than a continuous gradient: the point is to say "leave it" or
  // "work on this", and a precise hue does not help make that call.
  const tone =
    block.precision >= 70 ? styles.barStrong : block.precision >= 50 ? styles.barMedium : styles.barWeak;

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>
        <span className={styles.blockName}>{blockDisplayName(block.bloque)}</span>
        <span className={styles.blockStats}>
          {format(block.precision)}% · {block.aciertos}/{block.total} · nota{' '}
          {format(block.notaMedia)}
        </span>
      </div>

      <div
        className={styles.bar}
        role="meter"
        aria-valuenow={Math.round(block.precision)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Precisión en el bloque ${block.bloque}`}
      >
        <div className={`${styles.barFill} ${tone}`} style={{ width: `${block.precision}%` }} />
      </div>
    </div>
  );
}

function TrendChart({ points }: { points: TendenciaPunto[] }) {
  return (
    <>
      <div className={styles.trend} role="img" aria-label={describeTrend(points)}>
        {points.map((point, index) => (
          <div
            key={`${point.fecha}-${index}`}
            className={`${styles.trendBar} ${point.nota < PASS_MARK ? styles.trendBarFail : ''}`}
            // A floor of 4% keeps a zero visible as a bar rather than nothing at all.
            style={{ height: `${Math.max((point.nota / 10) * 100, 4)}%` }}
            title={`${format(point.nota)} / 10 · ${formatDate(point.fecha)}`}
          />
        ))}
      </div>

      <div className={styles.trendAxis}>
        <span>{formatDate(points[0]?.fecha)}</span>
        <span>{formatDate(points[points.length - 1]?.fecha)}</span>
      </div>
    </>
  );
}

/** The chart is decorative for a screen reader; this sentence carries the information. */
function describeTrend(points: TendenciaPunto[]): string {
  const grades = points.map((point) => format(point.nota)).join(', ');
  return `Evolución de la nota en los últimos ${points.length} simulacros: ${grades}.`;
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
