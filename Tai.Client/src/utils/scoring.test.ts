import { describe, expect, it } from 'vitest';
import { calculateINAPScore, formatDuration, gradeExam, tallyAnswers } from './scoring';
import type { Pregunta } from '../types/domain';

/**
 * The marking scale is the one thing a candidate uses this application to find out.
 * These tests pin it to the same constants the server applies, so the preview shown the
 * moment they finish cannot drift away from the grade that gets stored.
 */
describe('calculateINAPScore', () => {
  it('scores a perfect exam as ten', () => {
    expect(calculateINAPScore(20, 20, 0).grade).toBe(10);
  });

  it('subtracts a third of a mark for each wrong answer', () => {
    const score = calculateINAPScore(10, 8, 2);

    // (8 × 1.00) − (2 × 0.33) = 7.34 net points out of 10 available.
    expect(score.netPoints).toBe(7.34);
    expect(score.grade).toBe(7.34);
  });

  it('does not penalise unanswered questions', () => {
    const withBlanks = calculateINAPScore(10, 5, 0);

    expect(withBlanks.blank).toBe(5);
    expect(withBlanks.grade).toBe(5);
  });

  it('never returns a negative grade', () => {
    const score = calculateINAPScore(10, 0, 10);

    expect(score.grade).toBe(0);
    expect(score.netPoints).toBeLessThan(0);
  });

  it('returns zero rather than NaN for an empty exam', () => {
    // Dividing by zero rendered as "NaN / 10" in the results panel.
    const score = calculateINAPScore(0, 0, 0);

    expect(score.grade).toBe(0);
    expect(Number.isNaN(score.grade)).toBe(false);
  });

  it.each([
    [10, 20, 0],
    [10, 5, 20],
    [10, -5, -5],
  ])('clamps incoherent counters (total %i, correct %i, wrong %i)', (total, correct, wrong) => {
    const score = calculateINAPScore(total, correct, wrong);

    expect(score.correct + score.wrong + score.blank).toBe(total);
    expect(score.grade).toBeGreaterThanOrEqual(0);
    expect(score.grade).toBeLessThanOrEqual(10);
  });
});

describe('tallyAnswers', () => {
  const questions: Pregunta[] = [
    { id: 1, enunciado: 'a', opciones: ['x', 'y'], respuestaCorrecta: 0 },
    { id: 2, enunciado: 'b', opciones: ['x', 'y'], respuestaCorrecta: 1 },
    { id: 3, enunciado: 'c', opciones: ['x', 'y'], respuestaCorrecta: 0 },
  ];

  it('separates correct, wrong and unanswered', () => {
    expect(tallyAnswers(questions, { 1: 0, 2: 0 })).toEqual({ correct: 1, wrong: 1, blank: 1 });
  });

  it('treats an option index of zero as an answer, not as missing', () => {
    // A falsy-looking index is exactly the sort of thing a truthiness check gets wrong.
    expect(tallyAnswers(questions, { 1: 0, 2: 1, 3: 0 })).toEqual({
      correct: 3,
      wrong: 0,
      blank: 0,
    });
  });

  it('grades a full answer sheet in one step', () => {
    expect(gradeExam(questions, { 1: 0, 2: 1, 3: 0 }).grade).toBe(10);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [59, '00:59'],
    [540, '09:00'],
    [3661, '1:01:01'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it('never renders a negative clock', () => {
    expect(formatDuration(-30)).toBe('00:00');
  });
});
