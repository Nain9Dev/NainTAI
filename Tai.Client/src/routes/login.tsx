import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Callout } from '../components/ui/Callout';
import { useAuthStore } from '../store/useAuthStore';
import styles from './Auth.module.css';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      await navigate({ to: '/' });
    } catch (caught) {
      // The API returns a single message for a wrong password and an unknown address, so
      // it cannot be used to find out which accounts exist. Surfacing it verbatim keeps it
      // that way.
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = async () => {
    continueAsGuest();
    await navigate({ to: '/' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <Card eyebrow="Acceso" title="Inicia sesión" subtitle="Recupera tu progreso y estadísticas.">
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <Callout tone="danger" live="assertive">
                {error}
              </Callout>
            )}

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
              autoComplete="current-password"
              required
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {isSubmitting ? 'Comprobando…' : 'Entrar'}
            </Button>
          </form>

          <div className={styles.footer}>
            ¿Todavía no tienes cuenta? <Link to="/register">Regístrate</Link>
            <br />
            O{' '}
            <button type="button" className={styles.linkButton} onClick={handleGuest}>
              continúa como invitado
            </button>{' '}
            — tu progreso se guardará solo en este navegador.
          </div>
        </Card>
      </div>
    </div>
  );
}
