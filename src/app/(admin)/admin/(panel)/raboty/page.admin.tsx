import { requireAdmin } from '@/admin/auth'
import { listWorks } from '@/admin/lists'
import { BASE_WORKS } from '@/content/works'
import { plural } from '@/catalog/format'
import { ListField } from '@/components/admin/list-field'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { WorkPhotoUpload } from '@/components/admin/photo-upload'
import { AddRowButton, RowActions } from '@/components/admin/row-actions'
import { getDb } from '@/db/client'

/**
 * Галерея работ.
 *
 * ── Почему прежние снимки не показаны в списке ──
 *
 * Девятнадцать фотографий уже лежат в коде — настоящие кадры с
 * подъёмника, снятые в сервисе. Они идут на сайте первыми и правятся
 * разработчиком, а не здесь: подписи к ним сверены по шильдикам на
 * самих снимках, и менять их текстовым полем значит открыть дорогу
 * «Ауди» под фотографией «Шкоды».
 *
 * Добавленное владельцем показывается после них. Так новая работа не
 * перемешивается со старыми и видно, что именно добавил он.
 *
 * ── Почему ссылка необязательна ──
 *
 * У крупного плана узла машины в кадре нет, вести такой снимок некуда.
 * Пустое поле — рабочее состояние, а не недозаполненное.
 */
export default async function WorksPage() {
  await requireAdmin()

  const db = await getDb()
  const rows = await listWorks(db)
  const ready = rows.filter((row) => row.visible && row.photo).length

  return (
    <>
      <PageHead
        title="Наши работы"
        lead={`${BASE_WORKS.length} снимков в сайте изначально${
          rows.length > 0
            ? `, ваших ${rows.length} — ${ready} ${plural(ready, 'показан', 'показаны', 'показаны')}`
            : ''
        }`}
      >
        <AddRowButton list="work" label="Добавить снимок" />
      </PageHead>

      <PageBody>
        {rows.length === 0 ? (
          <Empty title="Своих снимков пока нет">
            Нажмите «Добавить снимок» и выберите фотографию с телефона. Она сама развернётся,
            ужмётся и встанет в галерею после девятнадцати прежних.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <article
                key={row.id}
                className={`rounded-card border bg-white px-5 py-4 ${
                  row.visible && row.photo
                    ? 'border-line-light'
                    : 'border-dashed border-line-light opacity-70'
                }`}
              >
                <div className="grid gap-x-5 gap-y-3 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <div>
                    <Label>Фотография</Label>
                    <WorkPhotoUpload id={row.id} photo={row.photo} hint={row.car} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Что на снимке</Label>
                      <ListField
                        list="work"
                        id={row.id}
                        field="car"
                        value={row.car}
                        placeholder="Toyota RAV4 или «Шар и квадрат»"
                      />
                    </div>
                    <div>
                      <Label>Производитель фаркопа</Label>
                      <ListField
                        list="work"
                        id={row.id}
                        field="article"
                        value={row.article}
                        placeholder="только если виден на снимке"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Ссылка на фаркопы для этой машины</Label>
                      <ListField
                        list="work"
                        id={row.id}
                        field="href"
                        value={row.href}
                        placeholder="/farkopy/toyota/rav4 — можно оставить пустым"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-light pt-3">
                  <RowActions
                    list="work"
                    id={row.id}
                    visible={row.visible}
                    first={index === 0}
                    last={index === rows.length - 1}
                  />
                  {(!row.photo || !row.car.trim()) && (
                    <span className="text-[12px] text-ink-dim">
                      Без фотографии и подписи на сайт не уйдёт
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
