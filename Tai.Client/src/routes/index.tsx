import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Landing } from '../features/landing/Landing';
import { useAuthStore } from '../store/useAuthStore';

// The home pulls in the exam engine, the forms and the progress hooks. A visitor reading the
// landing needs none of that, so it arrives as its own chunk.
const AppHome = lazy(() => import('../features/overview/AppHome').then((module) => ({ default: module.AppHome })));

export const Route = createFileRoute('/')({
  component: Home,
});

/** A visitor with neither a session nor guest mode gets the landing (REQ-060); everyone else, the home. */
function Home() {
  const hasSession = useAuthStore((state) => state.user !== null || state.isGuest);

  if (!hasSession) {
    return <Landing />;
  }

  return (
    <Suspense fallback={<LoadingSkeleton variant="title" label="Cargando tu panel" />}>
      <AppHome />
    </Suspense>
  );
}
