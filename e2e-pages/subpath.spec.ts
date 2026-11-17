import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { choose, chooseOther, targetId } from '../e2e/helpers.ts'

const BASE = '/bunny-english'
const artifacts = '/opt/cursor/artifacts'

test.beforeAll(() => {
  mkdirSync(artifacts, { recursive: true })
})

test('production assets resolve under /bunny-english/ and not the host root', async ({ request }) => {
  for (const path of ['/favicon.svg', '/manifest.webmanifest', '/sw.js', '/icons/icon-192.png', '/icons/icon-512.png']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(404)
  }

  const pageResponse = await request.get(`${BASE}/`)
  expect(pageResponse.ok()).toBe(true)
  const html = await pageResponse.text()
  const assets = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1] ?? '')
    .filter((url) => url.startsWith('/'))
  expect(assets.length).toBeGreaterThan(0)
  for (const url of assets) {
    expect(url.startsWith(`${BASE}/`), url).toBe(true)
    const response = await request.get(url)
    expect(response.ok(), url).toBe(true)
  }

  const manifestResponse = await request.get(`${BASE}/manifest.webmanifest`)
  expect(manifestResponse.ok()).toBe(true)
  const manifest = (await manifestResponse.json()) as { start_url: string; scope: string; icons: Array<{ src: string }> }
  expect(manifest.start_url).toBe(`${BASE}/`)
  expect(manifest.scope).toBe(`${BASE}/`)
  for (const icon of manifest.icons) {
    expect(icon.src.startsWith(`${BASE}/`), icon.src).toBe(true)
    const iconResponse = await request.get(icon.src)
    expect(iconResponse.ok(), icon.src).toBe(true)
  }

  const worker = await request.get(`${BASE}/sw.js`)
  expect(worker.ok()).toBe(true)
  const source = await worker.text()
  expect(source).toContain('self.location')
  expect(source).not.toMatch(/['"]\/(?:assets|icons|favicon\.svg|manifest\.webmanifest)/)
})

test('navigation and games render on the Pages subpath', async ({ page }) => {
  await page.goto(`${BASE}/#/`)
  await expect(page.getByRole('heading', { level: 1, name: '今天想和兔兔学什么？' })).toBeVisible()
  await expect(page.getByTestId('preview-banner')).toHaveCount(0)
  await page.screenshot({ path: `${artifacts}/pages_home.png`, fullPage: true })

  await expect
    .poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope ?? ''))
    .toBe(`http://127.0.0.1:43124${BASE}/`)

  const scriptURL = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    const worker = registration?.active ?? registration?.installing ?? registration?.waiting
    return worker?.scriptURL ?? ''
  })
  expect(scriptURL).toContain(`${BASE}/sw.js`)

  await page.goto(`${BASE}/#/world/animals`)
  await expect(page.getByRole('heading', { level: 1, name: '动物世界' })).toBeVisible()

  await page.goto(`${BASE}/#/learn/animals`)
  await expect(page.getByRole('heading', { level: 1, name: '学一学' })).toBeVisible()
  await expect(page.locator('[lang="en"]').filter({ hasText: /^cat$/ })).toBeVisible()
  await page.screenshot({ path: `${artifacts}/pages_learn.png`, fullPage: true })

  await page.goto(`${BASE}/#/listen/fruits`)
  await expect(page.getByRole('heading', { level: 1, name: '听一听' })).toBeVisible()
  const target = await targetId(page)
  await chooseOther(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'retry')
  await choose(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'correct')
  await page.screenshot({ path: `${artifacts}/pages_listen.png`, fullPage: true })

  await page.goto(`${BASE}/#/match/animals`)
  await expect(page.getByRole('heading', { level: 1, name: '配一配' })).toBeVisible()
  const picture = page.locator('[data-testid="match-picture"]').first()
  const id = await picture.getAttribute('data-word-id')
  if (!id) throw new Error('missing picture')
  await page.locator(`[data-testid="match-sound"][data-word-id="${id}"]`).click()
  await picture.click()
  await expect(picture).toHaveAttribute('data-matched', 'true')
  await page.screenshot({ path: `${artifacts}/pages_match.png`, fullPage: true })

  await page.goto(`${BASE}/#/speak/colors`)
  await expect(page.getByRole('heading', { level: 1, name: '读一读' })).toBeVisible()

  await page.goto(`${BASE}/#/session/numbers`)
  await expect(page.getByRole('heading', { level: 1, name: '小课堂' })).toBeVisible()

  await page.reload()
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const paths: string[] = []
        for (const key of await caches.keys()) {
          const cache = await caches.open(key)
          for (const request of await cache.keys()) paths.push(new URL(request.url).pathname)
        }
        return paths
      }),
    )
    .not.toEqual([])

  const cached = await page.evaluate(async () => {
    const paths: string[] = []
    for (const key of await caches.keys()) {
      const cache = await caches.open(key)
      for (const request of await cache.keys()) paths.push(new URL(request.url).pathname)
    }
    return paths
  })
  expect(cached.length).toBeGreaterThan(0)
  for (const path of cached) expect(path.startsWith(`${BASE}/`), path).toBe(true)
})
