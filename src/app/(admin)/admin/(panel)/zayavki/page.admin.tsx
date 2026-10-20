import Link from 'next/link'
import { requireAdmin } from '@/admin/auth'
import { listRequests, REQUEST_STATUSES, type RequestStatus } from '@/admin/store'
import { formatWhen } from '@/admin/when'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { RequestStatusSelect } from '@/components/admin/request-status'
import { getDb } from '@/db/client'

/**
 * Заявки с сайта.
 *
 * ── Почему таблица, а не карточки ──
 *
 * Заявка — это четыре поля: кто, телефон, машина, когда. В карточках
 * на экран влезает шесть штук, в строках — тридцать. Владелец
 * просматривает их утром пачкой, и ему нужен обзор, а не каждая по
 * очереди.
 *
 * ── Почему телефон — ссылка ──
 *
 * Админку открывают с телефона. Нажатие на номер набирает его, а не
 * заставляет переписывать семь цифр из одного приложения в другое.
 *
 * ── Чего здесь нет ──
 *
 * Удаления. Заявки — персональные данные, и по 152-ФЗ их полагается
 * хранить ровно столько, сколько нужно для дела, и уметь удалить по
 * требованию человека. Но «по требованию» — это отдельное обдуманное
 * действие, а не крестик в строке рядом с переключателем состояния.
 */
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()

  const params = await searchParams
  const raw = typeof params.status === 'string' ? params.status : ''
  const status = REQUEST_STATUSES.some((s) => s.value === raw) ? (raw as RequestStatus) : undefined

  const db = await getDb()
  const rows = await listRequests(db, status)

  return (
    <>
      <PageHead title="Заявки" lead="Звонки и записи, оставленные через формы на сайте">
        <Filter current={status} />
      </PageHead>

      <PageBody>
        {rows.length === 0 ? (
          <Empty title={status ? 'В этом состоянии заявок нет' : 'Заявок пока нет'}>
            {status
              ? 'Снимите фильтр, чтобы увидеть остальные.'
              : 'Здесь появятся обращения с форм «Записаться» и «Подобрать фаркоп». Пока формы отправляют письмо, запись в эту таблицу включится вместе с переездом сайта на свой сервер.'}
          </Empty>
        ) : (
          /*
            Сетка, а не <table>: на телефоне пять столбцов не
            помещаются, а заявки смотрят как раз с телефона — из
            мастерской. Здесь та же строка раскладывается в карточку.
          */
          <div className="overflow-hidden rounded-card border border-line-light bg-white">
            <div className={`${GRID} hidden border-b border-line-light bg-paper-2 px-3 py-2 text-[11px] tracking-wide text-ink-muted uppercase lg:grid`}>
              <span className="font-semibold">Когда</span>
              <span className="font-semibold">Имя</span>
              <span className="font-semibold">Телефон</span>
              <span className="font-semibold">Машина и вопрос</span>
              <span className="font-semibold">Состояние</span>
            </div>

            <div className="divide-y divide-line-light">
              {rows.map((row) => (
                <div key={row.id} className={`${GRID} px-3 py-3 hover:bg-row-hover`}>
                  <div className="text-[12px] text-ink-muted">
                    {formatWhen(row.createdAt)}
                    {row.page && (
                      <span className="mt-0.5 block truncate text-[11px] text-ink-dim">
                        {row.page}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 lg:block">
                    <a
                      href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}
                      className="num font-semibold text-accent hover:underline lg:hidden"
                    >
                      {row.phone}
                    </a>
                    <span className={row.name ? '' : 'text-ink-dim'}>
                      {row.name || 'без имени'}
                    </span>
                  </div>

                  <a
                    href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}
                    className="num hidden font-semibold text-accent hover:underline lg:block"
                  >
                    {row.phone}
                  </a>

                  <div>
                    {row.car && <span className="block">{row.car}</span>}
                    {row.comment && (
                      <span className="block text-[13px] text-ink-muted">{row.comment}</span>
                    )}
                    {!row.car && !row.comment && (
                      <span className="hidden text-ink-dim lg:inline">—</span>
                    )}
                  </div>

                  <div className="max-w-44">
                    <RequestStatusSelect id={row.id} status={row.status} />
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

/**
 * Фильтр по состоянию — ссылками, а не выпадающим списком.
 *
 * Состояние фильтра живёт в адресе: страницу можно положить в закладки
 * («новые заявки») и вернуться к ней после перезагрузки. Выпадающий
 * список потребовал бы для этого скрипта и сбрасывался бы при
 * обновлении.
 */
function Filter({ current }: { current?: RequestStatus }) {
  const options = [{ value: undefined, label: 'Все' }, ...REQUEST_STATUSES]

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => {
        const active = current === option.value
        return (
          <Link
            key={option.value ?? 'all'}
            href={option.value ? `/admin/zayavki?status=${option.value}` : '/admin/zayavki'}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              active
                ? 'border-ink-dark bg-ink-dark text-paper'
                : 'border-line-light bg-white text-ink-muted hover:border-ink-muted'
            }`}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Раскладка строки заявки: пять колонок на широком экране, одна на
 * узком. По ней же строится шапка — иначе подписи столбцов встанут не
 * над своими полями.
 */
const GRID = 'grid gap-x-3 gap-y-1.5 lg:grid-cols-[9rem_10rem_10rem_minmax(0,1fr)_9rem] lg:items-start'
