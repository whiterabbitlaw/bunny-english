export const STORAGE_KEY = 'bunny-english-state-v1'

export type ReminderMinutes = 0 | 10 | 15 | 20

export type Settings = {
  sound: boolean
  reminderMinutes: ReminderMinutes
  wordMatchOptIn: boolean
}

export type Persisted = {
  version: 1
  stars: number
  heard: string[]
  listenCorrect: number
  matchClears: number
  sessionClears: number
  recordCount: number
  settings: Settings
  sessionStartedAt: number
  reminderDismissedFor: number | null
}

const THREE_HOURS = 3 * 60 * 60 * 1000

export function defaultSettings(): Settings {
  return {
    sound: true,
    reminderMinutes: 15,
    wordMatchOptIn: false,
  }
}

export function freshState(now = Date.now()): Persisted {
  return {
    version: 1,
    stars: 0,
    heard: [],
    listenCorrect: 0,
    matchClears: 0,
    sessionClears: 0,
    recordCount: 0,
    settings: defaultSettings(),
    sessionStartedAt: now,
    reminderDismissedFor: null,
  }
}

function clampCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(9999, Math.max(0, Math.floor(value)))
}

function clampStars(value: unknown): number {
  return Math.min(999, clampCount(value))
}

function asReminder(value: unknown): ReminderMinutes {
  if (value === 0 || value === 10 || value === 15 || value === 20) return value
  return 15
}

export function sanitizeState(input: unknown, now = Date.now()): Persisted {
  const base = freshState(now)
  if (!input || typeof input !== 'object') return base
  const parsed = input as Partial<Persisted>
  const settings = parsed.settings
  const sessionStartedAt = typeof parsed.sessionStartedAt === 'number' && Number.isFinite(parsed.sessionStartedAt)
    ? parsed.sessionStartedAt
    : base.sessionStartedAt
  const stale = now - sessionStartedAt > THREE_HOURS
  return {
    version: 1,
    stars: clampStars(parsed.stars),
    heard: Array.isArray(parsed.heard) ? parsed.heard.filter((id): id is string => typeof id === 'string').slice(0, 48) : [],
    listenCorrect: clampCount(parsed.listenCorrect),
    matchClears: clampCount(parsed.matchClears),
    sessionClears: clampCount(parsed.sessionClears),
    recordCount: clampCount(parsed.recordCount),
    settings: {
      sound: settings?.sound !== false,
      reminderMinutes: asReminder(settings?.reminderMinutes),
      wordMatchOptIn: settings?.wordMatchOptIn === true,
    },
    sessionStartedAt: stale ? now : sessionStartedAt,
    reminderDismissedFor: stale || typeof parsed.reminderDismissedFor !== 'number' ? null : parsed.reminderDismissedFor,
  }
}

export function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    return sanitizeState(JSON.parse(raw))
  } catch {
    return freshState()
  }
}

export function savePersisted(state: Persisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
