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

/** Быстрые действия в меню — три вещи, ради которых сюда заходят. */
const ACTIONS = [
  { num: '01', label: 'Подобрать фаркоп', href: urls.catalog() },
  { num: '02', label: 'Записаться на установку', href: '/zapis' },
  { num: '03', label: 'Рассчитать доставку', href: '/dostavka' },
]

const COLUMNS = [
  {
    head: 'Каталог и услуги',
    links: [
      { label: 'Каталог фаркопов', href: urls.catalog() },
      { label: 'Подбор по автомобилю', href: urls.catalog() },
      { label: 'Электрика и розетка', href: '/uslugi#elektrika' },
      { label: 'Подбор и консультация', href: '/uslugi#podbor' },
      { label: 'Сварка и ремонт ТСУ', href: '/uslugi#remont-tsu' },
    ],
  },
  {
    head: 'О компании',
    links: [
      { label: 'О нас', href: '/o-nas' },
      { label: 'Наши работы', href: '/nashi-raboty' },
      { label: 'Отзывы', href: '/otzyvy' },
      { label: 'Акции', href: '/akcii' },
      { label: 'Блог', href: '/blog' },
    ],
  },
  {
    head: 'Покупателю',
    links: [
      { label: 'Доставка и оплата', href: '/dostavka' },
      { label: 'Гарантия', href: '/garantiya' },
      { label: 'Контакты', href: '/kontakty' },
      { label: 'Частые вопросы', href: '/ustanovka-farkopa' },
    ],
  },
]

/** Порог из макета: 24 пикселя прокрутки. */
const SCROLL_THRESHOLD = 24
const EASE = 'cubic-bezier(.16,1,.3,1)'

const SHELL_TRANSITION = `height 820ms ${EASE}, width 620ms ${EASE}, border-radius 820ms ${EASE}, background 420ms ease, border-color 420ms ease`

/**
 * Появление строки меню.
 *
 * Строки не возникают разом, а выплывают по очереди с задержкой и
 * лёгким размытием. Задержки взяты из исходника макета: карточки
 * действий с 300 мс через 70, ссылки столбцов с 430 через 50 —
 * порядок появления повторяет порядок чтения.
 *
 * При закрытии задержек нет: меню должно исчезать сразу, а не
 * досматриваться в обратном порядке.
 */
function reveal(open: boolean, delay: number, distance: number) {
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : `translateY(${distance}px)`,
    filter: open ? 'blur(0px)' : 'blur(6px)',
    transition: `opacity 620ms ease ${open ? delay : 0}ms, transform 900ms ${EASE} ${
      open ? delay : 0
    }ms, filter 620ms ease ${open ? delay : 0}ms`,
    pointerEvents: open ? ('auto' as const) : ('none' as const),
  }
}

