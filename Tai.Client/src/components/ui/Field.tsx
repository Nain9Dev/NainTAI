import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (ids: { controlId: string; describedBy: string | undefined }) => ReactNode;
}

/**
 * Wraps a control with its label, hint and error, wiring the accessibility attributes.
 *
 * `useId` is what makes `htmlFor` reliable here: the previous `Select` took an optional
 * `id` prop and pointed `htmlFor` at it, so every call site that omitted it produced a
 * label associated with nothing — invisible in the interface, fatal with a screen reader.
 */
function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>

      {children({ controlId, describedBy })}

      {hint && !error && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}

      {error && (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, hint, error, options, className = '', ...props }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ controlId, describedBy }) => (
        <select
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[styles.select, error ? styles.invalid : '', className].filter(Boolean).join(' ')}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export function TextField({ label, hint, error, className = '', ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ controlId, describedBy }) => (
        <input
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[error ? styles.invalid : '', className].filter(Boolean).join(' ')}
          {...props}
        />
      )}
    </FieldShell>
  );
}
