/**
 * The demo guide: what a visitor should try, in the order that tells the product's story.
 *
 * A checklist rather than a spotlight tour. Coach marks anchored to elements break across
 * routes, viewports and the sticky header; a list works on a phone, works from the keyboard,
 * and doubles as an index of everything the product does.
 */
export type GuideStepId = 'overview' | 'quick-round' | 'review' | 'exam' | 'performance' | 'profile';

export interface GuideStep {
  id: GuideStepId;
  title: string;
  hint: string;
  /** Where the step happens, so the guide can take the visitor there. */
  to: '/' | '/analytics' | '/perfil';
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: 'overview',
    title: 'Mira tu panel de hoy',
    hint: 'Objetivo diario, racha y nivel por bloque, con tres semanas de práctica de ejemplo.',
    to: '/',
  },
  {
    id: 'quick-round',
    title: 'Haz una ronda rápida',
    hint: 'Cinco preguntas con corrección inmediata y la explicación de cada solución.',
    to: '/',
  },
  {
    id: 'review',
    title: 'Repasa tus fallos',
    hint: 'La aplicación guarda lo que fallas y te lo vuelve a plantear hasta que lo dominas.',
    to: '/',
  },
  {
    id: 'exam',
    title: 'Simula el examen oficial',
    hint: 'Modo examen: cuenta atrás, soluciones ocultas y baremo +1,00 / −0,33.',
    to: '/',
  },
  {
    id: 'performance',
    title: 'Consulta tu rendimiento',
    hint: 'Evolución de la nota, constancia y en qué bloque conviene insistir.',
    to: '/analytics',
  },
  {
    id: 'profile',
    title: 'Guarda tu progreso',
    hint: 'Con una cuenta tu historial se sincroniza y no depende de este navegador.',
    to: '/perfil',
  },
];

const KNOWN_IDS: ReadonlySet<string> = new Set(GUIDE_STEPS.map((step) => step.id));

/** Adds a step to the done list once; an unknown id is ignored rather than counted. */
export function completeStep(done: readonly GuideStepId[], id: GuideStepId): GuideStepId[] {
  if (!KNOWN_IDS.has(id) || done.includes(id)) {
    return [...done];
  }

  return [...done, id];
}

export function guideProgress(done: readonly GuideStepId[]): { done: number; total: number; share: number } {
  const total = GUIDE_STEPS.length;
  const count = GUIDE_STEPS.filter((step) => done.includes(step.id)).length;

  return { done: count, total, share: count / total };
}

/** The first step still to do, in guide order. */
export function nextStep(done: readonly GuideStepId[]): GuideStep | null {
  return GUIDE_STEPS.find((step) => !done.includes(step.id)) ?? null;
}
