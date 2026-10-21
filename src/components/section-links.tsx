import Link from 'next/link'

const links = {
  selection: [
    { label: 'Подбор и консультация', href: '/uslugi#podbor' },
    { label: 'Полезные статьи', href: '/blog' },
  ],
  catalog: [{ label: 'Доставка и оплата', href: '/dostavka' }],
}

export function SectionLinks({ kind }: { kind: keyof typeof links }) {
  return (
    <nav aria-label={kind === 'selection' ? 'Помощь с подбором' : 'Информация о покупке'}
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-ink-dark/10 py-2">
      <span className="mr-1 text-sm text-[#444442]">
        {kind === 'selection' ? 'Помощь с выбором:' : 'Покупателю:'}
      </span>
      {links[kind].map((link) => (
        <Link key={link.href} href={link.href}
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-ink-dark hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">
          {link.label}<span aria-hidden="true" className="text-accent">→</span>
        </Link>
      ))}
    </nav>
  )
}
