'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { urls } from '@/redesign/urls'
import { CONTACTS } from '@/content/contacts'
import { useScrolled } from '@/redesign/components/use-scrolled'

const NAV = [
  { label: 'Подбор', href: '/redesign/podbor', icon: 'M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10M15 15L21 21' },
  { label: 'Каталог', href: urls.catalog(), icon: 'M3 3H10V10H3ZM14 3H21V10H14ZM3 14H10V21H3ZM14 14H21V21H14Z' },
  { label: 'Установка', href: '/ustanovka-farkopa', icon: 'M14 6L18 10L21 7A6 6 0 0 1 13 14L6 21A2.1 2.1 0 0 1 3 18L10 11A6 6 0 0 1 17 3Z' },
  { label: 'Услуги', href: '/uslugi', icon: 'M7 3V8M17 3V8M5 8H19V11A7 7 0 0 1 5 11ZM12 18V22' },
  { label: 'Акции', href: '/akcii', icon: 'M19 5L5 19M9 6A3 3 0 1 1 3 6A3 3 0 1 1 9 6ZM21 18A3 3 0 1 1 15 18A3 3 0 1 1 21 18Z' },
  { label: 'Контакты', href: '/kontakty', icon: 'M20 10C20 16 12 22 12 22S4 16 4 10A8 8 0 1 1 20 10ZM15 10A3 3 0 1 1 9 10A3 3 0 1 1 15 10Z' },
]

const SUBLINKS: Record<string, { label: string; href: string }[]> = {
  Установка: [
    { label: 'Записаться на установку', href: '/zapis' },
    { label: 'Наши работы', href: '/nashi-raboty' },
    { label: 'Гарантия', href: '/garantiya' },
    { label: 'Частые вопросы', href: '/redesign#faq' },
  ],
  Услуги: [{ label: 'Электрика и розетка', href: '/uslugi#elektrika' }],
  Контакты: [
    { label: 'О нас', href: '/o-nas' },
    { label: 'Отзывы', href: '/otzyvy' },
  ],
}

const SUBLINK_ICONS: Record<string, string> = {
  '/uslugi#podbor': 'M21 11A9 9 0 0 1 12 20H5L3 22V11A9 9 0 0 1 21 11ZM8 10H16M8 14H13',
  '/blog': 'M4 3H15L20 8V21H4ZM14 3V9H20M8 13H16M8 17H14',
  '/dostavka': 'M3 6H14V17H3ZM14 10H18L21 14V17H14M8 18A2 2 0 1 1 4 18A2 2 0 1 1 8 18M20 18A2 2 0 1 1 16 18A2 2 0 1 1 20 18',
  '/zapis': 'M4 5H20V21H4ZM8 3V7M16 3V7M4 10H20M8 15L11 18L16 13',
  '/nashi-raboty': 'M3 6H21V21H3ZM8 6V3H16V6M3 12H21M10 12V15H14V12',
  '/garantiya': 'M12 3L20 6V12C20 17 12 22 12 22S4 17 4 12V6ZM8 12L11 15L16 10',
  '/redesign#faq': 'M21 12A9 9 0 1 1 3 12A9 9 0 1 1 21 12M9 9A3 3 0 0 1 15 9C15 11 12 11 12 14M12 17H12.01',
  '/uslugi#elektrika': 'M7 3V8M17 3V8M5 8H19V11A7 7 0 0 1 5 11ZM12 18V22',
  '/o-nas': 'M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7M4 21V19A8 8 0 0 1 20 19V21',
  '/otzyvy': 'M12 3L15 9L22 10L17 15L18 22L12 19L6 22L7 15L2 10L9 9Z',
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0">
      <path d={path} />
    </svg>
  )
}

