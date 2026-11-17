import { expect, test } from '@playwright/test'
import { STORAGE_KEY, choose, chooseOther, go, targetId } from './helpers.ts'

test('listen game marks a miss, then a star that survives reload', async ({ page }) => {
  await go(page, '#/listen/fruits')
  await expect(page.getByRole('heading', { level: 1, name: '听一听' })).toBeVisible()
  await expect(page.getByTestId('star-count')).toHaveText('0')

  const target = await targetId(page)
  await page.getByTestId('listen-play').click()
  await chooseOther(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'retry')
  await expect(page.getByTestId('feedback')).toContainText(/再试一次|再听一次|找找看/)
  await expect(page.getByTestId('star-count')).toHaveText('0')

  await choose(page, target)
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'correct')
  await expect(page.getByTestId('feedback')).toContainText('对啦')
  await expect(page.getByTestId('star-count')).toHaveText('1')
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key)
    return Boolean(raw && JSON.parse(raw).stars >= 1)
  }, STORAGE_KEY)

  await page.reload()
  await expect(page.getByTestId('star-count')).toHaveText('1')
})

test('sound off shows the printed word instead of pretending to speak', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        settings: { sound: false, reminderMinutes: 15, wordMatchOptIn: false },
      }),
    )
  }, STORAGE_KEY)
  await go(page, '#/listen/numbers')
  await expect(page.getByTestId('tts-fallback')).toContainText('声音已关闭')
  const target = await targetId(page)
  const english = target.split('-').at(-1) ?? ''
  await expect(page.locator('main [lang="en"]').first()).toHaveText(english)
})
