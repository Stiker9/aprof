'use client'

import { useActionState, useRef } from 'react'
import { uploadProductPhoto, uploadWorkPhoto, type UploadState } from '@/admin/actions'

/**
 * Загрузка фотографии.
 *
 * ── Почему отправка начинается сразу после выбора файла ──
 *
 * Привычная связка «выбрать файл» плюс «загрузить» — это два нажатия
 * там, где нужно одно. Выбрав файл, человек уже сказал, чего хочет;
 * вторая кнопка только даёт забыть про неё и удивляться, почему
 * картинки нет.
 *
 * ── Почему видно, во что файл превратился ──
 *
 * Загруженное пересохраняется: разворачивается по EXIF, ужимается до
 * 1600 и переводится в webp. Снимок с телефона на 4 МБ становится
 * файлом на 200 КБ. Показать результат важно — иначе непонятно,
 * загрузилось ли вообще, а по виду плитки этого не сказать.
 *
 * ── Почему форма, а не fetch ──
 *
 * `<form action={…}>` отправляет файл и без JavaScript. Админку
 * открывают с телефона в мастерской, где связь плохая и скрипты
 * приходят последними.
 */
export function WorkPhotoUpload({
  id,
  photo,
  hint,
}: {
  id: number
  photo: string
  /** Название машины — попадёт в имя файла, чтобы папка читалась глазами. */
  hint: string
}) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadWorkPhoto, {})

  return (
    <Frame
      action={action}
      pending={pending}
      state={state}
      photo={photo}
      hidden={[
        ['id', String(id)],
        ['hint', hint],
      ]}
      empty="Нет фотографии"
    />
  )
}

export function ProductPhotoUpload({ slug, photo }: { slug: string; photo: string }) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadProductPhoto, {})

  return (
    <Frame
      action={action}
      pending={pending}
      state={state}
      photo={photo}
      hidden={[['slug', slug]]}
      empty="Своей фотографии нет"
    />
  )
}

function Frame({
  action,
  pending,
  state,
  photo,
  hidden,
  empty,
}: {
  action: (data: FormData) => void
  pending: boolean
  state: UploadState
  photo: string
  hidden: [string, string][]
  empty: string
}) {
  const form = useRef<HTMLFormElement>(null)
  const current = state.url || photo

  return (
    <form ref={form} action={action} className="flex items-start gap-3">
      {hidden.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line-light bg-paper-2">
        {current ? (
          // Обычный img, а не next/image: адрес приходит из базы и
          // меняется при каждой загрузке, а оптимизатор Next ждёт
          // известных заранее размеров. Файл и так ужат при сохранении.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className="size-full object-cover" />
        ) : (
          <span className="px-1 text-center text-[10px] leading-tight text-ink-dim">{empty}</span>
        )}
      </div>

      <div className="min-w-0">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-line-light bg-white px-3 py-1.5 text-[13px] transition-colors hover:border-ink-muted">
          <input
            type="file"
            name="file"
            accept="image/*"
            disabled={pending}
            className="sr-only"
            onChange={() => form.current?.requestSubmit()}
          />
          {pending ? 'Загружаю…' : current ? 'Заменить' : 'Выбрать файл'}
        </label>

        <p className="mt-1 text-[11px] text-ink-dim">
          JPEG, PNG или HEIC. Снимок сам развернётся и ужмётся до 1600 пикселей.
        </p>

        {state.error && <p className="mt-1 text-[12px] text-accent">{state.error}</p>}
      </div>
    </form>
  )
}
