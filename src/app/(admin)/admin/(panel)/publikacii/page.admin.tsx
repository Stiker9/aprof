import { requireAdmin } from '@/admin/auth'
import { pendingList, type OverrideEntity } from '@/admin/store'
import { publishState } from '@/admin/publish'
import { PublishButton } from '@/components/admin/publish-button'
import { formatWhen } from '@/admin/when'
import { plural } from '@/catalog/format'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Что ждёт публикации.
 *
 * ── Почему публикация отдельным шагом ──
 *
 * Сайт — статические файлы: 8 257 готовых страниц. Правка в базе на
 * них не влияет, пока страницы не пересобраны. Пересобирать на каждое
 * нажатие нельзя — владелец правит цены пачками по двадцать, и каждая
 * сборка это минуты.
 *
 * Поэтому правки копятся, и этот экран показывает, что именно лежит в
 * очереди. Заодно это право на ошибку: пока не опубликовано — видно,
 * что изменено, и можно вернуть.
 */

/** Человеческие названия сущностей. В базе они латиницей. */
const ENTITY_LABEL: Record<OverrideEntity, string> = {
  product: 'Товар',
  review: 'Отзыв',
  promo: 'Акция',
  work: 'Работа в галерее',
  install_price: 'Цена установки',
  electrics: 'Электрика',
  faq: 'Вопрос и ответ',
  contacts: 'Контакты',
  ball_photo: 'Фото узла',
}

const FIELD_LABEL: Record<string, string> = {
  /*
    Служебная метка: правки поля не осталось, но страницу пересобрать
    надо — владелец снял свою цену или поправил список отзывов.
    Показывается словами, иначе в очереди стоит «__dirty».
  */
  __dirty: 'изменён',
  price: 'цена',
  article: 'артикул',
  description: 'описание',
  photo: 'фотография',
  hidden: 'скрытие с витрины',
  selfManaged: 'веду сам',
  question: 'вопрос',
  answer: 'ответ',
  work: 'название работы',
  own: 'цена со своим фаркопом',
  client: 'цена с фаркопом клиента',
  note: 'оговорка',
  label: 'название',
  score: 'средняя оценка',
  count: 'число отзывов',
  phone: 'телефон',
  email: 'почта',
  hours: 'часы работы',
  dayOff: 'выходной',
  address: 'адрес',
  addressShort: 'короткий адрес',
  addressNote: 'как найти',
  streetIn: 'улица в предложном',
  legalName: 'название или ФИО',
  inn: 'ИНН',
  ogrn: 'ОГРН',
}

/** Четыре колонки на широком экране, одна на узком — как и в прочих списках. */
const GRID = 'grid gap-x-3 gap-y-1 lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)_14rem] lg:items-start'

export default async function PublicationsPage() {
  await requireAdmin()

  const db = await getDb()
  const items = await pendingList(db)
  const publish = publishState()

  return (
    <>
      <PageHead
        title="Публикации"
        lead={
          items.length === 0
            ? 'Все правки на сайте'
            : `${items.length} ${plural(items.length, 'правка ждёт', 'правки ждут', 'правок ждут')} публикации`
        }
      />

      <PageBody>
        <div className="mb-5">
          <PublishButton state={publish.kind} pending={items.length} log={publish.log} />
        </div>

        {items.length === 0 ? (
          <Empty title="Очередь пуста">
            Как только вы что-нибудь поправите, правка появится здесь и в меню слева.
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-card border border-line-light bg-white">
            <div className={`${GRID} hidden border-b border-line-light bg-paper-2 px-3 py-2 text-[11px] tracking-wide text-ink-muted uppercase lg:grid`}>
              <span className="font-semibold">Что</span>
              <span className="font-semibold">Где</span>
              <span className="font-semibold">Новое значение</span>
              <span className="font-semibold">Когда</span>
            </div>

            <div className="divide-y divide-line-light">
              {items.map((item) => (
                <div
                  key={`${item.entity}-${item.targetKey}-${item.field}`}
                  className={`${GRID} px-3 py-3`}
                >
                  <div>
                    {ENTITY_LABEL[item.entity]}
                    <span className="text-ink-muted"> · {FIELD_LABEL[item.field] ?? item.field}</span>
                  </div>

                  <div className="text-[13px] text-ink-muted">{item.targetKey}</div>

                  <div>
                    {item.field === '__dirty' ? (
                      <span className="text-ink-muted">
                        вернулось к исходному или изменён список
                      </span>
                    ) : item.field === 'hidden' ? (
                      <span className="text-accent">убрано с витрины</span>
                    ) : (
                      <span className="num">{item.value}</span>
                    )}
                  </div>

                  <div className="text-[12px] text-ink-dim lg:whitespace-nowrap">
                    {formatWhen(item.updatedAt)} · {item.author}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </>
  )
}
