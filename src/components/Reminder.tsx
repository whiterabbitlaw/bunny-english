import { useEffect, useState } from 'react'
import { useStore } from '../state/store.tsx'
import { BunnyMascot } from './Bunny.tsx'
import { Button } from './ui/button.tsx'
import { Modal } from './ui/dialog.tsx'

export function ReminderDialog() {
  const { state, dismissReminder } = useStore()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000)
    return () => window.clearInterval(id)
  }, [])

  const minutes = state.settings.reminderMinutes
  const due =
    minutes > 0 &&
    now - state.sessionStartedAt >= minutes * 60_000 &&
    state.reminderDismissedFor !== state.sessionStartedAt

  return (
    <Modal
      open={due}
      testId="reminder-dialog"
      title="眼睛休息一下吧"
      description="已经玩了一会儿。看看远处，眨眨眼，喝口水。这只是提醒，不会锁住游戏。"
      onClose={dismissReminder}
    >
      <div className="mx-auto h-28 w-28">
        <BunnyMascot mood="rest" />
      </div>
      <Button
        onClick={() => {
          dismissReminder()
        }}
      >
        再玩一会儿
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          dismissReminder()
          window.location.hash = '#/'
        }}
      >
        先回首页
      </Button>
    </Modal>
  )
}
