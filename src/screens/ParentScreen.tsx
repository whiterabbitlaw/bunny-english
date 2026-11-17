import { useState } from 'react'
import { worlds } from '../data/worlds.ts'
import { micCapability, recognitionAvailable } from '../lib/capabilities.ts'
import { isParentUnlocked, unlockParent } from '../lib/parent-lock.ts'
import type { ReminderMinutes } from '../lib/storage.ts'
import { speakEnglish } from '../lib/speech.ts'
import { initVoices } from '../lib/speech.ts'
import { useVoiceStatus } from '../hooks/useVoiceStatus.ts'
import { useStore } from '../state/store.tsx'
import { BunnyMascot } from '../components/Bunny.tsx'
import { HoldButton } from '../components/HoldButton.tsx'
import { Shell } from '../components/Shell.tsx'
import { Button } from '../components/ui/button.tsx'
import { Modal } from '../components/ui/dialog.tsx'
import { SettingSwitch } from '../components/ui/switch.tsx'

const reminders: Array<{ value: ReminderMinutes; label: string }> = [
  { value: 0, label: '关闭' },
  { value: 10, label: '10 分钟' },
  { value: 15, label: '15 分钟' },
  { value: 20, label: '20 分钟' },
]

export function ParentScreen() {
  const { state, updateSettings, resetProgress } = useStore()
  const voice = useVoiceStatus()
  const [unlocked, setUnlocked] = useState(() => isParentUnlocked())
  const [confirmReset, setConfirmReset] = useState(false)
  const [sample, setSample] = useState('')
  const mic = micCapability()
  const recognition = recognitionAvailable()

  if (!unlocked) {
    return (
      <Shell backHref="#/" backLabel="返回首页">
        <div className="mx-auto mt-8 flex max-w-lg flex-1 flex-col items-center gap-4 text-center">
          <div className="h-40 w-40">
            <BunnyMascot mood="think" />
          </div>
          <h1 className="font-display text-4xl">请家长按住</h1>
          <p className="text-lg leading-8 text-ink-soft">这一页给大人。请按住下面的按钮大约一秒半。孩子不容易误打开。</p>
          <HoldButton
            testId="parent-gate"
            label="按住进入"
            onComplete={() => {
              unlockParent()
              setUnlocked(true)
            }}
          />
        </div>
      </Shell>
    )
  }

  const micText =
    mic === 'ok'
      ? '可以在读一读里询问麦克风权限。录音只留在页面内存，不上传。'
      : mic === 'insecure'
        ? '当前不是安全连接（需要 HTTPS 或 localhost），麦克风不可用。'
        : '这台浏览器没有本地录音接口。'

  return (
    <Shell backHref="#/" backLabel="返回首页">
      <div className="mx-auto mt-5 flex w-full max-w-3xl flex-1 flex-col gap-5">
        <div>
          <h1 className="font-display text-4xl text-ink">家长区</h1>
          <p className="mt-2 text-lg leading-8 text-ink-soft">设置只保存在这台浏览器里。没有账号，也不会把学习记录发到别处。</p>
        </div>

        <section className="rounded-[28px] bg-cream-card p-5 shadow-[0_12px_40px_rgba(42,33,24,0.06)]">
          <h2 className="font-display text-2xl">这台设备现在能做什么</h2>
          <ul className="mt-3 space-y-3 text-base leading-7">
            <li data-testid="cap-tts" data-state={voice.status}>
              <strong>英语朗读：</strong> {voice.detail}
              {voice.names.length > 0 ? <span className="block text-ink-soft">读到的英语语音：{voice.names.join('；')}</span> : null}
            </li>
            <li data-testid="cap-mic" data-state={mic}>
              <strong>麦克风录音：</strong> {micText}
            </li>
            <li data-testid="cap-recognition" data-state={recognition ? 'available' : 'unsupported'}>
              <strong>词语识别：</strong>{' '}
              {recognition
                ? '这台浏览器有 SpeechRecognition 接口。它只在你打开下面的开关、并且孩子再点一次按钮时才会使用。它不是发音评分。'
                : '这台浏览器没有语音识别接口。可以忽略这个功能，录音回放不受影响。'}
            </li>
            <li data-testid="cap-install">
              <strong>添加到主屏幕：</strong> 如果浏览器支持，可以用浏览器菜单安装。这不是应用商店。安装后页面可能暂时打开，但英语语音和麦克风仍然取决于设备和是否为安全连接，不能保证离线朗读。
            </li>
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="ghost"
              size="md"
              data-testid="refresh-caps"
              onClick={() => {
                initVoices()
                setSample('')
              }}
            >
              再检查一次
            </Button>
            <Button
              variant="sun"
              size="md"
              data-testid="parent-sample"
              onClick={() => {
                void speakEnglish('cat', state.settings.sound).then((result) => {
                  setSample(
                    result === 'muted'
                      ? '声音关着，所以没有朗读。'
                      : result === 'spoken'
                        ? '已请求朗读 cat。如果没听见，这台设备可能没有英语语音。'
                        : '这次没能朗读 cat。',
                  )
                })
              }}
            >
              试听 cat
            </Button>
          </div>
          {sample ? <p className="mt-3 text-base leading-7">{sample}</p> : null}
        </section>

        <section className="rounded-[28px] bg-cream-card p-5">
          <h2 className="font-display text-2xl">声音</h2>
          <div className="mt-3">
            <SettingSwitch
              id="sound-switch"
              testId="sound-switch"
              label={state.settings.sound ? '声音开' : '声音关'}
              checked={state.settings.sound}
              onCheckedChange={(checked) => updateSettings({ sound: checked })}
            />
          </div>
          <p className="mt-2 text-base leading-7 text-ink-soft">关掉后，单词不会朗读，听一听会改为显示英语单词。</p>
        </section>

        <section className="rounded-[28px] bg-cream-card p-5">
          <h2 className="font-display text-2xl">休息提醒</h2>
          <p className="mt-2 text-base leading-7 text-ink-soft">到时间后兔兔会建议休息眼睛。孩子可以继续玩，没有惩罚，也没有倒计时锁。</p>
          <div role="radiogroup" aria-label="休息提醒" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {reminders.map((item) => {
              const active = state.settings.reminderMinutes === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`reminder-${item.value}`}
                  className={`min-h-14 rounded-full font-display text-lg ${active ? 'bg-teal text-white' : 'bg-white text-ink'}`}
                  onClick={() => updateSettings({ reminderMinutes: item.value })}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[28px] bg-coral-soft p-5">
          <h2 className="font-display text-2xl">词语对照（可选）</h2>
          <p data-testid="word-match-disclosure" className="mt-2 text-base leading-7 text-ink">
            开启后，孩子点“对一下单词”时，浏览器的语音识别会听一小段话，并给出识别到的文字。本应用只检查这些文字里有没有目标单词。这不是发音评分，不会显示分数，也不会判断读得像不像。部分浏览器会把这段声音发送给系统或浏览器厂商的服务器来识别。小兔英语没有自己的服务器，不会另外上传、保存或出售音频。录音回放不使用这项识别。如果设备没有这个功能，或你不希望声音离开设备，请保持关闭。
          </p>
          <div className="mt-3">
            <SettingSwitch
              id="word-match-switch"
              testId="word-match-switch"
              label="允许词语对照"
              checked={state.settings.wordMatchOptIn}
              onCheckedChange={(checked) => updateSettings({ wordMatchOptIn: checked })}
            />
          </div>
        </section>

        <section className="rounded-[28px] bg-cream-card p-5">
          <h2 className="font-display text-2xl">这台设备上的记录</h2>
          <ul className="mt-3 space-y-1 text-lg leading-8">
            <li>星星 {state.stars}</li>
            <li>听完并记下的单词 {state.heard.length}/{worlds.reduce((sum, world) => sum + world.words.length, 0)}</li>
            <li>听一听答对 {state.listenCorrect}</li>
            <li>完成配对 {state.matchClears}</li>
            <li>完成小课堂 {state.sessionClears}</li>
            <li>本地录音 {state.recordCount}</li>
          </ul>
          <Button className="mt-4" variant="coral" data-testid="reset-open" onClick={() => setConfirmReset(true)}>
            清空学习记录
          </Button>
        </section>
      </div>
      <Modal
        open={confirmReset}
        testId="reset-dialog"
        title="清空学习记录？"
        description="会清掉这台设备上的星星、听过的单词和游戏次数。家长设置会保留。此操作不能撤销。"
        onClose={() => setConfirmReset(false)}
      >
        <Button data-testid="reset-cancel" variant="ghost" onClick={() => setConfirmReset(false)}>
          再想想
        </Button>
        <Button
          data-testid="reset-confirm"
          onClick={() => {
            resetProgress()
            setConfirmReset(false)
          }}
        >
          确认清空
        </Button>
      </Modal>
    </Shell>
  )
}
