import { describe, expect, it } from 'vitest';
import {
  activityLevel,
  areaPath,
  buildConsistencyCalendar,
  linePoints,
  ringDash,
  smoothPath,
} from './chart';
import { toLocalDay } from './streak';

describe('linePoints', () => {
  const box = { width: 300, height: 100, paddingX: 10, paddingY: 10 };

  it('spaces points evenly across the padded width', () => {
    const points = linePoints([5, 5, 5], box, { min: 0, max: 10 });

    expect(points.map((point) => point.x)).toEqual([10, 150, 290]);
  });

  it('maps the value range onto the padded height, highest value at the top', () => {
    const [low, high] = linePoints([0, 10], box, { min: 0, max: 10 });

    expect(low.y).toBe(90);
    expect(high.y).toBe(10);
  });

  it('clamps values outside the range instead of drawing outside the box', () => {
    const [below, above] = linePoints([-3, 14], box, { min: 0, max: 10 });

    expect(below.y).toBe(90);
    expect(above.y).toBe(10);
  });

  it('centres a single point and returns nothing for no data', () => {
    expect(linePoints([6], box, { min: 0, max: 10 })).toEqual([{ x: 150, y: 42 }]);
    expect(linePoints([], box, { min: 0, max: 10 })).toEqual([]);
  });
});

describe('smoothPath', () => {
  it('draws a curve with one segment between consecutive points', () => {
    const path = smoothPath([
      { x: 0, y: 50 },
      { x: 50, y: 20 },
      { x: 100, y: 40 },
      { x: 150, y: 10 },
    ]);

    expect(path.startsWith('M0 50')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(3);
    expect(path).not.toMatch(/NaN|undefined/);
  });

  it('degrades to a move, or to nothing, for fewer than two points', () => {
    expect(smoothPath([{ x: 4, y: 9 }])).toBe('M4 9');
    expect(smoothPath([])).toBe('');
  });

  it('never overshoots the data on the vertical axis', () => {
    // A cardinal spline can loop above a peak; the grades are bounded so the curve must not.
    const points = [
      { x: 0, y: 80 },
      { x: 50, y: 10 },
      { x: 100, y: 80 },
    ];
    const controlYs = [...smoothPath(points).matchAll(/C[\d.-]+ ([\d.-]+) [\d.-]+ ([\d.-]+)/g)].flatMap(
      (match) => [Number(match[1]), Number(match[2])],
    );

    expect(Math.min(...controlYs)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...controlYs)).toBeLessThanOrEqual(80);
  });
});

describe('areaPath', () => {
  it('closes the curve down to the baseline', () => {
    const points = [
      { x: 0, y: 50 },
      { x: 100, y: 20 },
    ];
    const path = areaPath(points, 100);

    expect(path.startsWith(smoothPath(points))).toBe(true);
    expect(path.endsWith('L100 100L0 100Z')).toBe(true);
  });

  it('is empty without a curve to close', () => {
    expect(areaPath([{ x: 1, y: 1 }], 100)).toBe('');
  });
});

describe('ringDash', () => {
  const circumference = 2 * Math.PI * 40;

  it('fills a share of the circumference', () => {
    expect(ringDash(0.5, 40)).toBe(`${(circumference / 2).toFixed(2)} ${circumference.toFixed(2)}`);
  });

  it('clamps progress to the circle', () => {
    expect(ringDash(-1, 40)).toBe(`0.00 ${circumference.toFixed(2)}`);
    expect(ringDash(3, 40)).toBe(`${circumference.toFixed(2)} ${circumference.toFixed(2)}`);
  });

  it('treats a non-finite share as empty', () => {
    expect(ringDash(Number.NaN, 40)).toBe(`0.00 ${circumference.toFixed(2)}`);
  });
});

describe('activityLevel', () => {
  it('buckets questions answered in a day into five levels', () => {
    expect(activityLevel(0)).toBe(0);
    expect(activityLevel(5)).toBe(1);
    expect(activityLevel(10)).toBe(2);
    expect(activityLevel(20)).toBe(3);
    expect(activityLevel(35)).toBe(4);
    expect(activityLevel(120)).toBe(4);
  });
});

describe('buildConsistencyCalendar', () => {
  // Monday 26 October 2026, so the current week is 26 Oct to 1 Nov.
  const today = new Date(2026, 9, 26, 12, 0, 0);

  it('returns whole Monday-first weeks ending with the current one', () => {
    const { weeks } = buildConsistencyCalendar([], today, 5);

    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[4][0].day).toBe('2026-10-26');
    expect(weeks[0][0].day).toBe('2026-09-28');
  });

  it('marks the days after today as future and never as activity', () => {
    const { weeks } = buildConsistencyCalendar([], today, 5);
    const current = weeks[4];

    expect(current[0].isFuture).toBe(false);
    expect(current.slice(1).every((cell) => cell.isFuture)).toBe(true);
  });

  it('adds up the questions answered on the same local day', () => {
    const { weeks, activeDays, totalQuestions } = buildConsistencyCalendar(
      [
        { fecha: new Date(2026, 9, 25, 9, 0).toISOString(), total: 10 },
        { fecha: new Date(2026, 9, 25, 21, 30).toISOString(), total: 20 },
        { fecha: new Date(2026, 9, 20, 8, 0).toISOString(), total: 5 },
      ],
      today,
      5,
    );
    const byDay = Object.fromEntries(weeks.flat().map((cell) => [cell.day, cell]));

    expect(byDay['2026-10-25'].questions).toBe(30);
    expect(byDay['2026-10-25'].level).toBe(3);
    expect(byDay['2026-10-20'].questions).toBe(5);
    expect(activeDays).toBe(2);
    expect(totalQuestions).toBe(35);
  });

  it('ignores attempts older than the window', () => {
    const { activeDays } = buildConsistencyCalendar(
      [{ fecha: new Date(2026, 7, 1, 12, 0).toISOString(), total: 40 }],
      today,
      5,
    );

    expect(activeDays).toBe(0);
  });

  it('uses the local day, not the UTC one, near midnight', () => {
    const lateEvening = new Date(2026, 9, 24, 23, 50);
    const { weeks } = buildConsistencyCalendar(
      [{ fecha: lateEvening.toISOString(), total: 10 }],
      today,
      5,
    );
    const cell = weeks.flat().find((candidate) => candidate.day === toLocalDay(lateEvening));

    expect(cell?.questions).toBe(10);
  });

  it('skips attempts with an unreadable date', () => {
    const { activeDays } = buildConsistencyCalendar([{ fecha: 'not a date', total: 10 }], today, 5);

    expect(activeDays).toBe(0);
  });
});
