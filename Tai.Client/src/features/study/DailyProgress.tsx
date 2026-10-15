import { Flame, RotateCcw, Target, Zap } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  useProgressionStore,
  selectAnsweredToday,
} from '../../store/useProgressionStore';
import { currentStreak, isStreakAtRisk } from '../../utils/streak';
import styles from './DailyProgress.module.css';

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface DailyProgressProps {
  /** Starts a short session drawn from the questions most often missed. */
  onReviewMistakes: (count: number) => void;
  /** Starts a five-question round. */
  onQuickRound: () => void;
  isStarting: boolean;
}

/**
 * The panel that decides whether today becomes a study day.
 *
 * Its job is to remove the two reasons a session does not happen: not knowing what to
 * practise, and not having the half hour a full exam takes. Both answers are one click
 * away — a five-question round, or the questions already known to be weak.
 */
export function DailyProgress({ onReviewMistakes, onQuickRound, isStarting }: DailyProgressProps) {
  const streakState = useProgressionStore((state) => state.streak);
  const dailyGoal = useProgressionStore((state) => state.dailyGoal);
  const answeredToday = useProgressionStore(selectAnsweredToday);
  const reviewCount = useProgressionStore((state) => Object.keys(state.reviewQueue).length);

  const streak = currentStreak(streakState);
  const atRisk = isStreakAtRisk(streakState);
  const progress = dailyGoal > 0 ? Math.min(answeredToday / dailyGoal, 1) : 0;
  const goalMet = answeredToday >= dailyGoal;
  const remaining = Math.max(dailyGoal - answeredToday, 0);

  return (
    <Card eyebrow="Hoy" className={styles.card}>
      <div className={styles.panel}>
        <div className={`${styles.ring} ${goalMet ? styles.ringComplete : ''}`}>
          <svg
            className={styles.ringSvg}
            viewBox="0 0 100 100"
            role="img"
            aria-label={`${answeredToday} de ${dailyGoal} preguntas hechas hoy`}
          >
            <defs>
              <linearGradient id="daily-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-strong)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
              </linearGradient>
            </defs>
            <circle className={styles.ringTrack} cx="50" cy="50" r={RING_RADIUS} />
            <circle
              className={styles.ringFill}
              cx="50"
              cy="50"
              r={RING_RADIUS}
              strokeDasharray={`${progress * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            />
          </svg>

          <span className={styles.ringLabel} aria-hidden="true">
            <span className={styles.ringValue}>{answeredToday}</span>
            <span className={styles.ringUnit}>de {dailyGoal}</span>
          </span>
        </div>

        <div className={styles.body}>
          <h2 className={styles.headline}>{headline(goalMet, remaining, streak)}</h2>
          <p className={styles.sub}>{subtitle(goalMet, atRisk, streak, reviewCount)}</p>

          <div className={styles.chips}>
            {streak > 0 && (
              <span className={`${styles.chip} ${atRisk ? styles.chipRisk : styles.chipStreak}`}>
                <Flame size={14} aria-hidden="true" />
                {streak} {streak === 1 ? 'día' : 'días'} seguidos
              </span>
            )}

            {streakState.longest > 1 && (
              <span className={styles.chip}>
                <Target size={14} aria-hidden="true" />
                Récord: {streakState.longest}
              </span>
            )}

            {reviewCount > 0 && (
              <span className={`${styles.chip} ${styles.chipReview}`}>
                <RotateCcw size={14} aria-hidden="true" />
                {reviewCount} por repasar
              </span>
            )}
          </div>

          <div className={styles.actions}>
            <Button
              size="small"
              onClick={onQuickRound}
              disabled={isStarting}
              icon={<Zap size={15} aria-hidden="true" />}
            >
              Ronda rápida · 5 preguntas
            </Button>

            {reviewCount > 0 && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => onReviewMistakes(Math.min(reviewCount, 10))}
                disabled={isStarting}
                icon={<RotateCcw size={15} aria-hidden="true" />}
              >
                Repasar mis fallos
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function headline(goalMet: boolean, remaining: number, streak: number): string {
  if (goalMet) {
    return streak > 1 ? `Objetivo cumplido, ${streak} días seguidos` : 'Objetivo de hoy cumplido';
  }

  if (remaining <= 5) {
    return `Te faltan ${remaining} preguntas`;
  }

  return streak > 0 ? 'Mantén la racha' : 'Empieza tu racha';
}

function subtitle(goalMet: boolean, atRisk: boolean, streak: number, reviewCount: number): string {
  if (goalMet) {
    return reviewCount > 0
      ? `Si te quedan ganas, tienes ${reviewCount} preguntas falladas esperando repaso.`
      : 'Todo lo que hagas a partir de aquí es ventaja.';
  }

  if (atRisk && streak > 0) {
    return `Llevas ${streak} ${streak === 1 ? 'día' : 'días'} seguidos. Una ronda rápida basta para no romperla.`;
  }

  return 'Cinco preguntas cuentan igual que cincuenta para la racha.';
}
