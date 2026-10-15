import { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flag, Flame, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Callout } from '../../components/ui/Callout';
import { Metric } from '../../components/ui/Metric';
import { QuestionCard } from '../study/QuestionCard';
import { useExamKeyboard, useExamTimer } from '../../hooks/useStudy';
import { useEstadisticas, useSubmitIntento } from '../../hooks/useProgress';
import { useProgressionStore } from '../../store/useProgressionStore';
import { currentStreak } from '../../utils/streak';
import { useStudyStore } from '../../store/useStudyStore';
import { formatDuration, gradeExam, PENALTY_PER_WRONG } from '../../utils/scoring';
import { blockDisplayName } from '../../types/domain';
import styles from './ExamEngine.module.css';

/** Grade at or above which the exam is considered passed. */
const PASS_MARK = 5;

/** Seconds left at which the clock starts warning the candidate. */
const URGENT_THRESHOLD = 120;

export function ExamEngine() {
  const phase = useStudyStore((state) => state.phase);

  return phase === 'finished' ? <ExamResults /> : <ExamRunner />;
}

function ExamRunner() {
  const questions = useStudyStore((state) => state.questions);
  const answers = useStudyStore((state) => state.answers);
  const currentIndex = useStudyStore((state) => state.currentIndex);
  const mode = useStudyStore((state) => state.mode);
  const goToQuestion = useStudyStore((state) => state.goToQuestion);
  const nextQuestion = useStudyStore((state) => state.nextQuestion);
  const previousQuestion = useStudyStore((state) => state.previousQuestion);
  const finishTest = useStudyStore((state) => state.finishTest);

  const secondsRemaining = useExamTimer();
  useExamKeyboard(true);

  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (!question) {
    return (
      <Callout tone="warning" title="No hay preguntas cargadas">
        Vuelve a la configuración para generar un nuevo simulacro.
      </Callout>
    );
  }

  const unanswered = questions.length - answeredCount;

  return (
    <div className={styles.engine}>
      <div className={styles.bar}>
        <div className={styles.barGroup}>
          <span className={styles.progressText}>
            {answeredCount}/{questions.length} respondidas
          </span>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-label="Progreso del simulacro"
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {secondsRemaining !== null && (
          <span
            className={`${styles.timer} ${secondsRemaining <= URGENT_THRESHOLD ? styles.timerUrgent : ''}`}
            // Polite, and only while it matters: announcing every second would make the
            // page unusable with a screen reader.
            role="timer"
            aria-live={secondsRemaining <= URGENT_THRESHOLD ? 'polite' : 'off'}
          >
            <Clock size={15} aria-hidden="true" />
            {formatDuration(secondsRemaining)}
          </span>
        )}
      </div>

      <nav className={styles.palette} aria-label="Ir a una pregunta">
        {questions.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={[
              styles.paletteItem,
              answers[item.id] !== undefined ? styles.paletteAnswered : '',
              index === currentIndex ? styles.paletteCurrent : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => goToQuestion(index)}
            aria-current={index === currentIndex ? 'true' : undefined}
            aria-label={`Pregunta ${index + 1}${answers[item.id] !== undefined ? ', respondida' : ', sin responder'}`}
          >
            {index + 1}
          </button>
        ))}
      </nav>

      <QuestionCard
        key={question.id}
        pregunta={question}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
      />

      <div className={styles.navigation}>
        <div className={styles.navigationGroup}>
          <Button
            variant="secondary"
            onClick={previousQuestion}
            disabled={currentIndex === 0}
            icon={<ChevronLeft size={16} aria-hidden="true" />}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            icon={<ChevronRight size={16} aria-hidden="true" />}
          >
            Siguiente
          </Button>
        </div>

        <div className={styles.navigationGroup}>
          <span className={styles.hint}>
            <kbd className={styles.kbd}>←</kbd> <kbd className={styles.kbd}>→</kbd> navegar ·{' '}
            <kbd className={styles.kbd}>A</kbd>–<kbd className={styles.kbd}>D</kbd> responder
          </span>
          <Button
            onClick={() => {
              // In exam mode a blank counts as zero, so leaving questions unanswered is a
              // real decision worth confirming rather than a slip.
              if (
                mode === 'exam' &&
                unanswered > 0 &&
                !window.confirm(
                  `Quedan ${unanswered} ${unanswered === 1 ? 'pregunta sin responder' : 'preguntas sin responder'}. ¿Finalizar de todas formas?`,
                )
              ) {
                return;
              }

              finishTest();
            }}
            icon={<Flag size={16} aria-hidden="true" />}
          >
            Finalizar y corregir
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExamResults() {
  const questions = useStudyStore((state) => state.questions);
  const answers = useStudyStore((state) => state.answers);
  const bloque = useStudyStore((state) => state.bloque);
  const timedOut = useStudyStore((state) => state.timedOut);
  const isReviewing = useStudyStore((state) => state.isReviewing);
  const startedAt = useStudyStore((state) => state.startedAt);
  const finishedAt = useStudyStore((state) => state.finishedAt);
  const startReview = useStudyStore((state) => state.startReview);
  const reset = useStudyStore((state) => state.reset);

  const submit = useSubmitIntento();
  const recordSession = useProgressionStore((state) => state.recordSession);
  const recordAnswers = useProgressionStore((state) => state.recordAnswers);
  const streakState = useProgressionStore((state) => state.streak);
  const reviewCount = useProgressionStore((state) => Object.keys(state.reviewQueue).length);
  const { estadisticas } = useEstadisticas();
  const hasSubmitted = useRef(false);

  // Computed once from the answer sheet. The previous version tallied the same exam twice
  // — once on submit and again on every render — which is exactly how the two figures
  // drift apart.
  const score = useMemo(() => gradeExam(questions, answers), [questions, answers]);

  useEffect(() => {
    // React 18 mounts effects twice in development; the ref is what keeps a single exam
    // from being recorded as two attempts.
    if (hasSubmitted.current || questions.length === 0) {
      return;
    }

    hasSubmitted.current = true;

    // Filed before the network call, so the streak and the review queue advance even
    // when the attempt cannot reach the server.
    recordAnswers(questions, answers);
    recordSession(score.correct + score.wrong);

    submit.mutate({
      aciertos: score.correct,
      fallos: score.wrong,
      total: score.total,
      bloque,
      fecha: new Date().toISOString(),
    });
  }, [answers, bloque, questions, recordAnswers, recordSession, score, submit]);

  const passed = score.grade >= PASS_MARK;

  // Both timestamps are fixed in the store. Reading the clock during render would make the
  // elapsed time creep upwards while the candidate simply looks at their result.
  const elapsed =
    startedAt !== null && finishedAt !== null
      ? Math.round((finishedAt - startedAt) / 1000)
      : null;

  if (isReviewing) {
    return (
      <div className={styles.review}>
        <Card
          eyebrow="Revisión"
          title="Soluciones detalladas"
          subtitle={`${score.correct} de ${score.total} correctas · nota ${score.grade.toFixed(2).replace('.', ',')}`}
          actions={
            <Button onClick={reset} icon={<RotateCcw size={16} aria-hidden="true" />}>
              Nuevo simulacro
            </Button>
          }
        >
          <p className="muted" style={{ margin: 0 }}>
            La opción correcta aparece marcada en verde y la tuya, si fallaste, en rojo.
          </p>
        </Card>

        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            pregunta={question}
            questionNumber={index + 1}
            totalQuestions={questions.length}
            revealAnswers
          />
        ))}
      </div>
    );
  }

  return (
    <Card
      eyebrow="Resultado"
      title="Corrección con baremo oficial INAP"
      subtitle={blockDisplayName(bloque)}
    >
      <div className={styles.results}>
        {timedOut && (
          <Callout tone="warning" title="Se agotó el tiempo">
            El simulacro se cerró automáticamente al llegar a cero, igual que en el examen
            oficial. Las preguntas sin responder cuentan como blancos.
          </Callout>
        )}

        {submit.isError && (
          <Callout tone="danger" title="No se pudo guardar el intento">
            {submit.error instanceof Error
              ? submit.error.message
              : 'El resultado se muestra igualmente, pero no ha quedado registrado.'}
          </Callout>
        )}

        {/* The grade is the answer to the only question the candidate is asking. */}
        <div className={styles.grade} role="status" aria-live="polite">
          <span
            className={`${styles.gradeValue} ${passed ? styles.gradePass : styles.gradeFail}`}
          >
            {score.grade.toFixed(2).replace('.', ',')}
          </span>
          <span className={styles.gradeScale}>/ 10</span>
          <span
            className={`${styles.gradeVerdict} ${passed ? styles.verdictPass : styles.verdictFail}`}
          >
            {passed ? 'Apto' : 'No apto'}
          </span>
        </div>

        <div className="metric-grid">
          <Metric label="Aciertos" value={score.correct} caption="+1,00 cada uno" tone="success" />
          <Metric
            label="Fallos"
            value={score.wrong}
            caption={`−${PENALTY_PER_WRONG.toFixed(2).replace('.', ',')} cada uno`}
            tone="danger"
          />
          <Metric label="En blanco" value={score.blank} caption="0,00 · no penalizan" />
          <Metric
            label="Puntuación neta"
            value={score.netPoints.toFixed(2).replace('.', ',')}
            unit={`/ ${score.maxPoints}`}
            tone="accent"
          />
          {elapsed !== null && (
            <Metric label="Tiempo empleado" value={formatDuration(elapsed)} />
          )}
        </div>

        <SessionOutcome
          score={score}
          averageBefore={estadisticas.notaMedia}
          attemptsBefore={estadisticas.totalIntentos}
          streak={currentStreak(streakState)}
          reviewCount={reviewCount}
        />

        <div className={styles.navigationGroup}>
          {score.wrong > 0 && (
            <Button onClick={startReview}>
              Repasar los {score.wrong} {score.wrong === 1 ? 'fallo' : 'fallos'}
            </Button>
          )}
          <Button onClick={startReview} variant={score.wrong > 0 ? 'secondary' : 'primary'}>
            Ver todas las soluciones
          </Button>
          <Button onClick={reset} variant="secondary" icon={<RotateCcw size={16} aria-hidden="true" />}>
            Nuevo simulacro
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface SessionOutcomeProps {
  score: { grade: number; wrong: number; correct: number; total: number };
  /** Average across previous attempts, so the delta compares like with like. */
  averageBefore: number;
  attemptsBefore: number;
  streak: number;
  reviewCount: number;
}

/**
 * What this session changed.
 *
 * A grade on its own says how it went; it does not say whether things are improving. The
 * comparison against the running average is the part that makes the next session feel
 * worth starting — and it is deliberately omitted on the first attempt, where there is
 * nothing honest to compare against.
 */
function SessionOutcome({
  score,
  averageBefore,
  attemptsBefore,
  streak,
  reviewCount,
}: SessionOutcomeProps) {
  // The submitted attempt is already folded into the average by the time this renders, so
  // comparing against it directly would measure the session against itself.
  const hasHistory = attemptsBefore > 1;
  const delta = hasHistory ? score.grade - averageBefore : null;
  const improved = delta !== null && delta > 0.05;
  const worsened = delta !== null && delta < -0.05;

  return (
    <div className={styles.outcome}>
      {delta !== null && (improved || worsened) && (
        <span className={`${styles.outcomeItem} ${improved ? styles.outcomeUp : styles.outcomeDown}`}>
          {improved ? (
            <TrendingUp size={16} aria-hidden="true" />
          ) : (
            <TrendingDown size={16} aria-hidden="true" />
          )}
          {improved ? '+' : '−'}
          {Math.abs(delta).toFixed(2).replace('.', ',')} sobre tu media
        </span>
      )}

      {streak > 0 && (
        <span className={`${styles.outcomeItem} ${styles.outcomeStreak}`}>
          <Flame size={16} aria-hidden="true" />
          {streak} {streak === 1 ? 'día seguido' : 'días seguidos'}
        </span>
      )}

      {reviewCount > 0 && (
        <span className={styles.outcomeItem}>
          <RotateCcw size={16} aria-hidden="true" />
          {reviewCount} en la cola de repaso
        </span>
      )}
    </div>
  );
}
