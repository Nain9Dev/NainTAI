import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Callout } from '../components/ui/Callout';
import { useAuthStore } from '../store/useAuthStore';
import styles from './Auth.module.css';

/** Mirrors the server's rule: at least 8 characters, with a letter and a digit. */
const MIN_PASSWORD_LENGTH = 8;

export const Route = createFileRoute('/register')({
  component: Register,
});

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validating here mirrors the server so the candidate is not told about a typo only
    // after a round trip. The server still enforces the same rules.
    const errors = validate({ nombre, password, confirmPassword });
    setFieldErrors(errors);
    setError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(nombre, email, password);
      await navigate({ to: '/' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <Card
          eyebrow="Registro"
          title="Crea tu cuenta"
          subtitle="Guarda tu progreso y consúltalo desde cualquier dispositivo."
        >
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <Callout tone="danger" live="assertive">
                {error}
              </Callout>
            )}

            <TextField
              label="Nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              error={fieldErrors.nombre}
              required
            />

            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres, con al menos una letra y un número.`}
              error={fieldErrors.password}
              required
            />

            <TextField
              label="Repite la contraseña"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              required
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>

          <div className={styles.footer}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function validate({
  nombre,
  password,
  confirmPassword,
}: {
  nombre: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (nombre.trim().length < 3) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'La contraseña debe combinar letras y números.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}