/**
 * Шапка сайта.
 *
 * Не полоса во всю ширину, а плавающая пилюля по центру. Она липнет к
 * верху окна и не занимает места в потоке: обёртка нулевой высоты с
 * отрицательным отступом — иначе шапка сдвигала бы первый экран вниз,
 * и фотография не доходила бы до края.
 *
 * У пилюли три состояния, и все три — одна и та же коробка с разными
 * размерами:
 *
 * - развёрнутая строка меню, пока страница не прокручена;
 * - сжатая до 660 пикселей после 24 пикселей прокрутки;
 * - раскрытое меню высотой 600 по нажатию на гамбургер.
 *
 * Поэтому размеры анимируются на самой оболочке, а содержимое трёх
 * состояний лежит друг на друге и переключается прозрачностью. Если
 * подставлять содержимое вместо анимации, коробка будет прыгать.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > SCROLL_THRESHOLD
      setScrolled(next)
      // Прокрутка закрывает меню: держать его раскрытым над уезжающей
      // страницей незачем, а закрывать вручную — лишнее действие.
      if (next) setOpen(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const narrow = open || scrolled

  const burger =
    'absolute left-px h-[1.5px] w-[21px] rounded-sm bg-ink transition-[transform,top] duration-[620ms]'
  const burgerStyle = (rotate: string, top: string) => ({
    top,
    transform: rotate,
    transitionTimingFunction: EASE,
  })

  return (
    <div className="pointer-events-none sticky top-1.5 z-40 -mb-1.5 flex h-0 justify-center">
      <header
        className="pointer-events-auto relative overflow-hidden border backdrop-blur-[26px] backdrop-saturate-[1.35]"
        style={{
          width: scrolled && !open ? '660px' : '100%',
          height: open ? 'var(--menu-open-height)' : '56px',
          borderRadius: open ? '16px' : scrolled ? '28px' : '18px 18px 0 0',
          background: open ? 'rgba(14,14,16,.86)' : 'rgba(18,18,20,.44)',
          borderColor: open ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.08)',
          boxShadow: open
            ? '0 24px 60px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.14)'
            : '0 8px 24px rgba(0,0,0,.2)',
          transition: SHELL_TRANSITION,
        }}
      >
        {/* Развёрнутая строка — пока страница не прокручена и меню закрыто */}
        <div
          className="absolute inset-x-0 top-0 z-[2] grid h-14 grid-cols-[auto_1fr_auto] items-center gap-7 px-[22px]"
          style={{
            opacity: narrow ? 0 : 1,
            pointerEvents: narrow ? 'none' : 'auto',
            transition: narrow ? 'opacity 160ms ease' : 'opacity 260ms ease 160ms',
          }}
        >
          <div className="flex items-center gap-4 justify-self-start">
            <span className="block h-6 w-6" aria-hidden />
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

        {/* Сжатая строка — при прокрутке и при раскрытом меню */}
        <div
          className="absolute inset-x-0 top-0 z-[3] flex h-14 items-center justify-between px-[22px]"
          style={{
            opacity: narrow ? 1 : 0,
            pointerEvents: narrow ? 'auto' : 'none',
            transition: narrow ? 'opacity 260ms ease 160ms' : 'opacity 160ms ease',
          }}
        >
          <span className="block h-6 w-6" aria-hidden />

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

        {/*
          Гамбургер лежит поверх обеих строк и не переключается вместе
          с ними: он один и тот же во всех трёх состояниях, и мигать при
          сжатии шапки ему незачем.
        */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Закрыть меню' : 'Меню'}
          aria-expanded={open}
          className="absolute left-[22px] top-4 z-[4] block h-6 w-6"
        >
          <span className={burger} style={burgerStyle(open ? 'rotate(45deg)' : 'rotate(0deg)', open ? '12px' : '8px')} />
          <span className={burger} style={burgerStyle(open ? 'rotate(-45deg)' : 'rotate(0deg)', open ? '12px' : '16px')} />
        </button>

        {/* Раскрытое меню */}
        <div
          className="absolute inset-x-0 bottom-0 top-14 flex flex-col items-center overflow-y-auto px-5 pt-3.5 text-ink sm:px-7"
          aria-hidden={!open}
        >
          <div className="flex w-full max-w-[1100px] flex-1 flex-col">
            <div className="grid gap-[18px] sm:grid-cols-3">
              {ACTIONS.map((action, index) => (
                <div key={action.num} style={reveal(open, 300 + index * 70, 18)}>
                  <Link
                    href={action.href}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className="flex flex-col gap-8 border-y border-white/30 px-1 pb-3.5 pt-5 transition-colors hover:border-white/60"
                  >
                    <span className="text-xs text-[#8D8D8B]">{action.num}</span>
                    <span className="text-base leading-[1.25]">{action.label}</span>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-9 grid gap-8 sm:grid-cols-3">
              {COLUMNS.map((column) => (
                <div key={column.head} className="flex flex-col gap-0.5">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[#75757A]">
                    {column.head}
                  </div>
                  {column.links.map((link, index) => (
                    <div key={link.label} style={reveal(open, 430 + index * 50, 20)}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        tabIndex={open ? undefined : -1}
                        className="inline-block text-[18px] leading-[1.7] tracking-[-0.01em] transition-opacity hover:opacity-65"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div
              className="mt-auto flex items-end justify-between gap-6 border-t border-white/20 pb-5 pt-[18px] text-sm text-[#C6C6C3]"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(14px)',
                transition: open
                  ? `opacity 600ms ease 800ms, transform 800ms ${EASE} 800ms`
                  : 'opacity 260ms ease, transform 260ms ease',
              }}
            >
              <div className="flex flex-col gap-1">
                <span>
                  {CONTACTS.phone} · {CONTACTS.hours}
                </span>
                <span>{CONTACTS.address}</span>
              </div>
              <Link
                href="/politika-konfidencialnosti"
                onClick={() => setOpen(false)}
                tabIndex={open ? undefined : -1}
                className="whitespace-nowrap text-[13px] text-[#9C9C9A] underline"
              >
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}
