import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Pregunta } from '../types/domain';
import { ALL_BLOCKS } from '../types/domain';

export type StudyMode = 'study' | 'exam';
export type ExamPhase = 'setup' | 'running' | 'finished';

/** Official INAP allowance, in seconds per question. */
export const SECONDS_PER_QUESTION = 54;

interface StudyState {
  mode: StudyMode;
  phase: ExamPhase;
  questions: Pregunta[];
  /** Question id to the index of the chosen option. */
  answers: Record<number, number>;
  currentIndex: number;
  /** Block the exam was generated from, carried through so the attempt is filed correctly. */
  bloque: string;
  startedAt: number | null;
  /** Fixed the moment the exam closes, so the elapsed time stops growing on the results screen. */
  finishedAt: number | null;
  /** Remaining seconds in exam mode; null in study mode, which is untimed. */
  secondsRemaining: number | null;
  /** True when the exam ended because the clock ran out rather than by choice. */
  timedOut: boolean;
  /** Review mode reveals the answer key on a finished exam. */
  isReviewing: boolean;

  setMode: (mode: StudyMode) => void;
  startTest: (questions: Pregunta[], bloque: string) => void;
  answerQuestion: (questionId: number, optionIndex: number) => void;
  clearAnswer: (questionId: number) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  tick: () => void;
  finishTest: (timedOut?: boolean) => void;
  startReview: () => void;
  reset: () => void;
}

const initialState = {
  mode: 'study' as StudyMode,
  phase: 'setup' as ExamPhase,
  questions: [] as Pregunta[],
  answers: {} as Record<number, number>,
  currentIndex: 0,
  bloque: ALL_BLOCKS,
  startedAt: null as number | null,
  finishedAt: null as number | null,
  secondsRemaining: null as number | null,
  timedOut: false,
  isReviewing: false,
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setMode: (mode) => set({ mode }),

      startTest: (questions, bloque) =>
        set({
          questions,
          bloque,
          answers: {},
          currentIndex: 0,
          phase: 'running',
          startedAt: Date.now(),
          finishedAt: null,
          // Exam mode is timed under the official allowance; study mode is not, because
          // its point is understanding the question rather than beating the clock.
          secondsRemaining: get().mode === 'exam' ? questions.length * SECONDS_PER_QUESTION : null,
          timedOut: false,
          isReviewing: false,
        }),

      answerQuestion: (questionId, optionIndex) =>
        set((state) => {
          // In study mode the first answer is final: the feedback has already been shown,
          // so allowing a change would let the candidate "correct" a wrong answer and
          // record a score that says nothing about what they knew.
          if (state.mode === 'study' && state.answers[questionId] !== undefined) {
            return state;
          }

          return { answers: { ...state.answers, [questionId]: optionIndex } };
        }),

      clearAnswer: (questionId) =>
        set((state) => {
          if (state.mode === 'study') {
            return state;
          }

          const { [questionId]: _removed, ...rest } = state.answers;
          return { answers: rest };
        }),

      goToQuestion: (index) =>
        set((state) => ({
          currentIndex: Math.min(Math.max(index, 0), Math.max(state.questions.length - 1, 0)),
        })),

      nextQuestion: () =>
        set((state) => ({
          currentIndex: Math.min(state.currentIndex + 1, Math.max(state.questions.length - 1, 0)),
        })),

      previousQuestion: () =>
        set((state) => ({ currentIndex: Math.max(state.currentIndex - 1, 0) })),

      tick: () =>
        set((state) => {
          if (state.phase !== 'running' || state.secondsRemaining === null) {
            return state;
          }

          const secondsRemaining = state.secondsRemaining - 1;

          if (secondsRemaining <= 0) {
            // Time is up: the exam closes on its own, exactly as it would in the hall.
            return {
              secondsRemaining: 0,
              phase: 'finished' as ExamPhase,
              timedOut: true,
              finishedAt: Date.now(),
            };
          }

          return { secondsRemaining };
        }),

      finishTest: (timedOut = false) =>
        set({ phase: 'finished', timedOut, finishedAt: Date.now() }),

      startReview: () => set({ isReviewing: true }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'nain_tai_study_v1',
      // sessionStorage, not localStorage: a reload mid-exam must not lose the answer sheet,
      // but an exam abandoned days ago should not reappear in a new tab.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        mode: state.mode,
        phase: state.phase,
        questions: state.questions,
        answers: state.answers,
        currentIndex: state.currentIndex,
        bloque: state.bloque,
        startedAt: state.startedAt,
        finishedAt: state.finishedAt,
        secondsRemaining: state.secondsRemaining,
        timedOut: state.timedOut,
        isReviewing: state.isReviewing,
      }),
    },
  ),
);

/** Derived selectors, so components do not recompute the same thing on every render. */
export const selectCurrentQuestion = (state: StudyState): Pregunta | undefined =>
  state.questions[state.currentIndex];

export const selectAnsweredCount = (state: StudyState): number =>
  Object.keys(state.answers).length;

export const selectIsComplete = (state: StudyState): boolean =>
  state.questions.length > 0 && Object.keys(state.answers).length === state.questions.length;
