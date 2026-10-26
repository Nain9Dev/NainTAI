/**
 * Binds the demo logic to the real stores and to the browser.
 *
 * `session.ts` is pure and tested; this file is the thin layer that knows which stores exist.
 * It never calls the API: the only network access is a read of the bundled question
 * catalogue, and a failure there just leaves the review queue empty (REQ-073).
 */
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useDemoStore } from '../store/useDemoStore';
import { useProgressionStore, type ProgressionSnapshot } from '../store/useProgressionStore';
import { useStudyStore } from '../store/useStudyStore';
import type { Pregunta } from '../types/domain';
import { endDemo, startDemo, type DemoPorts } from './session';

const CATALOGUE_TIMEOUT_MS = 4000;

function ports(): DemoPorts {
  return {
    storage: window.localStorage,
    now: () => new Date(),
    readAnalytics: () => useAnalyticsStore.getState().historial,
    writeAnalytics: (historial) => useAnalyticsStore.getState().replaceAll(historial),
    readProgression: (): ProgressionSnapshot => {
      const { streak, dailyGoal, answeredToday, todayDay, reviewQueue } = useProgressionStore.getState();
      return { streak, dailyGoal, answeredToday, todayDay, reviewQueue };
    },
    writeProgression: (snapshot) => useProgressionStore.getState().replaceAll(snapshot),
  };
}

/** Reads the offline catalogue shipped with the application. Never throws. */
async function loadCatalogue(): Promise<Pregunta[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/preguntas.json`, {
      signal: AbortSignal.timeout(CATALOGUE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return [];
    }

    const questions = (await response.json()) as unknown;
    return Array.isArray(questions) ? (questions as Pregunta[]) : [];
  } catch {
    return [];
  }
}

/** Opens the demo: example data in, a fresh guide, and a guest session flagged as the demo. */
export async function beginDemo(): Promise<void> {
  const questions = await loadCatalogue();

  startDemo(ports(), questions);
  // An exam left half-finished by an earlier visit must not greet the visitor.
  useStudyStore.getState().reset();
  useDemoStore.getState().reset();
  useDemoStore.getState().complete('overview');
  useAuthStore.getState().enterDemo();
}

/**
 * Closes the demo and gives the visitor their own data back.
 *
 * Safe to call when no demo is running: `endDemo` then finds no stash and changes nothing.
 */
export function leaveDemo(): void {
  endDemo(ports());
  useStudyStore.getState().reset();
  useDemoStore.getState().reset();
  useAuthStore.getState().leaveDemo();
}
