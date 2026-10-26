/**
 * Geometry for the dashboard charts, as pure functions.
 *
 * The charts are inline SVG rather than a charting library: a library is a dependency and a
 * chunk of bundle (OQ-004 already worries about weight) for what is, here, a line, a ring and
 * a grid of squares. Keeping the maths out of the components also keeps it testable under the
 * Node-only test setup.
 */
import type { Intento } from '../types/domain';
import { toLocalDay } from './streak';

export interface Point {
  x: number;
  y: number;
}

export interface ChartBox {
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
}

export interface ValueRange {
  min: number;
  max: number;
}

/** Maps values onto the padded box: evenly spaced in x, highest value at the top. */
export function linePoints(values: readonly number[], box: ChartBox, range: ValueRange): Point[] {
  const span = range.max - range.min || 1;
  const innerWidth = box.width - box.paddingX * 2;
  const innerHeight = box.height - box.paddingY * 2;

  return values.map((value, index) => {
    const clamped = Math.min(Math.max(value, range.min), range.max);
    const x = values.length === 1 ? box.width / 2 : box.paddingX + (index * innerWidth) / (values.length - 1);
    const y = box.paddingY + (1 - (clamped - range.min) / span) * innerHeight;

    return { x: round(x), y: round(y) };
  });
}

/**
 * A smooth curve through the points, as a cubic Bézier path.
 *
 * Control points come from a Catmull-Rom spline, then are held between the two points they
 * belong to on the vertical axis. Without that clamp a spline loops above a peak and dips
 * below a trough, which on a chart of grades bounded at zero and ten draws marks nobody got.
 */
export function smoothPath(points: readonly Point[]): string {
  if (points.length === 0) {
    return '';
  }

  const [first] = points;
  if (points.length === 1) {
    return `M${fmt(first.x)} ${fmt(first.y)}`;
  }

  const tension = 1 / 6;
  let path = `M${fmt(first.x)} ${fmt(first.y)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const low = Math.min(p1.y, p2.y);
    const high = Math.max(p1.y, p2.y);
    const c1y = clamp(p1.y + (p2.y - p0.y) * tension, low, high);
    const c2y = clamp(p2.y - (p3.y - p1.y) * tension, low, high);
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;

    path += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
  }

  return path;
}

/** The same curve closed down to `baselineY`, for the filled area under a line. */
export function areaPath(points: readonly Point[], baselineY: number): string {
  if (points.length < 2) {
    return '';
  }

  const last = points[points.length - 1];
  const first = points[0];

  return `${smoothPath(points)}L${fmt(last.x)} ${fmt(baselineY)}L${fmt(first.x)} ${fmt(baselineY)}Z`;
}

/** `stroke-dasharray` for a ring that is `share` full (0 to 1) at the given radius. */
export function ringDash(share: number, radius: number): string {
  const circumference = 2 * Math.PI * radius;
  const filled = Number.isFinite(share) ? clamp(share, 0, 1) * circumference : 0;

  return `${filled.toFixed(2)} ${circumference.toFixed(2)}`;
}

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

/** Questions answered in a day, bucketed into the five shades of the consistency calendar. */
export function activityLevel(questions: number): ActivityLevel {
  if (questions >= 35) return 4;
  if (questions >= 20) return 3;
  if (questions >= 10) return 2;
  if (questions >= 1) return 1;
  return 0;
}

export interface CalendarCell {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  questions: number;
  level: ActivityLevel;
  /** After today: drawn as an empty slot, never as a missed day. */
  isFuture: boolean;
}

export interface ConsistencyCalendar {
  /** Whole weeks, oldest first, each Monday to Sunday. */
  weeks: CalendarCell[][];
  activeDays: number;
  totalQuestions: number;
}

/**
 * Activity per day for the last `weeks` weeks, ending with the current one.
 *
 * Days are local calendar days, the same convention as the streak: an exam sat at 23:50 belongs
 * to the evening the candidate sat it, not to the next UTC day.
 */
export function buildConsistencyCalendar(
  attempts: ReadonlyArray<Pick<Intento, 'fecha' | 'total'>>,
  today: Date,
  weeks = 6,
): ConsistencyCalendar {
  const todayDay = toLocalDay(today);
  const mondayOffset = (today.getDay() + 6) % 7;
  const cells: CalendarCell[][] = [];
  const byDay = new Map<string, CalendarCell>();

  for (let week = 0; week < weeks; week += 1) {
    const row: CalendarCell[] = [];

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const offset = (week - (weeks - 1)) * 7 + weekday - mondayOffset;
      const day = toLocalDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
      const cell: CalendarCell = { day, questions: 0, level: 0, isFuture: day > todayDay };

      row.push(cell);
      byDay.set(day, cell);
    }

    cells.push(row);
  }

  for (const attempt of attempts) {
    const when = new Date(attempt.fecha);
    if (Number.isNaN(when.getTime())) {
      continue;
    }

    const cell = byDay.get(toLocalDay(when));
    if (cell && !cell.isFuture) {
      cell.questions += attempt.total;
    }
  }

  let activeDays = 0;
  let totalQuestions = 0;

  for (const cell of byDay.values()) {
    cell.level = activityLevel(cell.questions);
    totalQuestions += cell.questions;
    if (cell.questions > 0) {
      activeDays += 1;
    }
  }

  return { weeks: cells, activeDays, totalQuestions };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function fmt(value: number): string {
  return String(round(value));
}
