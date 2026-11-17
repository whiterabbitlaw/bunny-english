import type { SpeakResult, VoiceSnapshot } from '../lib/speech.ts'

export function VoiceStatusText({ voice }: { voice: VoiceSnapshot }) {
  return (
    <p data-testid="tts-status" data-state={voice.status} className="text-base leading-7 text-ink-soft">
      {voice.detail}
    </p>
  )
}

export function HearResult({ result, voice }: { result: SpeakResult | null; voice: VoiceSnapshot }) {
  if (!result || result === 'replaced') return null
  const text =
    result === 'spoken'
      ? voice.status === 'ready'
        ? '已用英语语音播放。'
        : '已请求播放。如果这台设备没有英语语音，可能听不到声音。'
      : result === 'muted'
        ? '声音已关闭。请先打开右上角的声音，再听英语。'
        : result === 'unsupported'
          ? '这台浏览器不能朗读。请看图片和单词。'
          : '这次没能朗读。英语语音取决于设备，这个网页没有自带声音。'

  return (
    <p data-testid="tts-result" data-state={result} role="status" className="rounded-2xl bg-sun-soft px-4 py-3 text-base leading-7 text-ink">
      {text}
    </p>
  )
}
