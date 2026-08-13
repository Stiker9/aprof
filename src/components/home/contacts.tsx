import Link from 'next/link'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

const PHONE = '+7 (812) 123-45-67'
const PHONE_HREF = 'tel:+78121234567'
const EMAIL = 'hello@autoprofi.spb.ru'
const ADDRESS = 'Санкт-Петербург, Софийская ул. 72'

const FIELD =
  'w-full rounded-lg border border-line-light bg-paper-3 px-4 py-3 text-[15px] text-ink-dark placeholder:opacity-45 focus:border-accent focus:outline-none'

/**
 * Контакты с формой заявки.
 *
 * Форма пока ничего не отправляет: обработчик появится вместе с
 * админкой, куда заявки будут падать. Кнопка отключена, а не молча
 * бездействует — нажатие без результата человек воспринимает как
 * отправленную заявку и ждёт звонка, которого не будет.
 *
 * Согласие на обработку данных обязательно по 152-ФЗ: без отмеченной
 * галочки заявку принимать нельзя, и галочка не должна стоять заранее.
 */
export function Contacts() {
  return (
    <Section tone="light">
      <Eyebrow>Контакты</Eyebrow>
      <SectionTitle>Приезжайте или позвоните</SectionTitle>
      <SectionLead>
        Работаем без записи, но с ней быстрее. Оставьте номер — перезвоним в течение 15 минут в
        рабочие часы.
      </SectionLead>

      <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <form className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm opacity-70">Имя</span>
            <input type="text" name="name" autoComplete="name" className={FIELD} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-70">Телефон</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
              className={FIELD}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-70">Марка и модель авто</span>
            <input type="text" name="car" placeholder="Toyota RAV4, 2019" className={FIELD} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-70">Комментарий</span>
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
            className="mt-2 justify-self-start rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Отправить номер
          </button>
        </form>

        <div className="grid content-start gap-8">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{ADDRESS}</div>
            <div className="mt-1 text-sm opacity-55">Въезд со двора, вывеска AUTOPROFI</div>
          </div>

          <div>
            <div className="text-sm opacity-55">Телефон</div>
            <a
              href={PHONE_HREF}
              className="mt-2 block font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] leading-none tracking-[-0.02em] transition-colors hover:text-accent"
            >
              {PHONE}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Почта</div>
            <a href={`mailto:${EMAIL}`} className="mt-2 block text-[19px] hover:text-accent">
              {EMAIL}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Часы работы</div>
            <div className="mt-2 text-[19px]">Пн–Сб 9:00–19:00</div>
            <div className="mt-1 text-sm opacity-55">Воскресенье — выходной</div>
          </div>

          <ArrowLink href="/kontakty">Схема проезда</ArrowLink>
        </div>
      </div>
    </Section>
  )
}
