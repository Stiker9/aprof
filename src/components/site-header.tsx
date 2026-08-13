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

/**
 * Шапка сайта.
 *
 * Гамбургер стоит слева от логотипа намеренно. В макете при прокрутке
 * шапка сжимается в пилюлю, и там он тоже слева — если поставить его
 * справа, точка входа в меню переезжала бы при скролле, и человек
 * каждый раз искал бы её заново.
 *
 * Полное меню-оверлей пока не сделано, гамбургер ведёт в каталог.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-6 py-4">
        <Link
          href={urls.catalog()}
          aria-label="Меню"
          className="flex shrink-0 flex-col gap-[3px] p-1"
        >
          <span className="block h-[1.5px] w-[18px] bg-ink" />
          <span className="block h-[1.5px] w-[18px] bg-ink" />
          <span className="block h-[1.5px] w-[18px] bg-ink" />
        </Link>

        <Link
          href={urls.home()}
          className="shrink-0 font-[family-name:var(--font-display)] text-sm tracking-[0.22em] text-ink"
        >
          AUTOPROFI
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm text-ink-muted lg:flex">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-5 lg:ml-0">
          <div className="hidden text-right sm:block">
            <a href={PHONE_HREF} className="block text-[15px] font-bold text-ink">
              {PHONE}
            </a>
            <span className="text-[11px] text-ink-muted">{HOURS}</span>
          </div>
          <Link
            href={urls.catalog()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Подобрать
          </Link>
        </div>
      </div>
    </header>
  )
}
