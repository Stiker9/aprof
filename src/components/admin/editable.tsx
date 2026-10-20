'use client'

import { useState, useTransition } from 'react'
import { resetField, saveField } from '@/admin/actions'
import type { OverrideEntity } from '@/admin/store'

/**
 * Поле, которое сохраняется само.
 *
 * ── Почему без кнопки «Сохранить» ──
 *
 * Владелец правит цены пачками: прошёлся по десяти строкам, в каждой
 * поменял число. Кнопка на каждой строке — десять лишних нажатий, а
 * одна кнопка на всю таблицу означает, что случайно закрытая страница
 * уносит всю работу.
 *
 * Поэтому поле сохраняется, когда из него уходят: Tab, Enter или
 * щелчок мимо. Это привычно по таблицам.
 *
 * ── Почему рядом видно значение поставщика ──
 *
 * Пустое поле показывает серым то, что придёт из выгрузки. Без этого
 * нельзя отличить «цена не задана» от «задана такая же»: оба случая
 * выглядели бы пустым полем, и владелец правил бы цену, которая и так
 * верная.
 *
 * ── Почему Escape возвращает, а не очищает ──
 *
 * Очистка здесь означает «вернуться к цене поставщика» — это действие,
 * а не отмена. Отмена нужна чаще: начал печатать, понял, что не в ту
 * строку. Поэтому Escape возвращает прежнее, а сброс к поставщику —
 * отдельный крестик, по которому нельзя попасть случайно.
 */
export function Editable({
  entity,
  targetKey,
  field,
  value,
  fallback,
  placeholder,
  align = 'left',
  multiline = false,
  inputMode,
  className = '',
}: {
  entity: OverrideEntity
  targetKey: string
  field: string
  /** Правка владельца. Пустая строка — правки нет. */
  value: string
  /** Что покажет сайт без правки — подсказкой в пустом поле. */
  fallback?: string
  placeholder?: string
  align?: 'left' | 'right'
  multiline?: boolean
  inputMode?: 'numeric' | 'text'
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [shown, setShown] = useState(value)
  const [justSaved, setJustSaved] = useState(false)
  const [pending, start] = useTransition()

  /*
    Значение могло измениться снаружи — страница перерисовалась после
    сохранения или сброса. Приём из документации React: сравнить с
    запомненным и подправить состояние прямо при отрисовке, не доводя
    дело до useEffect с лишним проходом.
  */
  if (value !== shown) {
    setShown(value)
    setDraft(value)
    setJustSaved(false)
  }

  const dirty = draft !== value

  function save() {
    if (!dirty) return

    const data = new FormData()
    data.set('entity', entity)
    data.set('targetKey', targetKey)
    data.set('field', field)
    data.set('value', draft)

    start(async () => {
      await saveField(data)
      setJustSaved(true)
    })
  }

  function reset() {
    const data = new FormData()
    data.set('entity', entity)
    data.set('targetKey', targetKey)
    data.set('field', field)
    start(async () => {
      await resetField(data)
    })
  }

  const common = {
    value: draft,
    placeholder: placeholder ?? fallback ?? '',
    disabled: pending,
    inputMode,
    onChange: (e: { target: { value: string } }) => {
      setDraft(e.target.value)
      setJustSaved(false)
    },
    onBlur: save,
    className: `ctl ${align === 'right' ? 'text-right num' : ''} ${
      dirty ? 'border-accent' : ''
    } ${className}`,
  }

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          {...common}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDraft(value)
          }}
        />
      ) : (
        <input
          {...common}
          type="text"
          onKeyDown={(e) => {
            // Enter не отправляет форму, а снимает фокус: сохранение
            // висит на уходе из поля, и так путь один на все способы.
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') setDraft(value)
          }}
        />
      )}

      <Mark dirty={dirty} pending={pending} saved={justSaved} edited={value !== ''} onReset={reset} />
    </div>
  )
}

/**
 * Значок состояния поля в правом углу.
 *
 * Четыре состояния вместо «сохранено/не сохранено»: владелец должен
 * отличать «ещё не ушло» от «уже ушло» и видеть, что поле вообще
 * правлено — иначе через месяц не понять, какие цены свои, а какие из
 * выгрузки.
 *
 * Вынесен наружу: тем же значком пользуются поля списков (list-field.tsx),
 * у которых другой обработчик сохранения, но то же поведение.
 */
export function Mark({
  dirty,
  pending,
  saved,
  edited,
  onReset,
}: {
  dirty: boolean
  pending: boolean
  saved: boolean
  edited: boolean
  onReset: () => void
}) {
  if (pending) {
    return <Dot title="Сохраняю" className="bg-ink-muted" />
  }
  if (dirty) {
    return <Dot title="Не сохранено — уйдите из поля" className="bg-accent" />
  }
  if (saved) {
    return (
      <span
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[12px] text-in-stock"
        title="Сохранено"
      >
        ✓
      </span>
    )
  }
  if (edited) {
    return (
      <button
        type="button"
        onClick={onReset}
        title="Вернуть значение поставщика"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded px-1 text-[13px] leading-none text-ink-muted transition-colors hover:text-accent"
      >
        ×
      </button>
    )
  }
  return null
}

function Dot({ title, className }: { title: string; className: string }) {
  return (
    <span
      title={title}
      className={`pointer-events-none absolute top-1/2 right-2 size-1.5 -translate-y-1/2 rounded-full ${className}`}
    />
  )
}
