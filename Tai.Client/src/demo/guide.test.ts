import { beforeEach, describe, expect, it } from 'vitest';
import { GUIDE_STEPS, completeStep, guideProgress, nextStep, type GuideStepId } from './guide';
import { useDemoStore } from '../store/useDemoStore';

describe('guide steps', () => {
  it('lists each function once, with a destination and a hint', () => {
    const ids = GUIDE_STEPS.map((step) => step.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['overview', 'quick-round', 'review', 'exam', 'performance', 'profile']);

    for (const step of GUIDE_STEPS) {
      expect(step.title.length).toBeGreaterThan(5);
      expect(step.hint.length).toBeGreaterThan(10);
      expect(['/', '/analytics', '/perfil']).toContain(step.to);
    }
  });

  it('completes a step once, in any order', () => {
    const once = completeStep([], 'exam');
    const twice = completeStep(once, 'exam');
    const other = completeStep(twice, 'overview');

    expect(once).toEqual(['exam']);
    expect(twice).toEqual(['exam']);
    expect(other).toEqual(['exam', 'overview']);
  });

  it('reports progress as a count and a share', () => {
    expect(guideProgress([])).toEqual({ done: 0, total: GUIDE_STEPS.length, share: 0 });
    expect(guideProgress(['overview', 'exam'])).toEqual({
      done: 2,
      total: GUIDE_STEPS.length,
      share: 2 / GUIDE_STEPS.length,
    });
  });

  it('suggests the first step still to do, in guide order', () => {
    expect(nextStep([])?.id).toBe('overview');
    expect(nextStep(['overview', 'review'])?.id).toBe('quick-round');
    expect(nextStep(GUIDE_STEPS.map((step) => step.id))).toBeNull();
  });

  it('ignores ids it does not know', () => {
    const done = completeStep([], 'nonsense' as GuideStepId);

    expect(guideProgress(done).done).toBe(0);
  });
});

describe('demo guide store', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it('starts folded into its pill, with nothing done', () => {
    const state = useDemoStore.getState();

    expect(state.done).toEqual([]);
    expect(state.collapsed).toBe(true);
    expect(state.dismissed).toBe(false);
  });

  it('records a completed step and keeps the list free of duplicates', () => {
    useDemoStore.getState().complete('review');
    useDemoStore.getState().complete('review');

    expect(useDemoStore.getState().done).toEqual(['review']);
  });

  it('can be opened, folded again and dismissed', () => {
    useDemoStore.getState().toggle();
    expect(useDemoStore.getState().collapsed).toBe(false);

    useDemoStore.getState().toggle();
    expect(useDemoStore.getState().collapsed).toBe(true);

    useDemoStore.getState().dismiss();
    expect(useDemoStore.getState().dismissed).toBe(true);
  });

  it('forgets everything on reset, so a new demo starts fresh', () => {
    useDemoStore.getState().complete('exam');
    useDemoStore.getState().dismiss();
    useDemoStore.getState().reset();

    expect(useDemoStore.getState().done).toEqual([]);
    expect(useDemoStore.getState().dismissed).toBe(false);
  });
});
