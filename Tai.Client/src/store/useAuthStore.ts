import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/endpoints';
import { useCsrfStore } from './useCsrfStore';
import type { UserProfile } from '../types/domain';

interface AuthState {
  user: UserProfile | null;
  isGuest: boolean;
  /** True until the first session check completes, so routes do not redirect too early. */
  isHydrating: boolean;

  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  /** Confirms with the API whether the cookie session is still alive. */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isGuest: false,
      isHydrating: false,

      isAuthenticated: () => get().user !== null,

      login: async (email, password) => {
        const response = await authApi.login(email, password);
        useCsrfStore.getState().setToken(response.csrfToken);
        set({ user: response.user, isGuest: false });
      },

      register: async (nombre, email, password) => {
        const response = await authApi.register(nombre, email, password);
        useCsrfStore.getState().setToken(response.csrfToken);
        set({ user: response.user, isGuest: false });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // The server may already consider the session gone. Clearing locally either way
          // is what the user asked for; leaving them "logged in" would be worse.
        } finally {
          useCsrfStore.getState().clearToken();
          set({ user: null, isGuest: false });
        }
      },

      continueAsGuest: () => set({ user: null, isGuest: true }),

      hydrate: async () => {
        // The persisted profile is a cache for the first paint. The cookie is the real
        // session and only the API can say whether it is still valid — it may have expired,
        // been revoked by logging out elsewhere, or been dropped by the browser.
        if (get().user === null) {
          return;
        }

        set({ isHydrating: true });

        try {
          const profile = await authApi.me();
          set({ user: profile, isGuest: false });
        } catch {
          set({ user: null });
          useCsrfStore.getState().clearToken();
        } finally {
          set({ isHydrating: false });
        }
      },
    }),
    {
      name: 'nain_tai_auth_v1',
      partialize: (state) => ({ user: state.user, isGuest: state.isGuest }),
    },
  ),
);

// The API client raises this when a session cannot be recovered, including after a failed
// token rotation. Clearing here keeps the interface honest about being signed out.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    const { user, isGuest } = useAuthStore.getState();
    if (user !== null || isGuest) {
      useCsrfStore.getState().clearToken();
      useAuthStore.setState({ user: null });
    }
  });
}
