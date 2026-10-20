'use client'

import { useTransition } from 'react'
import { toggleField } from '@/admin/actions'
import type { OverrideEntity } from '@/admin/store'

/**
 * Переключатель «да/нет», который сохраняется сразу по нажатию.
 *
 * Выключенное состояние не хранится в базе: правка просто удаляется.
 * Строка «hidden = 0» и отсутствие строки означали бы одно и то же, но
 * первая попала бы в очередь публикации как изменение, а вторая нет —
 * и счётчик «правок не на сайте» врал бы на каждый случайный двойной
 * щелчок.
 */
export function Toggle({
  entity,
  targetKey,
  field,
  on,
  label,
  danger = false,
}: {
  entity: OverrideEntity
  targetKey: string
  field: string
  on: boolean
  label: string
  /** Включение — нежелательное состояние (скрыть товар): подсвечиваем. */
  danger?: boolean
}) {
  const [pending, start] = useTransition()

  function flip() {
    const data = new FormData()
    data.set('entity', entity)
    data.set('targetKey', targetKey)
    data.set('field', field)
    data.set('on', on ? '0' : '1')
    start(async () => {
      await toggleField(data)
    })
  }

  return (
    <button
      type="button"
      onClick={flip}
      disabled={pending}
      aria-pressed={on}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-50 ${
        on
          ? danger
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-in-stock bg-in-stock/10 text-in-stock'
          : 'border-line-light bg-white text-ink-muted hover:border-ink-muted'
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          on ? (danger ? 'bg-accent' : 'bg-in-stock') : 'bg-line-light'
        }`}
      />
      {label}
    </button>
  )
}
