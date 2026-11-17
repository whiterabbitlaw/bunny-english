import { expect, test } from '@playwright/test'
import { go } from './helpers.ts'

const worlds = [
  ['animals', '动物世界'],
  ['colors', '颜色世界'],
  ['fruits', '水果世界'],
  ['numbers', '数字世界'],
] as const

const activities = [
  ['learn', '学一学'],
  ['listen', '听一听'],
  ['match', '配一配'],
  ['speak', '读一读'],
  ['session', '小课堂'],
] as const

test('home, worlds, and activities are reachable', async ({ page }) => {
  await go(page, '#/')
  await expect(page.getByRole('heading', { level: 1, name: '今天想和兔兔学什么？' })).toBeVisible()
  await expect(page.getByTestId('preview-banner')).toContainText('本地预览，不是正式网站')
  await expect(page.getByTestId('star-count')).toHaveText('0')

  await page.getByTestId('world-animals').click()
  await expect(page.getByRole('heading', { level: 1, name: '动物世界' })).toBeVisible()
  await page.getByTestId('activity-learn').click()
  await expect(page.getByRole('heading', { level: 1, name: '学一学' })).toBeVisible()
  await expect(page.locator('[lang="en"]').filter({ hasText: 'cat' })).toBeVisible()
  await page.getByTestId('back-link').click()
  await expect(page.getByRole('heading', { level: 1, name: '动物世界' })).toBeVisible()

  for (const [id, title] of worlds) {
    await go(page, `#/world/${id}`)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    for (const [activity, heading] of activities) {
      await go(page, `#/${activity}/${id}`)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    }
  }

  await go(page, '#/not-a-page')
  await expect(page.getByTestId('home')).toBeVisible()
})
