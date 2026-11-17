import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { initVoices } from '../lib/speech.ts'
import {
  freshState,
  loadPersisted,
  savePersisted,
  type Persisted,
  type Settings,
} from '../lib/storage.ts'

type Action =
  | { type: 'add-stars'; amount: number }
  | { type: 'hear'; id: string }
  | { type: 'listen-correct' }
  | { type: 'match-clear' }
  | { type: 'session-clear' }
  | { type: 'recorded' }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'dismiss-reminder' }
  | { type: 'reset-progress' }

function clampStars(value: number) {
  return Math.min(999, Math.max(0, Math.floor(value)))
}

function reducer(state: Persisted, action: Action): Persisted {
  switch (action.type) {
    case 'add-stars':
      return { ...state, stars: clampStars(state.stars + action.amount) }
    case 'hear':
      if (state.heard.includes(action.id)) return state
      return { ...state, heard: [...state.heard, action.id], stars: clampStars(state.stars + 1) }
    case 'listen-correct':
      return {
        ...state,
        listenCorrect: state.listenCorrect + 1,
        stars: clampStars(state.stars + 1),
      }
    case 'match-clear':
      return { ...state, matchClears: state.matchClears + 1 }
    case 'session-clear':
      return { ...state, sessionClears: state.sessionClears + 1 }
    case 'recorded':
      return { ...state, recordCount: state.recordCount + 1 }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'dismiss-reminder':
      return { ...state, reminderDismissedFor: state.sessionStartedAt }
    case 'reset-progress':
      return {
        ...freshState(state.sessionStartedAt),
        settings: state.settings,
        sessionStartedAt: state.sessionStartedAt,
        reminderDismissedFor: state.reminderDismissedFor,
      }
    default:
      return state
  }
}

type Store = {
  state: Persisted
  addStars: (amount: number) => void
  markHeard: (id: string) => void
  markListenCorrect: () => void
  markMatchClear: () => void
  markSessionClear: () => void
  markRecorded: () => void
  updateSettings: (patch: Partial<Settings>) => void
  dismissReminder: () => void
  resetProgress: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersisted)

  useEffect(() => {
    savePersisted(state)
  }, [state])

  useEffect(() => {
    initVoices()
  }, [])

  const api = useMemo<Store>(
    () => ({
      state,
      addStars: (amount) => dispatch({ type: 'add-stars', amount }),
      markHeard: (id) => dispatch({ type: 'hear', id }),
      markListenCorrect: () => dispatch({ type: 'listen-correct' }),
      markMatchClear: () => dispatch({ type: 'match-clear' }),
      markSessionClear: () => dispatch({ type: 'session-clear' }),
      markRecorded: () => dispatch({ type: 'recorded' }),
      updateSettings: (patch) => dispatch({ type: 'settings', patch }),
      dismissReminder: () => dispatch({ type: 'dismiss-reminder' }),
      resetProgress: () => dispatch({ type: 'reset-progress' }),
    }),
    [state],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('StoreProvider is missing')
  return store
}
