import { PENALTY_PER_WRONG, POINTS_PER_CORRECT } from '../../utils/scoring';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.layout}`}>
        <p className={styles.copy}>
          © {new Date().getFullYear()} NainDev · Preparación de Oposiciones TAI
          <span className={styles.scale}>
            Baremo oficial INAP: +{POINTS_PER_CORRECT.toFixed(2).replace('.', ',')} acierto ·
            −{PENALTY_PER_WRONG.toFixed(2).replace('.', ',')} fallo · 0,00 en blanco
          </span>
        </p>

        <nav className={styles.links} aria-label="Enlaces del pie">
          <a
            className={styles.link}
            href="https://www.naindev.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            naindev.com
          </a>
          <a
            className={styles.link}
            href="https://github.com/Nain9Dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a className={styles.link} href="#top">
            Volver arriba
          </a>
        </nav>
      </div>
    </footer>
  );
}
