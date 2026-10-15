import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Intento } from '../types/domain';

/** Keeps the local history bounded; older attempts stop informing current study anyway. */
const MAX_LOCAL_ATTEMPTS = 200;

interface AnalyticsState {
  /**
   * Attempts held in this browser: everything a guest records, plus anything written
   * while offline and not yet confirmed by the server.
   */
  historial: Intento[];

  addLocal: (intento: Intento) => void;
  /** Drops a local copy once the server has acknowledged the same attempt. */
  confirmSynced: (localId: number) => void;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      historial: [],

      addLocal: (intento) =>
        set((state) => ({
          historial: [...state.historial, intento].slice(-MAX_LOCAL_ATTEMPTS),
        })),

      confirmSynced: (localId) =>
        set((state) => ({
          historial: state.historial.filter((attempt) => attempt.id !== localId),
        })),

      reset: () => set({ historial: [] }),
    }),
    {
      name: 'nain_tai_analytics_v1',
      partialize: (state) => ({ historial: state.historial }),
    },
  ),
);
