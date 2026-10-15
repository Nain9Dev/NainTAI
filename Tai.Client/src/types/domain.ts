/**
 * Domain types mirroring the API contract.
 *
 * Field names stay in Spanish because they are the wire format of a deployed API, not a
 * style choice. Renaming them would break the contract for no benefit.
 */

export interface SyllabusBlock {
  id: number;
  code: string;
  name: string;
}

export interface SyllabusTopic {
  id: number;
  blockId: number;
  topicNumber: number;
  title: string;
}

export interface Pregunta {
  id: number;
  enunciado: string;
  opciones: string[];
  /** Index into `opciones`. */
  respuestaCorrecta: number;
  /** Roman block code (I..IV). The static catalogue may still carry an ordinal ("1"). */
  bloque?: string;
  bloqueId?: number;
  bloqueNombre?: string;
  temaId?: number;
  tema?: string;
  dificultad?: number;
  explicacion?: string | null;
}

/** What the client observes about a finished exam. The server derives the rest. */
export interface IntentoRequest {
  aciertos: number;
  fallos: number;
  total: number;
  bloque?: string;
  fecha?: string;
}

/** A stored attempt, as returned by the API. */
export interface Intento {
  id: number;
  aciertos: number;
  fallos: number;
  blancos: number;
  total: number;
  nota: number;
  bloque: string;
  fecha: string;
  /** Set on locally-held attempts that have not reached the server yet. */
  pendienteSincronizar?: boolean;
}

export interface BloqueRendimiento {
  bloque: string;
  intentos: number;
  aciertos: number;
  fallos: number;
  total: number;
  /** Accuracy as a percentage, 0 to 100. */
  precision: number;
  notaMedia: number;
}

export interface TendenciaPunto {
  fecha: string;
  nota: number;
}

export interface Estadisticas {
  totalPreguntas: number;
  aciertos: number;
  fallos: number;
  blancos: number;
  notaMedia: number;
  totalIntentos: number;
  tasaAcierto: number;
  mejorNota: number;
  ultimaNota: number;
  ultimaActividad: string | null;
  /** Historical shape: block code to accuracy percentage. */
  progresoPorBloque: Record<string, number>;
  rendimientoPorBloque: BloqueRendimiento[];
  bloqueMasDebil: string | null;
  tendencia: TendenciaPunto[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserProfile {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthResponse {
  csrfToken: string;
  user: UserProfile;
  expiresAt: string;
}

export interface Disponibilidad {
  bloque: string;
  disponibles: number;
  maximoPorSimulacro: number;
}

/** The four official syllabus blocks, in curriculum order. */
export const SYLLABUS_BLOCKS = [
  { code: 'I', ordinal: 1, name: 'Organización del Estado y Administración electrónica' },
  { code: 'II', ordinal: 2, name: 'Tecnología básica' },
  { code: 'III', ordinal: 3, name: 'Desarrollo de sistemas' },
  { code: 'IV', ordinal: 4, name: 'Sistemas y comunicaciones' },
] as const;

export const ALL_BLOCKS = 'all';

/**
 * Normalises a block label to its roman code.
 *
 * The API returns "I".."IV" but the bundled static catalogue still stores "1".."4", so
 * anything that groups by block has to reconcile the two or the statistics split in half.
 */
export function normalizeBlockCode(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ALL_BLOCKS;
  }

  const raw = String(value).trim();

  // Trim first, then test for empty: a whitespace-only selector used to fall through and
  // be stored as an empty block label, which showed up as a nameless row in the statistics.
  if (raw === '' || raw.toLowerCase() === ALL_BLOCKS || raw.toLowerCase() === 'todos') {
    return ALL_BLOCKS;
  }

  const ordinal = Number.parseInt(raw, 10);
  if (!Number.isNaN(ordinal)) {
    return SYLLABUS_BLOCKS.find((block) => block.ordinal === ordinal)?.code ?? raw.toUpperCase();
  }

  return raw.toUpperCase();
}

/** Human-readable name for a block code, for labels and tables. */
export function blockDisplayName(code: string): string {
  if (code === ALL_BLOCKS) {
    return 'Todo el temario';
  }

  const normalized = normalizeBlockCode(code);
  const block = SYLLABUS_BLOCKS.find((candidate) => candidate.code === normalized);
  return block ? `${block.code} · ${block.name}` : normalized;
}
