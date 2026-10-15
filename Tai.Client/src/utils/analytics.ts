import type { BloqueRendimiento, Estadisticas, Intento } from '../types/domain';
import { ALL_BLOCKS, normalizeBlockCode } from '../types/domain';

/** A block needs a reasonable sample before it is worth calling out as the weak spot. */
const MIN_QUESTIONS_FOR_WEAKEST_BLOCK = 10;

/** Attempts shown in the trend line. */
const TREND_SIZE = 10;

/**
 * Builds the same statistics shape the API returns, from attempts held in this browser.
 *
 * The dashboard used to render "no statistics available" for guests even though their
 * attempts were sitting in local storage: the query was gated on being authenticated, so
 * the local history was written and never read. Computing it here means guest mode and
 * offline mode show real numbers instead of an empty panel.
 */
export function computeLocalEstadisticas(attempts: Intento[]): Estadisticas {
  if (attempts.length === 0) {
    return emptyEstadisticas();
  }

  const totals = attempts.reduce(
    (acc, attempt) => ({
      totalPreguntas: acc.totalPreguntas + attempt.total,
      aciertos: acc.aciertos + attempt.aciertos,
      fallos: acc.fallos + attempt.fallos,
      blancos: acc.blancos + (attempt.blancos ?? Math.max(attempt.total - attempt.aciertos - attempt.fallos, 0)),
      notaSum: acc.notaSum + attempt.nota,
    }),
    { totalPreguntas: 0, aciertos: 0, fallos: 0, blancos: 0, notaSum: 0 },
  );

  const chronological = [...attempts].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );
  const latest = chronological[chronological.length - 1];

  const rendimientoPorBloque = aggregateByBlock(attempts);
  const progresoPorBloque: Record<string, number> = {};
  for (const block of rendimientoPorBloque) {
    progresoPorBloque[block.bloque] = block.precision;
  }

  return {
    totalPreguntas: totals.totalPreguntas,
    aciertos: totals.aciertos,
    fallos: totals.fallos,
    blancos: totals.blancos,
    notaMedia: round2(totals.notaSum / attempts.length),
    totalIntentos: attempts.length,
    tasaAcierto:
      totals.totalPreguntas > 0 ? round2((totals.aciertos / totals.totalPreguntas) * 100) : 0,
    mejorNota: round2(Math.max(...attempts.map((attempt) => attempt.nota))),
    ultimaNota: round2(latest.nota),
    ultimaActividad: latest.fecha,
    progresoPorBloque,
    rendimientoPorBloque,
    bloqueMasDebil:
      rendimientoPorBloque.find((block) => block.total >= MIN_QUESTIONS_FOR_WEAKEST_BLOCK)?.bloque ??
      null,
    tendencia: chronological.slice(-TREND_SIZE).map((attempt) => ({
      fecha: attempt.fecha,
      nota: round2(attempt.nota),
    })),
  };
}

/**
 * Merges server statistics with attempts that only exist locally.
 *
 * A signed-in candidate who sat an exam while offline has attempts in both places. Showing
 * only the server's view would silently hide work they actually did.
 */
