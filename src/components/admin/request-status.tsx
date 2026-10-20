'use client'

import { useTransition } from 'react'
import { updateRequest } from '@/admin/actions'
import { REQUEST_STATUSES, type RequestStatus } from '@/admin/store'

/**
 * Состояние заявки — выпадающий список, который сохраняется сразу.
 *
 * Четыре состояния, не два. «Новая/обработана» мало: между звонком и
 * записью проходит день-два, и без середины владелец заново звонит тем,
 * с кем уже говорил.
 *
 * «Не по делу» вместо «удалить»: заявки — персональные данные, и
 * удалять их по нажатию нельзя. Если человек потом позвонит сам,
 * выяснить, что он уже писал, будет нечем.
 */
export function RequestStatusSelect({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition()

  return (
    <select
      className="ctl"
      value={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as RequestStatus
        const data = new FormData()
        data.set('id', String(id))
        data.set('status', next)
        start(async () => {
          await updateRequest(data)
        })
      }}
    >
      {REQUEST_STATUSES.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
