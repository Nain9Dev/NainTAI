import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progresoApi } from '../api/endpoints';
import { QueuedOfflineError } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { computeLocalEstadisticas, mergeEstadisticas } from '../utils/analytics';
import type { Estadisticas, Intento, IntentoRequest } from '../types/domain';
import { normalizeBlockCode } from '../types/domain';

const STATS_KEY = ['progreso', 'estadisticas'] as const;
const HISTORY_KEY = ['progreso', 'historial'] as const;

/**
 * Performance dashboard.
 *
 * Merges the server's view with attempts held only in this browser, so a guest sees real
 * numbers and a signed-in candidate does not lose the exams they sat offline.
 */
export function useEstadisticas(): {
  estadisticas: Estadisticas;
  isLoading: boolean;
  error: Error | null;
  hasLocalOnly: boolean;
} {
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const localAttempts = useAnalyticsStore((state) => state.historial);

  const query = useQuery({
    queryKey: STATS_KEY,
    queryFn: ({ signal }) => progresoApi.getEstadisticas(signal),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const estadisticas = useMemo(
    () =>
      isAuthenticated
        ? mergeEstadisticas(query.data, localAttempts)
        : computeLocalEstadisticas(localAttempts),
    [isAuthenticated, query.data, localAttempts],
  );

  return {
    estadisticas,
    isLoading: isAuthenticated && query.isLoading,
    error: (query.error as Error | null) ?? null,
    hasLocalOnly: localAttempts.length > 0,
  };
}

export function useHistorial(page = 1, pageSize = 20) {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: [...HISTORY_KEY, page, pageSize],
    queryFn: ({ signal }) => progresoApi.getHistorial(page, pageSize, signal),
    enabled: isAuthenticated,
    placeholderData: (previous) => previous,
  });
}

/**
 * Records a finished exam.
 *
 * A guest keeps it locally. A signed-in candidate sends it to the server, which recomputes
 * the grade; if the request cannot leave the device it is queued and kept locally until it
 * does. Either way the attempt is written exactly once.
 */
export function useSubmitIntento() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const addLocal = useAnalyticsStore((state) => state.addLocal);

  return useMutation({
    mutationFn: async (intento: IntentoRequest): Promise<Intento> => {
      const normalized: IntentoRequest = {
        ...intento,
        bloque: normalizeBlockCode(intento.bloque),
        fecha: intento.fecha ?? new Date().toISOString(),
      };

      if (!isAuthenticated) {
        return toLocalAttempt(normalized);
      }

      try {
        return await progresoApi.saveIntento(normalized);
      } catch (error) {
        if (error instanceof QueuedOfflineError) {
          // Parked for replay. Keeping a local copy is what makes the dashboard honest
          // in the meantime; it is dropped once the server confirms the same attempt.
          return { ...toLocalAttempt(normalized), pendienteSincronizar: true };
        }

        throw error;
      }
    },

    onSuccess: (attempt) => {
      // Server-confirmed attempts arrive through the queries; only unsynced ones are kept.
      if (!isAuthenticated || attempt.pendienteSincronizar) {
        addLocal(attempt);
      }

      void queryClient.invalidateQueries({ queryKey: STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });
}

export function useBorrarHistorial() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.user !== null);
  const resetLocal = useAnalyticsStore((state) => state.reset);

  return useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        await progresoApi.borrarHistorial();
      }
      resetLocal();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });
}

/**
 * Builds a local attempt, applying the same scale the server does.
 *
 * The id is negative so a local row can never be mistaken for a server one: the API issues
 * positive identities, and the two lists are merged in the dashboard.
 */
function toLocalAttempt(intento: IntentoRequest): Intento {
  const blancos = Math.max(intento.total - intento.aciertos - intento.fallos, 0);
  const netPoints = intento.aciertos - intento.fallos * 0.33;
  const grade = intento.total > 0 ? Math.max(0, (netPoints / intento.total) * 10) : 0;

  return {
    id: -Date.now(),
    aciertos: intento.aciertos,
    fallos: intento.fallos,
    blancos,
    total: intento.total,
    nota: Math.round((grade + Number.EPSILON) * 100) / 100,
    bloque: normalizeBlockCode(intento.bloque),
    fecha: intento.fecha ?? new Date().toISOString(),
  };
}
