import { describe, expect, it } from 'vitest';
import { buildDemoSeed, DEMO_ATTEMPT_COUNT, DEMO_DAILY_GOAL } from './seed';
import { computeLocalEstadisticas } from '../utils/analytics';
import { currentStreak, daysBetween, toLocalDay } from '../utils/streak';
import { normalizeBlockCode } from '../types/domain';
import type { Pregunta } from '../types/domain';

const TODAY = new Date(2026, 9, 26, 18, 30, 0);

function catalogue(size = 30): Pregunta[] {
  return Array.from({ length: size }, (_, index) => ({
    id: 100 + index,
    enunciado: `Pregunta ${index}`,
    opciones: ['a', 'b', 'c', 'd'],
    respuestaCorrecta: index % 4,
    bloque: String((index % 3) + 1),
  }));
}

describe('demo seed attempts', () => {
  const seed = buildDemoSeed(TODAY, catalogue());

  it('produces the documented number of attempts, oldest first', () => {
    expect(seed.historial).toHaveLength(DEMO_ATTEMPT_COUNT);

    const times = seed.historial.map((attempt) => new Date(attempt.fecha).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('uses negative unique ids so no attempt can be mistaken for a server one', () => {
    const ids = seed.historial.map((attempt) => attempt.id);

    expect(ids.every((id) => id < 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spreads the attempts over the last three weeks and never into the future', () => {
    for (const attempt of seed.historial) {
      const time = new Date(attempt.fecha);
      expect(time.getTime()).toBeLessThanOrEqual(TODAY.getTime());

      const age = daysBetween(toLocalDay(time), toLocalDay(TODAY));
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(21);
    }
  });

  it('keeps every attempt arithmetically consistent with the official scale', () => {
    for (const attempt of seed.historial) {
      expect(attempt.aciertos + attempt.fallos + attempt.blancos).toBe(attempt.total);

      const expected = Math.max(0, ((attempt.aciertos - attempt.fallos * 0.33) / attempt.total) * 10);
      expect(attempt.nota).toBeCloseTo(expected, 1);
      expect(attempt.nota).toBeGreaterThanOrEqual(0);
      expect(attempt.nota).toBeLessThanOrEqual(10);
    }
  });

  it('stores block labels in their normalised form', () => {
    for (const attempt of seed.historial) {
      expect(attempt.bloque).toBe(normalizeBlockCode(attempt.bloque));
    }
  });
});

describe('demo seed statistics', () => {
  const stats = computeLocalEstadisticas(buildDemoSeed(TODAY, catalogue()).historial);

  it('shows an improving trend, which is the story the demo tells', () => {
    const grades = stats.tendencia.map((point) => point.nota);
    const head = grades.slice(0, 4).reduce((sum, grade) => sum + grade, 0) / 4;
    const tail = grades.slice(-4).reduce((sum, grade) => sum + grade, 0) / 4;

    expect(tail - head).toBeGreaterThanOrEqual(1);
  });

  it('has a believable average around the pass mark', () => {
    expect(stats.notaMedia).toBeGreaterThan(4.5);
    expect(stats.notaMedia).toBeLessThan(7.5);
    expect(stats.mejorNota).toBeGreaterThan(stats.notaMedia);
  });

  it('covers the four syllabus blocks and names block III as the weakest', () => {
    expect(stats.rendimientoPorBloque.map((block) => block.bloque).sort()).toEqual([
      'I',
      'II',
      'III',
      'IV',
    ]);
    expect(stats.bloqueMasDebil).toBe('III');
  });
});

describe('demo seed progression', () => {
  const seed = buildDemoSeed(TODAY, catalogue());
  const { progression } = seed;

  it('opens a live streak that today still counts', () => {
    expect(progression.streak.lastPracticeDay).toBe(toLocalDay(TODAY));
    expect(currentStreak(progression.streak, toLocalDay(TODAY))).toBe(progression.streak.current);
    expect(progression.streak.current).toBeGreaterThanOrEqual(7);
    expect(progression.streak.longest).toBeGreaterThan(progression.streak.current);
  });

  it('backs the streak with an attempt on each of its days', () => {
    const days = new Set(seed.historial.map((attempt) => toLocalDay(new Date(attempt.fecha))));

    for (let back = 0; back < progression.streak.current; back += 1) {
      const day = new Date(TODAY);
      day.setDate(day.getDate() - back);
      expect(days.has(toLocalDay(day))).toBe(true);
    }
  });

  it('leaves today’s goal visibly in progress and matches today’s attempts', () => {
    const today = toLocalDay(TODAY);
    const answered = seed.historial
      .filter((attempt) => toLocalDay(new Date(attempt.fecha)) === today)
      .reduce((sum, attempt) => sum + attempt.total, 0);

    expect(progression.dailyGoal).toBe(DEMO_DAILY_GOAL);
    expect(progression.todayDay).toBe(today);
    expect(progression.answeredToday).toBe(answered);
    expect(progression.answeredToday).toBeGreaterThanOrEqual(DEMO_DAILY_GOAL / 2);
    expect(progression.answeredToday).toBeLessThan(DEMO_DAILY_GOAL);
  });

  it('queues a handful of the given questions for review', () => {
    const questions = catalogue();
    const queue = Object.values(progression.reviewQueue);
    const known = new Set(questions.map((question) => question.id));

    expect(queue.length).toBeGreaterThanOrEqual(5);
    expect(queue.length).toBeLessThanOrEqual(8);
    expect(queue.every((entry) => known.has(entry.pregunta.id))).toBe(true);
    expect(queue.every((entry) => entry.timesWrong >= 1 && entry.timesWrong <= 3)).toBe(true);
    expect(Object.keys(progression.reviewQueue).map(Number)).toEqual(
      queue.map((entry) => entry.pregunta.id),
    );
  });

  it('seeds an empty review queue, and nothing else changes, when there are no questions', () => {
    const bare = buildDemoSeed(TODAY, []);

    expect(bare.progression.reviewQueue).toEqual({});
    expect(bare.historial).toEqual(seed.historial);
    expect(bare.progression.streak).toEqual(progression.streak);
  });
});

describe('demo seed determinism', () => {
  it('returns identical data for identical input', () => {
    expect(buildDemoSeed(TODAY, catalogue())).toEqual(buildDemoSeed(TODAY, catalogue()));
  });

  it('moves with the calendar: the same story is told relative to a later day', () => {
    const later = new Date(2026, 10, 3, 18, 30, 0);
    const ages = (reference: Date) =>
      buildDemoSeed(reference, catalogue()).historial.map((attempt) =>
        daysBetween(toLocalDay(new Date(attempt.fecha)), toLocalDay(reference)),
      );

    expect(ages(later)).toEqual(ages(TODAY));
  });

  it('keeps today’s attempts in the past even early in the morning', () => {
    const earlyMorning = new Date(2026, 9, 26, 0, 5, 0);
    const seed = buildDemoSeed(earlyMorning, catalogue());

    for (const attempt of seed.historial) {
      expect(new Date(attempt.fecha).getTime()).toBeLessThanOrEqual(earlyMorning.getTime());
    }
    expect(seed.progression.answeredToday).toBeGreaterThan(0);
  });
});
