import type { ButtonHTMLAttributes } from 'react'
import { buttonStyles } from '../../lib/button-style.ts'
import { cn } from '../../lib/cn.ts'
import type { VariantProps } from 'class-variance-authority'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>

export function Button({ className, variant, size, type = 'button', ...props }: Props) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />
}
