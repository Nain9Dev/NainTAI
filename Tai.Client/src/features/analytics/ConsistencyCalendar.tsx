import { buildConsistencyCalendar } from '../../utils/chart';
import type { Intento } from '../../types/domain';
import styles from './ConsistencyCalendar.module.css';

const WEEKS = 10;
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

interface ConsistencyCalendarProps {
  attempts: ReadonlyArray<Pick<Intento, 'fecha' | 'total'>>;
}

/**
 * Practice per day over the last ten weeks, as a grid of squares.
 *
 * The goal is a habit, so the picture that matters is "how many days did I show up", not how
 * well. Each square also carries its exact count in a tooltip, and the whole grid has one
 * sentence for assistive technology, so the five shades are never the only source.
 */
export function ConsistencyCalendar({ attempts }: ConsistencyCalendarProps) {
  const { weeks, activeDays, totalQuestions } = buildConsistencyCalendar(attempts, new Date(), WEEKS);
  const summary =
    activeDays === 0
      ? `Sin práctica en las últimas ${WEEKS} semanas.`
      : `${activeDays} ${activeDays === 1 ? 'día' : 'días'} con práctica en las últimas ${WEEKS} semanas, ${totalQuestions} preguntas en total.`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.frame} role="img" aria-label={summary}>
        <ol className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <li key={day}>{day}</li>
          ))}
        </ol>

        <div className={styles.grid} aria-hidden="true">
          {weeks.map((week) => (
            <div key={week[0].day} className={styles.week}>
              {week.map((cell) => (
                <span
                  key={cell.day}
                  className={`${styles.cell} ${cell.isFuture ? styles.future : ''}`}
                  data-level={cell.level}
                  title={cell.isFuture ? undefined : `${formatDay(cell.day)}: ${cell.questions} preguntas`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.summary}>{summary}</p>

        <div className={styles.scale} aria-hidden="true">
          Menos
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={styles.cell} data-level={level} />
          ))}
          Más
        </div>
      </div>
    </div>
  );
}

function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
