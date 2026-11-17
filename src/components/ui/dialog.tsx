import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  testId?: string
}

export function Modal({ open, title, description, onClose, children, testId }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#2a2118]/45" />
        <Dialog.Content
          data-testid={testId}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] bg-cream p-6 shadow-[0_24px_80px_rgba(42,33,24,0.25)]"
        >
          <Dialog.Title className="font-display text-3xl text-ink">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-3 text-lg leading-8 text-ink-soft">{description}</Dialog.Description>
          ) : null}
          <div className="mt-5 flex flex-col gap-3">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
