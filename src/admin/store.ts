import { and, count, desc, eq, lte } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { overrides, requests } from '../db/schema'

/**
 * Запись правок владельца.
 *
 * Чтение живёт в src/catalog/overrides.ts — им пользуется сборка сайта.
 * Запись здесь, потому что ей нужны вещи, которых у сборки нет: автор
 * правки и признак «ещё не опубликовано».
 *
 * ── Очередь, а не мгновенная публикация ──
 *
 * Правка ложится в базу с `published: false` и на сайт сразу не
 * попадает: витрина — это статические файлы, их надо пересобрать.
 * Пересборка на каждое нажатие бессмысленна — владелец правит цены
 * пачками по двадцать штук. Поэтому правки копятся, админка показывает
 * «N правок не опубликовано», и публикация идёт одним нажатием.
 *
 * Это же даёт право на ошибку: пока не опубликовано — можно отменить,
 * и покупатель ничего не увидел.
 */

export type OverrideEntity = (typeof overrides.$inferSelect)['entity']

/**
 * Кладёт правку. Повторная правка того же поля затирает прежнюю.
 *
 * Пустая строка — это удаление правки, а не правка пустым значением.
 * Иначе из админки нельзя вернуться к цене поставщика: стёр поле,
 * сохранил — и на витрине пусто вместо цены.
 */
export async function setOverride(
  db: DrizzleDb,
  entity: OverrideEntity,
  targetKey: string,
  field: string,
  value: string | null,
  author: string,
): Promise<void> {
  const trimmed = value?.trim() ?? ''

  if (trimmed === '') {
    await clearOverride(db, entity, targetKey, field)
    return
  }

  await db
    .insert(overrides)
    .values({
      entity,
      targetKey,
      field,
      value: trimmed,
      author,
      updatedAt: new Date().toISOString(),
      published: false,
    })
    .onConflictDoUpdate({
      target: [overrides.entity, overrides.targetKey, overrides.field],
      set: {
        value: trimmed,
        author,
        updatedAt: new Date().toISOString(),
        published: false,
      },
    })
}

/**
 * Убирает правку — поле возвращается к значению из выгрузки.
 *
 * Строка удаляется, а не помечается пустой. Пустая правка в базе
 * означала бы «владелец задал пусто», и наложение слоя показало бы на
 * витрине пустое место вместо цены поставщика.
 *
 * Обратная сторона: удалённая правка не попадёт в очередь публикации,
 * и витрина продолжит показывать прежнее значение до следующей сборки.
 * Поэтому счётчик непубликованного считает и удаления — см. markDirty.
 */
export async function clearOverride(
  db: DrizzleDb,
  entity: OverrideEntity,
  targetKey: string,
  field: string,
): Promise<void> {
  const removed = await db
    .delete(overrides)
    .where(
      and(
        eq(overrides.entity, entity),
        eq(overrides.targetKey, targetKey),
        eq(overrides.field, field),
      ),
    )
    .returning({ id: overrides.id })

  /*
    Метка ставится, только если правку действительно сняли.

    Без проверки её ставил любой холостой вызов: нажатие на
    переключатель «Показан» у товара, который и так показан, уходило в
    clearOverride, ничего не удаляло — и всё равно добавляло строку в
    очередь публикации. Счётчик «N правок не на сайте» рос от действий,
    которые ничего не изменили, и доверять ему переставали.
  */
  if (removed.length > 0) await markDirty(db, entity, targetKey)
}

/**
 * Отмечает сущность изменённой, не меняя её полей.
 *
 * Нужна там, где правка не ложится строкой «поле → значение»:
 *
 * — сняли правку: записи больше нет, а страницу пересобрать надо,
 *   иначе на витрине останется стёртое значение;
 * — поправили список (отзыв, акцию, снимок): он живёт своей таблицей,
 *   и в очереди публикации его иначе не видно.
 *
 * Метка лежит служебным полем `__dirty`. Сайт его не читает, а очередь
 * публикации показывает словами.
 */
