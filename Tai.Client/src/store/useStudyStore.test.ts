import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pregunta } from '../types/domain';

// The study store persists to sessionStorage, which Node does not have. Without it the store
// silently skips persistence, so a stand-in is installed before the module is loaded.
const memory = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
});

const { useStudyStore } = await import('./useStudyStore');

function question(id: number): Pregunta {
  return { id, enunciado: `P${id}`, opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 0 };
}

function persisted(): { state: Record<string, unknown> } {
  return JSON.parse(memory.get('nain_tai_study_v1') ?? '{"state":{}}');
}

/**
 * REQ-030: a finished exam is recorded exactly once.
 *
 * The first fix was a `useRef` in the results screen, which stops React's double-invoked
 * effects but not a reload: the finished exam lives in `sessionStorage`, so after a reload the
 * results screen mounted again with a fresh ref and filed the same exam a second time, then a
 * third, with a new streak day, review-queue entries and a server write each time. The flag has
 * to live where the exam lives.
 */
describe('recording a finished exam once', () => {
  beforeEach(() => {
    useStudyStore.getState().reset();
  });

  it('starts every exam as not yet recorded', () => {
    useStudyStore.getState().startTest([question(1)], 'all');

    expect(useStudyStore.getState().recorded).toBe(false);
  });

  it('remembers that the result was filed', () => {
    useStudyStore.getState().startTest([question(1)], 'all');
    useStudyStore.getState().finishTest();
    useStudyStore.getState().markRecorded();

    expect(useStudyStore.getState().recorded).toBe(true);
  });

  it('writes the flag to sessionStorage, which is what survives a reload', () => {
    useStudyStore.getState().startTest([question(1)], 'all');
    useStudyStore.getState().markRecorded();

    expect(persisted().state.recorded).toBe(true);
  });

  it('lets the next exam be recorded again', () => {
    useStudyStore.getState().startTest([question(1)], 'all');
    useStudyStore.getState().markRecorded();
    useStudyStore.getState().startTest([question(2)], 'all');

    expect(useStudyStore.getState().recorded).toBe(false);
    expect(persisted().state.recorded).toBe(false);
  });

  it('clears the flag on reset', () => {
    useStudyStore.getState().startTest([question(1)], 'all');
    useStudyStore.getState().markRecorded();
    useStudyStore.getState().reset();

    expect(useStudyStore.getState().recorded).toBe(false);
  });
});
