import { apiClient } from '../client';
import type {
  AuthResponse,
  Disponibilidad,
  Estadisticas,
  Intento,
  IntentoRequest,
  PagedResult,
  Pregunta,
  SyllabusBlock,
  SyllabusTopic,
  UserProfile,
} from '../../types/domain';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  register: (nombre: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/register', { nombre, email, password }),

  /** Rehydrates the session on a cold load: the JWT lives in a cookie we cannot read. */
  me: () => apiClient.get<UserProfile>('/auth/me'),

  logout: () => apiClient.post<void>('/auth/logout', {}),
};

export const preguntasApi = {
  /**
   * Random questions for a block. `bloque` accepts the curriculum ordinal, the roman code
   * or the "all" wildcard; the API resolves all three.
   */
  getPreguntas: (bloque: string, cantidad: number, signal?: AbortSignal) =>
    apiClient.get<Pregunta[]>(
      `/preguntas/bloque/${encodeURIComponent(bloque)}?cantidad=${cantidad}`,
      { staticFallback: 'preguntas.json', signal },
    ),

  getDisponibilidad: (bloque: string, signal?: AbortSignal) =>
    apiClient.get<Disponibilidad>(
      `/preguntas/disponibilidad?bloque=${encodeURIComponent(bloque)}`,
      { signal },
    ),
};

export const syllabusApi = {
  getBlocks: (signal?: AbortSignal) =>
    apiClient.get<SyllabusBlock[]>('/syllabus/blocks', { staticFallback: 'blocks.json', signal }),

  getTopics: (signal?: AbortSignal) =>
    apiClient.get<SyllabusTopic[]>('/syllabus/topics', { staticFallback: 'topics.json', signal }),
};

export const progresoApi = {
  /**
   * Records a finished exam. The payload carries observations only — the server computes
   * the grade and the blank count, so there is nothing here for a tampered client to set.
   */
  saveIntento: (intento: IntentoRequest) =>
    apiClient.post<Intento>('/progreso', intento, { queueWhenOffline: true }),

  getHistorial: (page = 1, pageSize = 20, signal?: AbortSignal) =>
    apiClient.get<PagedResult<Intento>>(
      `/progreso/historial?page=${page}&pageSize=${pageSize}`,
      { signal },
    ),

  getEstadisticas: (signal?: AbortSignal) =>
    apiClient.get<Estadisticas>('/progreso/estadisticas', { signal }),

  borrarHistorial: () => apiClient.delete<{ eliminados: number }>('/progreso/historial'),
};
