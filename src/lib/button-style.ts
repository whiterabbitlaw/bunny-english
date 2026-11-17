import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.ts'

export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-center font-display font-semibold leading-none select-none disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-teal text-white shadow-[0_8px_0_#085851]',
        coral: 'bg-coral-soft text-[#7a2e28]',
        sun: 'bg-sun text-[#5c4308] shadow-[0_8px_0_#b8881d]',
        ghost: 'bg-white/80 text-ink',
        quiet: 'bg-transparent text-teal-deep underline decoration-2 underline-offset-4',
      },
      size: {
        lg: 'min-h-16 px-6 text-xl',
        md: 'min-h-14 px-5 text-lg',
        sm: 'min-h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  },
)

export function buttonClass(
  options?: VariantProps<typeof buttonStyles> & {
    className?: string
  },
) {
  return cn(buttonStyles({ variant: options?.variant, size: options?.size }), options?.className)
}
