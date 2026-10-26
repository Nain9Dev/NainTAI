/**
 * Motion helpers. Every one of them degrades to "no motion" rather than to "broken":
 * REQ-054 and REQ-072 say decorative movement must stop for a viewer who asked for that, and
 * a value or a section must never stay hidden because an animation did not run.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(query.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Fades an element up the first time it scrolls into view.
 *
 * Returns props to spread on the element. The CSS that hides `data-reveal="out"` lives under
 * `prefers-reduced-motion: no-preference`, and this hook reports "in" at once when motion is
 * reduced or `IntersectionObserver` is missing, so content is never stranded invisible.
 */
export function useReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || reduced || !canObserve) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced, canObserve]);

  const state = reduced || !canObserve || seen ? 'in' : 'out';
  const style = { '--reveal-delay': `${delayMs}ms` } as CSSProperties;

  return { ref, revealProps: { 'data-reveal': state, style } };
}

/** Counts up to `target` once when mounted and again whenever the target changes. */
export function useCountUp(target: number, durationMs = 900): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // Ease-out cubic: fast at first, settling on the real figure.
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  // Derived rather than stored: under reduced motion the target is the value, with no render
  // in between where the figure could show a stale count.
  return reduced ? target : value;
}
