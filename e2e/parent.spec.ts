import { expect, test } from '@playwright/test'
import { STORAGE_KEY, go, hold } from './helpers.ts'

test('parent gate, settings, and confirmed reset', async ({ page }) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('bunny-seeded') === '1') return
    sessionStorage.setItem('bunny-seeded', '1')
    localStorage.setItem(
      key,
      JSON.stringify({
        stars: 4,
        heard: ['animals-cat'],
        listenCorrect: 2,
        settings: { sound: true, reminderMinutes: 15, wordMatchOptIn: false },
        sessionStartedAt: Date.now(),
        reminderDismissedFor: null,
      }),
    )
  }, STORAGE_KEY)

  await go(page, '#/parent')
  await expect(page.getByRole('heading', { level: 1, name: '请家长按住' })).toBeVisible()
  await expect(page.getByTestId('reset-open')).toHaveCount(0)
  await hold(page, 'parent-gate')
  await expect(page.getByRole('heading', { level: 1, name: '家长区' })).toBeVisible()
  await expect(page.getByTestId('word-match-disclosure')).toContainText('不是发音评分')
  await expect(page.getByTestId('word-match-disclosure')).toContainText('服务器')
  await expect(page.getByTestId('star-count')).toHaveText('4')

  await page.getByTestId('sound-switch').click()
  await expect(page.getByTestId('sound-switch')).toHaveAttribute('aria-checked', 'false')
  await page.getByTestId('reminder-20').click()
  await expect(page.getByTestId('reminder-20')).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('word-match-switch').click()
  await expect(page.getByTestId('word-match-switch')).toHaveAttribute('aria-checked', 'true')

  await page.getByTestId('reset-open').click()
  await expect(page.getByTestId('reset-dialog')).toBeVisible()
  await page.getByTestId('reset-cancel').click()
  await expect(page.getByTestId('star-count')).toHaveText('4')

  await page.getByTestId('reset-open').click()
  await page.getByTestId('reset-confirm').click()
  await expect(page.getByTestId('star-count')).toHaveText('0')
  await expect(page.getByTestId('sound-switch')).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('reminder-20')).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('word-match-switch')).toHaveAttribute('aria-checked', 'true')
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const data = JSON.parse(raw) as { stars?: number; settings?: { sound?: boolean; reminderMinutes?: number; wordMatchOptIn?: boolean } }
    return data.stars === 0 && data.settings?.sound === false && data.settings.reminderMinutes === 20 && data.settings.wordMatchOptIn === true
  }, STORAGE_KEY)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: '家长区' })).toBeVisible()
  await expect(page.getByTestId('star-count')).toHaveText('0')
  await expect(page.getByTestId('sound-switch')).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('word-match-switch')).toHaveAttribute('aria-checked', 'true')
})

test('home hold opens the parent area', async ({ page }) => {
  await go(page, '#/')
  await hold(page, 'parent-hold')
  await expect(page.getByRole('heading', { level: 1, name: '家长区' })).toBeVisible()
})

test('rest reminder can be dismissed', async ({ page }) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('bunny-seeded') === '1') return
    sessionStorage.setItem('bunny-seeded', '1')
    localStorage.setItem(
      key,
      JSON.stringify({
        settings: { sound: true, reminderMinutes: 10, wordMatchOptIn: false },
        sessionStartedAt: Date.now() - 11 * 60 * 1000,
        reminderDismissedFor: null,
      }),
    )
  }, STORAGE_KEY)
  await go(page, '#/')
  await expect(page.getByTestId('reminder-dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: '眼睛休息一下吧' })).toBeVisible()
  await page.getByRole('button', { name: '再玩一会儿' }).click()
  await expect(page.getByTestId('reminder-dialog')).toHaveCount(0)
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const data = JSON.parse(raw) as { sessionStartedAt?: number; reminderDismissedFor?: number | null }
    return data.reminderDismissedFor != null && data.reminderDismissedFor === data.sessionStartedAt
  }, STORAGE_KEY)
  await page.reload()
  await expect(page.getByTestId('home')).toBeVisible()
  await expect(page.getByTestId('reminder-dialog')).toHaveCount(0)
})
