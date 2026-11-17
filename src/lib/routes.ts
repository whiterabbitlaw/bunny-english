import { isWorldId, type WorldId } from '../data/worlds.ts'

export type ActivityScreen = 'world' | 'learn' | 'listen' | 'match' | 'speak' | 'session'

export type Route =
  | { screen: 'home' }
  | { screen: 'parent' }
  | { screen: ActivityScreen; world: WorldId }

const activities = new Set<ActivityScreen>(['world', 'learn', 'listen', 'match', 'speak', 'session'])

export function parseHash(hash: string): Route {
  const path = (hash.startsWith('#') ? hash.slice(1) : hash) || '/'
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return { screen: 'home' }
  if (parts[0] === 'parent') return { screen: 'parent' }
  const screen = parts[0]
  const world = parts[1]
  if (screen && world && activities.has(screen as ActivityScreen) && isWorldId(world)) {
    return { screen: screen as ActivityScreen, world }
  }
  return { screen: 'home' }
}

export function pathFor(route: Route): string {
  if (route.screen === 'home') return '#/'
  if (route.screen === 'parent') return '#/parent'
  return `#/${route.screen}/${route.world}`
}

export function titleFor(route: Route): string {
  switch (route.screen) {
    case 'home':
      return '小兔英语'
    case 'parent':
      return '家长区 · 小兔英语'
    case 'world':
      return '主题 · 小兔英语'
    case 'learn':
      return '学一学 · 小兔英语'
    case 'listen':
      return '听一听 · 小兔英语'
    case 'match':
      return '配一配 · 小兔英语'
    case 'speak':
      return '读一读 · 小兔英语'
    case 'session':
      return '小课堂 · 小兔英语'
    default:
      return '小兔英语'
  }
}
