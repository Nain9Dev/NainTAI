import type { Pregunta } from '../types/domain';

/**
 * Official INAP marking scale: +1.00 per correct answer, −0.33 per wrong one, 0.00 for a
 * blank.
 *
 * This mirrors `ScoringService` on the server. The server remains authoritative — what is
 * computed here is a preview so the candidate sees their result the moment they finish,
 * without waiting for a round trip. The two are pinned to the same constants.
 */
export const POINTS_PER_CORRECT = 1;
export const PENALTY_PER_WRONG = 0.33;
export const MAX_GRADE = 10;

export interface ExamScore {
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  netPoints: number;
  maxPoints: number;
  /** Grade out of 10, never negative. */
  grade: number;
}

export function calculateINAPScore(total: number, correct: number, wrong: number): ExamScore {
  const safeTotal = Math.max(Math.trunc(total), 0);
  const safeCorrect = clamp(Math.trunc(correct), 0, safeTotal);
  const safeWrong = clamp(Math.trunc(wrong), 0, safeTotal - safeCorrect);
  const blank = safeTotal - safeCorrect - safeWrong;

  if (safeTotal === 0) {
    // Dividing by zero produced NaN, which rendered as "NaN / 10" in the results panel.
    return { total: 0, correct: 0, wrong: 0, blank: 0, netPoints: 0, maxPoints: 0, grade: 0 };
  }

  const netPoints = safeCorrect * POINTS_PER_CORRECT - safeWrong * PENALTY_PER_WRONG;
  const maxPoints = safeTotal * POINTS_PER_CORRECT;
  const grade = Math.max(0, (netPoints / maxPoints) * MAX_GRADE);

  return {
    total: safeTotal,
    correct: safeCorrect,
    wrong: safeWrong,
    blank,
    netPoints: round2(netPoints),
    maxPoints,
    grade: round2(grade),
  };
}

/** Tallies an answer sheet against the question set. */
export function tallyAnswers(
  questions: Pregunta[],
  answers: Record<number, number | undefined>,
): { correct: number; wrong: number; blank: number } {
  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (const question of questions) {
    const selected = answers[question.id];

    if (selected === undefined) {
      blank += 1;
    } else if (selected === question.respuestaCorrecta) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  return { correct, wrong, blank };
}

/** Grades an answer sheet in one step. */
export function gradeExam(
  questions: Pregunta[],
  answers: Record<number, number | undefined>,
): ExamScore {
  const { correct, wrong } = tallyAnswers(questions, answers);
  return calculateINAPScore(questions.length, correct, wrong);
}

/** Formats a duration in seconds as mm:ss, or h:mm:ss past an hour. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(Math.trunc(totalSeconds), 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(remainder).padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(max, min));
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
