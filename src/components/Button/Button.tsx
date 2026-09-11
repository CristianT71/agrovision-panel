import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'toggle'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  active?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  active = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'rounded-lg text-sm font-medium transition focus:outline-none'

  const styles: Record<Variant, string> = {
    primary:
      'flex w-full items-center justify-center gap-2 bg-[#1f5f3f] py-3 text-white enabled:hover:bg-[#194b32] disabled:cursor-not-allowed disabled:bg-[#9dc7ae]',
    toggle: active
      ? 'border border-transparent bg-[#1f5f3f] px-4 py-2.5 text-white'
      : 'border border-gray-200 bg-white px-4 py-2.5 text-gray-600 hover:border-gray-300',
  }

  return (
    <button type="button" className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}