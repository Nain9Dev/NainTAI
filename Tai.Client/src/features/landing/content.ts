import { BarChart3, BookOpenCheck, ClipboardCheck, Flame, RotateCcw, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
  /** Where the demo opens when the visitor tries this function. */
  to: '/' | '/analytics' | '/perfil';
  action: string;
}

/** One card per function of the product (REQ-062). Every claim here is behaviour the client implements. */
export const FEATURES: readonly Feature[] = [
  {
    icon: ClipboardCheck,
    title: 'Simulacros con baremo oficial',
    text: 'De 10 a 50 preguntas con la puntuación del INAP: +1,00 por acierto, −0,33 por fallo y 0,00 en blanco. En modo examen, con cuenta atrás de 54 segundos por pregunta.',
    to: '/',
    action: 'Hacer un simulacro',
  },
  {
    icon: BookOpenCheck,
    title: 'Modo estudio con explicación',
    text: 'Corrección inmediata tras cada respuesta, con el fundamento de la solución y sin reloj. Para aprender, no solo para medirte.',
    to: '/',
    action: 'Probar una ronda',
  },
  {
    icon: RotateCcw,
    title: 'Repaso de tus fallos',
    text: 'Lo que fallas vuelve a aparecer hasta que lo aciertas dos veces seguidas. El repaso funciona incluso sin conexión.',
    to: '/',
    action: 'Repasar fallos',
  },
  {
    icon: BarChart3,
    title: 'Rendimiento por bloque',
    text: 'Nota media, evolución de tus simulacros y el bloque del temario donde más conviene insistir.',
    to: '/analytics',
    action: 'Ver mi rendimiento',
  },
  {
    icon: Flame,
    title: 'Racha y objetivo diario',
    text: 'Cinco preguntas bastan para mantener la racha. Fija tu meta de cada día y mira cómo se completa.',
    to: '/',
    action: 'Ver mi racha',
  },
  {
    icon: WifiOff,
    title: 'Funciona sin conexión',
    text: 'Si la red falla, la aplicación usa su catálogo local y guarda tus resultados para enviarlos cuando vuelvas a estar online.',
    to: '/perfil',
    action: 'Ver cómo se guarda',
  },
];

export interface Step {
  title: string;
  text: string;
}

export const STEPS: readonly Step[] = [
  {
    title: 'Elige qué practicar',
    text: 'Un bloque del temario o todo el temario, la extensión que quieras y el modo: estudio o examen.',
  },
  {
    title: 'Practica y corrige',
    text: 'Responde con el ratón o con el teclado (A a D y flechas). Recibes la nota con el baremo oficial y repasas cada pregunta.',
  },
  {
    title: 'Mejora donde importa',
    text: 'El panel señala tu bloque más débil y te propone repasar justo lo que has fallado.',
  },
];

export const TRUST: readonly string[] = [
  'Baremo INAP +1,00 / −0,33',
  '4 bloques del temario',
  'Atajos de teclado',
  'Uso sin conexión',
];
