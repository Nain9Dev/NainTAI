import { Link } from '@tanstack/react-router';
import { ArrowRight, GitBranch, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useReveal } from '../../hooks/useMotion';
import { useStartDemo } from '../../demo/useStartDemo';
import { FEATURES, STEPS, TRUST } from './content';
import type { Feature } from './content';
import { ProductPreview } from './ProductPreview';
import styles from './Landing.module.css';

/**
 * The public first screen (REQ-060 to REQ-062).
 *
 * A visitor should be able to answer three questions without scrolling: what is this, is it
 * for me, and how do I try it. The demo button comes before the sign-in link because a
 * stranger has no account to sign in to.
 */
export function Landing() {
  const { start, isStarting } = useStartDemo();

  return (
    <div className={styles.landing}>
      <Hero onStart={() => void start('/')} isStarting={isStarting} />
      <Features onTry={(to) => void start(to)} disabled={isStarting} />
      <HowItWorks />
      <FinalCta onStart={() => void start('/')} isStarting={isStarting} />
    </div>
  );
}

function Hero({ onStart, isStarting }: { onStart: () => void; isStarting: boolean }) {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.copy}>
        <span className={`eyebrow ${styles.rise}`}>Oposiciones TAI · INAP</span>

        <h1 id="landing-title" className={`${styles.title} ${styles.rise}`}>
          Entrena el TAI como si ya fuera el <span className="title-accent">día del examen</span>
        </h1>

        <p className={`lead ${styles.lead} ${styles.rise}`}>
          Simulacros con el baremo oficial del INAP, repaso automático de tus fallos y un panel que te
          dice en qué bloque insistir. Pruébalo en un clic, sin registrarte.
        </p>

        <div className={`${styles.actions} ${styles.rise}`}>
          <Button
            onClick={onStart}
            isLoading={isStarting}
            icon={<Play size={16} aria-hidden="true" />}
            className={styles.primaryAction}
          >
            {isStarting ? 'Preparando la demo…' : 'Probar la demo'}
          </Button>

          <Link to="/login" className={styles.signIn}>
            Iniciar sesión <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <p className={`${styles.note} ${styles.rise}`}>
          Sin cuenta ni instalación. Los datos de la demo son de ejemplo y puedes reiniciarlos cuando
          quieras.
        </p>

        <ul className={`${styles.trust} ${styles.rise}`} aria-label="En resumen">
          {TRUST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={`${styles.visual} ${styles.riseLate}`}>
        <ProductPreview />
      </div>
    </section>
  );
}

function Features({ onTry, disabled }: { onTry: (to: Feature['to']) => void; disabled: boolean }) {
  const { ref, revealProps } = useReveal<HTMLDivElement>();

  return (
    <section id="funciones" className={styles.section} aria-labelledby="features-title">
      <div className={styles.heading} ref={ref} {...revealProps}>
        <span className="eyebrow">Qué ofrece</span>
        <h2 id="features-title">Todo lo que necesitas para practicar</h2>
        <p className="lead">
          Cada función se puede probar ahora mismo en la demo, con tres semanas de práctica de ejemplo
          ya cargadas.
        </p>
      </div>

      <ul className={styles.grid}>
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} onTry={onTry} disabled={disabled} />
        ))}
      </ul>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  onTry,
  disabled,
}: {
  feature: Feature;
  index: number;
  onTry: (to: Feature['to']) => void;
  disabled: boolean;
}) {
  const { ref, revealProps } = useReveal<HTMLLIElement>((index % 3) * 90);
  const Icon = feature.icon;

  return (
    <li className={styles.card} ref={ref} {...revealProps}>
      <span className={styles.icon}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
      <button type="button" className={styles.try} onClick={() => onTry(feature.to)} disabled={disabled}>
        {feature.action} <ArrowRight size={14} aria-hidden="true" />
      </button>
    </li>
  );
}

function HowItWorks() {
  const { ref, revealProps } = useReveal<HTMLDivElement>();

  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="how-title">
      <div className={styles.heading} ref={ref} {...revealProps}>
        <span className="eyebrow">Cómo funciona</span>
        <h2 id="how-title">Tres pasos, sin curva de aprendizaje</h2>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <Step key={step.title} step={step} index={index} />
        ))}
      </ol>
    </section>
  );
}

function Step({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const { ref, revealProps } = useReveal<HTMLLIElement>(index * 120);

  return (
    <li className={styles.step} ref={ref} {...revealProps}>
      <span className={styles.number} aria-hidden="true">
        {index + 1}
      </span>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </li>
  );
}

function FinalCta({ onStart, isStarting }: { onStart: () => void; isStarting: boolean }) {
  const { ref, revealProps } = useReveal<HTMLElement>();

  return (
    <section className={styles.final} ref={ref} {...revealProps} aria-labelledby="final-title">
      <h2 id="final-title">Pruébalo ahora, tarda diez segundos</h2>
      <p>
        Entra a la demo con datos de ejemplo y recorre la aplicación como lo haría un opositor: un
        simulacro, el repaso de fallos y el panel de rendimiento.
      </p>

      <Button onClick={onStart} isLoading={isStarting} icon={<Play size={16} aria-hidden="true" />}>
        {isStarting ? 'Preparando la demo…' : 'Probar la demo'}
      </Button>

      <p className={styles.credit}>
        Demo pública de NainDev: cliente React 19 y API .NET 10 con Clean Architecture.{' '}
        <a href="https://github.com/Nain9Dev/NainTAI" target="_blank" rel="noopener noreferrer">
          <GitBranch size={14} aria-hidden="true" /> Ver el código
        </a>{' '}
        ·{' '}
        <a href="https://www.naindev.com" target="_blank" rel="noopener noreferrer">
          Más proyectos en naindev.com
        </a>
      </p>
    </section>
  );
}
