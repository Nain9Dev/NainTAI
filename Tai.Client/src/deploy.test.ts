import { describe, expect, it } from 'vitest';
import raw from '../vercel.json?raw';

/**
 * REQ-074: every route of the application opens when typed or reloaded.
 *
 * The client routes in the browser. Without a rewrite the host looks for a file named after the
 * path and answers 404, so `/login`, `/analytics` and any shared link failed on a direct load
 * while `/` worked and the in-app navigation hid the problem. Production did exactly that.
 */
const config = JSON.parse(raw) as {
  rewrites?: Array<{ source: string; destination: string }>;
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

describe('Vercel configuration', () => {
  it('serves the application for any path that is not a file', () => {
    expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' });
  });

  it('caches fingerprinted assets for a year, because their name changes when they do', () => {
    const rule = config.headers?.find((entry) => entry.source === '/assets/(.*)');
    const cache = rule?.headers.find((header) => header.key === 'Cache-Control')?.value ?? '';

    expect(cache).toContain('max-age=31536000');
    expect(cache).toContain('immutable');
  });

  it('does not cache the document itself as immutable', () => {
    const documentRule = config.headers?.find((entry) => entry.source === '/(.*)');
    const cache = documentRule?.headers.find((header) => header.key === 'Cache-Control')?.value ?? '';

    expect(cache).not.toContain('immutable');
  });
});
