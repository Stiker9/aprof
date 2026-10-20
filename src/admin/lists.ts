import { asc, eq } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { faq, promos, reviews, works } from '../db/schema'

/**
 * Списки, которые ведёт владелец: отзывы, акции, снимки работ.
 *
 * ── Почему один модуль на три таблицы ──
 *
 * Операции у них одни и те же: показать по порядку, добавить пустую
 * строку, поправить поле, передвинуть, скрыть, удалить. Разложить это
 * по трём файлам значит трижды написать одно и то же и дважды забыть
 * поправить при изменении.
 *
 * Таблицы при этом остаются разными — общего типа «запись списка» нет
 * и не надо: у отзыва автор и текст, у акции срок и скидка, у снимка
 * файл. Общая здесь работа, а не данные.
 *
 * ── Почему новая запись создаётся пустой ──
 *
 * Привычнее форма «заполни и нажми добавить». Но тогда заполнение
 * живёт в браузере до нажатия, и закрытая вкладка уносит его целиком.
 * Здесь нажатие создаёт пустую строку сразу, а поля сохраняются сами
 * по мере заполнения — ровно как в таблице товаров.
 *
 * Цена этому — пустая строка, если передумали. Поэтому скрытой она
 * создаётся не всегда: отзыв без текста на витрину всё равно не
 * попадёт, это проверяется при выкладке.
 */

export type ListName = 'review' | 'promo' | 'work' | 'faq'

const TABLES = {
  review: reviews,
  promo: promos,
  work: works,
  faq,
} as const

/** Какие поля разрешено править через общий обработчик. */
const EDITABLE: Record<ListName, readonly string[]> = {
  review: ['author', 'car', 'text', 'date'],
  promo: ['slug', 'title', 'lead', 'kind', 'discount', 'discountNote', 'until'],
  work: ['car', 'article', 'photo', 'href'],
  faq: ['question', 'answer'],
}

export function isEditableField(list: ListName, field: string): boolean {
  return EDITABLE[list].includes(field)
}

export async function listReviews(db: DrizzleDb) {
  return db.select().from(reviews).orderBy(asc(reviews.position), asc(reviews.id))
}

export async function listPromos(db: DrizzleDb) {
  return db.select().from(promos).orderBy(asc(promos.position), asc(promos.id))
}

export async function listWorks(db: DrizzleDb) {
  return db.select().from(works).orderBy(asc(works.position), asc(works.id))
}

export async function listFaq(db: DrizzleDb) {
  return db.select().from(faq).orderBy(asc(faq.position), asc(faq.id))
}

/**
 * Добавляет пустую запись в конец списка.
 *
 * `position` считается от числа записей, а не от максимума: при
 * удалении из середины максимум остаётся прежним, и новые записи
 * копились бы с одинаковой позицией. Сортировка тогда падает на id, и
 * порядок внешне не ломается — но перетащить запись становится нечем.
 */
export async function addRow(
  db: DrizzleDb,
  list: ListName,
  /** Только для вопросов: в какой из двух списков добавлять. */
  scope: 'home' | 'catalog' = 'home',
): Promise<number> {
  const createdAt = new Date().toISOString()
  const position = (await listLength(db, list)) + 1

  if (list === 'review') {
    const [row] = await db
      .insert(reviews)
      .values({ author: '', text: '', position, createdAt, visible: false })
      .returning({ id: reviews.id })
    return row.id
  }

  if (list === 'promo') {
    const [row] = await db
      .insert(promos)
      .values({
        // Слаг обязан быть уникальным, а пустых строк может быть
        // несколько. Временный ставим от времени создания, владелец
        // перепишет его по-человечески.
        slug: `akciya-${Date.now().toString(36)}`,
        title: '',
        position,
        createdAt,
        visible: false,
      })
      .returning({ id: promos.id })
    return row.id
  }

  if (list === 'work') {
    const [row] = await db
      .insert(works)
      .values({ car: '', photo: '', position, createdAt, visible: false })
      .returning({ id: works.id })
    return row.id
  }

  const [row] = await db
    .insert(faq)
    .values({ question: '', answer: '', scope, position, createdAt, visible: false })
    .returning({ id: faq.id })
  return row.id
}

async function listLength(db: DrizzleDb, list: ListName): Promise<number> {
  const rows = await db.select({ id: TABLES[list].id }).from(TABLES[list])
  return rows.length
}

export async function setRowField(
  db: DrizzleDb,
  list: ListName,
  id: number,
  field: string,
  value: string,
): Promise<void> {
  if (!isEditableField(list, field)) return

  const table = TABLES[list]
  // Имя столбца приходит из формы, поэтому список разрешённых выше —
  // не формальность: без него сюда можно было бы передать 'visible'
  // или 'id' и переписать то, у чего есть свой обработчик.
  await db
    .update(table)
    .set({ [field]: value.trim() } as Record<string, string>)
    .where(eq(table.id, id))
}

export async function setRowVisible(
  db: DrizzleDb,
  list: ListName,
  id: number,
  visible: boolean,
): Promise<void> {
  const table = TABLES[list]
  await db.update(table).set({ visible }).where(eq(table.id, id))
}

export async function deleteRow(db: DrizzleDb, list: ListName, id: number): Promise<void> {
  const table = TABLES[list]
  await db.delete(table).where(eq(table.id, id))
}

/**
 * Меняет запись местами с соседней.
 *
 * Обмен позициями, а не «положить между»: дробных позиций нет, и
 * вставка между соседями требовала бы пересчёта всего списка. Списки
 * здесь короткие — десятки записей, не тысячи.
 */
export async function moveRow(
  db: DrizzleDb,
  list: ListName,
  id: number,
  direction: 'up' | 'down',
): Promise<void> {
  const table = TABLES[list]
  const rows = await db
    .select({ id: table.id, position: table.position })
    .from(table)
    .orderBy(asc(table.position), asc(table.id))

  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) return

  const neighbour = direction === 'up' ? index - 1 : index + 1
  if (neighbour < 0 || neighbour >= rows.length) return

  /*
    Позиции переписываются по порядку списка целиком, а не меняются у
    двух записей. У записей, созданных до появления сортировки, позиция
    может совпадать или стоять нулём — обмен двух таких значений не
    изменил бы ничего, и кнопка выглядела бы сломанной.
  */
  const reordered = [...rows]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(neighbour, 0, moved)

  for (const [position, row] of reordered.entries()) {
    await db
      .update(table)
      .set({ position: position + 1 })
      .where(eq(table.id, row.id))
  }
}
