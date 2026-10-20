import Link from 'next/link'
import { requireAdmin } from '@/admin/auth'
import { countEditedProducts, countHiddenProducts } from '@/admin/products'
import { countNewRequests, listRequests, pendingCount } from '@/admin/store'
import { formatWhen } from '@/admin/when'
import { countProducts } from '@/catalog/queries'
import { formatNumber, plural } from '@/catalog/format'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Сводка — первый экран после входа.
 *
 * ── Что на нём и почему именно это ──
 *
 * Владелец заходит с одним из двух вопросов: «кто мне написал» и «что я
 * не доделал». Всё остальное он ищет по меню. Поэтому на сводке только
 * свежие заявки и числа, по которым видно состояние: сколько правок
 * лежит неопубликованным, сколько товаров скрыто с витрины.
 *
 * Графиков и диаграмм здесь нет намеренно. Посещаемость показывает
 * Метрика, и рисовать её второй раз своими руками — значит обещать
 * точность, которой у нас нет: сайт статический, счётчика запросов на
 * нём не стоит.
 */
export default async function DashboardPage() {
  const session = await requireAdmin()
  const db = await getDb()

  const [newRequests, pending, total, edited, hidden, latest] = await Promise.all([
    countNewRequests(db),
    pendingCount(db),
    countProducts(db),
    countEditedProducts(db),
    countHiddenProducts(db),
    listRequests(db),
  ])

  return (
    <>
      <PageHead title={`Здравствуйте, ${session.login}`} lead="Что происходит на сайте" />

      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            value={newRequests}
            label={plural(newRequests, 'новая заявка', 'новые заявки', 'новых заявок')}
            href="/admin/zayavki?status=new"
            accent={newRequests > 0}
          />
          <Tile
            value={pending}
            label={plural(pending, 'правка не на сайте', 'правки не на сайте', 'правок не на сайте')}
            href="/admin/publikacii"
            accent={pending > 0}
          />
          <Tile value={total} label="товаров в каталоге" href="/admin/tovary" />
          <Tile
            value={edited}
            label={plural(edited, 'товар с вашей правкой', 'товара с вашими правками', 'товаров с вашими правками')}
            href="/admin/tovary"
            note={hidden > 0 ? `из них скрыто с витрины: ${formatNumber(hidden)}` : undefined}
          />
        </div>

        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-[15px] font-bold">
              Последние заявки
            </h2>
            <Link href="/admin/zayavki" className="text-[13px] text-ink-muted hover:text-accent">
              все заявки →
            </Link>
          </div>

          {latest.length === 0 ? (
            <Empty title="Заявок пока нет">
              Здесь появятся обращения с форм на сайте. Приём заявок в базу включится вместе с
              переездом на свой сервер — пока формы отправляют письмо.
            </Empty>
          ) : (
            <ul className="divide-y divide-line-light overflow-hidden rounded-card border border-line-light bg-white">
              {latest.slice(0, 6).map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5">
                  <a
                    href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}
                    className="num font-semibold text-accent hover:underline"
                  >
                    {row.phone}
                  </a>
                  <span>{row.name || 'без имени'}</span>
                  {row.car && <span className="text-ink-muted">{row.car}</span>}
                  <span className="ml-auto text-[12px] text-ink-dim">
                    {formatWhen(row.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  )
}

/**
 * Плитка с числом.
 *
 * Число крупным, подпись мелким — а не наоборот: плитки читают
 * вскользь, и первым в глаз должно попадать то, что изменилось.
 *
 * Акцентом подсвечивается только то, что требует действия. Если
 * подсвечивать всё, подсветка перестаёт значить что-либо — так теряется
 * смысл и красной рамки, и жирного шрифта.
 */
function Tile({
  value,
  label,
  href,
  note,
  accent = false,
}: {
  value: number
  label: string
  href: string
  note?: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block rounded-card border bg-white px-4 py-3.5 transition-colors ${
        accent
          ? 'border-accent/35 bg-accent-soft hover:border-accent'
          : 'border-line-light hover:border-ink-muted'
      }`}
    >
      <span
        className={`num block font-[family-name:var(--font-display)] text-2xl font-bold ${
          accent ? 'text-accent' : 'text-ink-dark'
        }`}
      >
        {formatNumber(value)}
      </span>
      <span className="mt-0.5 block text-[13px] text-ink-muted">{label}</span>
      {note && <span className="mt-0.5 block text-[11px] text-ink-dim">{note}</span>}
    </Link>
  )
}
