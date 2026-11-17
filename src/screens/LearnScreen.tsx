import { useState } from 'react'
import type { WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { buttonClass } from '../lib/button-style.ts'
import { useHearWord } from '../hooks/useHearWord.ts'
import { WordArt } from '../components/art.tsx'
import { Shell } from '../components/Shell.tsx'
import { SpeakerIcon } from '../components/icons.tsx'
import { HearResult, VoiceStatusText } from '../components/VoiceNote.tsx'
import { Button } from '../components/ui/button.tsx'

export function LearnScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const [index, setIndex] = useState(0)
  const word = world.words[Math.min(index, world.words.length - 1)] ?? world.words[0]
  const heard = useHearWord(word!)
  const last = index === world.words.length - 1

  return (
    <Shell backHref={pathFor({ screen: 'world', world: world.id })} backLabel={`返回${world.zh}`}>
      <div className="mx-auto mt-5 flex w-full max-w-xl flex-1 flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">学一学</h1>
          <p className="text-lg text-ink-soft">
            {world.zh} · {index + 1}/{world.words.length}
          </p>
        </div>
        <article className="rounded-[32px] bg-cream-card p-5 text-center shadow-[0_12px_40px_rgba(42,33,24,0.08)] sm:p-8">
          <WordArt wordId={word.id} className="mx-auto h-48 w-48 sm:h-56 sm:w-56" />
          <p lang="en" className="font-display text-6xl text-teal-deep">
            {word.en}
          </p>
          <p className="mt-1 font-display text-3xl text-ink">{word.zh}</p>
          <Button className="mt-5 w-full" data-testid="hear-word" disabled={heard.pending} onClick={() => void heard.hear()}>
            <SpeakerIcon className="h-8 w-8" />
            {heard.pending ? '正在朗读…' : '听一听'}
          </Button>
        </article>
        <VoiceStatusText voice={heard.voice} />
        <HearResult result={heard.result} voice={heard.voice} />
        <div className="mt-auto grid grid-cols-2 gap-3">
          <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
            上一个
          </Button>
          {last ? (
            <a className={buttonClass()} href={pathFor({ screen: 'listen', world: world.id })} data-testid="learn-next">
              去听一听
            </a>
          ) : (
            <Button data-testid="learn-next" onClick={() => setIndex((value) => Math.min(world.words.length - 1, value + 1))}>
              下一个
            </Button>
          )}
        </div>
      </div>
    </Shell>
  )
}
