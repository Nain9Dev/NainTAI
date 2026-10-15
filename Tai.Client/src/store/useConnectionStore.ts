import { create } from 'zustand';

export type ConnectionMode = 'connecting' | 'online' | 'offline';

interface ConnectionState {
  mode: ConnectionMode;
  /** Number of writes waiting in the offline queue. */
  pendingWrites: number;
  /** True while the queue is being drained. */
  isSyncing: boolean;
  lastError: string | null;

  setMode: (mode: ConnectionMode) => void;
  setPendingWrites: (count: number) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastError: (message: string | null) => void;
}

/**
 * Connection state as a store rather than something the interface polls.
 *
 * The header used to read `apiClient.getMode()` on a one-second interval and the offline
 * badge on a two-second one, so the two could disagree for up to two seconds and both
 * re-rendered forever even when nothing changed. The client now pushes its state here and
 * the components subscribe.
 */
export const useConnectionStore = create<ConnectionState>((set) => ({
  mode: 'connecting',
  pendingWrites: 0,
  isSyncing: false,
  lastError: null,

  setMode: (mode) => set((state) => (state.mode === mode ? state : { mode })),
  setPendingWrites: (pendingWrites) =>
    set((state) => (state.pendingWrites === pendingWrites ? state : { pendingWrites })),
  setSyncing: (isSyncing) => set((state) => (state.isSyncing === isSyncing ? state : { isSyncing })),
  setLastError: (lastError) => set({ lastError }),
}));

/** Read the mode outside React, for the API client itself. */
export const getConnectionMode = () => useConnectionStore.getState().mode;

export const setConnectionMode = (mode: ConnectionMode) =>
  useConnectionStore.getState().setMode(mode);
