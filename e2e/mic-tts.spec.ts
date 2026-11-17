import { expect, test } from '@playwright/test'
import { STORAGE_KEY, go } from './helpers.ts'

test('tts unavailable keeps the word visible and explains the limit', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      get() {
        return undefined
      },
    })
  })
  await go(page, '#/learn/animals')
  await expect(page.getByTestId('tts-status')).toContainText('浏览器不支持英语朗读')
  await expect(page.locator('[lang="en"]').filter({ hasText: /^cat$/ })).toBeVisible()
  await page.getByTestId('hear-word').click()
  await expect(page.getByTestId('tts-result')).toHaveAttribute('data-state', 'unsupported')
  await expect(page.getByTestId('tts-result')).toContainText('不能朗读')

  await go(page, '#/listen/animals')
  await expect(page.getByTestId('tts-fallback')).toContainText('浏览器不支持英语朗读')
  await expect(page.locator('main [lang="en"]').first()).toBeVisible()
})

test('microphone unsupported and insecure states are explicit', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      get() {
        return undefined
      },
    })
    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      get() {
        return undefined
      },
    })
  })
  await go(page, '#/speak/colors')
  await expect(page.getByTestId('mic-status')).toHaveAttribute('data-state', 'unsupported')
  await expect(page.getByTestId('mic-status')).toContainText('不能在本地录音')
  await expect(page.getByTestId('record-start')).toBeDisabled()
})

test('insecure context blocks the microphone', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      get() {
        return false
      },
    })
  })
  await go(page, '#/speak/colors')
  await expect(page.getByTestId('mic-status')).toHaveAttribute('data-state', 'insecure')
  await expect(page.getByTestId('mic-status')).toContainText('安全连接')
  await expect(page.getByTestId('record-start')).toBeDisabled()
})

test('denied microphone permission stays on the device and can still play the model', async ({ page }) => {
  await page.addInitScript(() => {
    const deny = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny
  })
  await go(page, '#/speak/fruits')
  await page.getByTestId('record-start').click()
  await expect(page.getByTestId('mic-status')).toHaveAttribute('data-state', 'denied')
  await expect(page.getByTestId('mic-status')).toContainText('不会上传')
  await expect(page.getByTestId('replay-audio')).toHaveCount(0)
  await expect(page.getByTestId('model-play')).toBeEnabled()
})

test('local recording can be replayed from a blob url', async ({ page }) => {
  await go(page, '#/speak/numbers')
  await page.getByTestId('record-start').click()
  await expect(page.getByTestId('record-stop')).toBeVisible()
  await page.waitForTimeout(700)
  await page.getByTestId('record-stop').click()
  await expect(page.getByTestId('mic-status')).toHaveAttribute('data-state', 'saved', { timeout: 8_000 })
  await expect(page.getByTestId('replay-audio')).toHaveAttribute('src', /^blob:/)
  await page.getByTestId('replay').click()
  await expect(page.getByTestId('mic-status')).toContainText('不会上传')
})

test('word match stays off without a parent opt-in', async ({ page }) => {
  await go(page, '#/speak/fruits')
  await expect(page.getByTestId('word-match-button')).toHaveCount(0)
  await expect(page.getByText('家长没有开启词语对照')).toBeVisible()
})

test('opted-in word match compares the word and does not show a score', async ({ page }) => {
  await page.addInitScript((key) => {
    class FakeRecognition {
      lang = 'en-US'
      continuous = false
      interimResults = false
      maxAlternatives = 1
      onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null = null
      onerror: ((event: { error: string }) => void) | null = null
      onend: (() => void) | null = null
      start() {
        const host = window as Window & { __bunnyHeard?: string }
        const transcript = host.__bunnyHeard ?? 'apple'
        window.setTimeout(() => {
          this.onresult?.({ results: [[{ transcript }]] })
          this.onend?.()
        }, 20)
      }
      stop() {
        this.onend?.()
      }
      abort() {}
    }
    try {
      Object.defineProperty(window, 'SpeechRecognition', { configurable: true, writable: true, value: FakeRecognition })
      Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, writable: true, value: FakeRecognition })
    } catch {
      // The page can still load if this browser refuses to replace the API.
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        settings: { sound: true, reminderMinutes: 15, wordMatchOptIn: true },
        sessionStartedAt: Date.now(),
      }),
    )
  }, STORAGE_KEY)

  await go(page, '#/speak/fruits')
  await expect(page.getByTestId('speak-recognition-note')).toContainText('不是发音评分')
  await page.getByTestId('word-match-button').click()
  const result = page.getByTestId('word-match-result')
  await expect(result).toHaveAttribute('data-state', 'match')
  await expect(result).toContainText('apple')
  await expect(result).toContainText('不是发音评分')
  await expect(result).not.toContainText('%')
  await expect(result).not.toContainText(/score/i)

  await page.evaluate(() => {
    ;(window as Window & { __bunnyHeard?: string }).__bunnyHeard = 'banana'
  })
  await page.getByTestId('word-match-button').click()
  await expect(result).toHaveAttribute('data-state', 'miss')
  await expect(result).toContainText('banana')
  await expect(result).toContainText('没有目标单词')
  await expect(result).not.toContainText('%')
})
