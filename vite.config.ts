import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

function normalizeBase(value: string | undefined): string {
  const raw = (value ?? '').trim()
  if (!raw || raw === '/') return '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

function withBase(base: string, url: string): string {
  if (!url.startsWith('/')) return url
  if (base === '/') return url
  if (url === base || url.startsWith(base)) return url
  return `${base}${url.slice(1)}`
}

/** Rewrite the copied manifest so start_url, scope, and icons follow Vite's base. */
function manifestBasePlugin(): Plugin {
  return {
    name: 'bunny-manifest-base',
    apply: 'build',
    closeBundle() {
      const base = normalizeBase(this.environment.config.base)
      const file = resolve('dist/manifest.webmanifest')
      const manifest = JSON.parse(readFileSync(file, 'utf8')) as {
        start_url?: string
        scope?: string
        icons?: Array<{ src?: string }>
      }
      manifest.start_url = base
      manifest.scope = base
      if (Array.isArray(manifest.icons)) {
        for (const icon of manifest.icons) {
          if (typeof icon.src === 'string') icon.src = withBase(base, icon.src)
        }
      }
      writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

// APP_BASE=/bunny-english/ for GitHub Pages. Leave unset for a root host (local preview, Cloudflare).
const base = normalizeBase(process.env.APP_BASE)

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), manifestBasePlugin()],
  server: {
    host: '127.0.0.1',
    port: 43123,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 43123,
    strictPort: true,
  },
})
