import Link from 'next/link'
import { urls } from '@/catalog/urls'

const PHONE = '+7 (812) 123-45-67'
const PHONE_HREF = 'tel:+78121234567'
const HOURS = 'Пн–Сб 9:00–19:00'

const NAV = [
  { label: 'Каталог', href: urls.catalog() },
  { label: 'Подбор по авто', href: urls.catalog() },
  { label: 'Установка', href: '/ustanovka-farkopa' },
  { label: 'Услуги', href: '/uslugi' },
  { label: 'Акции', href: '/akcii' },
  { label: 'Контакты', href: '/kontakty' },
]

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-4">
        <Link
          href={urls.home()}
          className="font-[family-name:var(--font-display)] text-sm tracking-[0.22em] text-ink"
        >
          AUTOPROFI
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-muted lg:flex">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto text-right">
          <a href={PHONE_HREF} className="block text-base font-bold text-ink">
            {PHONE}
          </a>
          <span className="text-xs text-ink-muted">{HOURS}</span>
        </div>
      </div>
    </header>
  )
}
