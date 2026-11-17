import { useState } from 'react'
import type { Word, WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { shuffle } from '../lib/shuffle.ts'
import { speakEnglish } from '../lib/speech.ts'
import { playChime } from '../lib/chime.ts'
import { useStore } from '../state/store.tsx'
import { WordArt } from '../components/art.tsx'
import { Shell } from '../components/Shell.tsx'
import { SpeakerIcon, StarIcon } from '../components/icons.tsx'
import { Button } from '../components/ui/button.tsx'
import { BunnyMascot } from '../components/Bunny.tsx'

type Board = { pictures: Word[]; sounds: Word[] }

function orderKey(words: Word[]) {
  return words.map((word) => word.id).join('|')
}

function deal(words: readonly Word[], previous?: string): Board {
  let pictures: Word[] = []
  let sounds: Word[] = []
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const picked = shuffle(words).slice(0, 4)
    pictures = shuffle(picked)
    sounds = shuffle(picked)
    if (!previous || orderKey(pictures) !== previous) break
  }
  return { pictures, sounds }
}

export function MatchScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const { state, addStars, markMatchClear } = useStore()
  const [board, setBoard] = useState<Board>(() => deal(world.words))
  const [matched, setMatched] = useState<string[]>([])
  const [pick, setPick] = useState<{ side: 'picture' | 'sound'; id: string } | null>(null)
  const [feedback, setFeedback] = useState<'idle' | 'retry' | 'correct' | 'done'>('idle')

  function reset() {
    setMatched([])
    setPick(null)
    setFeedback('idle')
    setBoard((current) => deal(world.words, orderKey(current.pictures)))
  }

  function resolve(pictureId: string, soundId: string) {
    if (pictureId === soundId) {
      const next = matched.includes(pictureId) ? matched : [...matched, pictureId]
      setMatched(next)
      setPick(null)
      addStars(1)
      playChime('ok', state.settings.sound)
      if (next.length === board.pictures.length) {
        setFeedback('done')
        markMatchClear()
      } else {
        setFeedback('correct')
      }
      return
    }
    setPick(null)
    setFeedback('retry')
    playChime('again', state.settings.sound)
  }

  function onPicture(id: string) {
    if (matched.includes(id)) return
    if (pick?.side === 'sound') resolve(id, pick.id)
    else setPick({ side: 'picture', id })
  }

  function onSound(id: string) {
    void speakEnglish(world.words.find((word) => word.id === id)?.en ?? '', state.settings.sound)
    if (matched.includes(id)) return
    if (pick?.side === 'picture') resolve(pick.id, id)
    else setPick({ side: 'sound', id })
  }

  const message =
    feedback === 'retry'
      ? '不是这一对哦，再听一次'
      : feedback === 'correct'
        ? '配对啦'
        : feedback === 'done'
          ? '全部配对完成'
          : '先点喇叭，再点图片。不认识字也没关系。'

  return (
    <Shell backHref={pathFor({ screen: 'world', world: world.id })} backLabel={`返回${world.zh}`}>
      <div className="mt-5 flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-ink">配一配</h1>
            <p className="text-lg text-ink-soft">{world.zh} · 图片和声音</p>
          </div>
          <Button variant="ghost" size="md" data-testid="match-reset" onClick={reset}>
            重新洗牌
          </Button>
        </div>
        <p data-testid="match-feedback" data-state={feedback} role="status" className="font-display text-2xl text-ink">
          {message}
        </p>
        {feedback === 'done' ? (
          <div className="flex items-center gap-3 rounded-3xl bg-mint px-4 py-3">
            <span className="h-16 w-16">
              <BunnyMascot mood="cheer" />
            </span>
            <p>四对都找到了。想再玩，点重新洗牌。</p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <section>
            <h2 className="mb-2 font-display text-xl">图片</h2>
            <ul data-testid="picture-column" className="flex flex-col gap-3">
              {board.pictures.map((word) => {
                const isMatched = matched.includes(word.id)
                const selected = pick?.side === 'picture' && pick.id === word.id
                return (
                  <li key={word.id}>
                    <button
                      type="button"
                      data-testid="match-picture"
                      data-word-id={word.id}
                      data-matched={isMatched ? 'true' : 'false'}
                      aria-label={isMatched ? `已配对 ${word.en}` : '图片'}
                      disabled={isMatched}
                      onClick={() => onPicture(word.id)}
                      className={`flex min-h-24 w-full items-center gap-2 rounded-[24px] bg-cream-card p-2 text-left shadow-[0_8px_24px_rgba(42,33,24,0.06)] ${selected ? 'ring-4 ring-teal' : ''} ${isMatched ? 'opacity-70' : ''}`}
                    >
                      <WordArt wordId={word.id} className="h-20 w-20 shrink-0" />
                      {isMatched ? (
                        <span>
                          <StarIcon className="h-6 w-6" />
                          <span lang="en" className="font-display text-lg">
                            {word.en}
                          </span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 font-display text-xl">声音</h2>
            <ul data-testid="sound-column" className="flex flex-col gap-3">
              {board.sounds.map((word, index) => {
                const isMatched = matched.includes(word.id)
                const selected = pick?.side === 'sound' && pick.id === word.id
                return (
                  <li key={word.id}>
                    <button
                      type="button"
                      data-testid="match-sound"
                      data-word-id={word.id}
                      data-matched={isMatched ? 'true' : 'false'}
                      aria-label={isMatched ? `已配对，再听 ${word.en}` : `播放声音 ${index + 1}`}
                      onClick={() => onSound(word.id)}
                      className={`flex min-h-24 w-full flex-col items-center justify-center rounded-[24px] bg-sun-soft text-teal-deep shadow-[0_8px_24px_rgba(42,33,24,0.06)] ${selected ? 'ring-4 ring-sun' : ''}`}
                    >
                      <SpeakerIcon className="h-12 w-12" />
                      {isMatched ? (
                        <span lang="en" className="font-display text-lg text-ink">
                          {word.en}
                        </span>
                      ) : (
                        <span className="text-base text-ink-soft">点我听</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </Shell>
  )
}
