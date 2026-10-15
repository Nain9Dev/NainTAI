import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStudyStore } from '../store/useStudyStore';
import { useProgressionStore } from '../store/useProgressionStore';
import { useGenerateExam } from '../hooks/useStudy';
import { SetupForm } from '../features/study/SetupForm';
import { DailyProgress } from '../features/study/DailyProgress';
import { ExamEngine } from '../features/exam/ExamEngine';
import { Callout } from '../components/ui/Callout';
import { ALL_BLOCKS } from '../types/domain';
import styles from './Home.module.css';

/** A round short enough to fit in a coffee break, which is when most of them happen. */
const QUICK_ROUND_SIZE = 5;

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const phase = useStudyStore((state) => state.phase);
  const setMode = useStudyStore((state) => state.setMode);
  const startTest = useStudyStore((state) => state.startTest);
  const dueForReview = useProgressionStore((state) => state.dueForReview);

  const generate = useGenerateExam();
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (phase !== 'setup') {
    return <ExamEngine />;
  }

  const startQuickRound = () => {
    // Study mode: five questions with the answer explained straight away is a better use
    // of four minutes than five questions marked at the end.
    setMode('study');
    generate.mutate({ bloque: ALL_BLOCKS, cantidad: QUICK_ROUND_SIZE });
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
    startTest(questions, ALL_BLOCKS);
  };

  return (
    <div className="stack">
      <header className={styles.hero}>
        <span className="eyebrow">Oposiciones TAI · INAP</span>
        <h1 className={styles.title}>
          Practica como en el <span className="title-accent">examen real</span>
        </h1>
        <p className="lead">
          Simulacros sobre los cuatro bloques del temario, corregidos con el baremo oficial
          (+1,00 por acierto, −0,33 por fallo, 0,00 en blanco) y analítica que te dice en qué
          bloque conviene insistir.
        </p>
      </header>

      <DailyProgress
        onQuickRound={startQuickRound}
        onReviewMistakes={startReview}
        isStarting={generate.isPending}
      />

      {reviewError && <Callout tone="info">{reviewError}</Callout>}

      <SetupForm />
    </div>
  );
}
