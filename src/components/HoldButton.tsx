import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 1100

type Props = {
  label: string
  testId: string
  onComplete: () => void
  className?: string
}

export function HoldButton({ label, testId, onComplete, className }: Props) {
  const [progress, setProgress] = useState(0)
  const startAt = useRef<number | null>(null)
  const timer = useRef(0)
  const done = useRef(false)

  useEffect(() => () => window.clearInterval(timer.current), [])

  function stop() {
    window.clearInterval(timer.current)
    startAt.current = null
    if (!done.current) setProgress(0)
  }

  function start() {
    if (done.current) return
    startAt.current = Date.now()
    window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      if (startAt.current == null || done.current) return
      const next = Math.min(1, (Date.now() - startAt.current) / HOLD_MS)
      setProgress(next)
      if (next >= 1) {
        done.current = true
        window.clearInterval(timer.current)
        onComplete()
      }
    }, 40)
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-describedby={`${testId}-help`}
      className={`touch-none rounded-full p-[3px] ${className ?? ''}`}
      style={{ background: `conic-gradient(#0e7c73 ${Math.round(progress * 360)}deg, #d5ebe7 0deg)` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        start()
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault()
        if (!event.repeat) start()
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') stop()
      }}
    >
      <span className="flex min-h-12 items-center justify-center rounded-full bg-white px-4 font-display text-lg text-teal-deep">
        {label}
      </span>
      <span id={`${testId}-help`} className="sr-only">
        按住大约一秒。也可以用键盘按住回车键。
      </span>
    </button>
  )
}
