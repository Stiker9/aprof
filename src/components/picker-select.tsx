'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { formatNumber } from '@/catalog/format'

export interface PickerOption {
  s: string
  n: string
  c: number
}

const POPULAR_SLUGS = ['toyota', 'kia', 'hyundai', 'volkswagen', 'chery', 'geely', 'bmw', 'mazda']

/**
 * Список выбора с поиском.
 *
 * Системный `<select>` здесь не годится: марок 106, моделей у иной
 * марки под сотню, и найти свою прокруткой невозможно. Поэтому свой
 * список с полем поиска и числом фаркопов у каждой строки — число
 * сразу отвечает на вопрос «а есть ли вообще под мою машину».
 *
 * Клавиатура работает целиком: стрелки ведут по списку, Enter выбирает,
 * Escape закрывает. Это не про доступность ради галочки — подбор
 * заполняют подряд, и тянуться к мыши на каждом шаге утомительно.
 */
export function PickerSelect({
  label,
  value,
  options,
  disabled = false,
  loading = false,
  onChange,
  searchHint,
  brandTiles = false,
  expanded,
  onExpandedChange,
}: {
  label: string
  value: string
  options: PickerOption[]
  disabled?: boolean
  loading?: boolean
  onChange: (slug: string) => void
  /** Подсказка в поле поиска: «Поиск по 106 маркам». */
  searchHint: string
  brandTiles?: boolean
  expanded?: boolean
  onExpandedChange?: (value: boolean) => void
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = expanded ?? localOpen
  const setOpen = (value: boolean) => { setLocalOpen(value); onExpandedChange?.(value) }
  const [showAll, setShowAll] = useState(false)
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.s === value)
  const tiles = brandTiles && !showAll && !query.trim()

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && tiles) return POPULAR_SLUGS.flatMap(slug => options.filter(option => option.s === slug))
    if (!q) return options
    return options.filter((o) => o.n.toLowerCase().includes(q))
  }, [options, query, tiles])

  // Закрытие по клику мимо и по Escape — иначе список остаётся висеть
  // поверх страницы и перехватывает нажатия.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) search.current?.focus()
    else {
      setQuery('')
      setActive(0)
      setShowAll(false)
    }
  }, [open])

  // Подсвеченная строка держится в видимой части списка при ходьбе стрелками
  useEffect(() => {
    if (!open) return
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const pick = (slug: string) => {
    setOpen(false)
    onChange(slug)
  }

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.max(0, Math.min(i + 1, found.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = found[active]
      if (item) pick(item.s)
    }
  }

  return (
    <div ref={root} className={`relative min-w-0 flex-1 ${open ? 'z-50' : ''}`}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        /*
          Надпись белая во всех состояниях. Раньше у невыбранного поля
          она была серой (ink-muted) и лежала на тёмной подложке — на
          фотографии первого экрана читалась с трудом, а у отключённых
          полей поверх ложилась ещё и прозрачность в 45%, и «Модель» с
          «Кузовом» пропадали почти совсем.

          Затемнение осталось, как и просил заказчик: пока поле не
          выбрано, у него слабее рамка и подложка, а пока недоступно —
          приглушено целиком. Но приглушено до 65%, а не до 45: разница
          видна, а текст остаётся читаемым.
        */
        className={`flex w-full items-center justify-between gap-3 rounded-[10px] border px-4 py-3.5 text-left text-sm text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-65 ${
          selected ? 'border-white/15 bg-surface-3' : 'border-white/8 bg-surface-3/50'
        }`}
      >
        <span className="truncate">{loading ? 'Загружаем…' : (selected?.n ?? label)}</span>
        {/*
          Стрелка фирменного красного, а не цвета текста поля: это
          единственный намёк на то, что поле раскрывается, и в общей
          серой строке он терялся.
        */}
        <span aria-hidden className={`text-accent text-xs transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className={`absolute left-0 top-[calc(100%+8px)] z-50 w-full max-w-[calc(100vw-40px)] overflow-hidden rounded-xl border border-[#393b40] bg-[#141517] shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${brandTiles ? 'lg:min-w-[430px]' : ''}`}>
          <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
            <span aria-hidden className="text-sm text-ink-muted">
              ⌕
            </span>
            <input
              ref={search}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onSearchKey}
              placeholder={searchHint}
              aria-label={searchHint}
              role="combobox"
              aria-expanded={open}
              aria-controls={id}
              aria-activedescendant={found[active] ? `${id}-${active}` : undefined}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </div>

          {tiles && <p className="px-4 pt-3 text-[11px] uppercase tracking-[0.12em] text-[#a4a6ad]">Популярные марки</p>}
          {found.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted">
              Ничего не нашлось. Позвоните — подберём под редкую модель.
            </p>
          ) : (
            <ul ref={list} id={id} role="listbox" aria-label={label}
              className={tiles ? 'grid max-h-[min(320px,45dvh)] grid-cols-2 gap-2 overflow-y-auto p-3 min-[400px]:grid-cols-4' : 'max-h-[min(320px,45dvh)] overflow-y-auto p-2'}>
              {found.map((option, index) => (
                <li key={option.s}>
                  <button
                    type="button"
                    role="option"
                    id={`${id}-${index}`}
                    aria-selected={option.s === value}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(option.s)}
                    className={`${tiles ? 'flex min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-[10px] border p-2' : 'flex min-h-12 w-full items-center justify-between gap-4 rounded-md px-3 py-3 text-left'} text-sm transition-colors ${
                      index === active || option.s === value ? 'border-accent/50 bg-[#30201f] text-white' : 'border-white/10 bg-[#1b1c1f] text-[#e8e8eb]'
                    }`}
                  >
                    {tiles && <Image src={`/images/logos/${option.s}.webp`} alt="" width={48} height={36} className="h-9 w-12 object-contain opacity-90 [filter:brightness(0)_invert(1)]" />}
                    <span className="truncate">{option.n}</span>
                    {option.s === value && <span aria-hidden="true" className="text-accent">✓</span>}
                    {/*
                      Счётчик может не приехать: браузер способен отдать
                      справочник от прошлой выкладки. Тогда строка просто
                      без числа — это лучше, чем уронить страницу целиком.
                    */}
                    {typeof option.c === 'number' ? (
                      <span className="shrink-0 text-xs text-[#a4a6ad]">
                        {formatNumber(option.c)}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {brandTiles && !query.trim() && <button type="button"
            onClick={() => { setShowAll(!showAll); setActive(0); search.current?.focus() }}
            className="min-h-12 px-4 text-sm text-[#ff7969] hover:text-white">
            {showAll ? 'Популярные марки' : `Все ${options.length} марок`} →
          </button>}
        </div>
      )}
    </div>
  )
}
