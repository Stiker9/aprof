'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatNumber } from '@/catalog/format'

export interface PickerOption {
  s: string
  n: string
  c: number
}

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
}: {
  label: string
  value: string
  options: PickerOption[]
  disabled?: boolean
  loading?: boolean
  onChange: (slug: string) => void
  /** Подсказка в поле поиска: «Поиск по 106 маркам». */
  searchHint: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.s === value)

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.n.toLowerCase().includes(q))
  }, [options, query])

  // Закрытие по клику мимо и по Escape — иначе список остаётся висеть
  // поверх страницы и перехватывает нажатия.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
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
    }
  }, [open])

  // Подсвеченная строка держится в видимой части списка при ходьбе стрелками
  useEffect(() => {
    if (!open) return
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const pick = (slug: string) => {
    onChange(slug)
    setOpen(false)
  }

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, found.length - 1))
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
    <div ref={root} className="relative flex-1">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-[10px] border px-4 py-3.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
          selected ? 'border-white/15 bg-surface-3 text-ink' : 'border-white/8 bg-surface-3/50 text-ink-muted'
        }`}
      >
        <span className="truncate">{loading ? 'Загружаем…' : (selected?.n ?? label)}</span>
        <span aria-hidden className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[rgba(18,18,20,0.96)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-[26px]">
          <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
            <span aria-hidden className="text-sm text-ink-dim">
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
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
            />
          </div>

          {found.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted">
              Ничего не нашлось. Позвоните — подберём под редкую модель.
            </p>
          ) : (
            <ul ref={list} role="listbox" className="max-h-[320px] overflow-y-auto py-1">
              {found.map((option, index) => (
                <li key={option.s}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.s === value}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(option.s)}
                    className={`flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors ${
                      index === active ? 'bg-white/8 text-ink' : 'text-ink-muted'
                    }`}
                  >
                    <span className="truncate">{option.n}</span>
                    {/*
                      Счётчик может не приехать: браузер способен отдать
                      справочник от прошлой выкладки. Тогда строка просто
                      без числа — это лучше, чем уронить страницу целиком.
                    */}
                    {typeof option.c === 'number' ? (
                      <span className="shrink-0 text-xs text-ink-dim">
                        ({formatNumber(option.c)})
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
