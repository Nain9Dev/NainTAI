import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { preguntasApi } from '../api/endpoints';
import { useStudyStore } from '../store/useStudyStore';
import { ALL_BLOCKS } from '../types/domain';
import type { Pregunta } from '../types/domain';
import { normalizeBlockCode } from '../types/domain';

interface GenerateExamInput {
  bloque: string;
  cantidad: number;
}

/**
 * Generates an exam and hands it to the study store.
 *
 * Filtering happens on the server. When the request falls through to the bundled static
 * catalogue the filter has to be reapplied here, because that file holds every block.
 */
export function useGenerateExam() {
  const startTest = useStudyStore((state) => state.startTest);

  return useMutation({
    mutationFn: async ({ bloque, cantidad }: GenerateExamInput) => {
      const questions = await preguntasApi.getPreguntas(bloque, cantidad);
      return { questions: prepare(questions, bloque, cantidad), bloque };
    },
    onSuccess: ({ questions, bloque }) => startTest(questions, bloque),
  });
}

export function useDisponibilidad(bloque: string) {
  return useQuery({
    queryKey: ['disponibilidad', bloque],
    queryFn: ({ signal }) => preguntasApi.getDisponibilidad(bloque, signal),
    staleTime: 5 * 60 * 1000,
    // Availability is a nicety, not a gate: a failure must not block starting an exam.
    retry: false,
  });
}

/**
 * Drives the exam countdown.
 *
 * The interval is anchored to wall-clock time rather than counting its own ticks: a
 * background tab has its timers throttled, so a tick-counting clock would drift and hand
 * the candidate minutes they should not have.
 */
export function useExamTimer() {
  const phase = useStudyStore((state) => state.phase);
  const secondsRemaining = useStudyStore((state) => state.secondsRemaining);
  const tick = useStudyStore((state) => state.tick);

  // Whether the exam is timed at all, rather than the value that changes every second:
  // depending on `secondsRemaining` would tear the interval down and rebuild it on
  // each tick.
  const isTimed = secondsRemaining !== null;

  useEffect(() => {
    if (phase !== 'running' || !isTimed) {
      return;
    }

    let last = Date.now();

    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - last) / 1000);

      if (elapsed <= 0) {
        return;
      }

      last += elapsed * 1000;
      for (let i = 0; i < elapsed; i += 1) {
        tick();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, isTimed, tick]);

  return secondsRemaining;
}

/** Keyboard navigation. An exam is answered from the keyboard, not with a mouse. */
export function useExamKeyboard(enabled: boolean) {
  const goNext = useStudyStore((state) => state.nextQuestion);
  const goPrevious = useStudyStore((state) => state.previousQuestion);
  const answerQuestion = useStudyStore((state) => state.answerQuestion);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      // Never steal a keystroke the user meant for a field.
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowRight') {
        goNext();
        return;
      }

      if (event.key === 'ArrowLeft') {
        goPrevious();
        return;
      }

      // A, B, C, D pick an option, matching how the options are labelled on screen.
      const optionIndex = 'abcd'.indexOf(event.key.toLowerCase());
      if (optionIndex === -1) {
        return;
      }

      const { questions, currentIndex } = useStudyStore.getState();
      const question = questions[currentIndex];
      if (question && optionIndex < question.opciones.length) {
        answerQuestion(question.id, optionIndex);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, goNext, goPrevious, answerQuestion]);
}

function prepare(questions: Pregunta[], bloque: string, cantidad: number): Pregunta[] {
  const wanted = normalizeBlockCode(bloque);

  const filtered =
    wanted === ALL_BLOCKS
      ? questions
      : questions.filter((question) => normalizeBlockCode(question.bloque) === wanted);

  // The static catalogue is ordered and unbounded; the API already randomises and limits.
  // Shuffling and slicing here makes both paths behave the same.
  return shuffle(filtered).slice(0, cantidad);
}

/** Fisher-Yates, on a copy. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
