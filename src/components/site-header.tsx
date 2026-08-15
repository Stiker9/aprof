'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

/** Порог из макета: 24 пикселя прокрутки. */
const SCROLL_THRESHOLD = 24

/** Кривая и длительности взяты из исходника — на глаз их не подобрать. */
const SHELL_TRANSITION =
  'height 820ms cubic-bezier(.16,1,.3,1), width 620ms cubic-bezier(.16,1,.3,1), border-radius 820ms cubic-bezier(.16,1,.3,1), background 420ms ease, border-color 420ms ease'

/**
 * Шапка сайта.
 *
 * Не полоса во всю ширину, а плавающая пилюля по центру. Она липнет к
 * верху окна и не занимает места в потоке: обёртка нулевой высоты с
 * отрицательным отступом — иначе шапка сдвигала бы первый экран вниз,
 * и фотография не доходила бы до края.
 *
 * При прокрутке пилюля складывается: с полной ширины до 660 пикселей,
 * скругление с 18 сверху до 28 по кругу, а вместо меню остаются
 * гамбургер, логотип и кнопка. Смысл в том, что дальше по странице
 * человек уже выбрал раздел, и шесть ссылок ему только мешают — но
 * точка входа в меню и кнопка заказа должны остаться под рукой.
 *
 * Оба ряда лежат друг на друге и переключаются прозрачностью, а не
 * подстановкой: так их можно плавно перекрестить, и ширина пилюли
 * анимируется независимо от того, что внутри.
 *
 * Меню-оверлей, в которое пилюля разворачивается по гамбургеру, пока
 * не сделано — гамбургер ведёт в каталог.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="pointer-events-none sticky top-1.5 z-40 -mb-1.5 flex h-0 justify-center">
      <header
        className="pointer-events-auto relative h-14 overflow-hidden border border-white/8 bg-[rgba(18,18,20,0.44)] shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-[26px] backdrop-saturate-[1.35]"
        style={{
          width: scrolled ? '660px' : '100%',
          borderRadius: scrolled ? '28px' : '18px 18px 0 0',
          transition: SHELL_TRANSITION,
        }}
      >
        {/* Развёрнутый ряд — пока страница не прокручена */}
        <div
          className="absolute inset-x-0 top-0 grid h-14 grid-cols-[auto_1fr_auto] items-center gap-7 px-[22px]"
          style={{
            opacity: scrolled ? 0 : 1,
            pointerEvents: scrolled ? 'none' : 'auto',
            transition: scrolled ? 'opacity 160ms ease' : 'opacity 260ms ease 160ms',
          }}
        >
          <div className="flex items-center gap-4 justify-self-start">
            <Link href={urls.catalog()} aria-label="Меню" className="relative block h-6 w-6">
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

          <nav className="hidden items-center gap-7 justify-self-center lg:flex">
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

          <div className="flex items-center gap-4 justify-self-end">
            <Link
              href={urls.catalog()}
              aria-label="Поиск"
              className="hidden h-[34px] w-[34px] items-center justify-center rounded-full border border-white/22 text-sm text-ink transition-colors hover:border-white/50 sm:flex"
            >
              <span aria-hidden>⌕</span>
            </Link>
            <div className="flex flex-col items-end gap-px">
              <a
                href={CONTACTS.phoneHref}
                className="whitespace-nowrap text-[15px] font-semibold text-ink"
              >
                {CONTACTS.phone}
              </a>
              <span className="whitespace-nowrap text-[11px] text-ink-muted">{CONTACTS.hours}</span>
            </div>
          </div>
        </div>

        {/* Сжатый ряд — когда страница прокручена */}
        <div
          className="absolute inset-x-0 top-0 flex h-14 items-center justify-between px-[22px]"
          style={{
            opacity: scrolled ? 1 : 0,
            pointerEvents: scrolled ? 'auto' : 'none',
            transition: scrolled ? 'opacity 260ms ease 160ms' : 'opacity 160ms ease',
          }}
        >
          <Link href={urls.catalog()} aria-label="Меню" className="relative block h-6 w-6">
            <span className="absolute left-px top-2 h-[1.5px] w-[21px] rounded-sm bg-ink" />
            <span className="absolute left-px top-4 h-[1.5px] w-[21px] rounded-sm bg-ink" />
          </Link>

          <Link
            href={urls.home()}
            className="font-[family-name:var(--font-display)] text-sm tracking-[0.24em] text-ink"
          >
            AUTOPROFI
          </Link>

          <Link
            href={urls.catalog()}
            className="whitespace-nowrap rounded-full bg-accent px-3.5 py-[7px] text-xs font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110"
          >
            Подобрать
          </Link>
        </div>
      </header>
    </div>
  )
}
