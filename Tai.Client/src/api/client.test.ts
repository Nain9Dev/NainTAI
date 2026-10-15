import { describe, expect, it } from 'vitest';
import { shouldDegradeToStatic } from './client';

/**
 * Which server responses mean "fall back to the bundled catalogue".
 *
 * This policy was written after a deployed API that predated the `/api/preguntas`
 * endpoints answered 404 to every read. The client treated that as a hard error and showed
 * nothing, when the whole point of shipping an offline catalogue is that it should have
 * carried on.
 */
describe('shouldDegradeToStatic', () => {
  it.each([500, 502, 503, 504])('degrades on %i: the API cannot serve the request', (status) => {
    expect(shouldDegradeToStatic(status)).toBe(true);
  });

  it('degrades on 404, which means the deployed API is older than this client', () => {
    expect(shouldDegradeToStatic(404)).toBe(true);
  });

  it.each([408, 429])('degrades on %i rather than leaving the candidate waiting', (status) => {
    expect(shouldDegradeToStatic(status)).toBe(true);
  });

  it.each([
    [400, 'the request itself is wrong'],
    [401, 'the session expired and the candidate has to know'],
    [403, 'a CSRF or permission problem worth surfacing'],
    [409, 'a real conflict with server state'],
  ])('does not degrade on %i, because %s', (status) => {
    // Hiding these behind the catalogue would turn "your session expired" into
    // "here are some questions", which is worse than the error.
    expect(shouldDegradeToStatic(status)).toBe(false);
  });

  it('does not degrade on a success', () => {
    expect(shouldDegradeToStatic(200)).toBe(false);
    expect(shouldDegradeToStatic(201)).toBe(false);
  });
});
