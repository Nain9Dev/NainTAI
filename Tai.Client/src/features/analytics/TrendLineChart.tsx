import { useId } from 'react';
import { areaPath, linePoints, smoothPath } from '../../utils/chart';
import type { TendenciaPunto } from '../../types/domain';
import styles from './TrendLineChart.module.css';

const BOX = { width: 640, height: 240, paddingX: 34, paddingY: 26 };
const RANGE = { min: 0, max: 10 };
const GRID_LINES = [0, 2.5, 5, 7.5, 10];

interface TrendLineChartProps {
  points: TendenciaPunto[];
  /** Grade at which an exam is passed; drawn as a reference line. */
  passMark: number;
}

/**
 * The grade of the last exams as a smooth line, with the pass mark as a dashed reference.
 *
 * A line rather than bars because the question here is direction ("am I improving?"), which a
 * line answers at a glance. Each point also carries its value as a label and passed or failed
 * as a shape (filled or hollow), so the reading never rests on colour alone (REQ-052).
 */
export function TrendLineChart({ points, passMark }: TrendLineChartProps) {
  const gradientId = useId();
  const coordinates = linePoints(
    points.map((point) => point.nota),
    BOX,
    RANGE,
  );
  const passY = linePoints([passMark], BOX, RANGE)[0].y;
  const baseline = BOX.height - BOX.paddingY;
  const last = coordinates[coordinates.length - 1];

  return (
    <div className={styles.wrapper}>
      <svg className={styles.chart} viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={describe(points, passMark)}>
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={styles.areaTop} />
            <stop offset="100%" className={styles.areaBottom} />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" className={styles.lineFrom} />
            <stop offset="100%" className={styles.lineTo} />
          </linearGradient>
        </defs>

        {GRID_LINES.map((value) => {
          const y = linePoints([value], BOX, RANGE)[0].y;

          return (
            <g key={value}>
              <line className={styles.grid} x1={BOX.paddingX} x2={BOX.width - BOX.paddingX / 2} y1={y} y2={y} />
              <text className={styles.tick} x={BOX.paddingX - 8} y={y + 4} textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}

        <line className={styles.pass} x1={BOX.paddingX} x2={BOX.width - BOX.paddingX / 2} y1={passY} y2={passY} />

        <path className={styles.area} d={areaPath(coordinates, baseline)} fill={`url(#${gradientId}-area)`} />
        <path
          className={styles.line}
          d={smoothPath(coordinates)}
          stroke={`url(#${gradientId}-line)`}
          pathLength={1}
        />

        {coordinates.map((point, index) => {
          const passed = points[index].nota >= passMark;

          return (
            <circle
              key={`${points[index].fecha}-${index}`}
              className={passed ? styles.dotPass : styles.dotFail}
              cx={point.x}
              cy={point.y}
              r={index === coordinates.length - 1 ? 6 : 4.5}
            />
          );
        })}

        {last && (
          <text className={styles.lastValue} x={last.x} y={last.y - 14} textAnchor="end">
            {points[points.length - 1].nota.toFixed(2).replace('.', ',')}
          </text>
        )}
      </svg>

      <ul className={styles.legend} aria-hidden="true">
        <li>
          <i className={styles.keyPass} /> Aprobado
        </li>
        <li>
          <i className={styles.keyFail} /> Por debajo del aprobado
        </li>
        <li>
          <i className={styles.keyLine} /> Nota de aprobado: {String(passMark).replace('.', ',')}
        </li>
      </ul>
    </div>
  );
}

/** The chart is a picture to a screen reader; this sentence carries the information. */
function describe(points: TendenciaPunto[], passMark: number): string {
  const grades = points.map((point) => point.nota.toFixed(2).replace('.', ',')).join(', ');
  const passed = points.filter((point) => point.nota >= passMark).length;

  return `Evolución de la nota en los últimos ${points.length} simulacros: ${grades}. ${passed} de ${points.length} por encima del aprobado, que es ${passMark}.`;
}
