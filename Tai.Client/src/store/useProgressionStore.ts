import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pregunta } from '../types/domain';
import { registerPractice, toLocalDay, type StreakState } from '../utils/streak';

/** Questions kept for review. Beyond this the oldest are dropped. */
const MAX_REVIEW_QUEUE = 120;

/** Times a question must be answered correctly before it leaves the review queue. */
const CORRECT_ANSWERS_TO_RETIRE = 2;

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;

export interface ReviewEntry {
  /** The question itself, so review works with no API reachable. */
  pregunta: Pregunta;
  /** How many times it has been answered wrong. Drives ordering. */
  timesWrong: number;
  /** Consecutive correct answers since the last mistake. */
  streakCorrect: number;
  lastSeen: string;
}

interface ProgressionState {
  streak: StreakState;
  dailyGoal: number;
  /** Questions answered today, reset on the first session of a new day. */
  answeredToday: number;
  todayDay: string | null;
  reviewQueue: Record<number, ReviewEntry>;

  setDailyGoal: (goal: number) => void;
  /** Records a finished session: advances the streak and the daily count. */
  recordSession: (questionsAnswered: number) => void;
  /** Files the questions from a finished exam into or out of the review queue. */
  recordAnswers: (questions: Pregunta[], answers: Record<number, number>) => void;
  /** Questions due for review, hardest first. */
  dueForReview: (limit: number) => Pregunta[];
  reviewCount: () => number;
  reset: () => void;
  /** Replaces the persisted fields wholesale. Used by the demo to seed and to restore. */
  replaceAll: (snapshot: ProgressionSnapshot) => void;
}

/** The persisted part of the store: what a demo seeds and what it must put back. */
export type ProgressionSnapshot = Pick<
  ProgressionState,
  'streak' | 'dailyGoal' | 'answeredToday' | 'todayDay' | 'reviewQueue'
>;

const initialStreak: StreakState = { current: 0, longest: 0, lastPracticeDay: null };

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      streak: initialStreak,
      dailyGoal: 20,
      answeredToday: 0,
      todayDay: null,
      reviewQueue: {},

      setDailyGoal: (dailyGoal) => set({ dailyGoal }),

      recordSession: (questionsAnswered) =>
        set((state) => {
          const today = toLocalDay();
          // The daily count belongs to a specific day; a session on a new day starts it over.
          const carried = state.todayDay === today ? state.answeredToday : 0;

          return {
            streak: registerPractice(state.streak, today),
            answeredToday: carried + questionsAnswered,
            todayDay: today,
          };
        }),

      recordAnswers: (questions, answers) =>
        set((state) => {
          const queue = { ...state.reviewQueue };
          const today = toLocalDay();

          for (const question of questions) {
            const selected = answers[question.id];

            // Unanswered questions say nothing about what the candidate knows, so they
            // neither enter the queue nor count as progress out of it.
            if (selected === undefined) {
              continue;
            }

            const existing = queue[question.id];

            if (selected !== question.respuestaCorrecta) {
              queue[question.id] = {
                pregunta: question,
                timesWrong: (existing?.timesWrong ?? 0) + 1,
                streakCorrect: 0,
                lastSeen: today,
              };
              continue;
            }

            if (!existing) {
              continue;
            }

            const streakCorrect = existing.streakCorrect + 1;

            // Getting it right once can be luck on a four-option question. Twice running
            // is the point at which it stops being worth the candidate's time.
            if (streakCorrect >= CORRECT_ANSWERS_TO_RETIRE) {
              delete queue[question.id];
            } else {
              queue[question.id] = { ...existing, streakCorrect, lastSeen: today };
            }
          }

          return { reviewQueue: trimQueue(queue) };
        }),

      dueForReview: (limit) =>
        Object.values(get().reviewQueue)
          // Most-missed first: those are the ones costing marks.
          .sort((a, b) => b.timesWrong - a.timesWrong || a.lastSeen.localeCompare(b.lastSeen))
          .slice(0, limit)
          .map((entry) => entry.pregunta),

      reviewCount: () => Object.keys(get().reviewQueue).length,

      reset: () =>
        set({ streak: initialStreak, answeredToday: 0, todayDay: null, reviewQueue: {} }),

      replaceAll: (snapshot) =>
        set({
          streak: snapshot.streak,
          dailyGoal: snapshot.dailyGoal,
          answeredToday: snapshot.answeredToday,
          todayDay: snapshot.todayDay,
          reviewQueue: snapshot.reviewQueue,
        }),
    }),
    {
      name: 'nain_tai_progression_v1',
      partialize: (state) => ({
        streak: state.streak,
        dailyGoal: state.dailyGoal,
        answeredToday: state.answeredToday,
        todayDay: state.todayDay,
        reviewQueue: state.reviewQueue,
      }),
    },
  ),
);

/** Keeps the queue bounded, dropping what was missed least often and seen longest ago. */
function trimQueue(queue: Record<number, ReviewEntry>): Record<number, ReviewEntry> {
  const entries = Object.entries(queue);

  if (entries.length <= MAX_REVIEW_QUEUE) {
    return queue;
  }

  const kept = entries
    .sort(([, a], [, b]) => b.timesWrong - a.timesWrong || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, MAX_REVIEW_QUEUE);

  return Object.fromEntries(kept);
}

/** Questions answered today, reported as zero once the day has rolled over. */
export function selectAnsweredToday(state: ProgressionState): number {
  return state.todayDay === toLocalDay() ? state.answeredToday : 0;
}
