import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Metric } from '../components/ui/Metric';
import { useAuthStore } from '../store/useAuthStore';
import { useEstadisticas } from '../hooks/useProgress';
import { useConnectionStore } from '../store/useConnectionStore';

export const Route = createFileRoute('/perfil')({
  component: Perfil,
});

function Perfil() {
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const logout = useAuthStore((state) => state.logout);
  const pendingWrites = useConnectionStore((state) => state.pendingWrites);
  const { estadisticas } = useEstadisticas();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await logout();
      // Router navigation rather than window.location: a full reload would throw away the
      // application state and re-download the bundle for no reason.
      await navigate({ to: '/login' });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isGuest) {
    return (
      <div className="stack">
        <Card
          eyebrow="Perfil"
          title="Estás en modo invitado"
          subtitle="Tu progreso vive solo en este navegador."
        >
          <Callout tone="info" title="Crea una cuenta para no perder tu trabajo">
            Los simulacros que completes ahora se guardan en este dispositivo. Si borras los
            datos del navegador o cambias de equipo, desaparecen.
          </Callout>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link to="/register">
              <Button>Crear una cuenta</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">Ya tengo cuenta</Button>
            </Link>
          </div>
        </Card>

        {estadisticas.totalIntentos > 0 && (
          <Card eyebrow="Local" title="Progreso en este dispositivo">
            <div className="metric-grid">
              <Metric label="Simulacros" value={estadisticas.totalIntentos} />
              <Metric
                label="Nota media"
                value={estadisticas.notaMedia.toFixed(2).replace('.', ',')}
                unit="/ 10"
                tone="accent"
              />
              <Metric
                label="Tasa de acierto"
                value={estadisticas.tasaAcierto.toFixed(0)}
                unit="%"
              />
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      <Card
        eyebrow="Perfil"
        title={user?.nombre ?? 'Mi cuenta'}
        subtitle={user?.email}
        actions={
          <Button
            variant="danger"
            size="small"
            icon={<LogOut size={15} aria-hidden="true" />}
            isLoading={isSigningOut}
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        }
      >
        {pendingWrites > 0 && (
          <Callout tone="warning" title="Tienes cambios sin enviar">
            {pendingWrites} {pendingWrites === 1 ? 'simulacro está' : 'simulacros están'} pendientes
            de sincronizar. Si cierras sesión ahora, se enviarán la próxima vez que entres desde
            este dispositivo.
          </Callout>
        )}

        <div className="metric-grid" style={{ marginTop: pendingWrites > 0 ? '1.5rem' : 0 }}>
          <Metric label="Simulacros" value={estadisticas.totalIntentos} />
          <Metric
            label="Nota media"
            value={estadisticas.notaMedia.toFixed(2).replace('.', ',')}
            unit="/ 10"
            tone={estadisticas.notaMedia >= 5 ? 'success' : 'danger'}
          />
          <Metric label="Preguntas respondidas" value={estadisticas.totalPreguntas} />
          <Metric label="Plan" value={user?.rol === 'Admin' ? 'Administración' : 'Estudiante'} />
        </div>
      </Card>
    </div>
  );
}
