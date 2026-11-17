export type MicSupport = 'ok' | 'insecure' | 'unsupported'

export function micCapability(): MicSupport {
  if (typeof window === 'undefined') return 'unsupported'
  if (!window.isSecureContext) return 'insecure'
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return 'unsupported'
  return 'ok'
}

export function classifyMicError(error: unknown): 'denied' | 'missing' | 'insecure' | 'failed' {
  const name = error instanceof DOMException || error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'missing'
  if (name === 'SecurityError') return 'insecure'
  return 'failed'
}

type RecogResult = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type Recog = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecogResult) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecogCtor = new () => Recog

export function recognitionCtor(): RecogCtor | null {
  const host = window as Window & {
    SpeechRecognition?: RecogCtor
    webkitSpeechRecognition?: RecogCtor
  }
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null
}

export function recognitionAvailable(): boolean {
  return recognitionCtor() !== null
}
