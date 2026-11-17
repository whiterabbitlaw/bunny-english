import { expect, test } from '@playwright/test'
import { go } from './helpers.ts'

async function pictureOrder(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="match-picture"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-word-id')),
  )
}

test('matching records a miss, a hit, and reshuffles on reset', async ({ page }) => {
  await go(page, '#/match/animals')
  await expect(page.getByRole('heading', { level: 1, name: '配一配' })).toBeVisible()
  const before = await pictureOrder(page)
  const first = before[0]
  const second = before.find((id) => id && id !== first)
  if (!first || !second) throw new Error('board too small')

  await page.locator(`[data-testid="match-sound"][data-word-id="${first}"]`).click()
  await page.locator(`[data-testid="match-picture"][data-word-id="${second}"]`).click()
  await expect(page.getByTestId('match-feedback')).toHaveAttribute('data-state', 'retry')
  await expect(page.getByTestId('match-feedback')).toContainText('不是这一对')
  await expect(page.getByTestId('star-count')).toHaveText('0')

  await page.locator(`[data-testid="match-sound"][data-word-id="${first}"]`).click()
  await page.locator(`[data-testid="match-picture"][data-word-id="${first}"]`).click()
  await expect(page.locator(`[data-testid="match-picture"][data-word-id="${first}"]`)).toHaveAttribute('data-matched', 'true')
  await expect(page.getByTestId('star-count')).toHaveText('1')

  await page.getByTestId('match-reset').click()
  await expect(page.locator('[data-testid="match-picture"][data-matched="true"]')).toHaveCount(0)
  await expect(page.getByTestId('match-feedback')).toHaveAttribute('data-state', 'idle')
  const after = await pictureOrder(page)
  expect(after.join('|')).not.toBe(before.join('|'))
})
