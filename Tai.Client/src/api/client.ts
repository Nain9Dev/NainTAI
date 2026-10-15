import { offlineQueue } from './offlineQueue';
import { useCsrfStore } from '../store/useCsrfStore';
import { setConnectionMode } from '../store/useConnectionStore';

/** Shape of an RFC 9457 ProblemDetails response, which the API returns for every error. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  /** Correlation identifier echoed by the API, for matching against server logs. */
  readonly correlationId?: string;

  constructor(status: number, message: string, correlationId?: string) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
    this.name = 'ApiError';
  }
}

/** Raised when a write could not be sent and was parked in the offline queue instead. */
export class QueuedOfflineError extends Error {
  constructor() {
    super('Sin conexión. El cambio se ha guardado y se enviará automáticamente.');
    this.name = 'QueuedOfflineError';
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Statuses on which a read falls back to the bundled catalogue.
 *
 * A 404 means the deployed API does not know this endpoint — version skew between the
 * client and the server, which is exactly when degrading is most valuable. A 5xx means it
 * knows the endpoint and cannot serve it. In both cases stale content beats a blank page.
 *
 * Deliberately excluded: 400, 401, 403 and 409. Those are answers, not failures, and
 * hiding them behind the offline catalogue would turn "your session expired" into
 * "here are some questions from 2026".
 */
const DEGRADABLE_STATUSES = new Set([404, 408, 429]);

export function shouldDegradeToStatic(status: number): boolean {
  return status >= 500 || DEGRADABLE_STATUSES.has(status);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** File under `public/data` to fall back to when the API is unreachable. */
  staticFallback?: string;
  /** Park the request in the offline queue instead of failing. Writes only. */
  queueWhenOffline?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

class ApiClient {
  private readonly baseUrl: string;
  private readonly staticBaseUrl: string;

  /**
   * In-flight refresh, shared by every caller.
   *
   * Without this, a page that fires five queries at once and receives five 401s would
   * start five rotations. Since each rotation revokes the previous refresh token, four of
   * them would be treated as replay and the API would revoke every session of the user —
   * turning an expired token into a forced logout.
   */
  private refreshInFlight: Promise<boolean> | null = null;

  constructor() {
    const raw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5298/api';
    const trimmed = raw.replace(/\/+$/, '');
    this.baseUrl = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    this.staticBaseUrl = `${import.meta.env.BASE_URL}data`;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.syncOfflineQueue();
      });
      window.addEventListener('offline', () => setConnectionMode('offline'));
    }
  }

  async get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();

    try {
      const response = await this.send(path, method, options);

      // A 401 on an authenticated call usually just means the access token aged out.
      // Rotate once and replay before giving up on the session.
      if (response.status === 401 && !this.isAuthPath(path)) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          const retried = await this.send(path, method, options);
          return await this.readBody<T>(retried, path);
        }

        notifyUnauthorized();
      }

      // The API answered, but with something it cannot serve. For a read with a bundled
      // catalogue behind it, that is still a reason to degrade rather than to break: a
      // deployed API missing an endpoint the client knows about would otherwise leave the
      // candidate looking at an error instead of practising.
      if (!response.ok && method === 'GET' && options.staticFallback && shouldDegradeToStatic(response.status)) {
        console.warn(
          `[api] GET ${path} respondió ${response.status}. Se usa el catálogo local.`,
        );
        setConnectionMode('offline');
        return this.readStatic<T>(options.staticFallback);
      }

      return await this.readBody<T>(response, path);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network failure or timeout, as opposed to a response the server chose to send.
      setConnectionMode('offline');

      if (method === 'GET' && options.staticFallback) {
        return this.readStatic<T>(options.staticFallback);
      }

      if (options.queueWhenOffline && MUTATING_METHODS.has(method)) {
        await offlineQueue.enqueue(path, method, options.body);
        throw new QueuedOfflineError();
      }

      throw error;
    }
  }

  private async send(path: string, method: string, options: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (MUTATING_METHODS.has(method)) {
      const csrfToken = useCsrfStore.getState().token;
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    // Honour a caller-supplied signal (TanStack Query cancels queries on unmount) as well
    // as the local timeout.
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        // Sends the HttpOnly session cookies. The JWT is never readable from JavaScript.
        credentials: 'include',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async readBody<T>(response: Response, path: string): Promise<T> {
    if (!response.ok) {
      throw await this.toApiError(response);
    }

    setConnectionMode('online');

    // A successful write is a good moment to flush anything parked while offline.
    if (this.pendingSyncCandidate(path)) {
      void this.syncOfflineQueue();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async toApiError(response: Response): Promise<ApiError> {
    const correlationId = response.headers.get('X-Correlation-Id') ?? undefined;

    let problem: ProblemDetails | null = null;
    try {
      const text = await response.text();
      problem = text ? (JSON.parse(text) as ProblemDetails) : null;
    } catch {
      // A non-JSON error body (a proxy's HTML page, say) still deserves a usable message.
      problem = null;
    }

    // Prefer the server's own wording: it is written for the end user and already in Spanish.
    const message =
      problem?.detail ??
      problem?.title ??
      (typeof (problem as { message?: string } | null)?.message === 'string'
        ? (problem as { message: string }).message
        : null) ??
      defaultMessageFor(response.status);

    if (response.status === 403) {
      // A rejected CSRF token is stale. Dropping it forces a fresh one on the next login.
      useCsrfStore.getState().clearToken();
    }

    return new ApiError(response.status, message, problem?.correlationId ?? correlationId);
  }

  /** Rotates the session. Concurrent callers share one request. */
  private refreshSession(): Promise<boolean> {
    this.refreshInFlight ??= (async () => {
      try {
        const response = await this.send('/auth/refresh', 'POST', { body: {} });
        if (!response.ok) {
          return false;
        }

        const payload = (await response.json()) as { csrfToken?: string };
        if (payload.csrfToken) {
          // Rotation issues a new CSRF token bound to the new session; the old one is dead.
          useCsrfStore.getState().setToken(payload.csrfToken);
        }

        return true;
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  async syncOfflineQueue(): Promise<void> {
    await offlineQueue.drain(async (request) => {
      const response = await this.send(request.path, request.method, { body: request.body });

      if (response.ok) {
        return 'sent';
      }

      // 4xx means the request itself is bad; replaying it will never succeed.
      if (response.status >= 400 && response.status < 500) {
        if (response.status === 401 || response.status === 403) {
          useCsrfStore.getState().clearToken();
          notifyUnauthorized();
        }
        return 'discard';
      }

      return 'retry-later';
    });
  }

  private async readStatic<T>(fileName: string): Promise<T> {
    const response = await fetch(`${this.staticBaseUrl}/${fileName}`);
    if (!response.ok) {
      throw new ApiError(response.status, `No se pudo cargar el catálogo local (${fileName}).`);
    }
    return (await response.json()) as T;
  }

  private isAuthPath(path: string): boolean {
    return path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/refresh');
  }

  private pendingSyncCandidate(path: string): boolean {
    return !this.isAuthPath(path);
  }
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'La petición no es válida.';
    case 401:
      return 'Sesión expirada. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes permiso para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'La operación entra en conflicto con el estado actual.';
    case 429:
      return 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.';
    default:
      return status >= 500 ? 'Error interno del servidor.' : `Error HTTP ${status}.`;
  }
}

/** Signals that the session is gone, so the auth store can clear itself. */
function notifyUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
}

export const apiClient = new ApiClient();
