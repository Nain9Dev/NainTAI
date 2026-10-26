import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Database, Flame, Menu, Play, ServerCrash, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStartDemo } from '../../demo/useStartDemo';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { currentStreak, isStreakAtRisk } from '../../utils/streak';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Simulacro', exact: true },
  { to: '/analytics', label: 'Rendimiento', exact: false },
  { to: '/perfil', label: 'Mi perfil', exact: false },
] as const;

/** What a visitor can do before having a session: read about the product, then try it. */
const VISITOR_LINKS = [
  { hash: 'funciones', label: 'Funciones' },
  { hash: 'como-funciona', label: 'Cómo funciona' },
] as const;

export function Header() {
  const mode = useConnectionStore((state) => state.mode);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isDemo = useAuthStore((state) => state.isDemo);
  // A visitor has neither an account nor guest mode: the navigation would send them to sign-in.
  const isVisitor = useAuthStore((state) => state.user === null && !state.isGuest);
  const { start, isStarting } = useStartDemo();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();

    // Passive: the listener never calls preventDefault, so the browser can keep scrolling
    // smoothly instead of waiting to find out.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`shell ${styles.layout}`}>
        <Link to="/" className={styles.brand} onClick={() => setIsMenuOpen(false)}>
          <span className={styles.brandMark} aria-hidden="true">
            TAI
          </span>
          <span>
            NainDev <span className={styles.brandName}>Oposiciones</span>
          </span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>

        <nav
          id="primary-navigation"
          className={`${styles.nav} ${isMenuOpen ? '' : styles.navCollapsed}`}
          aria-label="Navegación principal"
        >
          {isVisitor &&
            VISITOR_LINKS.map((item) => (
              <Link
                key={item.hash}
                to="/"
                hash={item.hash}
                className={styles.link}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

          {isVisitor && (
            <Link to="/login" className={`${styles.link} ${styles.navSignIn}`} onClick={() => setIsMenuOpen(false)}>
              Iniciar sesión
            </Link>
          )}

          {!isVisitor && NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={styles.link}
              activeProps={{ className: `${styles.link} ${styles.linkActive}` }}
              activeOptions={{ exact: item.exact }}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <a
            href="https://www.naindev.com"
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfolio
          </a>
        </nav>

        <div className={styles.trailing}>
          {isVisitor ? (
            <>
              <Link to="/login" className={styles.signIn}>
                Iniciar sesión
              </Link>
              <Button
                size="small"
                onClick={() => void start('/')}
                isLoading={isStarting}
                icon={<Play size={14} aria-hidden="true" />}
              >
                Probar la demo
              </Button>
            </>
          ) : (
            <>
              <StreakPill />
              <ConnectionPill mode={mode} isGuest={isGuest} isDemo={isDemo} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ConnectionPill({ mode, isGuest, isDemo }: { mode: string; isGuest: boolean; isDemo: boolean }) {
  // The demo runs on local data by design, so reporting the server as unreachable would be
  // noise; the pill names what the visitor is actually in.
  if (isDemo) {
    return (
      <span className={`${styles.status} ${styles.demo}`}>
        <Sparkles size={14} aria-hidden="true" />
        Modo demo
      </span>
    );
  }

  if (mode === 'connecting') {
    return <span className={styles.status}>Conectando…</span>;
  }

  if (mode === 'offline') {
    return (
      <span className={`${styles.status} ${styles.offline}`}>
        <ServerCrash size={14} aria-hidden="true" />
        Modo local
      </span>
    );
  }

  return (
    <span className={`${styles.status} ${styles.online}`}>
      <Database size={14} aria-hidden="true" />
      {isGuest ? 'Invitado' : 'Conectado'}
    </span>
  );
}

/**
 * The streak, kept in view.
 *
 * Placed in the header rather than only on the home panel because it is the one number
 * that should follow the candidate around: it is visible from the results screen, which
 * is exactly where the decision to come back tomorrow gets made.
 */
function StreakPill() {
  const streakState = useProgressionStore((state) => state.streak);
  const streak = currentStreak(streakState);

  if (streak === 0) {
    return null;
  }

  const atRisk = isStreakAtRisk(streakState);

  return (
    <span
      className={`${styles.streak} ${atRisk ? styles.streakAtRisk : ''}`}
      title={
        atRisk
          ? 'Todavía no has practicado hoy. Una ronda rápida mantiene la racha.'
          : `Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`
      }
    >
      <Flame size={14} aria-hidden="true" />
      {streak}
      <span className="visually-hidden">
        {atRisk
          ? `Racha de ${streak} días, pendiente de practicar hoy`
          : `Racha de ${streak} días`}
      </span>
    </span>
  );
}
