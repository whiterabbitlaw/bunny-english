import { useMemo, useState } from 'react'
import type { WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { makeRound, type Round } from '../lib/rounds.ts'
import { shuffle } from '../lib/shuffle.ts'
import { useHearWord } from '../hooks/useHearWord.ts'
import { useStore } from '../state/store.tsx'
import { WordArt } from '../components/art.tsx'
import { BunnyMascot } from '../components/Bunny.tsx'
import { ListenRound } from '../components/ListenRound.tsx'
import { Shell } from '../components/Shell.tsx'
import { SpeakerIcon } from '../components/icons.tsx'
import { HearResult, VoiceStatusText } from '../components/VoiceNote.tsx'
import { Button } from '../components/ui/button.tsx'

type Phase = { name: 'learn'; index: number } | { name: 'quiz'; index: number; round: Round } | { name: 'done' }

export function SessionScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const lesson = useMemo(() => shuffle(world.words).slice(0, 3), [world.words])
  const [phase, setPhase] = useState<Phase>({ name: 'learn', index: 0 })
  const [earned, setEarned] = useState(0)
  const [quizSolved, setQuizSolved] = useState(false)
  const { markListenCorrect, markSessionClear } = useStore()
  const learnWord = lesson[phase.name === 'learn' ? phase.index : 0] ?? lesson[0]
  const heard = useHearWord(learnWord!)

  function finishLesson() {
    const target = lesson[0]
    if (!target) return
    setQuizSolved(false)
    setPhase({ name: 'quiz', index: 0, round: makeRound(world.words, target) })
  }

  return (
    <Shell backHref={pathFor({ screen: 'world', world: world.id })} backLabel={`返回${world.zh}`}>
      <div className="mx-auto mt-5 flex w-full max-w-xl flex-1 flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">小课堂</h1>
          <p className="text-lg text-ink-soft">
            {world.zh}
            {phase.name === 'learn' ? ` · 单词 ${phase.index + 1}/3` : null}
            {phase.name === 'quiz' ? ` · 听一听 ${phase.index + 1}/2` : null}
            {phase.name === 'done' ? ' · 结束' : null}
          </p>
        </div>

        {phase.name === 'learn' && learnWord ? (
          <article className="rounded-[32px] bg-cream-card p-5 text-center shadow-[0_12px_40px_rgba(42,33,24,0.08)]">
            <WordArt wordId={learnWord.id} className="mx-auto h-44 w-44" />
            <p lang="en" className="font-display text-5xl text-teal-deep">
              {learnWord.en}
            </p>
            <p className="font-display text-3xl">{learnWord.zh}</p>
            <p className="mt-2 text-base leading-7 text-ink-soft">看一看，听一听，然后点下一个。没有计时。</p>
            <Button className="mt-4 w-full" data-testid="hear-word" disabled={heard.pending} onClick={() => void heard.hear()}>
              <SpeakerIcon className="h-8 w-8" />
              听一听
            </Button>
            <div className="mt-4 text-left">
              <VoiceStatusText voice={heard.voice} />
              <HearResult result={heard.result} voice={heard.voice} />
            </div>
            <Button
              className="mt-4 w-full"
              variant="sun"
              data-testid="session-next"
              onClick={() => {
                if (phase.index < lesson.length - 1) setPhase({ name: 'learn', index: phase.index + 1 })
                else finishLesson()
              }}
            >
              {phase.index < lesson.length - 1 ? '下一个' : '去听一听'}
            </Button>
          </article>
        ) : null}

        {phase.name === 'quiz' ? (
          <>
            <ListenRound
              key={phase.round.key}
              round={phase.round}
              onSolved={() => {
                setQuizSolved(true)
                setEarned((value) => value + 1)
                markListenCorrect()
              }}
            />
            {quizSolved ? (
              <Button
                data-testid="session-quiz-next"
                onClick={() => {
                  if (phase.index === 0) {
                    const target = lesson[1] ?? lesson[0]
                    if (!target) return
                    setQuizSolved(false)
                    setPhase({ name: 'quiz', index: 1, round: makeRound(world.words, target) })
                    return
                  }
                  markSessionClear()
                  setPhase({ name: 'done' })
                }}
              >
                {phase.index === 0 ? '下一题' : '完成'}
              </Button>
            ) : null}
          </>
        ) : null}

        {phase.name === 'done' ? (
          <section data-testid="session-done" className="rounded-[32px] bg-cream-card p-6 text-center">
            <div className="mx-auto h-36 w-36">
              <BunnyMascot mood="cheer" />
            </div>
            <h2 className="font-display text-3xl">小课堂结束啦</h2>
            <p className="mt-2 text-lg leading-8 text-ink-soft">听对了 {earned} 题。今天可以先停在这里，也可以再去主题里玩别的。</p>
            <div className="mt-5 flex flex-col gap-3">
              <a className="inline-flex min-h-16 items-center justify-center rounded-full bg-teal px-6 font-display text-xl text-white" href={pathFor({ screen: 'world', world: world.id })}>
                回主题
              </a>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                再上一节
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </Shell>
  )
}
