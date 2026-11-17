export const UNLOCK_KEY = 'bunny-parent-unlock'

export function unlockParent() {
  sessionStorage.setItem(UNLOCK_KEY, '1')
}

export function isParentUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}
