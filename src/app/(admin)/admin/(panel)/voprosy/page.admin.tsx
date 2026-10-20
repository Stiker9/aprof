import { requireAdmin } from '@/admin/auth'
import { loadContentGroup } from '@/admin/content'
import { listFaq } from '@/admin/lists'
import { BASE_CATALOG_FAQ, BASE_FAQ } from '@/content/faq'
import type { FaqItem } from '@/components/ui/accordion'
import { Editable } from '@/components/admin/editable'
import { ListField } from '@/components/admin/list-field'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { AddRowButton, RowActions } from '@/components/admin/row-actions'
import { Toggle } from '@/components/admin/toggle'
import { getDb } from '@/db/client'

/**
 * Вопросы и ответы.
 *
 * ── Почему два списка, а не один ──
 *
 * Человек на странице каталога ещё выбирает деталь: его занимает, чем
 * шары отличаются друг от друга и что делать, если своей марки он не
 * нашёл. Гарантия на работы ему в этот момент не нужна — он ещё не
 * решил, что ставить. Поэтому вопросы разведены по месту показа, а не
 * свалены в один список.
 *
 * ── Почему прежние вопросы правятся, а не удаляются ──
 *
 * Десять вопросов написаны заранее и местами связаны с другими
 * страницами: сроки в ответе про установку — те же числа, что в
 * таблице сроков. Правка ложится слоем поверх, исходный текст остаётся
 * виден серым, и всегда понятно, от чего владелец отклонился.
 *
 * Ненужный вопрос снимается с витрины переключателем, а не удаляется:
 * удалённый пришлось бы набирать заново, а снятый возвращается одним
 * нажатием.
 */
export default async function FaqPage() {
  await requireAdmin()

  const db = await getDb()
  const [own, added] = await Promise.all([loadContentGroup(db, 'faq'), listFaq(db)])

  const hiddenCount = [...BASE_FAQ, ...BASE_CATALOG_FAQ].filter(
    (item) => own[item.id]?.hidden === '1',
  ).length

  return (
    <>
      <PageHead
        title="Вопросы и ответы"
        lead={
          hiddenCount === 0
            ? 'Показываются на главной, странице установки и в каталоге'
            : `Показываются на главной, странице установки и в каталоге. Снято с витрины: ${hiddenCount}`
        }
      />

      <PageBody>
        <Group
          title="Про установку"
          lead="Показываются на главной и на странице «Установка фаркопа»"
          scope="home"
          base={BASE_FAQ}
          own={own}
          added={added.filter((row) => row.scope !== 'catalog')}
        />

        <Group
          title="Про подбор"
          lead="Показываются на странице каталога, где человек ещё выбирает деталь"
          scope="catalog"
          base={BASE_CATALOG_FAQ}
          own={own}
          added={added.filter((row) => row.scope === 'catalog')}
        />
      </PageBody>
    </>
  )
}

function Group({
  title,
  lead,
  scope,
  base,
  own,
  added,
}: {
  title: string
  lead: string
  scope: 'home' | 'catalog'
  base: FaqItem[]
  own: Record<string, Record<string, string>>
  added: { id: number; question: string; answer: string; visible: boolean }[]
}) {
  return (
    <section className="mb-7">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[15px] font-bold">{title}</h2>
          <p className="text-[13px] text-ink-muted">{lead}</p>
        </div>
        <AddRowButton list="faq" scope={scope} label="Добавить вопрос" />
      </div>

      <div className="flex flex-col gap-3">
        {base.map((item) => {
          const edits = own[item.id] ?? {}
          const hidden = edits.hidden === '1'

          return (
            <article
              key={item.id}
              className={`rounded-card border bg-white px-5 py-4 ${
                hidden ? 'border-dashed border-line-light opacity-70' : 'border-line-light'
              }`}
            >
              <Label>Вопрос</Label>
              <Editable
                entity="faq"
                targetKey={item.id}
                field="question"
                value={edits.question ?? ''}
                fallback={item.question}
              />

              <div className="mt-3">
                <Label>Ответ</Label>
                <Editable
                  entity="faq"
                  targetKey={item.id}
                  field="answer"
                  value={edits.answer ?? ''}
                  fallback={item.answer}
                  multiline
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line-light pt-3">
                <Toggle
                  entity="faq"
                  targetKey={item.id}
                  field="hidden"
                  on={hidden}
                  label={hidden ? 'Снят с витрины' : 'На сайте'}
                  danger
                />
                <span className="text-[12px] text-ink-dim">
                  {edits.question || edits.answer
                    ? 'Вы правили этот вопрос. Крестик в поле вернёт исходный текст'
                    : 'Серым — текст, который сейчас на сайте'}
                </span>
              </div>
            </article>
          )
        })}

        {added.map((row, index) => (
          <article
            key={row.id}
            className={`rounded-card border bg-white px-5 py-4 ${
              row.visible ? 'border-line-light' : 'border-dashed border-line-light opacity-70'
            }`}
          >
            <Label>Вопрос</Label>
            <ListField
              list="faq"
              id={row.id}
              field="question"
              value={row.question}
              placeholder="Как к вам доехать?"
            />

            <div className="mt-3">
              <Label>Ответ</Label>
              <ListField
                list="faq"
                id={row.id}
                field="answer"
                value={row.answer}
                placeholder="Ответ целиком, как его прочитает посетитель"
                multiline
                rows={4}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line-light pt-3">
              <RowActions
                list="faq"
                id={row.id}
                visible={row.visible}
                first={index === 0}
                last={index === added.length - 1}
              />
              {(!row.question.trim() || !row.answer.trim()) && (
                <span className="text-[12px] text-ink-dim">
                  Без вопроса и ответа на сайт не уйдёт
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-ink-muted">{children}</span>
}
