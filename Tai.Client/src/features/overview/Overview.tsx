import { ChevronRight, RotateCcw, Timer, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { useReveal } from '../../hooks/useMotion';
import { useEstadisticas } from '../../hooks/useProgress';
import { useAuthStore } from '../../store/useAuthStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { DailyProgress } from '../study/DailyProgress';
import { blockDisplayName, SYLLABUS_BLOCKS } from '../../types/domain';
import type { Estadisticas } from '../../types/domain';
import styles from './Overview.module.css';

const PASS_MARK = 5;

/** Greeting by local hour, so the first line of the home already speaks to the moment. */
export function greetingFor(date: Date): string {
  const hour = date.getHours();

  if (hour < 6) return 'Buenas noches';
  if (hour < 13) return 'Buenos días';
  if (hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

/** The one-line read of where the candidate stands. */
export function standing(stats: Estadisticas): string {
  if (stats.totalIntentos === 0) {
    return 'Haz tu primer simulacro y verás aquí tu nota, tu evolución y en qué bloque insistir.';
  }

  const grade = stats.notaMedia.toFixed(2).replace('.', ',');
  const weakest = stats.bloqueMasDebil ? ` Tu bloque más débil es el ${blockDisplayName(stats.bloqueMasDebil)}.` : '';

  return `Nota media de ${grade} sobre 10 en ${stats.totalIntentos} simulacros.${weakest}`;
}

export function Welcome() {
  const user = useAuthStore((state) => state.user);
  const { estadisticas } = useEstadisticas();
  const firstName = user?.nombre.split(' ')[0];

  return (
    <header className={styles.welcome}>
      <span className="eyebrow">Panel</span>
      <h1 className={styles.greeting}>
        {greetingFor(new Date())}
        {firstName ? (
          <>
            , <span className="title-accent">{firstName}</span>
          </>
        ) : null}
      </h1>
      <p className="lead">{standing(estadisticas)}</p>
    </header>
  );
}

/** Today's goal beside the four headline figures. */
export function TodayRow() {
  return (
    <div className={styles.top}>
      <DailyProgress />
      <KpiGrid />
    </div>
  );
}

/** Four figures beside the daily goal. Without attempts they read "—", not a misleading zero. */
function KpiGrid() {
  const { estadisticas: stats } = useEstadisticas();
  const hasData = stats.totalIntentos > 0;

  return (
    <div className={styles.kpis}>
      <Metric
        label="Nota media"
        value={hasData ? <AnimatedNumber value={stats.notaMedia} decimals={2} /> : '—'}
        unit={hasData ? '/ 10' : undefined}
        tone={!hasData ? 'default' : stats.notaMedia >= PASS_MARK ? 'success' : 'danger'}
        caption="Baremo oficial INAP"
      />
      <Metric
        label="Mejor nota"
        value={hasData ? <AnimatedNumber value={stats.mejorNota} decimals={2} /> : '—'}
        unit={hasData ? '/ 10' : undefined}
        tone={hasData ? 'success' : 'default'}
      />
      <Metric
        label="Tasa de acierto"
        value={hasData ? <AnimatedNumber value={stats.tasaAcierto} decimals={0} /> : '—'}
        unit={hasData ? '%' : undefined}
        tone={hasData ? 'accent' : 'default'}
        caption={hasData ? `${stats.aciertos} de ${stats.totalPreguntas}` : undefined}
      />
      <Metric
        label="Simulacros"
        value={hasData ? <AnimatedNumber value={stats.totalIntentos} /> : '—'}
        caption={hasData ? `${stats.totalPreguntas} preguntas` : undefined}
      />
    </div>
  );
}

interface ActionCardsProps {
  onQuickRound: () => void;
  onReview: (count: number) => void;
  onOfficial: () => void;
  isStarting: boolean;
}

/**
 * The three ways to start studying, as cards big enough to hit without thinking.
 *
 * Each states what it costs (minutes, questions) because "how long will this take" is the
 * question that keeps a session from starting.
 */
export function ActionCards({ onQuickRound, onReview, onOfficial, isStarting }: ActionCardsProps) {
  const reviewCount = useProgressionStore((state) => Object.keys(state.reviewQueue).length);

  return (
    <ul className={styles.actions} aria-label="Formas de empezar">
      <ActionCard
        icon={Zap}
        title="Ronda rápida"
        text="Cinco preguntas con corrección inmediata y la explicación de cada solución. Unos tres minutos."
        cta="Empezar ahora"
        onClick={onQuickRound}
        disabled={isStarting}
        delay={0}
      />
      <ActionCard
        icon={RotateCcw}
        title="Repasar mis fallos"
        text={
          reviewCount > 0
            ? `${reviewCount} preguntas esperan repaso. Salen primero las que más has fallado.`
            : 'Aún no tienes fallos pendientes. Cuando falles una pregunta, volverá aquí.'
        }
        cta={reviewCount > 0 ? 'Repasar ahora' : 'Sin pendientes'}
        onClick={() => onReview(Math.min(reviewCount, 10))}
        disabled={isStarting || reviewCount === 0}
        delay={90}
      />
      <ActionCard
        icon={Timer}
        title="Simulacro oficial"
        text="Condiciones de examen: cuenta atrás, soluciones ocultas y baremo +1,00 / −0,33."
        cta="Configurar el examen"
        onClick={onOfficial}
        disabled={isStarting}
        delay={180}
      />
    </ul>
  );
}

function ActionCard({
  icon: Icon,
  title,
  text,
  cta,
  onClick,
  disabled,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
  disabled: boolean;
  delay: number;
}) {
  const { ref, revealProps } = useReveal<HTMLLIElement>(delay);

  return (
    <li ref={ref} {...revealProps}>
      <button type="button" className={styles.action} onClick={onClick} disabled={disabled}>
        <span className={styles.actionIcon}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className={styles.actionTitle}>{title}</span>
        <span className={styles.actionText}>{text}</span>
        <span className={styles.actionCta}>
          {cta} <ChevronRight size={15} aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

interface BlockMasteryProps {
  onPractice: (ordinal: number) => void;
  isStarting: boolean;
}

/** Mastery per syllabus block: a ring each, the weakest called out, and a way to work on it. */
export function BlockMastery({ onPractice, isStarting }: BlockMasteryProps) {
  const { estadisticas: stats } = useEstadisticas();

  return (
    <Card
      eyebrow="Temario"
      title="Tu dominio por bloque"
      subtitle="Porcentaje de aciertos en cada bloque oficial. Practica el que más lo necesite."
    >
      <ul className={styles.blocks}>
        {SYLLABUS_BLOCKS.map((block, index) => {
          const performance = stats.rendimientoPorBloque.find((entry) => entry.bloque === block.code);

          return (
            <BlockTile
              key={block.code}
              code={block.code}
              name={block.name}
              percent={performance?.precision ?? null}
              detail={
                performance
                  ? `${performance.aciertos} de ${performance.total} · nota ${performance.notaMedia.toFixed(2).replace('.', ',')}`
                  : 'Sin datos todavía'
              }
              isWeakest={stats.bloqueMasDebil === block.code}
              onPractice={() => onPractice(block.ordinal)}
              disabled={isStarting}
              delay={index * 80}
            />
          );
        })}
      </ul>
    </Card>
  );
}

function BlockTile({
  code,
  name,
  percent,
  detail,
  isWeakest,
  onPractice,
  disabled,
  delay,
}: {
  code: string;
  name: string;
  percent: number | null;
  detail: string;
  isWeakest: boolean;
  onPractice: () => void;
  disabled: boolean;
  delay: number;
}) {
  const { ref, revealProps } = useReveal<HTMLLIElement>(delay);
  const value = percent ?? 0;
  const tone = percent === null ? 'primary' : value >= 70 ? 'success' : value >= 50 ? 'warning' : 'danger';

  return (
    <li ref={ref} {...revealProps} className={`${styles.tile} ${isWeakest ? styles.tileWeak : ''}`}>
      <ProgressRing
        value={value / 100}
        tone={tone}
        size={5.5}
        label={percent === null ? `Bloque ${code}: sin datos` : `Bloque ${code}: ${Math.round(value)} por ciento de aciertos`}
        center={percent === null ? '—' : `${Math.round(value)}%`}
      />

      <div className={styles.tileText}>
        <span className={styles.tileCode}>Bloque {code}</span>
        <strong className={styles.tileName}>{name}</strong>
        <span className={styles.tileDetail}>{detail}</span>
        {isWeakest && <span className={styles.weakTag}>Insistir aquí</span>}
      </div>

      <Button size="small" variant="secondary" onClick={onPractice} disabled={disabled}>
        Practicar
      </Button>
    </li>
  );
}