export function mergeEstadisticas(
  server: Estadisticas | undefined,
  localAttempts: Intento[],
): Estadisticas {
  if (!server) {
    return computeLocalEstadisticas(localAttempts);
  }

  if (localAttempts.length === 0) {
    return server;
  }

  const local = computeLocalEstadisticas(localAttempts);
  const totalPreguntas = server.totalPreguntas + local.totalPreguntas;
  const totalIntentos = server.totalIntentos + local.totalIntentos;
  const aciertos = server.aciertos + local.aciertos;

  // Weighted by attempt count, not a mean of two means: an average over forty attempts
  // must not be pulled around by a single offline one.
  const notaMedia =
    totalIntentos > 0
      ? (server.notaMedia * server.totalIntentos + local.notaMedia * local.totalIntentos) /
        totalIntentos
      : 0;

  const rendimientoPorBloque = mergeBlockPerformance(
    server.rendimientoPorBloque,
    local.rendimientoPorBloque,
  );

  const progresoPorBloque: Record<string, number> = {};
  for (const block of rendimientoPorBloque) {
    progresoPorBloque[block.bloque] = block.precision;
  }

  const tendencia = [...server.tendencia, ...local.tendencia]
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(-TREND_SIZE);

  return {
    totalPreguntas,
    aciertos,
    fallos: server.fallos + local.fallos,
    blancos: server.blancos + local.blancos,
    notaMedia: round2(notaMedia),
    totalIntentos,
    tasaAcierto: totalPreguntas > 0 ? round2((aciertos / totalPreguntas) * 100) : 0,
    mejorNota: round2(Math.max(server.mejorNota, local.mejorNota)),
    ultimaNota: mostRecent(server.ultimaActividad, local.ultimaActividad) === 'local'
      ? local.ultimaNota
      : server.ultimaNota,
    ultimaActividad:
      mostRecent(server.ultimaActividad, local.ultimaActividad) === 'local'
        ? local.ultimaActividad
        : server.ultimaActividad,
    progresoPorBloque,
    rendimientoPorBloque,
    bloqueMasDebil:
      rendimientoPorBloque.find((block) => block.total >= MIN_QUESTIONS_FOR_WEAKEST_BLOCK)?.bloque ??
      null,
    tendencia,
  };
}

function aggregateByBlock(attempts: Intento[]): BloqueRendimiento[] {
  const byBlock = new Map<string, BloqueRendimiento>();

  for (const attempt of attempts) {
    // Normalising first is what stops "1", "I" and "i" from becoming three separate rows.
    const code = normalizeBlockCode(attempt.bloque);
    if (code === ALL_BLOCKS) {
      // A whole-syllabus attempt cannot be attributed to one block.
      continue;
    }

    const current = byBlock.get(code) ?? {
      bloque: code,
      intentos: 0,
      aciertos: 0,
      fallos: 0,
      total: 0,
      precision: 0,
      notaMedia: 0,
    };

    current.intentos += 1;
    current.aciertos += attempt.aciertos;
    current.fallos += attempt.fallos;
    current.total += attempt.total;
    current.notaMedia += attempt.nota;

    byBlock.set(code, current);
  }

  return finalize([...byBlock.values()]);
}

function mergeBlockPerformance(
  server: BloqueRendimiento[],
  local: BloqueRendimiento[],
): BloqueRendimiento[] {
  const byBlock = new Map<string, BloqueRendimiento>();

  for (const block of [...server, ...local]) {
    const code = normalizeBlockCode(block.bloque);
    const current = byBlock.get(code);

    if (!current) {
      // notaMedia is re-accumulated as a weighted sum and divided again in finalize().
      byBlock.set(code, { ...block, bloque: code, notaMedia: block.notaMedia * block.intentos });
      continue;
    }

    current.intentos += block.intentos;
    current.aciertos += block.aciertos;
    current.fallos += block.fallos;
    current.total += block.total;
    current.notaMedia += block.notaMedia * block.intentos;
  }

  return finalize([...byBlock.values()]);
}

function finalize(blocks: BloqueRendimiento[]): BloqueRendimiento[] {
  return blocks
    .map((block) => ({
      ...block,
      precision: block.total > 0 ? round2((block.aciertos / block.total) * 100) : 0,
      notaMedia: block.intentos > 0 ? round2(block.notaMedia / block.intentos) : 0,
    }))
    // Weakest first: the point of the panel is to say where to study next.
    .sort((a, b) => a.precision - b.precision);
}

function mostRecent(server: string | null, local: string | null): 'server' | 'local' {
  if (!local) return 'server';
  if (!server) return 'local';
  return new Date(local).getTime() > new Date(server).getTime() ? 'local' : 'server';
}

function emptyEstadisticas(): Estadisticas {
  return {
    totalPreguntas: 0,
    aciertos: 0,
    fallos: 0,
    blancos: 0,
    notaMedia: 0,
    totalIntentos: 0,
    tasaAcierto: 0,
    mejorNota: 0,
    ultimaNota: 0,
    ultimaActividad: null,
    progresoPorBloque: {},
    rendimientoPorBloque: [],
    bloqueMasDebil: null,
    tendencia: [],
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
