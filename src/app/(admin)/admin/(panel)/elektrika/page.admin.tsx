import { requireAdmin } from '@/admin/auth'
import { loadContentGroup } from '@/admin/content'
import { ELECTRICS } from '@/content/ustanovka'
import { formatPrice } from '@/catalog/format'
import { Editable } from '@/components/admin/editable'
import { FieldGroup, FieldRow } from '@/components/admin/field-row'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Электрика к фаркопу.
 *
 * ── Почему здесь цена числом, а в установке строкой ──
 *
 * Эти три позиции участвуют в расчёте: в карточке товара покупатель
 * выбирает электрику, и сумма складывается из цены фаркопа и цены
 * электрики. «От 1 000» сложить не с чем.
 *
 * Поэтому битое значение здесь не применяется вовсе — показывается
 * прежняя цена. «NaN ₽» в итоговой сумме заказа хуже устаревшей цифры.
 *
 * ── Почему позиций ровно три и добавить нельзя ──
 *
 * Их `id` уходит в расчёт и в адрес страницы. Четвёртая позиция — это
 * правка кода карточки товара, а не строка в админке. Зато названия,
 * пояснения и цены правятся свободно.
 */
export default async function ElectricsPage() {
  await requireAdmin()

  const db = await getDb()
  const own = await loadContentGroup(db, 'electrics')

  return (
    <>
      <PageHead title="Электрика" lead="Выбор электрики и её цена в карточке товара" />

      <PageBody>
        {ELECTRICS.map((option) => (
          <FieldGroup
            key={option.id}
            title={option.label}
            lead={`Сейчас на сайте: ${option.price === 0 ? 'без доплаты' : formatPrice(option.price)}`}
          >
            <FieldRow label="Название" hint="Видно в списке выбора на карточке товара.">
              <Editable
                entity="electrics"
                targetKey={option.id}
                field="label"
                value={own[option.id]?.label ?? ''}
                fallback={option.label}
              />
            </FieldRow>

            <FieldRow label="Пояснение" hint="Строка помельче под названием.">
              <Editable
                entity="electrics"
                targetKey={option.id}
                field="note"
                value={own[option.id]?.note ?? ''}
                fallback={option.note}
              />
            </FieldRow>

            <FieldRow
              label="Цена, ₽"
              hint={
                option.id === 'none'
                  ? 'У позиции «без электрики» цена должна оставаться нулём — иначе фаркоп подорожает сам по себе.'
                  : 'Только число, без знака рубля и пробелов. Прибавляется к цене фаркопа.'
              }
            >
              <Editable
                entity="electrics"
                targetKey={option.id}
                field="price"
                value={own[option.id]?.price ?? ''}
                fallback={String(option.price)}
                align="right"
                inputMode="numeric"
              />
            </FieldRow>
          </FieldGroup>
        ))}
      </PageBody>
    </>
  )
}
