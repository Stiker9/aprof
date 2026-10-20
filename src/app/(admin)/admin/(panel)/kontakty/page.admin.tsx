import { requireAdmin } from '@/admin/auth'
import { loadContentGroup } from '@/admin/content'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'
import { Editable } from '@/components/admin/editable'
import { FieldGroup, FieldRow } from '@/components/admin/field-row'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Контакты и реквизиты.
 *
 * ── Почему это один из самых важных экранов ──
 *
 * Телефон и адрес стоят на 8 251 странице сайта, а ИНН и ОГРН — в
 * правовых документах. Ошибка здесь тиражируется мгновенно и целиком:
 * неверный номер означает, что сайт месяц работал вхолостую.
 *
 * Поэтому у каждого поля написано, где оно показывается. Владелец
 * должен понимать, что правит не «строчку в админке», а подпись на
 * каждой странице.
 *
 * ── Чего здесь нет ──
 *
 * Ссылок на карту и координат. Они привязаны к карточке организации на
 * Яндекс.Картах, и править их строкой нельзя: ошибка в адресе виджета
 * даёт пустую карту, а ошибка в координатах — маршрут к чужому дому.
 * Переезд сервиса — повод позвонить разработчику, а не поправить поле.
 */
export default async function ContactsPage() {
  await requireAdmin()

  const db = await getDb()
  const own = await loadContentGroup(db, 'contacts')
  const self = own.self ?? {}

  const field = (name: string) => ({
    entity: 'contacts' as const,
    targetKey: 'self',
    field: name,
    value: self[name] ?? '',
  })

  return (
    <>
      <PageHead title="Контакты" lead="Телефон, адрес, часы работы и реквизиты" />

      <PageBody>
        <FieldGroup title="Связь" lead="Показывается в шапке, подвале и на каждой странице">
          <FieldRow
            label="Телефон"
            hint="Ссылка для звонка соберётся сама — отдельно её править не нужно."
          >
            <Editable {...field('phone')} fallback={CONTACTS.phone} />
          </FieldRow>

          <FieldRow
            label="Почта"
            hint="Сюда будут писать покупатели. Ящик должен существовать и читаться — он же указан в правовых документах."
          >
            <Editable {...field('email')} fallback={CONTACTS.email} />
          </FieldRow>

          <FieldRow
            label="Часы работы"
            hint="Одной строкой, как показывать посетителю: «Пн–Сб 10:00–20:00» или «Ежедневно до 20:00»."
          >
            <Editable {...field('hours')} fallback={CONTACTS.hours} />
          </FieldRow>

          <FieldRow label="Выходной" hint="Если выходного нет — оставьте пусто.">
            <Editable {...field('dayOff')} fallback={CONTACTS.dayOff} placeholder="нет выходных" />
          </FieldRow>
        </FieldGroup>

        <FieldGroup title="Адрес">
          <FieldRow label="Полный адрес" hint="Как в карточке на Картах, с городом.">
            <Editable {...field('address')} fallback={CONTACTS.address} />
          </FieldRow>

          <FieldRow
            label="Короткий адрес"
            hint="Без города — для строк, где длинный не помещается."
          >
            <Editable {...field('addressShort')} fallback={CONTACTS.addressShort} />
          </FieldRow>

          <FieldRow
            label="Улица в предложном"
            hint="Для фраз «сервис на 1-й Жерновской». Нужен готовый падеж: склонять названия автоматически нельзя."
          >
            <Editable {...field('streetIn')} fallback={CONTACTS.streetIn} />
          </FieldRow>

          <FieldRow
            label="Как найти"
            hint="Въезд, вывеска, ориентир. Пусто — подсказка не показывается вовсе. Лучше пусто, чем приблизительно: человек поедет и будет искать."
          >
            <Editable
              {...field('addressNote')}
              fallback={CONTACTS.addressNote}
              placeholder="въезд со двора, вывеска у ворот"
              multiline
            />
          </FieldRow>
        </FieldGroup>

        <FieldGroup
          title="Реквизиты"
          lead="Показываются в пользовательском соглашении, политике и согласии на обработку данных"
        >
          {/*
            Предупреждение стоит над полями, а не под ними: владелец
            видит нули и должен понимать, чем они грозят, до того как
            решит, что это неважно.
          */}
          <p className="mb-3 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
            Пока здесь нули, сайт сообщает о продавце недостоверные сведения. По закону о защите
            прав потребителей продавец обязан назвать себя — за нарушение штрафуют по жалобе
            одного покупателя.
          </p>

          <FieldRow
            label="Название или ФИО"
            hint="Ровно как в ЕГРИП или ЕГРЮЛ: «ИП Иванов Иван Иванович» либо «ООО „Название“». Вывеска сайта тут ни при чём — важно, что записано в реестре."
          >
            <Editable {...field('legalName')} fallback={LEGAL_ENTITY.name} />
          </FieldRow>

          <FieldRow label="ИНН" hint="12 цифр у ИП, 10 у ООО.">
            <Editable {...field('inn')} fallback={LEGAL_ENTITY.inn} inputMode="numeric" />
          </FieldRow>

          <FieldRow label="ОГРН или ОГРНИП" hint="15 цифр у ИП, 13 у ООО.">
            <Editable {...field('ogrn')} fallback={LEGAL_ENTITY.ogrn} inputMode="numeric" />
          </FieldRow>
        </FieldGroup>
      </PageBody>
    </>
  )
}
