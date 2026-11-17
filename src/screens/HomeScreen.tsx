import { previewWordId, worlds } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { useStore } from '../state/store.tsx'
import { WordArt } from '../components/art.tsx'
import { BunnyMascot } from '../components/Bunny.tsx'
import { Shell } from '../components/Shell.tsx'

export function HomeScreen() {
  const { state } = useStore()
  const reminder = state.settings.reminderMinutes

  return (
    <Shell showParent>
      <div data-testid="home" className="mt-6 grid flex-1 items-center gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[32px] bg-cream-card p-5 shadow-[0_12px_40px_rgba(42,33,24,0.08)] sm:p-8">
          <div className="mascot-hero float-soft mx-auto h-40 w-40 sm:h-52 sm:w-52">
            <BunnyMascot mood="wave" />
          </div>
          <h1 className="mt-2 text-center font-display text-4xl text-ink sm:text-5xl">今天想和兔兔学什么？</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-lg leading-8 text-ink-soft">
            四个小世界，每次玩一会儿就好。看图、听单词、点一指。
          </p>
          <p className="mt-3 text-center font-display text-xl text-teal-deep">
            {state.stars === 0 ? '还没有星星。选一个世界，点一点、听一听。' : `已经收集了 ${state.stars} 颗星。`}
          </p>
        </section>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {worlds.map((world) => {
            const heard = state.heard.filter((id) => id.startsWith(`${world.id}-`)).length
            return (
              <li key={world.id}>
                <a
                  href={pathFor({ screen: 'world', world: world.id })}
                  data-testid={`world-${world.id}`}
                  className="flex h-full min-h-44 flex-col rounded-[28px] bg-cream-card p-3 shadow-[0_12px_40px_rgba(42,33,24,0.08)] sm:min-h-52 sm:p-4"
                >
                  <span className="block h-24 sm:h-28" style={{ background: world.soft, borderRadius: 20 }}>
                    <WordArt wordId={previewWordId(world.id)} />
                  </span>
                  <span className="mt-3 font-display text-2xl text-ink">{world.zh}</span>
                  <span lang="en" className="font-display text-lg text-teal">
                    {world.en}
                  </span>
                  <span className="mt-auto pt-2 text-sm text-ink-soft">听过 {heard}/6</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
      <footer className="mt-8 space-y-2 text-center text-sm leading-6 text-ink-soft">
        <p>给 3–6 岁孩子。英语朗读要用这台设备自己的语音，不是每台设备都有。</p>
        {reminder > 0 ? <p>大约 {reminder} 分钟后，兔兔会提醒休息眼睛。可以在家长区修改。</p> : <p>休息提醒目前关着。</p>}
      </footer>
    </Shell>
  )
}
