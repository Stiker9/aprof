'use client'

import { useState, useTransition } from 'react'
import { savePromoShape } from '@/admin/actions'
import { ListField } from './list-field'

interface Item {
  model: string
  discount: string
}

/**
 * Форма акции: одна скидка на всё или перечень позиций.
 *
 * ── Почему переключатель, а не два разных типа записи ──
 *
 * Владелец не должен решать, «какого типа» акцию он заводит, до того
 * как придумал её. Он пишет заголовок, а потом видит, что скидка на
 * три модели разная, и переключает. Выбор типа при создании заставил
 * бы заводить акцию заново.
 *
 * ── Почему позиции сохраняются целиком, а не по ячейке ──
 *
 * Это один массив в базе, не отдельные строки. Сохранять по ячейке
 * значит читать массив, менять один элемент и писать обратно — а две
 * правки подряд в соседних ячейках затёрли бы друг друга.
 */
export function PromoKind({
  id,
  kind,
  discount,
  discountNote,
  items,
}: {
  id: number
  kind: 'text' | 'list'
  discount: string
  discountNote: string
  items: Item[]
}) {
  const [rows, setRows] = useState<Item[]>(items.length > 0 ? items : [{ model: '', discount: '' }])
  const [pending, start] = useTransition()

  function save(nextKind: 'text' | 'list', nextRows: Item[]) {
    const data = new FormData()
    data.set('id', String(id))
    data.set('kind', nextKind)
    data.set('items', JSON.stringify(nextRows))
    start(async () => {
      await savePromoShape(data)
    })
  }

  return (
    <div>
      <div className="mb-2 flex gap-1">
        <Choice active={kind === 'text'} disabled={pending} onClick={() => save('text', rows)}>
          Одна скидка
        </Choice>
        <Choice active={kind === 'list'} disabled={pending} onClick={() => save('list', rows)}>
          Список позиций
        </Choice>
      </div>

      {kind === 'text' ? (
        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
          <div>
            <Label>Размер скидки</Label>
            <ListField
              list="promo"
              id={id}
              field="discount"
              value={discount}
              placeholder="−15%"
            />
          </div>
          <div>
            <Label>Условие</Label>
            <ListField
              list="promo"
              id={id}
              field="discountNote"
              value={discountNote}
              placeholder="при установке в нашем сервисе"
            />
          </div>
        </div>
      ) : (
        <div>
          <Label>Позиции</Label>
          <div className="flex flex-col gap-1.5">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <input
                  className="ctl"
                  value={row.model}
                  disabled={pending}
                  placeholder="Toyota RAV4"
                  onChange={(event) => {
                    const next = [...rows]
                    next[index] = { ...row, model: event.target.value }
                    setRows(next)
                  }}
                  onBlur={() => save('list', rows)}
                />
                <input
                  className="ctl w-28 text-right"
                  value={row.discount}
                  disabled={pending}
                  placeholder="−15%"
                  onChange={(event) => {
                    const next = [...rows]
                    next[index] = { ...row, discount: event.target.value }
                    setRows(next)
                  }}
                  onBlur={() => save('list', rows)}
                />
                <button
                  type="button"
                  disabled={pending || rows.length === 1}
                  title="Убрать позицию"
                  onClick={() => {
                    const next = rows.filter((_, i) => i !== index)
                    setRows(next)
                    save('list', next)
                  }}
                  className="px-1.5 text-ink-dim transition-colors hover:text-accent disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => setRows([...rows, { model: '', discount: '' }])}
            className="mt-1.5 text-[12px] text-ink-muted transition-colors hover:text-accent"
          >
            + ещё позиция
          </button>
        </div>
      )}
    </div>
  )
}

function Choice({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[12px] transition-colors disabled:opacity-50 ${
        active
          ? 'border-ink-dark bg-ink-dark text-paper'
          : 'border-line-light bg-white text-ink-muted hover:border-ink-muted'
      }`}
    >
      {children}
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-ink-muted">{children}</span>
}
