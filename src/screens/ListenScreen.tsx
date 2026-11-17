import { useState } from 'react'
import type { WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { buildRounds, type Round } from '../lib/rounds.ts'
import { useStore } from '../state/store.tsx'
import { ListenRound } from '../components/ListenRound.tsx'
import { Shell } from '../components/Shell.tsx'
import { BunnyMascot } from '../components/Bunny.tsx'
import { Button } from '../components/ui/button.tsx'

export function ListenScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const { markListenCorrect } = useStore()
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(world.words, 4))
  const [index, setIndex] = useState(0)
  const [solved, setSolved] = useState(false)
  const [finished, setFinished] = useState(false)
  const [earned, setEarned] = useState(0)
  const round = rounds[index]

  function replay() {
    setRounds(buildRounds(world.words, 4))
    setIndex(0)
    setSolved(false)
    setFinished(false)
    setEarned(0)
  }

  return (
    <Shell backHref={pathFor({ screen: 'world', world: world.id })} backLabel={`返回${world.zh}`}>
      <div className="mt-5 flex flex-1 flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">听一听</h1>
          <p className="text-lg text-ink-soft">
            {world.zh}
            {finished ? ' · 完成' : ` · 第 ${index + 1}/4 题`}
          </p>
        </div>
        {finished || !round ? (
          <section data-testid="listen-finished" className="rounded-[32px] bg-cream-card p-6 text-center shadow-[0_12px_40px_rgba(42,33,24,0.08)]">
            <div className="mx-auto h-36 w-36">
              <BunnyMascot mood="cheer" />
            </div>
            <h2 className="font-display text-3xl">四题都完成啦</h2>
            <p className="mt-2 text-lg text-ink-soft">这次得到 {earned} 颗星。没有计时，想再玩可以再来一次。</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={replay}>再玩一次</Button>
              <a className="inline-flex min-h-16 items-center justify-center rounded-full bg-white/80 px-6 font-display text-xl" href={pathFor({ screen: 'world', world: world.id })}>
                回主题
              </a>
            </div>
          </section>
        ) : (
          <>
            <ListenRound
              key={round.key}
              round={round}
              onSolved={() => {
                setSolved(true)
                setEarned((value) => value + 1)
                markListenCorrect()
              }}
            />
            {solved ? (
              <Button
                data-testid="listen-next"
                onClick={() => {
                  if (index + 1 >= rounds.length) setFinished(true)
                  else {
                    setIndex((value) => value + 1)
                    setSolved(false)
                  }
                }}
              >
                {index + 1 >= rounds.length ? '看结果' : '下一题'}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </Shell>
  )
}
