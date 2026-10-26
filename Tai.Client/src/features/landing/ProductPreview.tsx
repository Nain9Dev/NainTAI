import { CheckCircle2, Flame, RotateCcw } from 'lucide-react';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { MasteryBar } from '../../components/ui/MasteryBar';
import { buildDemoSeed, DEMO_DAILY_GOAL } from '../../demo/seed';
import { computeLocalEstadisticas } from '../../utils/analytics';
import { blockDisplayName, SYLLABUS_BLOCKS } from '../../types/domain';
import styles from './ProductPreview.module.css';

/**
 * The first thing a visitor sees of the product, drawn with the product's own components.
 *
 * Not a screenshot: it is built from the same seed the demo opens with, so the figures here
 * are the figures behind the "Probar la demo" button, and it can never drift from the real
 * interface. It is purely illustrative, so assistive technology gets one sentence instead of
 * a tour of decorative controls.
 */
const seed = buildDemoSeed(new Date(), []);
const stats = computeLocalEstadisticas(seed.historial);
const answeredToday = seed.progression.answeredToday;
const remaining = Math.max(DEMO_DAILY_GOAL - answeredToday, 0);
const streak = seed.progression.streak.current;

const PREVIEW_OPTIONS = [
  { letter: 'A', text: 'El Tribunal Supremo', correct: false },
  { letter: 'B', text: 'El Tribunal Constitucional', correct: true },
  { letter: 'C', text: 'El Consejo de Estado', correct: false },
  { letter: 'D', text: 'El Defensor del Pueblo', correct: false },
] as const;

export function ProductPreview() {
  const weakest = stats.bloqueMasDebil;

  return (
    <div className={styles.stage}>
      <p className="visually-hidden">
        Vista previa de la aplicación: un panel con el objetivo diario, una racha de {streak} días,
        el nivel en cada bloque del temario y una pregunta corregida al instante con su explicación.
      </p>

      <div className={styles.window} aria-hidden="true">
        <div className={styles.chrome}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.address}>tai.naindev.com</span>
        </div>

        <div className={styles.screen}>
          <div className={styles.today}>
            <ProgressRing
              value={answeredToday / DEMO_DAILY_GOAL}
              label={`${answeredToday} de ${DEMO_DAILY_GOAL} preguntas hechas hoy`}
              center={answeredToday}
              caption={`de ${DEMO_DAILY_GOAL}`}
              size={5.75}
            />

            <div className={styles.todayText}>
              <span className="eyebrow">Hoy</span>
              <strong className={styles.headline}>Te faltan {remaining} preguntas</strong>
              <span className={styles.chips}>
                <span className={`${styles.chip} ${styles.chipStreak}`}>
                  <Flame size={13} aria-hidden="true" />
                  {streak} días seguidos
                </span>
                <span className={`${styles.chip} ${styles.chipReview}`}>
                  <RotateCcw size={13} aria-hidden="true" />
                  {Object.keys(seed.progression.reviewQueue).length || 7} por repasar
                </span>
              </span>
            </div>
          </div>

          <div className={styles.blocks}>
            {SYLLABUS_BLOCKS.map((block) => {
              const performance = stats.rendimientoPorBloque.find((entry) => entry.bloque === block.code);
              const percent = performance?.precision ?? 0;

              return (
                <MasteryBar
                  key={block.code}
                  label={blockDisplayName(block.code)}
                  percent={percent}
                  detail={`${Math.round(percent)}%`}
                  ariaLabel={`Precisión en el bloque ${block.code}`}
                  highlight={weakest === block.code}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.question} aria-hidden="true">
        <span className="eyebrow">Modo estudio · Bloque I</span>
        <strong className={styles.prompt}>¿Qué órgano controla la constitucionalidad de las leyes?</strong>

        <ul className={styles.options}>
          {PREVIEW_OPTIONS.map((option) => (
            <li key={option.letter} className={option.correct ? styles.optionCorrect : styles.option}>
              <span className={styles.letter}>{option.letter}</span>
              {option.text}
              {option.correct && <CheckCircle2 size={16} className={styles.tick} aria-hidden="true" />}
            </li>
          ))}
        </ul>

        <p className={styles.explanation}>
          <strong>Correcta.</strong> Art. 161 CE: el Tribunal Constitucional resuelve los recursos de
          inconstitucionalidad contra leyes.
        </p>
      </div>
    </div>
  );
}
