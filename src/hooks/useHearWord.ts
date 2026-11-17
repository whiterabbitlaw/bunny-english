import { useRef, useState } from 'react'
import type { Word } from '../data/worlds.ts'
import { speakEnglish, type SpeakResult } from '../lib/speech.ts'
import { useStore } from '../state/store.tsx'
import { useVoiceStatus } from './useVoiceStatus.ts'

type HearBucket = {
  id: string
  ticket: number
  result: SpeakResult | null
  pending: boolean
}

export function useHearWord(word: Word) {
  const { state, markHeard } = useStore()
  const voice = useVoiceStatus()
  const [bucket, setBucket] = useState<HearBucket | null>(null)
  const ticketRef = useRef(0)
  const view = bucket?.id === word.id ? bucket : { result: null, pending: false }

  async function hear() {
    const id = word.id
    const english = word.en
    const ticket = ticketRef.current + 1
    ticketRef.current = ticket
    setBucket({ id, ticket, result: null, pending: true })
    const outcome = await speakEnglish(english, state.settings.sound)
    setBucket((previous) => {
      if (!previous || previous.ticket !== ticket) return previous
      return { id, ticket, result: outcome, pending: false }
    })
    if (outcome === 'spoken') markHeard(id)
    return outcome
  }

  return {
    voice,
    result: view.result,
    pending: view.pending,
    hear,
    soundOn: state.settings.sound,
  }
}
