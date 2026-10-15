/**
 * Practice-streak arithmetic.
 *
 * Streaks are counted in **local calendar days**, not in 24-hour windows. Someone who
 * studies at 23:50 and again at 00:10 has practised on two days, and a UTC-based
 * calculation would tell them otherwise — in Spain, for two hours every summer evening.
 */

/** Local calendar day as YYYY-MM-DD. Comparing these compares days, not instants. */
export function toLocalDay(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Whole calendar days between two local day strings. Negative if `to` precedes `from`. */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${to}T00:00:00`);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return Number.NaN;
  }

  // Rounding absorbs the hour that daylight saving adds or removes from a calendar day.
  return Math.round((end - start) / 86_400_000);
}

export interface StreakState {
  current: number;
  longest: number;
  /** Local day of the most recent practice, or null if there has never been one. */
  lastPracticeDay: string | null;
}

/**
 * Advances the streak for a practice session on `today`.
 *
 * Practising twice in one day does not advance it: the streak measures days shown up, not
 * exams sat. A day missed resets it to one, because the session happening now is itself
 * day one of the next streak — reporting zero would be wrong and needlessly discouraging.
 */
export function registerPractice(state: StreakState, today: string = toLocalDay()): StreakState {
  if (state.lastPracticeDay === null) {
    return { current: 1, longest: Math.max(state.longest, 1), lastPracticeDay: today };
  }

  const gap = daysBetween(state.lastPracticeDay, today);

  // Same day: nothing to advance.
  if (gap === 0) {
    return state;
  }

  // A clock moved backwards, or a stored day in the future. Leave the streak alone rather
  // than inventing a number from it.
  if (Number.isNaN(gap) || gap < 0) {
    return state;
  }

  const current = gap === 1 ? state.current + 1 : 1;

  return {
    current,
    longest: Math.max(state.longest, current),
    lastPracticeDay: today,
  };
}

/**
 * The streak as it should be displayed, which is not always the stored one.
 *
 * A streak recorded yesterday is still alive today — it is only broken once a whole day
 * has passed without practice. Showing the stored number without this check would keep a
 * three-week streak on screen a month after it ended.
 */
export function currentStreak(state: StreakState, today: string = toLocalDay()): number {
  if (state.lastPracticeDay === null) {
    return 0;
  }

  const gap = daysBetween(state.lastPracticeDay, today);

  if (Number.isNaN(gap) || gap < 0) {
    return state.current;
  }

  return gap <= 1 ? state.current : 0;
}

/** True when today has no practice yet, so the streak is at risk of ending tonight. */
export function isStreakAtRisk(state: StreakState, today: string = toLocalDay()): boolean {
  return currentStreak(state, today) > 0 && state.lastPracticeDay !== today;
}
