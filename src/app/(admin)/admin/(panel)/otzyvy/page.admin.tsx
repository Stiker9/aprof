import { requireAdmin } from '@/admin/auth'
import { loadContentGroup } from '@/admin/content'
import { listReviews } from '@/admin/lists'
import { plural } from '@/catalog/format'
import { Editable } from '@/components/admin/editable'
import { FieldGroup, FieldRow } from '@/components/admin/field-row'
import { ListField } from '@/components/admin/list-field'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { AddRowButton, RowActions } from '@/components/admin/row-actions'
import { getDb } from '@/db/client'

/**
 * Отзывы.
 *
 * ── Почему оценка отдельно от списка ──
 *
 * Средняя оценка не считается по этой таблице, а вводится руками. На
 * Яндекс.Картах и Авито отзывов у сервиса в разы больше, чем он
 * перенесёт сюда; посчитанное по десяти перенесённым «5,0» разошлось
 * бы с настоящей карточкой, и это была бы недостоверная реклама.
 *
 * Поэтому владелец переписывает цифру из карточки, а рядом сказано,
 * откуда её брать.
 *
 * ── Почему новый отзыв создаётся скрытым ──
 *
 * Запись появляется пустой и заполняется по полю. Будь она сразу
 * видимой, на сайте на несколько минут повис бы отзыв без текста с
 * пустым автором.
 */
export default async function ReviewsPage() {
  await requireAdmin()

  const db = await getDb()
  const [rows, own] = await Promise.all([listReviews(db), loadContentGroup(db, 'review')])
  const rating = own.self ?? {}

  const shown = rows.filter((row) => row.visible).length

  return (
    <>
      <PageHead
        title="Отзывы"
        lead={
          rows.length === 0
            ? 'Пока ни одного — раздел отзывов на сайте не показывается'
            : `${shown} из ${rows.length} ${plural(rows.length, 'показан', 'показаны', 'показаны')} на сайте`
        }
      >
        <AddRowButton list="review" label="Добавить отзыв" />
      </PageHead>

      <PageBody>
        <FieldGroup
          title="Оценка"
          lead="Показывается в шапке раздела и в блоке «С 2014 года». Пока не заполнена — не показывается вовсе"
        >
          <FieldRow
            label="Средняя оценка"
            hint="Как в карточке на Яндекс.Картах: 4,8. Придумывать нельзя — выдуманный рейтинг это недостоверная реклама."
          >
            <Editable
              entity="review"
              targetKey="self"
              field="score"
              value={rating.score ?? ''}
              placeholder="4,8"
            />
          </FieldRow>

          <FieldRow label="Сколько отзывов" hint="Число из той же карточки. Только цифры.">
            <Editable
              entity="review"
              targetKey="self"
              field="count"
              value={rating.count ?? ''}
              placeholder="127"
              inputMode="numeric"
            />
          </FieldRow>
        </FieldGroup>

        {rows.length === 0 ? (
          <Empty title="Отзывов нет">
            Переносите настоящие — с Яндекс.Карт, Авито или из переписки. Выдуманный отзыв на
            витрине это недостоверная реклама, штрафуют за неё без всякой жалобы на работу.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <article
                key={row.id}
                className={`rounded-card border bg-white px-5 py-4 ${
                  row.visible ? 'border-line-light' : 'border-dashed border-line-light opacity-70'
                }`}
              >
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                  <div>
                    <Label>Текст отзыва</Label>
                    <ListField
                      list="review"
                      id={row.id}
                      field="text"
                      value={row.text}
                      placeholder="Что написал человек — дословно"
                      multiline
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <Label>Кто</Label>
                      <ListField
                        list="review"
                        id={row.id}
                        field="author"
                        value={row.author}
                        placeholder="Имя"
                      />
                    </div>
                    <div>
                      <Label>Машина</Label>
                      <ListField
                        list="review"
                        id={row.id}
                        field="car"
                        value={row.car}
                        placeholder="Lada Largus"
                      />
                    </div>
                    <div>
                      <Label>Когда</Label>
                      <ListField
                        list="review"
                        id={row.id}
                        field="date"
                        value={row.date}
                        placeholder="Сентябрь 2026"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-light pt-3">
                  <RowActions
                    list="review"
                    id={row.id}
                    visible={row.visible}
                    first={index === 0}
                    last={index === rows.length - 1}
                  />
                  {(!row.text.trim() || !row.author.trim()) && (
                    <span className="text-[12px] text-ink-dim">
                      Без текста и имени на сайт не уйдёт
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </PageBody>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-ink-muted">{children}</span>
}
