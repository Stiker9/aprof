'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addFitAction, removeFitAction } from '@/admin/catalog-actions'
import { CarPicker } from './car-picker'

export interface FitItem {
  fitmentId: number
  label: string
  addedByOwner: boolean
}

/**
 * «Подходит к» — на какие машины встаёт фаркоп.
 *
 * Именно по этому списку товар попадает на страницы машин, в фильтры и
 * в подбор. Поставщик даёт его готовым, но бывает неполным: 4513.12
 * ставили на Audi Q7, а в выгрузке Q7 у него не было — и покупатель Q7
 * этот фаркоп на сайте не нашёл бы.
 *
 * Добавить можно любую машину из каталога или новую из «Машин». Убрать
 * — любую, кроме последней: товар без машин выпал бы из каталога, а
 * убрать товар с сайта — это «Скрыть».
 */
export function ProductFits({ slug, fits }: { slug: string; fits: FitItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [variantId, setVariantId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [pickerKey, setPickerKey] = useState(0)

  function run(action: () => Promise<{ error?: string }>, after?: () => void) {
    setError('')
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
      else after?.()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5">
        {fits.map((fit) => (
          <li
            key={fit.fitmentId}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-light bg-white py-1 pl-3 pr-1 text-[12px]"
          >
            {fit.label}
            {fit.addedByOwner && <span className="text-[10px] text-accent">добавлено вами</span>}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`Убрать «${fit.label}» из совместимости?`)) run(() => removeFitAction(fit.fitmentId))
              }}
              aria-label={`Убрать ${fit.label}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted hover:bg-accent/10 hover:text-accent"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <CarPicker key={pickerKey} onChange={(id) => setVariantId(id)} />
        <button
          type="button"
          disabled={!variantId || pending}
          onClick={() =>
            variantId &&
            run(
              () => addFitAction(slug, variantId),
              () => {
                setVariantId(null)
                setPickerKey((k) => k + 1)
              },
            )
          }
          className="rounded-lg bg-ink-dark px-3 py-2 text-[13px] text-white disabled:opacity-40"
        >
          + Добавить машину
        </button>
      </div>

      <p className="text-[11px] text-ink-dim">
        Нужной машины нет в списке?{' '}
        <Link href="/admin/mashiny" className="text-accent hover:underline">
          Добавьте её в «Машинах»
        </Link>
        , потом выберите здесь. На сайте товар появится у машины после публикации.
      </p>

      {error && <p className="text-[12px] text-accent">{error}</p>}
    </div>
  )
}
