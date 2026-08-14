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
 * Тёмная полупрозрачная полоса со скруглением сверху — она лежит поверх
 * страницы, а не отделена от неё границей, и размывает то, что под ней.
 * Отсюда и цвет с прозрачностью: без размытия он выглядит просто серым.
 *
 * Гамбургер стоит слева от логотипа намеренно. В макете при прокрутке
 * шапка сжимается в пилюлю, и там он тоже слева — если поставить его
 * справа, точка входа в меню переезжала бы при скролле, и человек
 * каждый раз искал бы её заново.
 *
 * Кнопки «Подобрать» здесь нет по макету: сразу под шапкой идёт строка
 * подбора со своей кнопкой, и вторая рядом была бы шумом.
 *
 * Меню-оверлей и сжатие при прокрутке пока не сделаны — гамбургер ведёт
 * в каталог.
 */
export function SiteHeader() {
  return (
    <header className="rounded-t-[var(--radius-block)] border border-white/8 bg-[rgba(18,18,20,0.44)] backdrop-blur-[26px] backdrop-saturate-[1.35]">
      <div className="flex h-14 items-center gap-6 px-[22px]">
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
          className="shrink-0 font-[family-name:var(--font-display)] text-[15px] tracking-[0.24em] text-ink"
        >
          AUTOPROFI
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm text-ink lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-opacity hover:opacity-65"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          <Link
            href={urls.catalog()}
            aria-label="Поиск"
            className="hidden h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-white/10 text-ink transition-colors hover:border-white/25 sm:flex"
          >
            <span aria-hidden className="text-sm">
              ⌕
            </span>
          </Link>

          <div className="text-right">
            <a href={PHONE_HREF} className="block text-[15px] font-semibold text-ink">
              {PHONE}
            </a>
            <span className="text-[11px] text-ink-muted">{HOURS}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
