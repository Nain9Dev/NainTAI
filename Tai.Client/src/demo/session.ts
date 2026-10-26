/**
 * Starting and leaving the public demo.
 *
 * The demo is a guest session with example data poured into the same local stores a real guest
 * uses. That makes every screen show the real product, but it also means the demo could
 * overwrite something genuine: a candidate who signed out of an account, say, can still hold
 * exams that were never synced. So the first thing a demo does is put the current local
 * progress aside, and the last thing it does is put it back.
 *
 * The stash doubles as the "a demo is running" marker. Leaving a demo that was never started
 * therefore does nothing, rather than guessing which data is real and wiping it.
 */
import type { Intento, Pregunta } from '../types/domain';
import type { ProgressionSnapshot } from '../store/useProgressionStore';
import { buildDemoSeed } from './seed';

export const PRE_DEMO_STASH_KEY = 'nain_tai_pre_demo_v1';

/** What a visitor with no progress has, so restoring "nothing" really is nothing. */
export const EMPTY_PROGRESSION: ProgressionSnapshot = {
  streak: { current: 0, longest: 0, lastPracticeDay: null },
  dailyGoal: 20,
  answeredToday: 0,
  todayDay: null,
  reviewQueue: {},
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Everything the demo touches, injected so the logic runs the same in a test as in a browser. */
export interface DemoPorts {
  storage: StorageLike;
  now: () => Date;
  readAnalytics: () => Intento[];
  writeAnalytics: (historial: Intento[]) => void;
  readProgression: () => ProgressionSnapshot;
  writeProgression: (progression: ProgressionSnapshot) => void;
}

interface Stash {
  historial: Intento[];
  progression: ProgressionSnapshot;
}

export function startDemo(ports: DemoPorts, questions: readonly Pregunta[]): void {
  // A second start must not stash the first one's example data as if it were the visitor's.
  if (ports.storage.getItem(PRE_DEMO_STASH_KEY) === null) {
    const stash: Stash = {
      historial: ports.readAnalytics(),
      progression: ports.readProgression(),
    };
    ports.storage.setItem(PRE_DEMO_STASH_KEY, JSON.stringify(stash));
  }

  const seed = buildDemoSeed(ports.now(), questions);
  ports.writeAnalytics(seed.historial);
  ports.writeProgression(seed.progression);
}

export function endDemo(ports: DemoPorts): void {
  const raw = ports.storage.getItem(PRE_DEMO_STASH_KEY);

  // No stash means no demo is running; there is nothing to undo and nothing safe to clear.
  if (raw === null) {
    return;
  }

  const stash = parseStash(raw);
  ports.writeAnalytics(stash.historial);
  ports.writeProgression(stash.progression);
  ports.storage.removeItem(PRE_DEMO_STASH_KEY);
}

function parseStash(raw: string): Stash {
  try {
    const parsed = JSON.parse(raw) as Partial<Stash> | null;

    if (parsed && Array.isArray(parsed.historial) && parsed.progression) {
      return { historial: parsed.historial, progression: parsed.progression };
    }
  } catch {
    // Falls through: a damaged stash is worth less than a working demo exit.
  }

  return { historial: [], progression: EMPTY_PROGRESSION };
}
