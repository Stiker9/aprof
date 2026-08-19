import Link from 'next/link'

const FIELD_BASE =
  'w-full rounded-lg border px-4 py-3 text-[15px] placeholder:opacity-45 focus:border-accent focus:outline-none'
const FIELD_LIGHT = 'border-line-light bg-white text-ink-dark'
const FIELD_DARK = 'border-white/12 bg-white/5 text-ink'

/** Подпись поля: мелкая, прописными — как в макете страницы установки. */
const LABEL = 'text-[11px] uppercase tracking-[0.12em] opacity-55'

/**
 * Форма заявки.
 *
 * Ничего не отправляет: обработчик появится вместе с админкой, куда
 * заявки будут падать. Кнопка отключена, а не молча бездействует —
 * нажатие без результата человек воспринимает как отправленную заявку
 * и ждёт звонка, которого не будет.
 *
 * Согласие на обработку данных обязательно по 152-ФЗ: без отмеченной
 * галочки заявку принимать нельзя, и галочка не должна стоять заранее.
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

  return (
    <form className="grid gap-4">
      <label className="grid gap-2">
        <span className={LABEL}>Имя</span>
        <input type="text" name="name" autoComplete="name" className={FIELD} />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Телефон</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          className={FIELD}
        />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Марка и модель авто</span>
        <input type="text" name="car" placeholder="Toyota RAV4, 2019" className={FIELD} />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Комментарий</span>
        <textarea name="comment" rows={3} className={`${FIELD} resize-y`} />
      </label>

      <label className="mt-2 flex items-start gap-3 text-sm opacity-70">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span>
          Согласен на обработку персональных данных в соответствии с{' '}
          <Link href="/politika-konfidencialnosti" className="text-accent underline">
            политикой конфиденциальности
          </Link>
        </span>
      </label>

      <button
        type="submit"
        disabled
        className="mt-2 justify-self-start rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  )
}
