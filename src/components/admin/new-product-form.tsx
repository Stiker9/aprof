'use client'

import { useActionState, useTransition } from 'react'
import { addProductAction, type ActionResult } from '@/admin/catalog-actions'
import { keepOnError } from './car-form'
import { CarPicker } from './car-picker'
import { SpecFields } from './spec-fields'

/**
 * Новый фаркоп — которого нет в каталоге поставщика.
 *
 * Поля те же, что у товаров из выгрузки, и по ним же работает сайт:
 * нагрузка и тип шара — в фильтре, вырез бампера — в карточке и
 * фильтре, наличие — в бейдже. Незаполненное поле на сайте выглядит как
 * «нет данных», поэтому обязательны только артикул, цена и машина.
 *
 * Машина здесь одна — первая. Остальные добавляются в карточке товара,
 * в «Подходит к», куда форма и переводит после сохранения; там же фото.
 */
export function NewProductForm({
  manufacturers,
  balls,
}: {
  manufacturers: string[]
  balls: string[]
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addProductAction, {})
  // После успеха форма уходит на страницу товара, очищать её не нужно.
  const [, startTransition] = useTransition()
  const label = 'flex flex-col gap-1 text-[12px] text-ink-muted'

  return (
    <form onSubmit={keepOnError(action, startTransition)} className="grid max-w-3xl gap-4">
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <label className={label}>
          Производитель
          <input name="manufacturer" list="manufacturers" required placeholder="Например, Oris" className="ctl" />
          <datalist id="manufacturers">
            {manufacturers.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className={label}>
          Артикул
          <input name="article" required placeholder="Например, 4513.12" className="ctl" />
        </label>
        <label className={label}>
          Цена, ₽
          <input name="price" required inputMode="numeric" placeholder="12 690" className="ctl" />
        </label>
      </fieldset>

      <div className={label}>
        Подходит к — первая машина, остальные добавите в карточке товара
        <CarPicker name="variantId" />
      </div>

      <SpecFields balls={balls} />

      <label className={label}>
        Описание
        <textarea
          name="description"
          rows={3}
          placeholder="Например: фаркоп на Geely Okavango 2023– без выреза бампера, съёмный шар."
          className="ctl resize-y"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Сохраняю…' : 'Добавить фаркоп'}
        </button>
        {state.error && <span className="text-[13px] text-accent">{state.error}</span>}
      </div>
    </form>
  )
}
