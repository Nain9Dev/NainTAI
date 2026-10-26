import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { BaseLayout } from '../components/layout/BaseLayout';
import { leaveDemo } from '../demo/runtime';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Routes reachable without a session or guest mode.
 *
 * `/` is public because it is the landing for a visitor (REQ-060); a candidate with a session
 * sees the home there instead, so the path does the right thing for both.
 */
const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);

/** Where someone goes to use their own account, which the demo's example data must not follow them to. */
const ACCOUNT_ROUTES = new Set(['/login', '/register']);

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { user, isGuest, isDemo } = useAuthStore.getState();

    // Example attempts left in the local stores would be merged into a real account's
    // statistics as unsynced work (REQ-066), so the demo is closed, and the visitor's own
    // progress restored, before an account screen opens.
    if (isDemo && ACCOUNT_ROUTES.has(location.pathname)) {
      leaveDemo();
    }

    if (user === null && !isGuest && !isDemo && !PUBLIC_ROUTES.has(location.pathname)) {
      // `redirect` is carried so the candidate lands back where they were heading.
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
