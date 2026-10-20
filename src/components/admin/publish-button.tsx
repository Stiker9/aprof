'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishSite } from '@/admin/actions'

/**
 * Кнопка «Опубликовать» и ход публикации.
 *
 * ── Почему страница сама себя обновляет ──
 *
 * Публикация идёт полчаса отдельным процессом, и странице о ней никто
 * не сообщает. Без обновления владелец видел бы застывшее «Собираю
 * сайт» и решил, что всё зависло. Поэтому пока идёт — раз в десять
 * секунд перечитываем страницу и показываем свежий хвост журнала.
 *
 * Десять секунд, а не одна: чаще незачем — за секунду в журнале
 * ничего нового не появляется, а каждое обновление это запрос к
 * серверу, который в это время занят сборкой.
 *
 * ── Почему подтверждение ──
 *
 * Публикация занимает полчаса и отменить её нечем. Случайное нажатие
 * стоит дорого, поэтому кнопка спрашивает ещё раз.
 */
export function PublishButton({
  state,
  pending,
  log,
}: {
  state: 'idle' | 'running' | 'done'
  /** Сколько правок ждёт отправки. */
  pending: number
  log: string[]
}) {
  const [busy, start] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (state !== 'running') return
    const timer = setInterval(() => router.refresh(), 10_000)
    return () => clearInterval(timer)
  }, [state, router])

  if (state === 'running') {
    return (
      <div className="rounded-card border border-accent/35 bg-accent-soft px-5 py-4">
        <p className="font-semibold text-accent">Публикую…</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Пересобираю сайт и отправляю изменения. Это занимает около получаса — страницу можно
          закрыть, публикация не прервётся.
        </p>
        <Log lines={log} />
      </div>
    )
  }

  return (
    <div className="rounded-card border border-line-light bg-white px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {pending === 0 ? 'Всё опубликовано' : 'Отправить правки на сайт'}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {pending === 0
              ? 'Новых правок нет. Публиковать нечего.'
              : 'Сайт пересоберётся и обновится. Занимает около получаса.'}
          </p>
        </div>

        <button
          type="button"
          disabled={busy || pending === 0}
          onClick={() => {
            if (!confirm('Опубликовать изменения на сайте? Это займёт около получаса.')) return
            start(async () => {
              await publishSite()
            })
          }}
          className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? 'Запускаю…' : 'Опубликовать'}
        </button>
      </div>

      {state === 'done' && log.length > 0 && (
        <div className="mt-3 border-t border-line-light pt-3">
          <p className="text-[13px] font-semibold text-ink-muted">Прошлая публикация</p>
          <Log lines={log} />
        </div>
      )}
    </div>
  )
}

function Log({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-paper-2 px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap">
      {lines.join('\n')}
    </pre>
  )
}
