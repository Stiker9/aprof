import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { plural } from '../src/catalog/format'

/**
 * Выкладывает правки владельца в файл, который читает сайт.
 *
 *   npx tsx scripts/apply-overrides.ts
 *
 * ── Зачем промежуточный файл ──
 *
 * Телефон, адрес и реквизиты выводятся на 8 251 странице обычными
 * константами — синхронно, прямо при отрисовке. Чтобы брать их из
 * базы, пришлось бы сделать асинхронными почти все страницы сайта
 * вместе с шапкой и подвалом. Поэтому правки один раз выкладываются в
 * JSON, а константы остаются константами.
 *
 * Товаров это не касается: их страницы и так читают базу, и правка
 * накладывается прямо в запросе (src/catalog/overrides.ts).
 *
 * ── Что попадает в файлы ──
 *
 * content-overrides.json — всё из таблицы overrides, кроме товаров и
 * служебных меток.
 *
 * content-lists.json — отзывы, акции и снимки работ, которые владелец
 * пометил «показывать». Заодно отсеивается незаполненное: отзыв без
 * текста, акция без заголовка, снимок без файла. Проверка стоит здесь,
 * а не при показе, намеренно — к моменту сборки данные должны быть
 * пригодны к выводу, и странице не нужно гадать, рисовать ли пустую
 * карточку.
 *
 * Признак «опубликовано» здесь не смотрится: раз запущена сборка —
 * значит, публикуем всё, что накопилось. Отметку о публикации ставит
 * тот, кто запускал сборку, и только после успешной заливки.
 */
const DB_PATH = process.env.PGLITE_PATH || path.resolve(__dirname, '..', '.pgdata')
const OUT = path.resolve(__dirname, '..', 'data', 'content-overrides.json')
const OUT_LISTS = path.resolve(__dirname, '..', 'data', 'content-lists.json')

interface Row {
  entity: string
  target_key: string
  field: string
  value: string | null
}

async function main() {
  const client = new PGlite(DB_PATH)

  /*
    Таблицы может не быть: на чистой машине дамп разворачивается до
    миграций, а этот скрипт запускается и отдельно. Пустой файл в таком
    случае правильнее падения — сайт просто соберётся на значениях из
    кода.
  */
  const out: Record<string, Record<string, Record<string, string>>> = {}

  if (await hasTable(client, 'overrides')) {
    const { rows } = await client.query<Row>(
      "select entity, target_key, field, value from overrides where entity <> 'product' and field <> '__dirty'",
    )

    for (const row of rows) {
      if (row.value === null || row.value.trim() === '') continue
      const entity = (out[row.entity] ??= {})
      const target = (entity[row.target_key] ??= {})
      target[row.field] = row.value
    }
  }

  // Ключи сортируются: иначе порядок зависит от порядка строк в базе, и
  // файл шумит в истории изменений при каждом запуске.
  writeFileSync(OUT, `${JSON.stringify(sortDeep(out), null, 2)}\n`, 'utf8')

  const count = Object.values(out).reduce(
    (sum, targets) => sum + Object.values(targets).reduce((n, fields) => n + Object.keys(fields).length, 0),
    0,
  )
  console.log(`data/content-overrides.json: ${count} ${plural(count, 'правка', 'правки', 'правок')}`)

  await writeLists(client)
  await client.close()
}

interface ReviewRow {
  author: string
  car: string
  text: string
  date: string
}

interface PromoRow {
  slug: string
  title: string
  lead: string
  kind: string
  discount: string
  discount_note: string
  items: { model: string; discount: string }[]
  until: string | null
}

interface WorkRow {
  car: string
  article: string
  photo: string
  href: string
}

interface FaqRow {
  id: number
  scope: string
  question: string
  answer: string
}

async function writeLists(client: PGlite): Promise<void> {
  const lists: {
    reviews: ReviewRow[]
    promos: unknown[]
    works: WorkRow[]
    faq: unknown[]
  } = { reviews: [], promos: [], works: [], faq: [] }

  if (await hasTable(client, 'reviews')) {
    const { rows } = await client.query<ReviewRow>(
      `select author, car, text, date from reviews
       where visible and btrim(text) <> '' and btrim(author) <> ''
       order by position, id`,
    )
    lists.reviews = rows
  }

  if (await hasTable(client, 'promos')) {
    const { rows } = await client.query<PromoRow>(
      `select slug, title, lead, kind, discount, discount_note, items, until from promos
       where visible and btrim(title) <> ''
       order by position, id`,
    )
    // Имя поля в базе со знаком подчёркивания, в коде сайта — слитно.
    // Переименование здесь, а не на витрине: пусть разница живёт в
    // одном месте, на границе.
    lists.promos = rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      lead: row.lead,
      kind: row.kind === 'list' ? 'list' : 'text',
      discount: row.discount,
      discountNote: row.discount_note,
      items: row.items ?? [],
      until: row.until ?? '',
    }))
  }

  if (await hasTable(client, 'works')) {
    const { rows } = await client.query<WorkRow>(
      `select car, article, photo, href from works
       where visible and btrim(photo) <> '' and btrim(car) <> ''
       order by position, id`,
    )
    lists.works = rows
  }

  if (await hasTable(client, 'faq')) {
    const { rows } = await client.query<FaqRow>(
      `select id, scope, question, answer from faq
       where visible and btrim(question) <> '' and btrim(answer) <> ''
       order by position, id`,
    )
    /*
      Ключ собирается из номера строки с приставкой: он уходит в
      разметку как ключ списка и обязан не совпасть с ключами вопросов
      из кода. Голое число однажды совпало бы.
    */
    lists.faq = rows.map((row) => ({
      id: `own-${row.id}`,
      scope: row.scope === 'catalog' ? 'catalog' : 'home',
      question: row.question,
      answer: row.answer,
    }))
  }

  writeFileSync(OUT_LISTS, `${JSON.stringify(lists, null, 2)}
`, 'utf8')

  console.log(
    `data/content-lists.json: отзывов ${lists.reviews.length}, ` +
      `акций ${lists.promos.length}, снимков ${lists.works.length}, ` +
      `вопросов ${lists.faq.length}`,
  )
}

async function hasTable(client: PGlite, name: string): Promise<boolean> {
  const { rows } = await client.query<{ yes: boolean }>(
    'select exists(select 1 from information_schema.tables where table_name = $1) as yes',
    [name],
  )
  return rows[0]?.yes === true
}

function sortDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value

  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortDeep((value as Record<string, unknown>)[key])
  }
  return sorted as T
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
