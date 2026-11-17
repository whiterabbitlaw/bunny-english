import { defineConfig } from '@playwright/test'

const origin = 'http://127.0.0.1:43124'

export default defineConfig({
  testDir: 'e2e-pages',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: origin,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'zh-CN',
    launchOptions: {
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    },
  },
  webServer: {
    command: 'npm run build:pages && npm run preview:pages',
    url: `${origin}/bunny-english/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
