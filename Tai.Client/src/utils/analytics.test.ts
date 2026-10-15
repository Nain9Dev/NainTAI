import { describe, expect, it } from 'vitest';
import { computeLocalEstadisticas, mergeEstadisticas } from './analytics';
import type { Estadisticas, Intento } from '../types/domain';

function attempt(overrides: Partial<Intento> = {}): Intento {
  return {
    id: 1,
    aciertos: 8,
    fallos: 2,
    blancos: 0,
    total: 10,
    nota: 7.34,
    bloque: 'I',
    fecha: '2026-03-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('computeLocalEstadisticas', () => {
  it('returns an empty panel rather than throwing when there is nothing to show', () => {
    const stats = computeLocalEstadisticas([]);

    expect(stats.totalIntentos).toBe(0);
    expect(stats.bloqueMasDebil).toBeNull();
    expect(stats.rendimientoPorBloque).toEqual([]);
  });

  it('aggregates attempts held only in this browser', () => {
    // Guests keep everything locally. The dashboard used to render "no data" for them
    // even though their attempts were sitting in local storage.
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, aciertos: 8, fallos: 2, total: 10, nota: 7.34 }),
      attempt({ id: 2, aciertos: 4, fallos: 6, total: 10, nota: 2.02 }),
    ]);

    expect(stats.totalIntentos).toBe(2);
    expect(stats.totalPreguntas).toBe(20);
    expect(stats.aciertos).toBe(12);
    expect(stats.tasaAcierto).toBe(60);
    expect(stats.mejorNota).toBe(7.34);
  });

  it('groups the same block written as an ordinal and as a roman code', () => {
    // The API returns "I" but the bundled static catalogue still stores "1". Without
    // normalising, one block turns into two rows that each look half as important.
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, bloque: '1', aciertos: 5, total: 10 }),
      attempt({ id: 2, bloque: 'I', aciertos: 5, total: 10 }),
    ]);

    expect(stats.rendimientoPorBloque).toHaveLength(1);
    expect(stats.rendimientoPorBloque[0].bloque).toBe('I');
    expect(stats.rendimientoPorBloque[0].total).toBe(20);
  });

  it('leaves whole-syllabus attempts out of the per-block breakdown', () => {
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, bloque: 'all' }),
      attempt({ id: 2, bloque: 'II' }),
    ]);

    expect(stats.rendimientoPorBloque.map((block) => block.bloque)).toEqual(['II']);
  });

  it('orders blocks from weakest to strongest', () => {
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, bloque: 'I', aciertos: 9, fallos: 1, total: 10 }),
      attempt({ id: 2, bloque: 'II', aciertos: 3, fallos: 7, total: 10 }),
    ]);

    expect(stats.rendimientoPorBloque.map((block) => block.bloque)).toEqual(['II', 'I']);
  });

  it('ignores samples too small to call a weak spot', () => {
    // Missing both questions of a two-question block does not make it your weakness.
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, bloque: 'III', aciertos: 0, fallos: 2, total: 2, nota: 0 }),
      attempt({ id: 2, bloque: 'II', aciertos: 18, fallos: 22, total: 40, nota: 4 }),
    ]);

    expect(stats.rendimientoPorBloque[0].bloque).toBe('III');
    expect(stats.bloqueMasDebil).toBe('II');
  });

  it('keeps the trend in chronological order', () => {
    const stats = computeLocalEstadisticas([
      attempt({ id: 1, fecha: '2026-03-03T10:00:00.000Z', nota: 6 }),
      attempt({ id: 2, fecha: '2026-03-01T10:00:00.000Z', nota: 4 }),
    ]);

    expect(stats.tendencia.map((point) => point.nota)).toEqual([4, 6]);
    expect(stats.ultimaNota).toBe(6);
  });
});

describe('mergeEstadisticas', () => {
  const server: Estadisticas = {
    totalPreguntas: 100,
    aciertos: 70,
    fallos: 30,
    blancos: 0,
    notaMedia: 6,
    totalIntentos: 10,
    tasaAcierto: 70,
    mejorNota: 8,
    ultimaNota: 6,
    ultimaActividad: '2026-03-01T10:00:00.000Z',
    progresoPorBloque: { I: 70 },
    rendimientoPorBloque: [
      { bloque: 'I', intentos: 10, aciertos: 70, fallos: 30, total: 100, precision: 70, notaMedia: 6 },
    ],
    bloqueMasDebil: 'I',
    tendencia: [{ fecha: '2026-03-01T10:00:00.000Z', nota: 6 }],
  };

  it('returns the server view untouched when nothing is held locally', () => {
    expect(mergeEstadisticas(server, [])).toBe(server);
  });

  it('falls back to local attempts when the server view is missing', () => {
    const merged = mergeEstadisticas(undefined, [attempt()]);

    expect(merged.totalIntentos).toBe(1);
  });

  it('adds offline attempts to the server totals', () => {
    // A signed-in candidate who sat an exam offline has attempts in both places; showing
    // only the server's view would quietly hide work they actually did.
    const merged = mergeEstadisticas(server, [
      attempt({ id: -1, aciertos: 10, fallos: 0, total: 10, nota: 10, bloque: 'I' }),
    ]);

    expect(merged.totalIntentos).toBe(11);
    expect(merged.totalPreguntas).toBe(110);
    expect(merged.aciertos).toBe(80);
    expect(merged.mejorNota).toBe(10);
  });

  it('weights the average by attempt count instead of averaging two averages', () => {
    const merged = mergeEstadisticas(server, [attempt({ id: -1, nota: 10 })]);

    // (6 × 10 + 10 × 1) / 11 = 6.36, not the 8 a naive mean of means would give.
    expect(merged.notaMedia).toBe(6.36);
  });

  it('combines per-block figures rather than listing the block twice', () => {
    const merged = mergeEstadisticas(server, [
      attempt({ id: -1, bloque: '1', aciertos: 10, fallos: 0, total: 10, nota: 10 }),
    ]);

    expect(merged.rendimientoPorBloque).toHaveLength(1);
    expect(merged.rendimientoPorBloque[0].total).toBe(110);
  });

  it('reports the most recent activity across both sources', () => {
    const merged = mergeEstadisticas(server, [
      attempt({ id: -1, fecha: '2026-06-01T10:00:00.000Z', nota: 9 }),
    ]);

    expect(merged.ultimaActividad).toBe('2026-06-01T10:00:00.000Z');
    expect(merged.ultimaNota).toBe(9);
  });
});
