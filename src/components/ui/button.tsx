import Link from 'next/link'
import type { ReactNode } from 'react'

const BASE =
  'inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition-colors'

const VARIANTS = {
  solid: 'rounded-lg bg-accent text-white hover:bg-accent-hover',
  outline: 'rounded-lg border border-line text-ink hover:border-ink-muted',
  pill: 'rounded-full bg-accent text-white hover:bg-accent-hover',
} as const

export function Button({
  children,
  variant = 'solid',
  href,
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  variant?: keyof typeof VARIANTS
  href?: string
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles = `${BASE} ${VARIANTS[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={styles} disabled={disabled}>
      {children}
    </button>
  )
}
