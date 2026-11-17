import { useEffect, useRef, useState } from 'react'
import type { WorldId } from '../data/worlds.ts'
import { getWorld } from '../data/worlds.ts'
import { pathFor } from '../lib/routes.ts'
import { recognitionAvailable } from '../lib/capabilities.ts'
import { recognizeWord, type MatchOutcome } from '../lib/recognition.ts'
import { useHearWord } from '../hooks/useHearWord.ts'
import { useRecorder } from '../hooks/useRecorder.ts'
import { useStore } from '../state/store.tsx'
import { WordArt } from '../components/art.tsx'
import { Shell } from '../components/Shell.tsx'
import { MicIcon, SpeakerIcon } from '../components/icons.tsx'
import { HearResult, VoiceStatusText } from '../components/VoiceNote.tsx'
import { Button } from '../components/ui/button.tsx'

const micCopy: Record<string, string> = {
  unsupported: '这台浏览器不能在本地录音（没有 MediaRecorder 或麦克风接口）。仍然可以听示范。',
  insecure: '麦克风只能在安全连接里使用（HTTPS 或 localhost）。现在的页面不是安全连接，所以不能录音。听示范仍然可以。',
  denied: '没有获得麦克风权限。录音不会上传。你可以在浏览器里允许麦克风，或只听示范。',
  missing: '没有找到麦克风。可以继续听示范。',
  failed: '录音没有成功。可以再试一次，或只听示范。',
  'too-short': '录得太短了。再按一次，把单词读完。',
  idle: '点录音后，浏览器会询问麦克风。声音只留在这台设备的内存里，刷新就没有了，不会上传。',
  recording: '正在录音。读完点停止，就可以在本地回放。最长大约 8 秒。',
  saved: '录音好了。点“听我的”在这台设备上回放。这段录音不会上传，刷新页面后就没有了。',
}

function matchCopy(outcome: MatchOutcome, target: string): string {
  if (outcome.status === 'match') {
    return `听到“${outcome.transcript}”，里面有目标单词 ${target}。这只说明词语对上了，不是发音评分。`
  }
  if (outcome.status === 'miss') {
    return `听到“${outcome.transcript}”，里面没有目标单词 ${target}。可以再听示范。这不是发音评分。`
  }
  if (outcome.status === 'empty') return '没有识别到单词。这不是发音评分。'
  if (outcome.status === 'unsupported') return '这台浏览器没有语音识别，不能做词语对照。录音回放仍可用。这不是发音评分。'
  return `${outcome.message} 这不是发音评分。`
}

