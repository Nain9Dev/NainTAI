import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { completeStep, type GuideStepId } from '../demo/guide';

interface DemoState {
  /** Guide steps the visitor has done. */
  done: GuideStepId[];
  /** The guide shows as a small pill instead of the full checklist. */
  collapsed: boolean;
  /** The visitor closed the guide; it stays closed for this demo. */
  dismissed: boolean;

  complete: (id: GuideStepId) => void;
  toggle: () => void;
  dismiss: () => void;
  /** A new demo starts with a fresh guide. */
  reset: () => void;
}

/**
 * The guide starts folded into its pill. Opened, it covers the left of the page on a laptop,
 * and the first thing a visitor should see is the product, not a panel about the product.
 */
const initialState = { done: [] as GuideStepId[], collapsed: true, dismissed: false };

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...initialState,

      complete: (id) =>
        set((state) => {
          const done = completeStep(state.done, id);
          // Returning the same state keeps subscribers quiet when the step was already done.
          return done.length === state.done.length ? state : { done };
        }),

      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      dismiss: () => set({ dismissed: true }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'nain_tai_demo_v1',
      partialize: (state) => ({
        done: state.done,
        collapsed: state.collapsed,
        dismissed: state.dismissed,
      }),
    },
  ),
);
