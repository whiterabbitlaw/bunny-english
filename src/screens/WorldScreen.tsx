import type { WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { buttonClass } from '../lib/button-style.ts'
import { useStore } from '../state/store.tsx'
import { WordArt } from '../components/art.tsx'
import { Shell } from '../components/Shell.tsx'

const activities = [
  { screen: 'learn', zh: '学一学', en: 'Learn', text: '看图，听单词' },
  { screen: 'listen', zh: '听一听', en: 'Listen', text: '听声音，点图片' },
  { screen: 'match', zh: '配一配', en: 'Match', text: '图片和声音配对' },
  { screen: 'speak', zh: '读一读', en: 'Speak', text: '听示范，录一录' },
] as const

export function WorldScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const { state } = useStore()
  const heard = state.heard.filter((id) => id.startsWith(`${world.id}-`)).length

  return (
    <Shell backHref="#/" backLabel="返回首页">
      <div data-testid="world-page" className="mt-5 flex flex-1 flex-col gap-5">
        <div className="overflow-hidden rounded-[32px] bg-cream-card shadow-[0_12px_40px_rgba(42,33,24,0.08)]">
          <div className="h-3" style={{ background: world.band }} />
          <div className="p-5 sm:p-7">
            <h1 className="font-display text-4xl text-ink sm:text-5xl">{world.zh}</h1>
            <p lang="en" className="font-display text-2xl text-teal">
              {world.en}
            </p>
            <p className="mt-2 max-w-xl text-lg leading-8 text-ink-soft">{world.intro}</p>
            <p className="mt-2 text-base text-ink-soft">这个世界听过 {heard}/6 个单词。</p>
            <a
              className={`${buttonClass({ className: 'mt-4' })}`}
              href={pathFor({ screen: 'session', world: world.id })}
              data-testid="start-session"
            >
              开始小课堂
            </a>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {activities.map((activity) => (
            <li key={activity.screen}>
              <a
                href={pathFor({ screen: activity.screen, world: world.id })}
                data-testid={`activity-${activity.screen}`}
                className="flex min-h-32 flex-col justify-center rounded-[28px] bg-cream-card p-4 shadow-[0_8px_24px_rgba(42,33,24,0.06)]"
              >
                <span className="font-display text-3xl text-ink">{activity.zh}</span>
                <span lang="en" className="font-display text-xl text-teal">
                  {activity.en}
                </span>
                <span className="mt-2 text-base text-ink-soft">{activity.text}</span>
              </a>
            </li>
          ))}
        </ul>
        <section>
          <h2 className="font-display text-2xl text-ink">这个世界的单词</h2>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {world.words.map((word) => (
              <li key={word.id} className="w-28 shrink-0 rounded-3xl bg-white/70 p-2 text-center">
                <WordArt wordId={word.id} className="mx-auto h-20 w-20" />
                <p lang="en" className="font-display text-lg text-ink">
                  {word.en}
                </p>
                <p className="text-sm text-ink-soft">{word.zh}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  )
}
