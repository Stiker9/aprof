import Link from 'next/link'
import { urls } from '@/catalog/urls'
import { CONTACTS } from '@/content/contacts'

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
 * Не полоса во всю ширину, а плавающая пилюля по центру. Она липнет к
 * верху окна и не занимает места в потоке: `height: 0` с отрицательным
 * отступом снизу — иначе она сдвигала бы первый экран вниз, и
 * фотография перестала бы доходить до края.
 *
 * Отсюда же и стекло: пилюля всё время лежит поверх содержимого, и
 * размывает то, что под ней проезжает при прокрутке.
 *
 * Полное меню-оверлей, в которое пилюля разворачивается по гамбургеру,
 * пока не сделано — там анимация размеров и три столбца ссылок. Кнопка
 * ведёт в каталог.
 */
export function SiteHeader() {
  return (
    <div className="sticky top-1.5 z-40 -mb-1.5 flex h-0 justify-center">
      <header className="flex h-14 w-full max-w-[1244px] items-center gap-7 overflow-hidden rounded-[var(--radius-block)] border border-white/10 bg-[rgba(18,18,20,0.44)] px-[22px] backdrop-blur-[26px] backdrop-saturate-[1.35]">
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={urls.catalog()}
            aria-label="Меню"
            className="relative block h-6 w-6"
          >
            <span className="absolute left-px top-2 h-[1.5px] w-[21px] rounded-sm bg-ink" />
            <span className="absolute left-px top-4 h-[1.5px] w-[21px] rounded-sm bg-ink" />
          </Link>

          <Link
            href={urls.home()}
            className="font-[family-name:var(--font-display)] text-[15px] tracking-[0.24em] text-ink"
          >
            AUTOPROFI
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-sm text-ink transition-opacity hover:opacity-65"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4 lg:ml-0">
          <Link
            href={urls.catalog()}
            aria-label="Поиск"
            className="hidden h-[34px] w-[34px] items-center justify-center rounded-full border border-white/22 text-sm text-ink transition-colors hover:border-white/50 sm:flex"
          >
            <span aria-hidden>⌕</span>
          </Link>

          <div className="text-right">
            <a
              href={CONTACTS.phoneHref}
              className="block whitespace-nowrap text-[15px] font-semibold text-ink"
            >
              {CONTACTS.phone}
            </a>
            <span className="whitespace-nowrap text-[11px] text-ink-muted">{CONTACTS.hours}</span>
          </div>
        </div>
      </header>
    </div>
  )
}
