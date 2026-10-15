import { Check, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useStudyStore } from '../../store/useStudyStore';
import { blockDisplayName } from '../../types/domain';
import type { Pregunta } from '../../types/domain';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  pregunta: Pregunta;
  questionNumber: number;
  totalQuestions: number;
  /** Reveals the answer key regardless of mode, for reviewing a finished exam. */
  revealAnswers?: boolean;
}

export function QuestionCard({
  pregunta,
  questionNumber,
  totalQuestions,
  revealAnswers = false,
}: QuestionCardProps) {
  const mode = useStudyStore((state) => state.mode);
  const answerQuestion = useStudyStore((state) => state.answerQuestion);
  const selected = useStudyStore((state) => state.answers[pregunta.id]);

  const hasAnswered = selected !== undefined;
  // Study mode corrects as you go; exam mode holds everything back until review.
  const showsKey = revealAnswers || (mode === 'study' && hasAnswered);
  const isLocked = revealAnswers || (mode === 'study' && hasAnswered);

  return (
    <Card as="article">
      <div className={styles.question}>
        <div className={styles.meta}>
          <span className={styles.counter}>
            Pregunta {questionNumber} de {totalQuestions}
          </span>
          {pregunta.bloque && (
            <span className={styles.tag}>{blockDisplayName(pregunta.bloque)}</span>
          )}
          {pregunta.tema && <span className={styles.tag}>{pregunta.tema}</span>}
        </div>

        <h3 className={styles.statement}>{pregunta.enunciado}</h3>

        <div className={styles.options} role="group" aria-label="Opciones de respuesta">
          {pregunta.opciones.map((texto, index) => {
            const isSelected = selected === index;
            const isCorrect = index === pregunta.respuestaCorrecta;

            return (
              <button
                key={index}
                type="button"
                className={optionClassName({ showsKey, isSelected, isCorrect })}
                onClick={() => answerQuestion(pregunta.id, index)}
                disabled={isLocked}
                aria-pressed={isSelected}
              >
                <span className={styles.marker} aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{texto}</span>

                {showsKey && (isCorrect || isSelected) && (
                  <span className={styles.verdict}>
                    {isCorrect ? (
                      <Check size={18} className={styles.correctText} aria-hidden="true" />
                    ) : (
                      <X size={18} className={styles.incorrectText} aria-hidden="true" />
                    )}
                    {/* The icon is decorative; this is what a screen reader announces. */}
                    <span className="visually-hidden">
                      {isCorrect ? 'Respuesta correcta' : 'Respuesta incorrecta'}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showsKey && hasAnswered && (
          <div className={styles.feedback} role="status">
            <span className={styles.feedbackTitle}>
              {selected === pregunta.respuestaCorrecta ? (
                <span className={styles.correctText}>Correcto</span>
              ) : (
                <span className={styles.incorrectText}>
                  Incorrecto · la respuesta es la{' '}
                  {String.fromCharCode(65 + pregunta.respuestaCorrecta)}
                </span>
              )}
            </span>

            {/* The API returns an explanation when the question has one; most do not yet. */}
            {pregunta.explicacion && <p style={{ margin: 0 }}>{pregunta.explicacion}</p>}

            {(pregunta.bloqueNombre || pregunta.tema) && (
              <span className={styles.feedbackMeta}>
                Repasa: {[pregunta.bloqueNombre, pregunta.tema].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function optionClassName({
  showsKey,
  isSelected,
  isCorrect,
}: {
  showsKey: boolean;
  isSelected: boolean;
  isCorrect: boolean;
}): string {
  const classes = [styles.option];

  if (showsKey) {
    if (isCorrect) {
      classes.push(styles.correct);
    } else if (isSelected) {
      classes.push(styles.incorrect);
    }
  } else if (isSelected) {
    classes.push(styles.selected);
  }

  return classes.join(' ');
}
