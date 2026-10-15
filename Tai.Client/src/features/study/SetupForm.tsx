import { useState } from 'react';
import { Play } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { useDisponibilidad, useGenerateExam } from '../../hooks/useStudy';
import { useStudyStore, SECONDS_PER_QUESTION } from '../../store/useStudyStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { ALL_BLOCKS, SYLLABUS_BLOCKS } from '../../types/domain';
import { formatDuration } from '../../utils/scoring';
import type { StudyMode } from '../../store/useStudyStore';
import styles from './SetupForm.module.css';

const QUESTION_COUNTS = [10, 20, 30, 40, 50];

const BLOCK_OPTIONS = [
  { value: ALL_BLOCKS, label: 'Todo el temario TAI' },
  ...SYLLABUS_BLOCKS.map((block) => ({
    value: String(block.ordinal),
    label: `${block.code} · ${block.name}`,
  })),
];

export function SetupForm() {
  const [bloque, setBloque] = useState(ALL_BLOCKS);
  const [cantidad, setCantidad] = useState(20);

  const mode = useStudyStore((state) => state.mode);
  const setMode = useStudyStore((state) => state.setMode);
  const isOffline = useConnectionStore((state) => state.mode === 'offline');

  const generate = useGenerateExam();
  const { data: disponibilidad } = useDisponibilidad(bloque);

  const shortfall =
    disponibilidad && disponibilidad.disponibles > 0 && disponibilidad.disponibles < cantidad
      ? disponibilidad.disponibles
      : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    generate.mutate({ bloque, cantidad });
  };

  return (
    <Card
      eyebrow="Configuración"
      title="Prepara tu simulacro"
      subtitle="Elige el bloque, la extensión y cómo quieres que se corrija."
      as="section"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {generate.isError && (
          <Callout tone="danger" title="No se pudo generar el simulacro">
            {generate.error instanceof Error
              ? generate.error.message
              : 'Inténtalo de nuevo en unos segundos.'}
          </Callout>
        )}

        {isOffline && (
          <Callout tone="warning" title="Trabajando sin conexión">
            Se usará el catálogo local incluido en la aplicación. Tus resultados se guardarán en
            este dispositivo y se enviarán cuando vuelva la conexión.
          </Callout>
        )}

        {shortfall !== null && (
          <Callout tone="info" title="Hay menos preguntas de las que has pedido">
            Solo hay {shortfall} {shortfall === 1 ? 'pregunta disponible' : 'preguntas disponibles'}{' '}
            para este filtro. El simulacro se generará con {shortfall}.
          </Callout>
        )}

        <div className={styles.grid}>
          <Select
            label="Bloque del temario"
            value={bloque}
            onChange={(event) => setBloque(event.target.value)}
            options={BLOCK_OPTIONS}
            disabled={generate.isPending}
            hint={
              disponibilidad
                ? `${disponibilidad.disponibles} preguntas disponibles`
                : 'Los cuatro bloques oficiales del temario TAI'
            }
          />

          <Select
            label="Número de preguntas"
            value={String(cantidad)}
            onChange={(event) => setCantidad(Number(event.target.value))}
            options={QUESTION_COUNTS.map((count) => ({
              value: String(count),
              label: `${count} preguntas`,
            }))}
            disabled={generate.isPending}
            hint={
              mode === 'exam'
                ? `Tiempo asignado: ${formatDuration(cantidad * SECONDS_PER_QUESTION)}`
                : 'Sin límite de tiempo en modo estudio'
            }
          />
        </div>

        <fieldset className={styles.fieldset}>
          {/* A real fieldset and legend: the two options are one choice, and a screen
              reader has to hear the question before the answers. */}
          <legend className={styles.legend}>Modalidad de la prueba</legend>

          <div className={styles.modes}>
            <ModeOption
              value="study"
              current={mode}
              onSelect={setMode}
              disabled={generate.isPending}
              title="Modo estudio"
              hint="Corrección inmediata tras cada respuesta, con el fundamento de la solución. Sin reloj."
            />
            <ModeOption
              value="exam"
              current={mode}
              onSelect={setMode}
              disabled={generate.isPending}
              title="Modo examen oficial"
              hint="Condiciones INAP: cuenta atrás, soluciones ocultas y baremo +1,00 / −0,33."
            />
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Button
            type="submit"
            isLoading={generate.isPending}
            icon={<Play size={16} aria-hidden="true" />}
          >
            {generate.isPending ? 'Generando…' : 'Comenzar simulacro'}
          </Button>

          <span className={styles.availability}>
            {mode === 'exam'
              ? `${cantidad} preguntas · ${formatDuration(cantidad * SECONDS_PER_QUESTION)}`
              : `${cantidad} preguntas · sin límite`}
          </span>
        </div>
      </form>
    </Card>
  );
}

interface ModeOptionProps {
  value: StudyMode;
  current: StudyMode;
  onSelect: (mode: StudyMode) => void;
  disabled: boolean;
  title: string;
  hint: string;
}

function ModeOption({ value, current, onSelect, disabled, title, hint }: ModeOptionProps) {
  const isSelected = current === value;

  return (
    <label className={`${styles.mode} ${isSelected ? styles.modeSelected : ''}`}>
      <input
        type="radio"
        name="studyMode"
        value={value}
        checked={isSelected}
        onChange={() => onSelect(value)}
        disabled={disabled}
      />
      <span className={styles.modeText}>
        <span className={styles.modeTitle}>{title}</span>
        <span className={styles.modeHint}>{hint}</span>
      </span>
    </label>
  );
}
