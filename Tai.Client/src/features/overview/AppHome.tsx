import { useState } from 'react';
import { useStudyStore } from '../../store/useStudyStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { useDemoStore } from '../../store/useDemoStore';
import { useGenerateExam } from '../../hooks/useStudy';
import { usePrefersReducedMotion } from '../../hooks/useMotion';
import { SetupForm } from '../study/SetupForm';
import { ExamEngine } from '../exam/ExamEngine';
import { Callout } from '../../components/ui/Callout';
import { ALL_BLOCKS } from '../../types/domain';
import { ActionCards, BlockMastery, TodayRow, Welcome } from './Overview';

/** A round short enough to fit in a coffee break, which is when most of them happen. */
const QUICK_ROUND_SIZE = 5;

/** A block round is longer than a quick one: the candidate chose what to work on. */
const BLOCK_ROUND_SIZE = 10;

/**
 * The home of a candidate or a guest: today's goal, the three ways to start, mastery by block
 * and the custom exam form, or the exam itself once one is running.
 *
 * Loaded on demand by the route (see `routes/index.tsx`): a visitor reading the landing never
 * downloads the exam engine.
 */
export function AppHome() {
  const phase = useStudyStore((state) => state.phase);
  const setMode = useStudyStore((state) => state.setMode);
  const startTest = useStudyStore((state) => state.startTest);
  const dueForReview = useProgressionStore((state) => state.dueForReview);
  const completeStep = useDemoStore((state) => state.complete);
  const reducedMotion = usePrefersReducedMotion();

  const generate = useGenerateExam();
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (phase !== 'setup') {
    return <ExamEngine />;
  }

  const startQuickRound = () => {
    // Study mode: five questions with the answer explained straight away is a better use
    // of four minutes than five questions marked at the end.
    setMode('study');
    completeStep('quick-round');
    generate.mutate({ bloque: ALL_BLOCKS, cantidad: QUICK_ROUND_SIZE });
  };

  const startBlockRound = (ordinal: number) => {
    setMode('study');
    generate.mutate({ bloque: String(ordinal), cantidad: BLOCK_ROUND_SIZE });
  };

  const startReview = (count: number) => {
    const questions = dueForReview(count);

    if (questions.length === 0) {
      setReviewError('No hay preguntas falladas pendientes de repaso.');
      return;
    }

    // Served entirely from what is stored on the device, so review works with no
    // connection at all — which is when it is most likely to be used.
    setReviewError(null);
    setMode('study');
    completeStep('review');
    startTest(questions, ALL_BLOCKS);
  };

  const openOfficialExam = () => {
    setMode('exam');
    // An explicit smooth scroll ignores the CSS reduced-motion override, so it is gated here.
    document
      .getElementById('simulacro')
      ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="stack">
      <Welcome />

      <TodayRow />

      <ActionCards
        onQuickRound={startQuickRound}
        onReview={startReview}
        onOfficial={openOfficialExam}
        isStarting={generate.isPending}
      />

      {reviewError && <Callout tone="info">{reviewError}</Callout>}

      <BlockMastery onPractice={startBlockRound} isStarting={generate.isPending} />

      <div id="simulacro">
        <SetupForm />
      </div>
    </div>
  );
}
