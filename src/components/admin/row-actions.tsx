'use client'

import { useState, useTransition } from 'react'
import { addListRow, deleteListRow, moveListRow, toggleListVisible } from '@/admin/actions'
import type { ListName } from '@/admin/lists'

/**
 * Управление записью списка: показать/скрыть, передвинуть, удалить.
 *
 * ── Почему «скрыть» стоит первым и крупнее удаления ──
 *
 * В девяти случаях из десяти владельцу нужно именно скрыть: акция
 * кончилась, отзыв временно убрать, снимок заменить. Скрытое можно
 * вернуть, удалённое нет. Если обе кнопки выглядят одинаково, рано или
 * поздно нажмут не ту — и восстанавливать будет нечего.
 *
 * ── Почему удаление в два нажатия, а не через окно подтверждения ──
 *
 * Системное `confirm()` в браузере выглядит чужеродно и на телефоне
 * перекрывает полэкрана. Кнопка, которая на три секунды превращается в
 * «точно?», делает то же самое: случайное нажатие не удаляет, а
 * намеренное стоит одного лишнего движения.
 */
export function RowActions({
  list,
  id,
  visible,
  first,
  last,
}: {
  list: ListName
  id: number
  visible: boolean
  first: boolean
  last: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, start] = useTransition()

  function send(action: (data: FormData) => Promise<void>, extra: Record<string, string> = {}) {
    const data = new FormData()
    data.set('list', list)
    data.set('id', String(id))
    for (const [key, value] of Object.entries(extra)) data.set(key, value)
    start(async () => {
      await action(data)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => send(toggleListVisible, { on: visible ? '0' : '1' })}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-50 ${
          visible
            ? 'border-in-stock bg-in-stock/10 text-in-stock'
            : 'border-line-light bg-white text-ink-muted hover:border-ink-muted'
        }`}
      >
        <span className={`size-2 rounded-full ${visible ? 'bg-in-stock' : 'bg-line-light'}`} />
        {visible ? 'На сайте' : 'Скрыт'}
      </button>

      <div className="flex overflow-hidden rounded-lg border border-line-light">
        <button
          type="button"
          disabled={pending || first}
          onClick={() => send(moveListRow, { direction: 'up' })}
          title="Выше"
          className="px-2 py-1 text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink-dark disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || last}
          onClick={() => send(moveListRow, { direction: 'down' })}
          title="Ниже"
          className="border-l border-line-light px-2 py-1 text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink-dark disabled:opacity-30"
        >
          ↓
        </button>
      </div>

      {confirming ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => send(deleteListRow)}
            className="rounded-lg bg-accent px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            Точно удалить
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-1.5 py-1 text-[12px] text-ink-muted hover:text-ink-dark"
          >
            отмена
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="px-1.5 py-1 text-[12px] text-ink-dim transition-colors hover:text-accent"
        >
          удалить
        </button>
      )}
    </div>
  )
}

/** Кнопка «добавить запись» — одна на список. */
export function AddRowButton({
  list,
  label,
  scope,
}: {
  list: ListName
  label: string
  /** Только для вопросов: в какой из двух списков добавлять. */
  scope?: 'home' | 'catalog'
}) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const data = new FormData()
        data.set('list', list)
        if (scope) data.set('scope', scope)
        start(async () => {
          await addListRow(data)
        })
      }}
      className="rounded-lg bg-ink-dark px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-ink-dark/85 disabled:opacity-60"
    >
      {pending ? 'Добавляю…' : label}
    </button>
  )
}
