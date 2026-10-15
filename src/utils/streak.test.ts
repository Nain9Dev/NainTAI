import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  daysBetween,
  isStreakAtRisk,
  registerPractice,
  toLocalDay,
  type StreakState,
} from './streak';

const fresh: StreakState = { current: 0, longest: 0, lastPracticeDay: null };

describe('toLocalDay', () => {
  it('formats a date as a local calendar day', () => {
    expect(toLocalDay(new Date(2026, 2, 9, 23, 50))).toBe('2026-03-09');
  });

  it.each([
    [new Date(2026, 2, 9, 23, 50)],
    [new Date(2026, 2, 10, 0, 10)],
    [new Date(2026, 11, 31, 23, 59)],
  ])('reads the local calendar components of %s', (date) => {
    // Asserting against the machine's UTC offset would make this test pass or fail
    // depending on where it runs. The contract is simply that the output names the day
    // the candidate was living in, which is what the local getters return.
    const expected = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    expect(toLocalDay(date)).toBe(expected);
  });
});

describe('daysBetween', () => {
  it.each([
    ['2026-03-01', '2026-03-02', 1],
    ['2026-03-01', '2026-03-01', 0],
    ['2026-03-02', '2026-03-01', -1],
    ['2026-02-28', '2026-03-01', 1],
    ['2026-12-31', '2027-01-01', 1],
  ])('counts %s to %s as %i days', (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected);
  });

  it('counts one day across a daylight-saving change', () => {
    // Spain moves the clock on the last Sunday of March. That day is 23 hours long, so
    // dividing by 86_400_000 without rounding yields 0.958 and truncates to zero — the
    // candidate would lose their streak for practising two days running.
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1);
    expect(daysBetween('2026-10-24', '2026-10-25')).toBe(1);
  });
});

describe('registerPractice', () => {
  it('starts a streak at one', () => {
    expect(registerPractice(fresh, '2026-03-01')).toEqual({
      current: 1,
      longest: 1,
      lastPracticeDay: '2026-03-01',
    });
  });

  it('advances on consecutive days', () => {
    const state = { current: 4, longest: 9, lastPracticeDay: '2026-03-01' };
    expect(registerPractice(state, '2026-03-02').current).toBe(5);
  });

  it('does not advance twice in the same day', () => {
    // The streak measures days shown up, not exams sat.
    const state = { current: 4, longest: 9, lastPracticeDay: '2026-03-01' };
    expect(registerPractice(state, '2026-03-01')).toEqual(state);
  });

  it('restarts at one after a missed day', () => {
    // Not zero: the session happening right now is day one of the next streak.
    const state = { current: 12, longest: 12, lastPracticeDay: '2026-03-01' };
    expect(registerPractice(state, '2026-03-05').current).toBe(1);
  });

  it('keeps the longest streak after a reset', () => {
    const state = { current: 12, longest: 12, lastPracticeDay: '2026-03-01' };
    expect(registerPractice(state, '2026-03-05').longest).toBe(12);
  });

  it('ignores a stored day in the future instead of inventing a number', () => {
    // A clock that moved backwards, or storage copied between machines.
    const state = { current: 3, longest: 3, lastPracticeDay: '2026-06-01' };
    expect(registerPractice(state, '2026-03-01')).toEqual(state);
  });
});

describe('currentStreak', () => {
  it('keeps yesterday’s streak alive today', () => {
    // It only breaks once a whole day has passed with no practice.
    const state = { current: 7, longest: 7, lastPracticeDay: '2026-03-01' };
    expect(currentStreak(state, '2026-03-02')).toBe(7);
  });

  it('reports zero once a day has been missed', () => {
    // The stored number is stale; showing it would keep a dead streak on screen for weeks.
    const state = { current: 7, longest: 7, lastPracticeDay: '2026-03-01' };
    expect(currentStreak(state, '2026-03-03')).toBe(0);
  });

  it('reports zero before any practice', () => {
    expect(currentStreak(fresh, '2026-03-01')).toBe(0);
  });
});

describe('isStreakAtRisk', () => {
  it('flags a live streak with no practice yet today', () => {
    const state = { current: 5, longest: 5, lastPracticeDay: '2026-03-01' };
    expect(isStreakAtRisk(state, '2026-03-02')).toBe(true);
  });

  it('does not flag a streak already extended today', () => {
    const state = { current: 5, longest: 5, lastPracticeDay: '2026-03-02' };
    expect(isStreakAtRisk(state, '2026-03-02')).toBe(false);
  });

  it('does not flag a streak that is already broken', () => {
    // Nothing is at risk any more; there is nothing left to lose.
    const state = { current: 5, longest: 5, lastPracticeDay: '2026-03-01' };
    expect(isStreakAtRisk(state, '2026-03-10')).toBe(false);
  });
});
