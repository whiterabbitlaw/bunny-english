import { expect, type Page } from '@playwright/test'

export const STORAGE_KEY = 'bunny-english-state-v1'

export async function go(page: Page, hash: string) {
  await page.goto(`/${hash}`)
  if (!page.url().includes(hash.replace('#', ''))) {
    await page.evaluate((value) => {
      window.location.hash = value
    }, hash)
  }
}

export async function hold(page: Page, testId: string) {
  const button = page.getByTestId(testId)
  await page.bringToFront()
  await expect(button).toBeVisible()
  const box = await button.boundingBox()
  if (!box) throw new Error(`missing box for ${testId}`)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(1600)
  await page.mouse.up()
}

export async function targetId(page: Page) {
  const id = await page.getByTestId('target-word').getAttribute('data-word-id')
  if (!id) throw new Error('missing target')
  return id
}

export async function choose(page: Page, wordId: string) {
  await page.locator(`[data-choice="true"][data-word-id="${wordId}"]`).click()
}

export async function chooseOther(page: Page, wordId: string) {
  const ids = await page.locator('[data-choice="true"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-word-id') ?? ''),
  )
  const other = ids.find((id) => id && id !== wordId)
  if (!other) throw new Error('missing distractor')
  await choose(page, other)
  return other
}
