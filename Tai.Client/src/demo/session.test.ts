import { beforeEach, describe, expect, it } from 'vitest';
import {
  PRE_DEMO_STASH_KEY,
  EMPTY_PROGRESSION,
  endDemo,
  startDemo,
  type DemoPorts,
} from './session';
import { DEMO_ATTEMPT_COUNT } from './seed';
import type { Intento, Pregunta } from '../types/domain';
import type { ProgressionSnapshot } from '../store/useProgressionStore';

const NOW = new Date(2026, 9, 26, 18, 30, 0);

function question(id: number): Pregunta {
  return { id, enunciado: `P${id}`, opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 0, bloque: 'I' };
}

const QUESTIONS = Array.from({ length: 24 }, (_, index) => question(200 + index));

const REAL_ATTEMPT: Intento = {
  id: -1_700_000_000_000,
  aciertos: 7,
  fallos: 2,
  blancos: 1,
  total: 10,
  nota: 6.34,
  bloque: 'II',
  fecha: new Date(2026, 9, 20, 9, 0).toISOString(),
  pendienteSincronizar: true,
};

const REAL_PROGRESSION: ProgressionSnapshot = {
  streak: { current: 2, longest: 4, lastPracticeDay: '2026-10-25' },
  dailyGoal: 30,
  answeredToday: 0,
  todayDay: '2026-10-25',
  reviewQueue: {
    5: { pregunta: question(5), timesWrong: 2, streakCorrect: 0, lastSeen: '2026-10-24' },
  },
};

class MemoryStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function makePorts(initial?: { historial: Intento[]; progression: ProgressionSnapshot }) {
  const state = {
    historial: initial?.historial ?? [],
    progression: initial?.progression ?? EMPTY_PROGRESSION,
  };
  const storage = new MemoryStorage();
  const ports: DemoPorts = {
    storage,
    now: () => NOW,
    readAnalytics: () => state.historial,
    writeAnalytics: (historial) => {
      state.historial = historial;
    },
    readProgression: () => state.progression,
    writeProgression: (progression) => {
      state.progression = progression;
    },
  };

  return { state, storage, ports };
}

describe('startDemo', () => {
  let setup: ReturnType<typeof makePorts>;

  beforeEach(() => {
    setup = makePorts({ historial: [REAL_ATTEMPT], progression: REAL_PROGRESSION });
  });

  it('seeds the analytics and progression stores with example data', () => {
    startDemo(setup.ports, QUESTIONS);

    expect(setup.state.historial).toHaveLength(DEMO_ATTEMPT_COUNT);
    expect(setup.state.historial.some((attempt) => attempt.id === REAL_ATTEMPT.id)).toBe(false);
    expect(setup.state.progression.streak.current).toBeGreaterThan(0);
    expect(Object.keys(setup.state.progression.reviewQueue).length).toBeGreaterThan(0);
  });

  it('puts the visitor’s real guest progress aside before overwriting anything', () => {
    startDemo(setup.ports, QUESTIONS);

    const stash = JSON.parse(setup.storage.getItem(PRE_DEMO_STASH_KEY) ?? 'null');
    expect(stash.historial).toEqual([REAL_ATTEMPT]);
    expect(stash.progression).toEqual(REAL_PROGRESSION);
  });

  it('keeps the original stash when started twice, so the example data is never saved as real', () => {
    startDemo(setup.ports, QUESTIONS);
    startDemo(setup.ports, QUESTIONS);

    const stash = JSON.parse(setup.storage.getItem(PRE_DEMO_STASH_KEY) ?? 'null');
    expect(stash.historial).toEqual([REAL_ATTEMPT]);
    expect(setup.state.historial).toHaveLength(DEMO_ATTEMPT_COUNT);
  });

  it('replaces rather than stacks when started again', () => {
    startDemo(setup.ports, QUESTIONS);
    const first = setup.state.historial;
    startDemo(setup.ports, QUESTIONS);

    expect(setup.state.historial).toEqual(first);
  });

  it('works with no questions: the review queue starts empty and the rest still seeds', () => {
    startDemo(setup.ports, []);

    expect(setup.state.historial).toHaveLength(DEMO_ATTEMPT_COUNT);
    expect(setup.state.progression.reviewQueue).toEqual({});
  });
});

describe('endDemo', () => {
  it('restores exactly what the visitor had before the demo', () => {
    const { ports, state } = makePorts({ historial: [REAL_ATTEMPT], progression: REAL_PROGRESSION });

    startDemo(ports, QUESTIONS);
    endDemo(ports);

    expect(state.historial).toEqual([REAL_ATTEMPT]);
    expect(state.progression).toEqual(REAL_PROGRESSION);
  });

  it('removes the stash once it has been restored', () => {
    const { ports, storage } = makePorts({ historial: [REAL_ATTEMPT], progression: REAL_PROGRESSION });

    startDemo(ports, QUESTIONS);
    endDemo(ports);

    expect(storage.getItem(PRE_DEMO_STASH_KEY)).toBeNull();
  });

  it('leaves a visitor who had nothing with nothing, not with the example data', () => {
    const { ports, state } = makePorts();

    startDemo(ports, QUESTIONS);
    endDemo(ports);

    expect(state.historial).toEqual([]);
    expect(state.progression).toEqual(EMPTY_PROGRESSION);
  });

  it('treats an unreadable stash as an empty one instead of crashing', () => {
    const { ports, state } = makePorts();

    startDemo(ports, QUESTIONS);
    ports.storage.setItem(PRE_DEMO_STASH_KEY, '{not json');
    endDemo(ports);

    expect(state.historial).toEqual([]);
    expect(ports.storage.getItem(PRE_DEMO_STASH_KEY)).toBeNull();
  });

  it('is harmless when no demo is running', () => {
    const { ports, state } = makePorts({ historial: [REAL_ATTEMPT], progression: REAL_PROGRESSION });

    endDemo(ports);

    // Without a stash there is no way to tell example data from real, so it must not guess:
    // a guest’s real progress is never wiped by leaving a demo that was never started.
    expect(state.historial).toEqual([REAL_ATTEMPT]);
    expect(state.progression).toEqual(REAL_PROGRESSION);
  });
});