function DesktopItem({ item }: { item: (typeof NAV)[number] }) {
  const [expanded, setExpanded] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLAnchorElement>(null)
  const links = SUBLINKS[item.label]
  const id = `submenu-${item.href.replaceAll('/', '')}`

  useEffect(() => {
    if (!expanded) return
    const closeOutside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setExpanded(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [expanded])

  return (
    <div ref={container}
      className={`group relative flex items-stretch ${expanded ? 'bg-accent text-white' : 'text-ink hover:bg-accent hover:text-white'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          event.preventDefault()
          trigger.current?.focus()
          setExpanded(false)
        }
      }}>
      <Link ref={trigger} href={item.href}
        onFocus={() => { if (links) setExpanded(true) }}
        aria-expanded={links ? expanded : undefined}
        aria-controls={links && expanded ? id : undefined}
        className="inline-flex items-center gap-2 whitespace-nowrap px-2.5 text-[16px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white">
        <span className={`${expanded ? 'text-white' : 'text-accent'} group-hover:text-white [&>svg]:h-5 [&>svg]:w-5`}>
          <NavIcon path={item.icon} />
        </span>
        {item.label}
        {links && (
          <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}>
            <path d="M3 6L8 11L13 6" />
          </svg>
        )}
      </Link>
      {links && (
        <>
          {expanded && (
            <ul id={id} className="redesign-submenu absolute left-0 top-full z-50 w-[280px] rounded-b-lg border border-t-0 border-white/10 bg-[#20252b] p-2 text-white shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setExpanded(false)}
                    className="flex min-h-12 items-center gap-3 rounded px-3 py-3 text-sm text-white/85 transition-colors duration-150 hover:bg-accent/15 hover:text-white focus-visible:bg-accent/15 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    <span className="text-accent"><NavIcon path={SUBLINK_ICONS[link.href] ?? item.icon} /></span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export function SiteHeader() {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const onHome = usePathname() === urls.home()

  useEffect(() => {
    if (scrolled) setOpen(false)
  }, [scrolled])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)')
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  const scrollTopOnHome = (event: MouseEvent) => {
    if (!onHome) return
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <div className="sticky top-0 z-40 h-0">
      <header className="border-b backdrop-blur-[26px] backdrop-saturate-[1.35]"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false)
            menuButton.current?.focus()
          }
        }}
        style={{
          background: open ? 'rgba(14,14,16,.98)' : scrolled ? 'rgba(16,16,20,.88)' : 'rgba(18,18,20,.44)',
          borderColor: scrolled || open ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.08)',
          boxShadow: scrolled && !open ? '0 8px 24px rgba(0,0,0,.28)' : 'none',
          transition: 'background 200ms ease, border-color 200ms ease',
        }}>
        <div className="relative flex items-center gap-3 px-5 sm:gap-5 sm:px-8 lg:px-14"
          style={{ height: scrolled && !open ? 'var(--header-h-min)' : 'var(--header-h)', transition: 'height 300ms ease' }}>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button ref={menuButton} type="button" onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="mobile-navigation"
              className="flex h-12 w-10 shrink-0 items-center justify-center text-ink xl:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={open ? 'M5 5L19 19M5 19L19 5' : 'M3 7H21M3 17H21'} />
              </svg>
            </button>
            <Link href={urls.home()} onClick={scrollTopOnHome}
              aria-label="VASHFARKOP — главная"
              className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <Image src="/images/redesign/vashfarkop-vf-transparent.png" alt="VASHFARKOP"
                width={2170} height={725} sizes="(min-width: 640px) 190px, 145px"
                className="h-auto w-[145px] sm:w-[190px]" />
            </Link>
          </div>
          <nav aria-label="Основная навигация" className="hidden h-full shrink-0 items-stretch xl:flex">
            {NAV.map((item) => <DesktopItem key={item.label} item={item} />)}
          </nav>
          <div className="flex items-center justify-end gap-3 sm:flex-1">
            <Link href={urls.catalog()} aria-label="Поиск"
              className="hidden h-[34px] w-[34px] items-center justify-center rounded-full border border-white/22 text-sm text-ink hover:border-white/50 sm:flex">
              <span aria-hidden="true">⌕</span>
            </Link>
            <div className="flex flex-col items-end gap-px">
              <a href={CONTACTS.phoneHref} className="flex min-h-10 items-center whitespace-nowrap text-sm font-semibold text-ink">
                <span className="hidden sm:inline">{CONTACTS.phone}</span>
                <span className="sm:hidden">Позвонить</span>
              </a>
              <span className="hidden overflow-hidden whitespace-nowrap text-[11px] text-ink-muted sm:block"
                style={{ maxHeight: scrolled && !open ? '0px' : '16px', opacity: scrolled && !open ? 0 : 1 }}>
                {CONTACTS.hours}
              </span>
            </div>
          </div>
        </div>
        {open && (
          <nav id="mobile-navigation" aria-label="Мобильная навигация"
            className="max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-white/15 px-5 pb-6 text-ink sm:px-8 xl:hidden">
            {NAV.map((item) => (
              <div key={item.label} className="border-b border-white/10 py-2">
                <Link href={item.href} onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 font-medium hover:text-accent">
                  <span className="text-accent"><NavIcon path={item.icon} /></span>
                  {item.label}
                </Link>
                {SUBLINKS[item.label] && (
                  <ul className="pl-8">
                    {SUBLINKS[item.label].map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} onClick={() => setOpen(false)}
                          className="flex min-h-12 items-center text-sm text-ink-muted hover:text-white focus-visible:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <a href={CONTACTS.phoneHref} className="mt-5 block text-lg">{CONTACTS.phone}</a>
            <p className="mt-2 text-sm text-ink-muted">{CONTACTS.address} · {CONTACTS.hours}</p>
          </nav>
        )}
      </header>
    </div>
  )
}


