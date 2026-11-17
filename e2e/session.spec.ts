import { expect, test } from '@playwright/test'
import { choose, go, targetId } from './helpers.ts'

test('a short themed session can be finished without a timer', async ({ page }) => {
  await go(page, '#/session/colors')
  await expect(page.getByRole('heading', { level: 1, name: '小课堂' })).toBeVisible()
  await expect(page.getByText('没有计时')).toBeVisible()

  for (let step = 0; step < 3; step += 1) {
    await page.getByTestId('session-next').click()
  }

  for (let step = 0; step < 2; step += 1) {
    const target = await targetId(page)
    await choose(page, target)
    await expect(page.getByTestId('feedback')).toHaveAttribute('data-state', 'correct')
    await page.getByTestId('session-quiz-next').click()
  }

  await expect(page.getByTestId('session-done')).toBeVisible()
  await expect(page.getByTestId('session-done')).toContainText('听对了 2 题')
  await expect(page.getByTestId('star-count')).toHaveText('2')
})