export function SpeakScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId)
  const { state, addStars, markRecorded } = useStore()
  const [selectedId, setSelectedId] = useState(world.words[0]?.id ?? '')
  const selected = world.words.find((word) => word.id === selectedId) ?? world.words[0]
  const heard = useHearWord(selected!)
  const recorder = useRecorder()
  const audioRef = useRef<HTMLAudioElement>(null)
  const credited = useRef<string | null>(null)
  const [playError, setPlayError] = useState('')
  const [matching, setMatching] = useState(false)
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null)
  const canRecognize = recognitionAvailable()

  useEffect(() => {
    if (recorder.phase === 'saved' && recorder.url && credited.current !== recorder.url) {
      credited.current = recorder.url
      markRecorded()
      addStars(1)
    }
  }, [recorder.phase, recorder.url, markRecorded, addStars])

  async function matchWord() {
    if (!selected || recorder.phase === 'recording') return
    setMatching(true)
    setOutcome(null)
    const next = await recognizeWord(selected.en)
    setOutcome(next)
    setMatching(false)
  }

  const recordable = recorder.support === 'ok'

  return (
    <Shell backHref={pathFor({ screen: 'world', world: world.id })} backLabel={`返回${world.zh}`}>
      <div className="mt-5 flex flex-1 flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">读一读</h1>
          <p className="text-lg leading-8 text-ink-soft">先听示范，再录下来自己听。这里不给发音打分。</p>
        </div>
        <div role="radiogroup" aria-label="选择要读的单词" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {world.words.map((word) => {
            const active = word.id === selected?.id
            return (
              <button
                key={word.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid="speak-word"
                data-word-id={word.id}
                onClick={() => {
                  setSelectedId(word.id)
                  setOutcome(null)
                }}
                className={`rounded-3xl bg-cream-card p-1 ${active ? 'ring-4 ring-teal' : ''}`}
              >
                <WordArt wordId={word.id} className="mx-auto h-16 w-16" />
              </button>
            )
          })}
        </div>
        {selected ? (
          <article className="rounded-[32px] bg-cream-card p-5 text-center shadow-[0_12px_40px_rgba(42,33,24,0.08)]">
            <WordArt wordId={selected.id} className="mx-auto h-40 w-40" />
            <p lang="en" className="font-display text-5xl text-teal-deep">
              {selected.en}
            </p>
            <p className="font-display text-3xl">{selected.zh}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button data-testid="model-play" disabled={heard.pending} onClick={() => void heard.hear()}>
                <SpeakerIcon className="h-8 w-8" />
                听示范
              </Button>
              {recorder.phase === 'recording' ? (
                <Button data-testid="record-stop" variant="sun" onClick={recorder.stop}>
                  停止 · {Math.min(8, Math.floor(recorder.seconds))} 秒
                </Button>
              ) : (
                <Button data-testid="record-start" variant="sun" disabled={!recordable} onClick={() => void recorder.start()}>
                  <MicIcon className="h-8 w-8" />
                  录音
                </Button>
              )}
            </div>
            <p data-testid="mic-status" data-state={recorder.phase} className="mt-4 text-left text-base leading-7 text-ink-soft">
              {micCopy[recorder.phase] ?? micCopy.idle}
            </p>
            {recorder.url ? (
              <div className="mt-3 flex flex-col gap-3">
                <Button
                  variant="coral"
                  data-testid="replay"
                  onClick={() => {
                    const audio = audioRef.current
                    if (!audio) return
                    audio.currentTime = 0
                    void audio.play().catch(() => setPlayError('没能播放这段录音。'))
                  }}
                >
                  听我的
                </Button>
                <audio ref={audioRef} data-testid="replay-audio" src={recorder.url} controls className="w-full" />
              </div>
            ) : null}
            {playError ? <p className="mt-2 text-base text-coral">{playError}</p> : null}
          </article>
        ) : null}
        <VoiceStatusText voice={heard.voice} />
        <HearResult result={heard.result} voice={heard.voice} />

        <section className="rounded-[28px] bg-white/75 p-4">
          <h2 className="font-display text-2xl">词语对照</h2>
          {state.settings.wordMatchOptIn ? (
            <>
              <p data-testid="speak-recognition-note" className="mt-2 text-base leading-7 text-ink-soft">
                家长已开启。点下面的按钮时，浏览器的语音识别会听一小段话。部分浏览器会把声音发给自己的服务商。小兔英语不保存这段声音。对照结果只说明有没有听到目标单词，不是发音评分。
              </p>
              {canRecognize && selected ? (
                <Button className="mt-3" data-testid="word-match-button" disabled={matching || recorder.phase === 'recording'} onClick={() => void matchWord()}>
                  {matching ? '正在听…' : '对一下单词'}
                </Button>
              ) : (
                <p className="mt-3 text-base leading-7">这台浏览器没有语音识别接口，所以不能做词语对照。录音回放不受影响。</p>
              )}
              {outcome ? (
                <p data-testid="word-match-result" data-state={outcome.status} role="status" className="mt-3 text-base leading-7">
                  {matchCopy(outcome, selected?.en ?? '')}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-base leading-7 text-ink-soft">家长没有开启词语对照。录音回放可以在这台设备上听，不需要这个功能。</p>
          )}
        </section>
      </div>
    </Shell>
  )
}
