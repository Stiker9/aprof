import { requireAdmin } from '@/admin/auth'
import { loadContentGroup } from '@/admin/content'
import { PRICE_NOTE, PRICE_WORKS } from '@/content/ustanovka'
import { Editable } from '@/components/admin/editable'
import { FieldGroup, FieldRow } from '@/components/admin/field-row'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Цены на установку.
 *
 * ── Почему цена — строка, а не число ──
 *
 * В прайсе на работы встречается не только «3 500», но и «от 3 500»,
 * «по осмотру», «бесплатно при покупке фаркопа». Число такого не
 * вместит, а запрет писать «от» заставит владельца ставить точную
 * цифру там, где он её не знает, — и получится обещание, которого
 * сервис не держит.
 *
 * Цены товаров устроены иначе и намеренно: там число, потому что по
 * нему считается сумма заказа и строится сортировка каталога.
 *
 * ── Почему пустая цена — рабочее состояние ──
 *
 * Пока ни одна цена не названа, страница установки показывает перечень
 * работ и говорит, что стоимость называют по телефону. Это честнее
 * выдуманных цифр: прежние были сняты с сайта конкурента и обещали
 * то, что сервис не подтверждал.
 */
/** Три колонки на широком экране, одна на узком. */
const GRID = 'grid gap-x-3 gap-y-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:items-center'

export default async function InstallPage() {
  await requireAdmin()

  const db = await getDb()
  const own = await loadContentGroup(db, 'install_price')

  const filled = PRICE_WORKS.filter((row) => own[row.id]?.own || own[row.id]?.client).length

  return (
    <>
      <PageHead
        title="Установка"
        lead={
          filled === 0
            ? 'Цены не названы — страница показывает перечень работ без цифр'
            : `Цены названы для ${filled} из ${PRICE_WORKS.length} работ`
        }
      />

      <PageBody>
        <FieldGroup
          title="Прайс на работы"
          lead="Пустая строка означает «цену называем по телефону» — так и напишет сайт"
        >
          <div className="overflow-hidden rounded-lg border border-line-light">
            <div className={`${GRID} hidden border-b border-line-light bg-paper-2 px-3 py-2 text-[11px] tracking-wide text-ink-muted uppercase lg:grid`}>
              <span className="font-semibold">Работа</span>
              <span className="font-semibold">С нашим фаркопом</span>
              <span className="font-semibold">С фаркопом клиента</span>
            </div>

            <div className="divide-y divide-line-light">
              {PRICE_WORKS.map((row) => (
                <div key={row.id} className={`${GRID} px-3 py-2.5`}>
                  <Editable
                    entity="install_price"
                    targetKey={row.id}
                    field="work"
                    value={own[row.id]?.work ?? ''}
                    fallback={row.work}
                  />
                  <div>
                    <Cap>С нашим фаркопом</Cap>
                    <Editable
                      entity="install_price"
                      targetKey={row.id}
                      field="own"
                      value={own[row.id]?.own ?? ''}
                      placeholder="по телефону"
                      align="right"
                    />
                  </div>
                  <div>
                    <Cap>С фаркопом клиента</Cap>
                    <Editable
                      entity="install_price"
                      targetKey={row.id}
                      field="client"
                      value={own[row.id]?.client ?? ''}
                      placeholder="по телефону"
                      align="right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-2 text-[12px] text-ink-dim">
            Пишите как показывать: «3 500 ₽», «от 3 500 ₽», «по осмотру». Знак рубля сайт сам не
            подставляет — что напишете, то и увидит посетитель.
          </p>
        </FieldGroup>

        <FieldGroup title="Оговорка под прайсом">
          <FieldRow
            label="Текст"
            hint="Что считается отдельно и почему. Стоит мелким шрифтом под таблицей."
          >
            <Editable
              entity="install_price"
              targetKey="self"
              field="note"
              value={own.self?.note ?? ''}
              fallback={PRICE_NOTE}
              multiline
            />
          </FieldRow>
        </FieldGroup>
      </PageBody>
    </>
  )
}

/** Подпись поля — только на узком экране, где шапки таблицы нет. */
function Cap({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-0.5 block text-[11px] tracking-wide text-ink-dim uppercase lg:hidden">
      {children}
    </span>
  )
}
