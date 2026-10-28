'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { addCarAction, deleteVariantAction, type ActionResult } from '@/admin/catalog-actions'

/**
 * Добавление машины: марка, модель, кузов.
 *
 * Марку и модель можно выбрать из подсказки или вписать новую — если
 * такая уже есть, она и возьмётся, дубля «Geely» и «geely» не будет.
 * Поколение и годы — то, чем кузова одной модели различаются: фаркоп
 * подбирается к кузову, а не к модели целиком.
 */
export function CarForm({ brandNames }: { brandNames: string[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<ActionResult, FormData>(addCarAction, {})
  const [, startTransition] = useTransition()
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.ok) return
    form.current?.reset()
    router.refresh()
  }, [state, router])

  return (
    <form ref={form} onSubmit={keepOnError(action, startTransition)} className="grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr]">
      <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
        Марка
        <input name="brand" list="brand-names" required placeholder="Например, Geely" className="ctl" />
        <datalist id="brand-names">
          {brandNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
        Модель
        <input name="model" required placeholder="Например, Okavango" className="ctl" />
      </label>
      <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
        Поколение или кузов — если есть
        <input name="generation" placeholder="Например, 2 или NF" className="ctl" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
          Год с
          <input name="yearFrom" inputMode="numeric" placeholder="2023" className="ctl" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
          Год по
          <input name="yearTo" inputMode="numeric" placeholder="пусто — выпускается" className="ctl" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink-dark px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Сохраняю…' : 'Добавить машину'}
        </button>
        {state.error && <span className="text-[13px] text-accent">{state.error}</span>}
        {state.ok && <span className="text-[13px] text-ink-dark">{state.ok}</span>}
      </div>
    </form>
  )
}

export function DeleteCarButton({ variantId, label }: { variantId: number; label: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Удалить «${label}»?`)) return
          startTransition(async () => {
            const result = await deleteVariantAction(variantId)
            if (result.error) setError(result.error)
            router.refresh()
          })
        }}
        className="text-[12px] text-ink-muted hover:text-accent"
      >
        удалить
      </button>
      {error && <span className="text-[12px] text-accent">{error}</span>}
    </span>
  )
}

/**
 * Отправка формы без её очистки.
 *
 * Форма с action={...} после отправки сама сбрасывается — так устроен
 * React. При ошибке («Год окончания раньше начала») человеку пришлось бы
 * вписывать всё заново, а в форме фаркопа это дюжина полей. Поэтому
 * отправляем вручную, а очищаем сами — только после успеха.
 */
export function keepOnError(
  action: (data: FormData) => void,
  startTransition: (callback: () => void) => void,
) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => action(data))
  }
}
