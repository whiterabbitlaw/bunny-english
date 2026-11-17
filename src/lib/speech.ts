export type VoiceStatus = 'unsupported' | 'loading' | 'ready' | 'no-english' | 'empty'

export type VoiceSnapshot = {
  status: VoiceStatus
  detail: string
  names: string[]
}

export type SpeakResult = 'spoken' | 'muted' | 'unsupported' | 'failed' | 'replaced'

const LOADING: VoiceSnapshot = {
  status: 'loading',
  detail: '正在查找这台设备的英语语音…',
  names: [],
}

let snapshot: VoiceSnapshot = LOADING
let englishVoice: SpeechSynthesisVoice | null = null
let hooked = false
let speakToken = 0
const listeners = new Set<() => void>()

function publish(next: VoiceSnapshot) {
  if (
    snapshot.status === next.status &&
    snapshot.detail === next.detail &&
    snapshot.names.join('|') === next.names.join('|')
  ) {
    return
  }
  snapshot = next
  listeners.forEach((listener) => listener())
}

export function getVoiceSnapshot(): VoiceSnapshot {
  return snapshot
}

export function subscribeVoices(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function applyVoices() {
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis
  if (!synth || typeof synth.speak !== 'function' || typeof synth.getVoices !== 'function') {
    englishVoice = null
    publish({
      status: 'unsupported',
      detail: '浏览器不支持英语朗读（没有可用的 speechSynthesis）。仍然可以看图、认单词、玩游戏。',
      names: [],
    })
    return
  }

  let voices: SpeechSynthesisVoice[] = []
  try {
    voices = synth.getVoices()
  } catch {
    voices = []
  }

  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  englishVoice =
    english.find((voice) => voice.lang.toLowerCase().replace('_', '-') === 'en-us') ??
    english[0] ??
    null

  if (voices.length === 0) {
    publish({
      status: 'empty',
      detail: '没有读到可用语音。点“听一听”仍会尝试朗读，但不保证有声音。英语朗读取决于设备，不是这个网页自带的。',
      names: [],
    })
    return
  }

  if (!englishVoice) {
    publish({
      status: 'no-english',
      detail: '没有找到英语语音。可以看单词和图片。点听的时候会试一次，但可能没有英语声。',
      names: [],
    })
    return
  }

  publish({
    status: 'ready',
    detail: `英语语音已准备：${englishVoice.name}（${englishVoice.lang}）。不同设备的声音不一样。`,
    names: english.slice(0, 3).map((voice) => `${voice.name} · ${voice.lang}`),
  })
}

export function initVoices() {
  if (typeof window === 'undefined') return
  if (!hooked) {
    hooked = true
    const synth = window.speechSynthesis
    if (synth && typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', applyVoices)
    }
    window.setTimeout(applyVoices, 400)
    window.setTimeout(applyVoices, 1400)
  }
  applyVoices()
}

export function voiceNeedsPrint(status: VoiceStatus, soundOn: boolean): boolean {
  if (!soundOn) return true
  return status === 'unsupported' || status === 'empty' || status === 'no-english'
}

export function speakEnglish(text: string, soundOn: boolean): Promise<SpeakResult> {
  if (!soundOn) return Promise.resolve('muted')
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis
  if (!synth || typeof synth.speak !== 'function') return Promise.resolve('unsupported')

  const token = ++speakToken
  return new Promise((resolve) => {
    let settled = false
    let started = false
    let timer = 0
    const finish = (result: SpeakResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (token !== speakToken) {
        resolve('replaced')
        return
      }
      resolve(result)
    }

    try {
      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.84
      utterance.pitch = 1.04
      if (englishVoice) utterance.voice = englishVoice
      utterance.onstart = () => {
        started = true
      }
      utterance.onend = () => finish('spoken')
      utterance.onerror = (event) => {
        const reason = event.error
        if (reason === 'canceled' || reason === 'interrupted') finish('replaced')
        else finish('failed')
      }
      synth.speak(utterance)
      synth.resume()
    } catch {
      finish('failed')
      return
    }

    timer = window.setTimeout(() => finish(started ? 'spoken' : 'failed'), 4500)
  })
}

export function fallbackReason(status: VoiceStatus, soundOn: boolean): string | null {
  if (!soundOn) return '声音已关闭，所以先把英语单词显示出来。可以打开右上角的声音再听。'
  if (status === 'unsupported') return '浏览器不支持英语朗读，所以先把英语单词显示出来。'
  if (status === 'no-english') return '没有找到英语语音，所以先把英语单词显示出来。'
  if (status === 'empty') return '没有读到可用语音，所以先把英语单词显示出来。点喇叭仍会尝试。'
  return null
}
