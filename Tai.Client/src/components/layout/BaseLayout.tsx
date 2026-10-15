import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import styles from './BaseLayout.module.css';

interface BaseLayoutProps {
  children: ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  usePointerGlow();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <Header />

      <main id="main-content" className={`shell ${styles.main}`}>
        {children}
      </main>

      <Footer />
      <ConnectionBanner />
    </>
  );
}

/**
 * Feeds the pointer position to the ambient glow in `main.css`.
 *
 * Writing two custom properties on the root element keeps the effect entirely in CSS, so
 * React never re-renders for it. Skipped when the viewer has asked for reduced motion, and
 * on coarse pointers where there is no cursor to follow.
 */
function usePointerGlow() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (prefersReducedMotion || isCoarsePointer) {
      return;
    }

    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      // Coalesced into an animation frame: pointermove fires far more often than the
      // screen refreshes, and every extra write is wasted work.
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const { style } = document.documentElement;
        style.setProperty('--mouse-x', `${(event.clientX / window.innerWidth) * 100}%`);
        style.setProperty('--mouse-y', `${(event.clientY / window.innerHeight) * 100}%`);
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);
}
