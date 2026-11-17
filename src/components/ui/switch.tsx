import * as Switch from '@radix-ui/react-switch'

type Props = {
  id: string
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  testId?: string
}

export function SettingSwitch({ id, checked, label, onCheckedChange, testId }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3">
      <label htmlFor={id} className="font-display text-xl text-ink">
        {label}
      </label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        data-testid={testId}
        className="relative h-11 w-[4.5rem] shrink-0 cursor-pointer rounded-full bg-[#d9cfc3] data-[state=checked]:bg-teal"
      >
        <Switch.Thumb className="block size-9 translate-x-1 rounded-full bg-white shadow data-[state=checked]:translate-x-[1.35rem]" />
      </Switch.Root>
    </div>
  )
}
