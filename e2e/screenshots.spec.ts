import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { choose, chooseOther, go, hold, targetId } from './helpers.ts'

const dir = '/opt/cursor/artifacts'

test.beforeAll(() => {
  mkdirSync(dir, { recursive: true })
})

test('capture representative screens', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await page.setViewportSize({ width: 390, height: 844 })
  await go(page, '#/')
  await expect(page.getByTestId('home')).toBeVisible()
  await page.screenshot({ path: `${dir}/home-phone.png`, fullPage: true })

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.screenshot({ path: `${dir}/home-desktop.png`, fullPage: true })

  await page.setViewportSize({ width: 844, height: 390 })
  await page.screenshot({ path: `${dir}/home-landscape.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await go(page, '#/learn/animals')
  await expect(page.locator('[lang="en"]').filter({ hasText: /^cat$/ })).toBeVisible()
  await page.screenshot({ path: `${dir}/learn-animals.png`, fullPage: true })

  await go(page, '#/learn/fruits')
  await page.getByTestId('learn-next').click()
  await expect(page.locator('[lang="en"]').filter({ hasText: /^banana$/ })).toBeVisible()
  await page.screenshot({ path: `${dir}/learn-banana.png`, fullPage: true })

  await go(page, '#/listen/fruits')
  const target = await targetId(page)
  await chooseOther(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'retry')
  await page.screenshot({ path: `${dir}/listen-retry.png`, fullPage: true })
  await choose(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'correct')
  await page.screenshot({ path: `${dir}/listen-correct.png`, fullPage: true })

  await go(page, '#/match/animals')
  const picture = page.locator('[data-testid="match-picture"]').first()
  const id = await picture.getAttribute('data-word-id')
  if (!id) throw new Error('missing picture')
  await page.locator(`[data-testid="match-sound"][data-word-id="${id}"]`).click()
  await picture.click()
  await expect(picture).toHaveAttribute('data-matched', 'true')
  await page.screenshot({ path: `${dir}/match.png`, fullPage: true })

  await go(page, '#/speak/fruits')
  await page.screenshot({ path: `${dir}/speak.png`, fullPage: true })

  await go(page, '#/')
  await hold(page, 'parent-hold')
  await expect(page.getByRole('heading', { level: 1, name: '家长区' })).toBeVisible()
  await page.screenshot({ path: `${dir}/parent.png`, fullPage: true })
})

test('capture the no-voice fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      get() {
        return undefined
      },
    })
  })
  await go(page, '#/learn/colors')
  await expect(page.getByTestId('tts-status')).toContainText('浏览器不支持英语朗读')
  await page.screenshot({ path: `${dir}/tts-fallback.png`, fullPage: true })
})
