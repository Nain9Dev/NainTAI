import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Storage key.
 *
 * Every key here is namespaced, because browser storage is scoped per origin and two
 * projects served from the same host and port share one bucket. This key used to be a
 * bare "csrf-token", which is generic enough that any other application on the same
 * origin would silently overwrite it — and the symptom is a logged-in user whose writes
 * start failing with 403 for no visible reason.
 */
const STORAGE_KEY = 'nain_tai_csrf_v1';

interface CsrfState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useCsrfStore = create<CsrfState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: STORAGE_KEY,
      // A token written under the old generic key belongs to whichever project wrote it
      // last. It is not worth migrating: the server issues a fresh one on the next login.
      version: 1,
    },
  ),
);
