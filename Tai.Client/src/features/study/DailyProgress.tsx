import { Flame, RotateCcw, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { useProgressionStore, selectAnsweredToday } from '../../store/useProgressionStore';
import { currentStreak, isStreakAtRisk } from '../../utils/streak';
import styles from './DailyProgress.module.css';

/**
 * Today's goal and the streak, the two numbers that decide whether a session happens.
 *
 * The actions that used to sit under this panel moved to the action cards beside it: a
 * goal panel that also owned three buttons was doing two jobs, and the buttons were the part a
 * visitor needs to find first.
 */
export function DailyProgress() {
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
        <ProgressRing
          value={progress}
          tone={goalMet ? 'success' : 'primary'}
          label={`${answeredToday} de ${dailyGoal} preguntas hechas hoy`}
          center={answeredToday}
          caption={`de ${dailyGoal}`}
          size={7.5}
        />

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
