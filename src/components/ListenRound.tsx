import { useRef, useState } from 'react'
import { WordArt } from './art.tsx'
import { SpeakerIcon, StarIcon } from './icons.tsx'
import { Button } from './ui/button.tsx'
import { fallbackReason, speakEnglish } from '../lib/speech.ts'
import { playChime } from '../lib/chime.ts'
import type { Round } from '../lib/rounds.ts'
import { useStore } from '../state/store.tsx'
import { useVoiceStatus } from '../hooks/useVoiceStatus.ts'

const RETRY = ['再试一次，你可以的', '没关系，再听一次', '慢慢来，找找看']

export function ListenRound({ round, onSolved }: { round: Round; onSolved: () => void }) {
  const { state } = useStore()
  const voice = useVoiceStatus()
  const [phase, setPhase] = useState<'play' | 'retry' | 'correct'>('play')
  const [misses, setMisses] = useState(0)
  const sent = useRef(false)
  const soundOn = state.settings.sound
  const reason = fallbackReason(voice.status, soundOn)
  const showWord = Boolean(reason) || phase === 'correct'

  function play() {
    void speakEnglish(round.target.en, soundOn)
  }

  function choose(id: string) {
    if (phase === 'correct') return
    if (id === round.target.id) {
      setPhase('correct')
      void speakEnglish(round.target.en, soundOn)
      playChime('ok', soundOn)
      if (!sent.current) {
        sent.current = true
        onSolved()
      }
      return
    }
    setPhase('retry')
    setMisses((count) => count + 1)
    playChime('again', soundOn)
  }

  const retryText = RETRY[Math.max(0, misses - 1) % RETRY.length]

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" data-testid="target-word" data-word-id={round.target.id}>
        目标单词 {round.target.en}
      </p>
      <div className="flex flex-col items-center gap-3 rounded-[28px] bg-cream-card p-4 shadow-[0_12px_40px_rgba(42,33,24,0.08)] sm:p-6">
        <Button data-testid="listen-play" onClick={play} className="w-full max-w-sm">
          <SpeakerIcon className="h-8 w-8" muted={!soundOn} />
          听一听
        </Button>
        {showWord ? (
          <p className="text-center">
            <span lang="en" className="font-display text-5xl text-teal-deep">
              {round.target.en}
            </span>
          </p>
        ) : (
          <p className="font-display text-2xl text-ink">听声音，点图片</p>
        )}
        {reason ? (
          <p data-testid="tts-fallback" className="max-w-md text-center text-base leading-7 text-ink-soft">
            {reason}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {round.choices.map((word, index) => {
          const hint = phase !== 'correct' && misses >= 2 && word.id === round.target.id
          const correct = phase === 'correct' && word.id === round.target.id
          return (
            <button
              key={word.id}
              type="button"
              data-choice="true"
              data-word-id={word.id}
              data-hint={hint ? 'true' : 'false'}
              data-state={correct ? 'correct' : 'open'}
              aria-label={`第 ${index + 1} 张图片`}
              disabled={phase === 'correct'}
              onClick={() => choose(word.id)}
              className={`min-h-28 rounded-[24px] bg-cream-card p-2 shadow-[0_8px_24px_rgba(42,33,24,0.06)] ${hint ? 'hint-pulse' : ''} ${correct ? 'ring-4 ring-teal' : ''}`}
            >
              <WordArt wordId={word.id} className="mx-auto h-24 w-24 sm:h-32 sm:w-32" />
            </button>
          )
        })}
      </div>

      <p data-testid="feedback" data-state={phase} role="status" className="min-h-14 text-center font-display text-2xl text-ink">
        {phase === 'retry' ? retryText : null}
        {phase === 'correct' ? (
          <span className="pop-in inline-flex items-center justify-center gap-2">
            <StarIcon className="h-8 w-8" />
            对啦！<span lang="en">{round.target.en}</span> {round.target.zh}
          </span>
        ) : null}
        {phase === 'play' ? <span className="text-lg text-ink-soft">点一张图片</span> : null}
      </p>
      {misses >= 2 && phase !== 'correct' ? (
        <p className="text-center text-base text-ink-soft">需要的话，看边框发亮的那一张。</p>
      ) : null}
    </div>
  )
}
