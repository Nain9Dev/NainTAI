import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { BaseLayout } from '../components/layout/BaseLayout';
import { useAuthStore } from '../store/useAuthStore';

/** Routes reachable without a session or guest mode. */
const PUBLIC_ROUTES = new Set(['/login', '/register']);

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { user, isGuest } = useAuthStore.getState();

    if (user === null && !isGuest && !PUBLIC_ROUTES.has(location.pathname)) {
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
