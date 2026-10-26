/**
 * Synthetic example data for the public demo.
 *
 * A visitor who tries the application should see a product that is being used, not a row of
 * zeros. Everything here is invented, deterministic and relative to the day it is built, so
 * the demo always reads as "three weeks of practice that ends today". Nothing is sent to the
 * API: these are local attempts, with the negative ids every local attempt carries.
 */
import type { Intento, Pregunta } from '../types/domain';
import type { ProgressionSnapshot, ReviewEntry } from '../store/useProgressionStore';
import { toLocalDay } from '../utils/streak';

export const DEMO_DAILY_GOAL = 20;

/** Official INAP scale, mirrored from `toLocalAttempt` so the demo grades like the product. */
const WRONG_ANSWER_PENALTY = 0.33;

/** Share of wrong answers that were answered rather than left blank. */
const ANSWERED_WRONG_SHARE = 0.75;

const MAX_REVIEW_ENTRIES = 8;

/** Fixed so two builds on the same day are identical: the demo must not flicker between visits. */
const PRNG_SEED = 0x7a1_c0de;

interface PlannedAttempt {
  daysAgo: number;
  bloque: string;
  total: number;
  /** Target share of correct answers, before the small deterministic jitter. */
  accuracy: number;
}

/**
 * Three weeks of practice. Grades climb from the low fives to the high sevens, block III stays
 * the weak spot, and the last nine days are consecutive so the streak is real. Today holds a
 * five-question round and a ten-question exam: fifteen of the twenty-question daily goal.
 */
const PLAN: readonly PlannedAttempt[] = [
  { daysAgo: 20, bloque: 'I', total: 20, accuracy: 0.56 },
  { daysAgo: 18, bloque: 'III', total: 10, accuracy: 0.4 },
  { daysAgo: 17, bloque: 'II', total: 20, accuracy: 0.54 },
  { daysAgo: 15, bloque: 'IV', total: 10, accuracy: 0.48 },
  { daysAgo: 13, bloque: 'all', total: 30, accuracy: 0.56 },
  { daysAgo: 12, bloque: 'I', total: 20, accuracy: 0.62 },
  { daysAgo: 10, bloque: 'III', total: 10, accuracy: 0.44 },
  { daysAgo: 8, bloque: 'II', total: 20, accuracy: 0.62 },
  { daysAgo: 7, bloque: 'I', total: 10, accuracy: 0.7 },
  { daysAgo: 6, bloque: 'IV', total: 20, accuracy: 0.6 },
  { daysAgo: 5, bloque: 'III', total: 10, accuracy: 0.52 },
  { daysAgo: 4, bloque: 'all', total: 30, accuracy: 0.68 },
  { daysAgo: 3, bloque: 'I', total: 20, accuracy: 0.8 },
  { daysAgo: 2, bloque: 'II', total: 10, accuracy: 0.78 },
  { daysAgo: 1, bloque: 'IV', total: 20, accuracy: 0.76 },
  { daysAgo: 0, bloque: 'all', total: 5, accuracy: 0.8 },
  { daysAgo: 0, bloque: 'I', total: 10, accuracy: 0.9 },
];

export const DEMO_ATTEMPT_COUNT = PLAN.length;

/** Consecutive days ending today that carry an attempt; the longest earlier run was longer. */
const CURRENT_STREAK = 9;
const LONGEST_STREAK = 12;

export interface DemoSeed {
  historial: Intento[];
  progression: ProgressionSnapshot;
}

export function buildDemoSeed(today: Date, questions: readonly Pregunta[]): DemoSeed {
  const random = mulberry32(PRNG_SEED);
  const historial = PLAN.map((planned, index) => toAttempt(planned, index, today, random));

  const todayDay = toLocalDay(today);
  const answeredToday = historial
    .filter((attempt) => toLocalDay(new Date(attempt.fecha)) === todayDay)
    .reduce((sum, attempt) => sum + attempt.total, 0);

  return {
    historial,
    progression: {
      streak: { current: CURRENT_STREAK, longest: LONGEST_STREAK, lastPracticeDay: todayDay },
      dailyGoal: DEMO_DAILY_GOAL,
      answeredToday,
      todayDay,
      reviewQueue: buildReviewQueue(questions, today, random),
    },
  };
}

function toAttempt(
  planned: PlannedAttempt,
  index: number,
  today: Date,
  random: () => number,
): Intento {
  // Up to one question either way, so the grades do not trace a ruler-straight line.
  const jitter = Math.round((random() - 0.5) * 2);
  const aciertos = clamp(Math.round(planned.total * planned.accuracy) + jitter, 0, planned.total);
  const wrong = planned.total - aciertos;
  const fallos = Math.round(wrong * ANSWERED_WRONG_SHARE);
  const blancos = wrong - fallos;
  const net = aciertos - fallos * WRONG_ANSWER_PENALTY;
  const nota = Math.max(0, (net / planned.total) * 10);

  return {
    id: -(index + 1),
    aciertos,
    fallos,
    blancos,
    total: planned.total,
    nota: Math.round((nota + Number.EPSILON) * 100) / 100,
    bloque: planned.bloque,
    fecha: attemptTime(today, planned.daysAgo, index).toISOString(),
  };
}

/**
 * A moment inside the right local day.
 *
 * Past days get an evening hour. Today is placed at fixed fractions of the time elapsed since
 * midnight, so an attempt can never land in the future, or on yesterday, whatever the clock
 * says when the demo starts.
 */
function attemptTime(today: Date, daysAgo: number, index: number): Date {
  if (daysAgo > 0) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo, 19, 0);
    day.setMinutes(day.getMinutes() + (index % 4) * 11);
    return day;
  }

  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const elapsed = today.getTime() - midnight.getTime();
  const earlierToday = PLAN.filter((planned) => planned.daysAgo === 0).length;
  const position = index - (PLAN.length - earlierToday);
  const fraction = (position + 1) / (earlierToday + 1);

  return new Date(midnight.getTime() + Math.floor(elapsed * fraction));
}

function buildReviewQueue(
  questions: readonly Pregunta[],
  today: Date,
  random: () => number,
): Record<number, ReviewEntry> {
  if (questions.length === 0) {
    return {};
  }

  const ordered = [...questions].sort((a, b) => a.id - b.id);
  const count = Math.min(MAX_REVIEW_ENTRIES, Math.max(5, Math.floor(ordered.length / 4)), ordered.length);
  // Evenly spaced through the catalogue, so the queue draws on every block that has questions.
  const step = ordered.length / count;
  const queue: Record<number, ReviewEntry> = {};

  for (let slot = 0; slot < count; slot += 1) {
    const pregunta = ordered[Math.floor(slot * step)];
    const lastSeen = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (1 + (slot % 6)));

    queue[pregunta.id] = {
      pregunta,
      timesWrong: 1 + Math.floor(random() * 3),
      streakCorrect: random() < 0.35 ? 1 : 0,
      lastSeen: toLocalDay(lastSeen),
    };
  }

  return queue;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Small seedable PRNG (mulberry32): enough variety for demo data, and reproducible. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