export async function markDirty(
  db: DrizzleDb,
  entity: OverrideEntity,
  targetKey: string,
  author = 'system',
): Promise<void> {
  await db
    .insert(overrides)
    .values({
      entity,
      targetKey,
      field: '__dirty',
      value: '1',
      author,
      updatedAt: new Date().toISOString(),
      published: false,
    })
    .onConflictDoUpdate({
      target: [overrides.entity, overrides.targetKey, overrides.field],
      set: { updatedAt: new Date().toISOString(), published: false, author },
    })
}

/**
 * Сколько правок ждёт публикации.
 *
 * Служебные метки считаются наравне с правками полей: метка означает
 * «здесь что-то изменилось, а строки правки не осталось» — снятую
 * правку или добавленный отзыв. Не считать её значит показывать «всё
 * опубликовано» там, где витрина отстала.
 */
export async function pendingCount(db: DrizzleDb): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(overrides)
    .where(eq(overrides.published, false))
  return Number(row?.n ?? 0)
}

export interface PendingItem {
  entity: OverrideEntity
  targetKey: string
  field: string
  value: string | null
  author: string
  updatedAt: string
}

/** Что именно ждёт публикации — список для проверки перед нажатием. */
export async function pendingList(db: DrizzleDb, limit = 200): Promise<PendingItem[]> {
  return db
    .select({
      entity: overrides.entity,
      targetKey: overrides.targetKey,
      field: overrides.field,
      value: overrides.value,
      author: overrides.author,
      updatedAt: overrides.updatedAt,
    })
    .from(overrides)
    .where(eq(overrides.published, false))
    .orderBy(desc(overrides.updatedAt))
    .limit(limit)
}

/**
 * Помечает всё опубликованным.
 *
 * Вызывается ПОСЛЕ успешной сборки и заливки, а не до. Если пометить
 * заранее и сборка упадёт, правки пропадут из очереди, и владелец
 * решит, что они на сайте.
 *
 * Служебные метки при публикации удаляются: они нужны были только
 * чтобы сборка узнала, что страницу надо переделать.
 */
export async function markPublished(db: DrizzleDb, upTo?: string): Promise<void> {
  /*
    upTo — момент, когда снималась база для сборки. Правки, сделанные
    позже, пока сайт полчаса собирался, в выгрузку не попали, и помечать
    их опубликованными нельзя: владелец решил бы, что они на сайте.
    Время хранится в ISO, поэтому строки сравниваются как даты.
  */
  const before = upTo ? lte(overrides.updatedAt, upTo) : undefined
  await db.delete(overrides).where(and(eq(overrides.field, '__dirty'), before))
  await db
    .update(overrides)
    .set({ published: true })
    .where(and(eq(overrides.published, false), before))
}

/* ── Заявки ──────────────────────────────────────────────────────── */

export type RequestStatus = 'new' | 'called' | 'done' | 'spam'

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'called', label: 'Позвонили' },
  { value: 'done', label: 'Записан' },
  { value: 'spam', label: 'Не по делу' },
]

export async function listRequests(
  db: DrizzleDb,
  status?: RequestStatus,
): Promise<(typeof requests.$inferSelect)[]> {
  // `.where()` ставится до `.orderBy()`: конструктор запросов Drizzle
  // не принимает его после `.limit()` — цепочка там уже закрыта.
  return db
    .select()
    .from(requests)
    .where(status ? eq(requests.status, status) : undefined)
    .orderBy(desc(requests.createdAt))
    .limit(300)
}

export async function countNewRequests(db: DrizzleDb): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(requests)
    .where(eq(requests.status, 'new'))
  return Number(row?.n ?? 0)
}

/**
 * Меняет состояние заявки.
 *
 * Заявки не правятся через слой overrides: это не правка выгрузки, а
 * собственные данные админки, и импорт их не трогает.
 */
export async function setRequestStatus(
  db: DrizzleDb,
  id: number,
  status: RequestStatus,
): Promise<void> {
  await db.update(requests).set({ status }).where(eq(requests.id, id))
}
