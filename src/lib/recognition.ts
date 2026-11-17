import { recognitionCtor } from './capabilities.ts'
import { heardMatches } from './match-text.ts'

export type MatchOutcome =
  | { status: 'match'; transcript: string }
  | { status: 'miss'; transcript: string }
  | { status: 'empty'; transcript: string }
  | { status: 'error'; message: string }
  | { status: 'unsupported' }

function errorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '浏览器没有允许语音识别。'
    case 'no-speech':
      return '没有听到说话声。可以再试一次，或只使用录音回放。'
    case 'audio-capture':
      return '没有可用的麦克风来做词语对照。'
    case 'network':
      return '词语对照需要浏览器连接它自己的识别服务，这次没有连上。录音回放不走这个服务。'
    case 'aborted':
      return '识别已取消。'
    default:
      return '这次没有识别成功。可以改听自己的录音。'
  }
}

export function recognizeWord(target: string): Promise<MatchOutcome> {
  const Ctor = recognitionCtor()
  if (!Ctor) return Promise.resolve({ status: 'unsupported' })

  return new Promise((resolve) => {
    const recog = new Ctor()
    recog.lang = 'en-US'
    recog.continuous = false
    recog.interimResults = false
    recog.maxAlternatives = 1
    let settled = false
    const finish = (outcome: MatchOutcome) => {
      if (settled) return
      settled = true
      resolve(outcome)
    }

    recog.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? ''
      if (!transcript) finish({ status: 'empty', transcript: '' })
      else if (heardMatches(transcript, target)) finish({ status: 'match', transcript })
      else finish({ status: 'miss', transcript })
    }
    recog.onerror = (event) => {
      finish({ status: 'error', message: errorMessage(event.error) })
    }
    recog.onend = () => {
      window.setTimeout(() => finish({ status: 'empty', transcript: '' }), 60)
    }

    try {
      recog.start()
    } catch {
      finish({ status: 'error', message: '这次没能开始识别。' })
      return
    }

    window.setTimeout(() => {
      try {
        recog.stop()
      } catch {
        // The browser may already have stopped.
      }
      finish({ status: 'error', message: '等了一会儿，还没有识别结果。' })
    }, 8000)
  })
}
