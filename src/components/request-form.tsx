'use client'

import Link from 'next/link'
import { useState } from 'react'

const FIELD_BASE =
  'w-full rounded-lg border px-4 py-3 text-[15px] placeholder:opacity-65 focus:border-accent focus:outline-none'
const FIELD_LIGHT = 'border-line-light bg-white text-ink-dark'
const FIELD_DARK = 'border-white/12 bg-white/5 text-ink'

/**
 * Подпись поля: мелкая, прописными — как в макете страницы установки.
 *
 * Прозрачность 75, а не 55 процентов. Текст здесь 11 пикселей и в
 * разрядку, а на opacity-55 он давал контраст около 3.5 к 1 при норме
 * 4.5 — подписи над полями читались хуже всего на странице. Подсказки
 * внутри полей по той же причине подняты с 45 до 65 процентов.
 */
const LABEL = 'text-[11px] uppercase tracking-[0.12em] opacity-75'

/**
 * Куда уходит заявка.
 *
 * Сайт статический и принять её не может — на том хостинге не
 * запускаются программы. Поэтому форма отправляет её на сервер
 * админки, и заявка сразу появляется в разделе «Заявки».
 *
 * Адрес подставляется при сборке. Если он не задан — кнопка остаётся
 * отключённой и об этом сказано прямо. Молча принимать нажатия нельзя:
 * человек решит, что заявка ушла, и будет ждать звонка, которого не
 * будет. Именно так эта форма и вела себя до сих пор.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_REQUESTS_URL ?? ''

type State = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }

/**
 * Форма заявки.
 *
 * ── Согласие ──
 *
 * Галочка обязательна и заранее не отмечена: предустановленная
 * согласием не считается. Ссылка ведёт на отдельный документ согласия,
 * а не на политику: с 1 сентября 2025 согласие нельзя «зашивать» в
 * политику или пользовательское соглашение, оно оформляется само по
 * себе. Политика идёт рядом отдельной ссылкой — она отвечает на другой
 * вопрос, «что вы вообще делаете с данными».
 *
 * Цель сбора названа прямо у галочки, а не только внутри документа.
 * Требование — чтобы человек понимал, на что соглашается, не открывая
 * ничего: до документа дочитывает один из сотни.
 *
 * ── Ловушка для роботов ──
 *
 * Поле `website` спрятано от человека и не попадает в обход по
 * клавиатуре. Робот видит его в разметке и заполняет — по непустому
 * значению сервер такую заявку отбрасывает. Капчи нет намеренно: она
 * отпугивает покупателей сильнее, чем роботов.
 */
export function RequestForm({
  submitLabel = 'Отправить номер',
  tone = 'light',
}: {
  submitLabel?: string
  /** На тёмном блоке поля прозрачные, а не белые. */
  tone?: 'light' | 'dark'
}) {
  const FIELD = `${FIELD_BASE} ${tone === 'dark' ? FIELD_DARK : FIELD_LIGHT}`
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ENDPOINT) return

    const form = event.currentTarget
    const data = new FormData(form)
    // Адрес страницы говорит, что человек смотрел перед обращением:
    // карточку товара, подбор или запись. Это видно в админке и
    // подсказывает, с чего начать разговор.
    data.set('page', window.location.pathname)

    setState({ kind: 'sending' })
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', body: data })
      const answer = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        setState({ kind: 'error', message: answer.error ?? 'Не получилось отправить' })
        return
      }

      form.reset()
      setState({ kind: 'sent' })
    } catch {
      setState({
        kind: 'error',
        message: 'Не получилось отправить. Проверьте связь или позвоните нам',
      })
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="rounded-lg border border-current/15 px-5 py-6">
        <p className="text-[17px] font-semibold">Заявка принята</p>
        <p className="mt-1 text-[15px] opacity-70">
          Перезвоним в рабочее время. Если дело срочное — звоните сами, так быстрее.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          className="mt-4 text-sm text-accent underline"
        >
          Оставить ещё одну
        </button>
      </div>
    )
  }

  const sending = state.kind === 'sending'

  return (
    <form className="grid gap-4" onSubmit={send}>
      <label className="grid gap-2">
        <span className={LABEL}>Имя</span>
        <input type="text" name="name" autoComplete="name" className={FIELD} disabled={sending} />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Телефон</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          required
          placeholder="+7 (___) ___-__-__"
          className={FIELD}
          disabled={sending}
        />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Марка и модель авто</span>
        <input
          type="text"
          name="car"
          placeholder="Toyota RAV4, 2019"
          className={FIELD}
          disabled={sending}
        />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Комментарий</span>
        <textarea name="comment" rows={3} className={`${FIELD} resize-y`} disabled={sending} />
      </label>

      {/* Ловушка для роботов: человек её не видит и табуляцией не задевает. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      <label className="mt-2 flex items-start gap-3 text-sm opacity-70">
        <input
          type="checkbox"
          name="consent"
          required
          disabled={sending}
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span>
          Даю{' '}
          <Link href="/soglasie-na-obrabotku" className="text-accent underline">
            согласие на обработку персональных данных
          </Link>{' '}
          — чтобы со мной связались по этой заявке и подобрали фаркоп. Ознакомлен с{' '}
          <Link href="/politika-konfidencialnosti" className="text-accent underline">
            политикой конфиденциальности
          </Link>
        </span>
      </label>

      {state.kind === 'error' && (
        <p className="rounded-lg border border-accent/40 px-4 py-3 text-sm text-accent">
          {state.message}
        </p>
      )}

      {!ENDPOINT && (
        <p className="rounded-lg border border-current/15 px-4 py-3 text-sm opacity-70">
          Форма пока не принимает заявки. Позвоните нам — ответим сразу.
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !ENDPOINT}
        className="mt-2 justify-self-start rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? 'Отправляю…' : submitLabel}
      </button>
    </form>
  )
}
