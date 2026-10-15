import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '../features/analytics/Dashboard';

export const Route = createFileRoute('/analytics')({
  component: Analytics,
});

function Analytics() {
  return <Dashboard />;
}
