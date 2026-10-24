'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteProductPhoto, moveProductPhoto, uploadProductPhoto } from '@/admin/actions'

export interface AdminPhotoGroup {
  /** '' — общие фото фаркопа; иначе «audi/q7». */
  key: string
  /** «Audi Q7»; у общих пусто. */
  label: string
  photos: { id: number; url: string }[]
}

/**
 * Фотографии товара в админке.
 *
 * ── Почему группами ──
 *
 * Один фаркоп подходит к нескольким машинам. Снимок, где он стоит на
 * Q7, покупателю Cayenne только мешает — он решит, что фаркоп не для
 * него. Поэтому у товара строки: «Общие» — сам фаркоп, виден всем, и по
 * строке на каждую подходящую машину — видна только на её странице.
 * Владелец не думает, куда встанет фото: выбрал строку — загрузил.
 *
 * ── Почему пачка уходит по одному файлу ──
 *
 * Выбрать можно сразу шесть снимков, но отправляются они по очереди:
 * одним запросом шесть фото по 5 МБ упёрлись бы в предел запроса, и
 * пропала бы вся пачка. По одному — упадёт разве что один файл, и о нём
 * будет сказано отдельно.
 */
export function ProductPhotos({ slug, groups }: { slug: string; groups: AdminPhotoGroup[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  async function upload(key: string, files: FileList) {
    setBusy(key)
    setErrors([])
    const failed: string[] = []

    const list = Array.from(files)
    for (const [i, file] of list.entries()) {
      setProgress(list.length > 1 ? `Загружаю ${i + 1} из ${list.length}…` : 'Загружаю…')
      const data = new FormData()
      data.set('slug', slug)
      data.set('modelKey', key)
      data.set('file', file)
      try {
        const result = await uploadProductPhoto(data)
        if (result.error) failed.push(`${file.name}: ${result.error}`)
      } catch {
        failed.push(`${file.name}: не дошёл до сервера — проверьте связь`)
      }
    }

    setErrors(failed)
    setBusy(null)
    setProgress('')
    router.refresh()
  }

  function act(run: () => Promise<void>) {
    startTransition(async () => {
      await run()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const uploading = busy === group.key
        return (
          <div key={group.key} className="rounded-lg border border-line-light bg-paper-2/40 p-3">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[13px] font-medium">
                {group.label ? `На ${group.label}` : 'Общие — сам фаркоп'}
              </span>
              <span className="text-[11px] text-ink-dim">
                {group.label
                  ? `видны только на странице ${group.label}`
                  : 'видны на всех машинах — снимки без машины в кадре'}
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-2">
              {group.photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative h-[72px] w-[96px] overflow-hidden rounded-md border border-line-light bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white">
                      главное
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 text-[12px] text-white">
                    <button
                      type="button"
                      disabled={pending || i === 0}
                      onClick={() => act(() => moveProductPhoto(photo.id, -1))}
                      aria-label="Раньше"
                      className="px-1.5 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm('Удалить это фото?')) act(() => deleteProductPhoto(photo.id))
                      }}
                      aria-label="Удалить"
                      className="px-1.5 hover:text-accent-bright"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      disabled={pending || i === group.photos.length - 1}
                      onClick={() => act(() => moveProductPhoto(photo.id, 1))}
                      aria-label="Позже"
                      className="px-1.5 disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}

              <label
                className={`flex h-[72px] w-[96px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-ink-muted/50 bg-white text-center text-[11px] leading-tight text-ink-muted hover:border-accent hover:text-accent ${
                  busy ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  disabled={busy !== null}
                  className="sr-only"
                  onChange={(event) => {
                    const files = event.target.files
                    if (files?.length) void upload(group.key, files)
                    event.target.value = ''
                  }}
                />
                {uploading ? progress : '+ добавить фото'}
              </label>
            </div>
          </div>
        )
      })}

      {errors.length > 0 && (
        <div className="text-[12px] text-accent">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <p className="text-[11px] text-ink-dim">
        Можно выбрать сразу несколько снимков. JPEG, PNG, HEIC — снимок сам развернётся и
        ужмётся до 1600 пикселей. Первое фото в строке — главное, оно стоит в карточке.
      </p>
    </div>
  )
}
