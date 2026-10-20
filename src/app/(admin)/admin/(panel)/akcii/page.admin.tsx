import { requireAdmin } from '@/admin/auth'
import { listPromos } from '@/admin/lists'
import { plural } from '@/catalog/format'
import { ListField } from '@/components/admin/list-field'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { AddRowButton, RowActions } from '@/components/admin/row-actions'
import { PromoKind } from '@/components/admin/promo-kind'
import { getDb } from '@/db/client'

/**
 * Акции.
 *
 * ── Почему срок хранится датой, а не словами ──
 *
 * Строка «До 31 августа» истечь не может. Так уже было: она провисела
 * на главной до октября, и человек, приехавший за скидкой, был прав, а
 * мы нет. Теперь владелец вводит дату, а подпись сайт собирает сам — и
 * сам же убирает акцию, когда дата прошла.
 *
 * Убирает при пересборке, а не в полночь: страницы статические, и
 * «сегодня» для них — момент сборки. Для скидок это допустимо.
 *
 * ── Две формы акции ──
 *
 * Обычная: одна скидка на всё, размер строкой. Списочная: перечень
 * «модель → скидка», который владелец ведёт руками. Третьей не бывает,
 * поэтому переключатель, а не свободная форма.
 */
export default async function PromosPage() {
  await requireAdmin()

  const db = await getDb()
  const rows = await listPromos(db)
  const shown = rows.filter((row) => row.visible && row.title.trim()).length

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHead
        title="Акции"
        lead={
          rows.length === 0
            ? 'Пока ни одной — на сайте написано, что предложений сейчас нет'
            : `${shown} из ${rows.length} ${plural(rows.length, 'показана', 'показаны', 'показаны')} на сайте`
        }
      >
        <AddRowButton list="promo" label="Добавить акцию" />
      </PageHead>

      <PageBody>
        {rows.length === 0 ? (
          <Empty title="Акций нет">
            Это рабочее состояние: блок акций на главной и страница «Акции» сами напишут, что
            предложений сейчас нет. Заводите акцию, только когда она действительно есть — скидка,
            которой нет, это недостоверная реклама.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const expired = Boolean(row.until) && row.until! < today

              return (
                <article
                  key={row.id}
                  className={`rounded-card border bg-white px-5 py-4 ${
                    row.visible && !expired
                      ? 'border-line-light'
                      : 'border-dashed border-line-light opacity-70'
                  }`}
                >
                  <div className="grid gap-x-5 gap-y-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label>Заголовок</Label>
                        <ListField
                          list="promo"
                          id={row.id}
                          field="title"
                          value={row.title}
                          placeholder="Электрика в подарок"
                        />
                      </div>
                      <div>
                        <Label>Пояснение</Label>
                        <ListField
                          list="promo"
                          id={row.id}
                          field="lead"
                          value={row.lead}
                          placeholder="Одна-две строки: на что скидка и при каком условии"
                          multiline
                          rows={2}
                        />
                      </div>

                      <PromoKind
                        id={row.id}
                        kind={row.kind === 'list' ? 'list' : 'text'}
                        discount={row.discount}
                        discountNote={row.discountNote}
                        items={row.items}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <Label>Действует до</Label>
                        <ListField
                          list="promo"
                          id={row.id}
                          field="until"
                          value={row.until ?? ''}
                          placeholder="2026-12-31"
                        />
                        <p className="mt-1 text-[11px] text-ink-dim">
                          В виде 2026-12-31. Пусто — акция бессрочная. После этой даты сайт уберёт
                          её сам.
                        </p>
                        {expired && (
                          <p className="mt-1 text-[12px] text-accent">
                            Срок прошёл — на сайте её уже нет.
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Адрес страницы</Label>
                        <ListField
                          list="promo"
                          id={row.id}
                          field="slug"
                          value={row.slug}
                          placeholder="elektrika-v-podarok"
                        />
                        <p className="mt-1 text-[11px] text-ink-dim">
                          Латиницей, через дефис. Виден в адресе страницы акции.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-light pt-3">
                    <RowActions
                      list="promo"
                      id={row.id}
                      visible={row.visible}
                      first={index === 0}
                      last={index === rows.length - 1}
                    />
                    {!row.title.trim() && (
                      <span className="text-[12px] text-ink-dim">Без заголовка на сайт не уйдёт</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </PageBody>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-ink-muted">{children}</span>
}
