import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { beginDemo, leaveDemo } from './runtime';

type Destination = '/' | '/analytics' | '/perfil';

/** Starts the demo and lands the visitor on the screen they asked to see. */
export function useStartDemo() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const start = useCallback(
    async (to: Destination = '/') => {
      setIsStarting(true);

      // The home is its own chunk; fetching it while the demo seeds means it is already here
      // when the navigation lands, instead of flashing a placeholder.
      void import('../features/overview/AppHome');

      try {
        await beginDemo();
        await navigate({ to });
      } finally {
        setIsStarting(false);
      }
    },
    [navigate],
  );

  return { start, isStarting };
}

/** Leaves the demo, restoring the visitor's own data, and goes where they meant to go. */
export function useLeaveDemo() {
  const navigate = useNavigate();

  return useCallback(
    async (to: '/' | '/register' | '/login' = '/') => {
      leaveDemo();
      await navigate({ to });
    },
    [navigate],
  );
}
