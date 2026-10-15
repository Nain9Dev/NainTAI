import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { routeTree } from './routeTree.gen';
import { ApiError } from './api/client';
import { offlineQueue } from './api/offlineQueue';
import { useAuthStore } from './store/useAuthStore';
import './styles/main.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // Retrying a 4xx just repeats a request the server already refused on its merits.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Confirms with the API whether the persisted session is still valid. The cookie is
// HttpOnly, so the only way to know is to ask.
void useAuthStore.getState().hydrate();

// Publishes the pending-write count so a reload with a queued exam shows it immediately.
// The queue opens IndexedDB here rather than on import, so the module stays loadable
// wherever IndexedDB is absent or blocked.
void offlineQueue.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
