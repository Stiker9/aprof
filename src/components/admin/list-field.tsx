'use client'

import { useState, useTransition } from 'react'
import { saveListField } from '@/admin/actions'
import type { ListName } from '@/admin/lists'
import { Mark } from './editable'

/**
 * Поле записи списка: отзыва, акции, снимка работы.
 *
 * Отличается от Editable только тем, куда сохраняет. Там правка
 * ложится слоем поверх выгрузки поставщика, здесь — прямо в свою
 * таблицу: у отзыва нет «значения поставщика», к которому можно
 * вернуться, он весь свой.
 *
 * Отсюда и разница в поведении: крестика «вернуть исходное» нет, а
 * пустое поле — это просто пустое поле, а не «удалить правку».
 */
export function ListField({
  list,
  id,
  field,
  value,
  placeholder,
  multiline = false,
  rows = 3,
  className = '',
}: {
  list: ListName
  id: number
  field: string
  value: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [shown, setShown] = useState(value)
  const [justSaved, setJustSaved] = useState(false)
  const [pending, start] = useTransition()

  // Значение изменилось снаружи — страница перерисовалась после
  // сохранения. Приём из документации React, как и в Editable.
  if (value !== shown) {
    setShown(value)
    setDraft(value)
    setJustSaved(false)
  }

  const dirty = draft !== value

  function save() {
    if (!dirty) return

    const data = new FormData()
    data.set('list', list)
    data.set('id', String(id))
    data.set('field', field)
    data.set('value', draft)

    start(async () => {
      await saveListField(data)
      setJustSaved(true)
    })
  }

  const common = {
    value: draft,
    placeholder,
    disabled: pending,
    onChange: (event: { target: { value: string } }) => {
      setDraft(event.target.value)
      setJustSaved(false)
    },
    onBlur: save,
    className: `ctl ${dirty ? 'border-accent' : ''} ${className}`,
  }

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          {...common}
          rows={rows}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setDraft(value)
          }}
        />
      ) : (
        <input
          {...common}
          type="text"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') setDraft(value)
          }}
        />
      )}

      <Mark dirty={dirty} pending={pending} saved={justSaved} edited={false} onReset={() => {}} />
    </div>
  )
}
