import { useEffect, useState } from 'react'
import { parseHash, titleFor, type Route } from './lib/routes.ts'
import { StoreProvider } from './state/store.tsx'
import { ReminderDialog } from './components/Reminder.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { WorldScreen } from './screens/WorldScreen.tsx'
import { LearnScreen } from './screens/LearnScreen.tsx'
import { ListenScreen } from './screens/ListenScreen.tsx'
import { MatchScreen } from './screens/MatchScreen.tsx'
import { SpeakScreen } from './screens/SpeakScreen.tsx'
import { SessionScreen } from './screens/SessionScreen.tsx'
import { ParentScreen } from './screens/ParentScreen.tsx'

function Screen({ route }: { route: Route }) {
  switch (route.screen) {
    case 'home':
      return <HomeScreen />
    case 'parent':
      return <ParentScreen />
    case 'world':
      return <WorldScreen worldId={route.world} />
    case 'learn':
      return <LearnScreen worldId={route.world} />
    case 'listen':
      return <ListenScreen worldId={route.world} />
    case 'match':
      return <MatchScreen worldId={route.world} />
    case 'speak':
      return <SpeakScreen worldId={route.world} />
    case 'session':
      return <SessionScreen worldId={route.world} />
    default:
      return <HomeScreen />
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = titleFor(route)
  }, [route])

  return (
    <StoreProvider>
      <Screen route={route} />
      <ReminderDialog />
    </StoreProvider>
  )
}
