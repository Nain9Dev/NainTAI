import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

/**
 * Ports and hostname are pinned so this project cannot collide with another one
 * running at the same time. See PORTS.md at the Personal-Projects root for the
 * allocation table.
 *
 * The hostname matters more than the port. Browser storage is scoped per origin, so
 * two projects both served from localhost:5173 share one localStorage bucket and can
 * overwrite each other's keys. Every *.localhost name resolves to 127.0.0.1 with no
 * hosts-file entry (RFC 6761) and is a distinct origin, so tai.localhost gets storage
 * that nothing else can reach.
 */
const HOST = 'tai.localhost'
const DEV_PORT = 5290
const PREVIEW_PORT = 5291

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    port: DEV_PORT,
    // Fail instead of drifting to the next free port. Silently landing on 5291 is how
    // you end up debugging one project while looking at another.
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: [HOST],
    open: `http://${HOST}:${DEV_PORT}/`,
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: [HOST],
  },
})
