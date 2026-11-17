import type { ReactNode } from 'react'
import { buttonClass } from '../lib/button-style.ts'
import { useStore } from '../state/store.tsx'
import { BunnyMascot } from './Bunny.tsx'
import { HoldButton } from './HoldButton.tsx'
import { SpeakerIcon, StarIcon } from './icons.tsx'
import { unlockParent } from '../lib/parent-lock.ts'

type Props = {
  backHref?: string
  backLabel?: string
  showParent?: boolean
  children: ReactNode
}

export function Shell({ backHref, backLabel = '返回', showParent = false, children }: Props) {
  const { state, updateSettings } = useStore()
  const sound = state.settings.sound

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 sm:px-8 sm:py-6">
      <a className="skip" href="#main">
        跳到内容
      </a>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {backHref ? (
            <a href={backHref} data-testid="back-link" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
              {backLabel}
            </a>
          ) : null}
          <a href="#/" className="flex min-w-0 items-center gap-2" aria-label="回到小兔英语首页">
            <span className="block h-12 w-12 shrink-0">
              <BunnyMascot mood="wave" />
            </span>
            <span className="truncate font-logo text-2xl leading-none text-teal-deep sm:text-3xl">小兔英语</span>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <p className="flex min-h-12 items-center gap-1 rounded-full bg-white/80 px-3 font-display text-xl text-ink" aria-label={`${state.stars} 颗星`}>
            <StarIcon className="h-6 w-6" />
            <span data-testid="star-count">{state.stars}</span>
          </p>
          <button
            type="button"
            data-testid="sound-toggle"
            aria-pressed={sound}
            aria-label={sound ? '声音开' : '声音关'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80"
            onClick={() => updateSettings({ sound: !sound })}
          >
            <SpeakerIcon className="h-8 w-8" muted={!sound} />
          </button>
          {showParent ? (
            <HoldButton
              testId="parent-hold"
              label="家长"
              onComplete={() => {
                unlockParent()
                window.location.hash = '#/parent'
              }}
            />
          ) : null}
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      {import.meta.env.DEV ? (
        <p data-testid="preview-banner" className="mt-6 text-center text-sm leading-6 text-ink-soft">
          本地预览，不是正式网站。英语语音和麦克风取决于这台浏览器，刷新后录音会消失。
        </p>
      ) : null}
    </div>
  )
}
