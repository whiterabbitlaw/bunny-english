import { useSyncExternalStore } from 'react'
import { getVoiceSnapshot, subscribeVoices, type VoiceSnapshot } from '../lib/speech.ts'

export function useVoiceStatus(): VoiceSnapshot {
  return useSyncExternalStore(subscribeVoices, getVoiceSnapshot, getVoiceSnapshot)
}
