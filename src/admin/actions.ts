'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { forgetProductOverrides } from '@/catalog/overrides'
import { forgetOwnPhotos } from '@/catalog/own-photos'
import { addPhoto, deletePhoto, movePhoto } from './product-photos'
import { getDb } from '@/db/client'
import { adminUsers, promos } from '@/db/schema'
import { requireAdmin } from './auth'
import { verifyPassword, hashPassword } from './password'
import { createSession, destroySession } from './session'
import { addRow, deleteRow, moveRow, setRowField, setRowVisible, type ListName } from './lists'
import { startPublish } from './publish'
import { savePhoto, UploadError } from './uploads'
import {
  clearOverride,
  markDirty,
  setOverride,
  setRequestStatus,
  type OverrideEntity,
  type RequestStatus,
} from './store'
import { lockedFor, noteFailure, noteSuccess } from './throttle'

/**
 * Сбросить запомненные страницы после правки.
 *
 * Кроме админки, сервер отдаёт и страницы сайта — по адресу админки,
 * например /tovar/451312. Они запоминаются при первом открытии и сами
 * не обновляются. Владелец загрузил фото, открыл товар там — и увидел
 * старую картинку, а у Touareg, открытого впервые, уже новую
 * (23.10.2026). Сброс после каждой правки превращает эту копию в
 * честный предпросмотр: правки товаров видны сразу, ещё до публикации.
 *
 * Тексты, контакты, отзывы и вопросы сайт берёт из файлов, которые
 * пересобираются только при публикации, — в предпросмотре их не видно.
 */
function refresh(): void {
  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
}

/**
 * Серверные действия админки.
 *
 * ── Правило файла ──
 *
 * Каждое действие начинается с `requireAdmin()`. Не «проверка стоит в
 * макете»: серверное действие — это POST на собственный адрес, и
 * вызвать его можно, не открывая ни одной страницы. Макет при этом не
 * рендерится, и его проверка не срабатывает.
 *
 * Исключение одно — вход: ему проверять нечего.
 *
 * ── Почему `FormData`, а не объекты ──
 *
 * Формы отправляются и без JavaScript: `<form action={действие}>`
 * работает, пока скрипты грузятся или не загрузились вовсе. Для
 * админки, которую открывают с телефона в мастерской, это не роскошь.
 */

export interface LoginState {
  error?: string
}

/**
 * Вход.
 *
 * Сообщение об ошибке одно на оба случая — нет такого логина и
 * неверный пароль. Разные сообщения подсказывают перебирающему, что
 * логин угадан, и дальше остаётся только пароль.
 */
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const name = String(formData.get('login') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!name || !password) return { error: 'Заполните логин и пароль' }

  const waiting = lockedFor(name)
  if (waiting > 0) {
    return {
      error: `Слишком много попыток. Повторите через ${Math.ceil(waiting / 60)} мин.`,
    }
  }

  const db = await getDb()
  const [user] = await db
    .select({ login: adminUsers.login, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.login, name))
    .limit(1)

  const ok = user ? await verifyPassword(password, user.passwordHash) : false

  if (!ok) {
    noteFailure(name)
    return { error: 'Неверный логин или пароль' }
  }

  noteSuccess(name)
  await createSession(name)
  redirect('/admin')
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/admin/vhod')
}

/**
 * Смена пароля.
 *
 * Старый пароль спрашивается обязательно: иначе любой, кто подсел за
 * открытый ноутбук владельца, меняет пароль и запирает его самого.
 */
export async function changePassword(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState & { done?: boolean }> {
  const session = await requireAdmin()

  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const repeat = String(formData.get('repeat') ?? '')

  if (next.length < 10) return { error: 'Новый пароль короче десяти знаков' }
  if (next !== repeat) return { error: 'Новый пароль и повтор не совпадают' }

  const db = await getDb()
  const [user] = await db
    .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.login, session.login))
    .limit(1)

  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { error: 'Текущий пароль неверен' }
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(adminUsers.id, user.id))

  return { done: true }
}

/* ── Правки ──────────────────────────────────────────────────────── */

/**
 * Сохраняет одно поле одной сущности.
 *
 * Одно действие на все экраны правок, а не своё на каждый: экранов
 * десять, а операция у всех одна и та же — «положи значение поля».
 * Разными они были бы только набором проверок, а проверки всё равно
 * принадлежат экрану, который рисует поле.
 *
 * `entity` и `field` приходят из формы, то есть от браузера. Поэтому
 * список разрешённых сущностей задан типом перечисления в базе: чужое
 * значение не пройдёт вставку. Поле не проверяется — оно и так пишется
 * в свою строку и читается только тем экраном, который его знает.
 */
export async function saveField(formData: FormData): Promise<void> {
  const session = await requireAdmin()

  const entity = String(formData.get('entity') ?? '') as OverrideEntity
  const targetKey = String(formData.get('targetKey') ?? '')
  const field = String(formData.get('field') ?? '')
  const value = formData.get('value')

  if (!entity || !targetKey || !field) return

  const db = await getDb()
  await setOverride(db, entity, targetKey, field, value === null ? null : String(value), session.login)

  /*
    Страница админки перерисовывается, чтобы счётчик непубликованного
    и само поле показали новое состояние. Витрина пересобирается
    отдельно, по нажатию «Опубликовать».

    Заодно сбрасывается кеш правок. Он держится на весь процесс — так
    нужно сборке, которая читает его тысячи раз, — но в разработке
    процесс тот же, и без сброса страница товара показывала бы старую
    цену до перезапуска сервера.
  */
  forgetProductOverrides()
  refresh()
}

/** Снимает правку — поле возвращается к значению из выгрузки. */
export async function resetField(formData: FormData): Promise<void> {
  await requireAdmin()

  const entity = String(formData.get('entity') ?? '') as OverrideEntity
  const targetKey = String(formData.get('targetKey') ?? '')
  const field = String(formData.get('field') ?? '')
  if (!entity || !targetKey || !field) return

  const db = await getDb()
  await clearOverride(db, entity, targetKey, field)
  forgetProductOverrides()
  refresh()
}

/** Переключатель: скрыт товар или нет, спрятан он или нет. */
export async function toggleField(formData: FormData): Promise<void> {
  const session = await requireAdmin()

  const entity = String(formData.get('entity') ?? '') as OverrideEntity
  const targetKey = String(formData.get('targetKey') ?? '')
  const field = String(formData.get('field') ?? '')
  const on = formData.get('on') === '1'
  if (!entity || !targetKey || !field) return

  const db = await getDb()
  if (on) {
    await setOverride(db, entity, targetKey, field, '1', session.login)
  } else {
    await clearOverride(db, entity, targetKey, field)
  }
  forgetProductOverrides()
  refresh()
}

/* ── Заявки ──────────────────────────────────────────────────────── */

export async function updateRequest(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = Number(formData.get('id'))
  const status = String(formData.get('status') ?? '') as RequestStatus
  if (!Number.isInteger(id)) return

  const db = await getDb()
  await setRequestStatus(db, id, status)
  refresh()
}

/* ── Списки: отзывы, акции, снимки работ ─────────────────────────── */

/**
 * Любая правка списка помечает его изменённым.
 *
 * Сами записи лежат своими таблицами, а очередь публикации читает
 * overrides. Без метки добавленный отзыв не попал бы в счётчик «правок
 * не на сайте», и владелец считал бы его опубликованным.
 */
async function noteListChange(list: ListName, id: number, author: string): Promise<void> {
  const db = await getDb()
  await markDirty(db, LIST_ENTITY[list], String(id), author)
}

const LIST_ENTITY: Record<ListName, OverrideEntity> = {
  review: 'review',
  promo: 'promo',
  work: 'work',
  faq: 'faq',
}

function listOf(formData: FormData): ListName | null {
  const value = String(formData.get('list') ?? '')
  return value === 'review' || value === 'promo' || value === 'work' || value === 'faq'
    ? value
    : null
}

export async function addListRow(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const list = listOf(formData)
  if (!list) return

  // Вопросы делятся на два списка — про установку и про подбор.
  // Остальным спискам область не нужна и игнорируется.
  const scope = formData.get('scope') === 'catalog' ? 'catalog' : 'home'

  const db = await getDb()
  const id = await addRow(db, list, scope)
  await noteListChange(list, id, session.login)
  refresh()
}

export async function saveListField(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const list = listOf(formData)
  const id = Number(formData.get('id'))
  const field = String(formData.get('field') ?? '')
  if (!list || !Number.isInteger(id)) return

  const db = await getDb()
  await setRowField(db, list, id, field, String(formData.get('value') ?? ''))
  await noteListChange(list, id, session.login)
  refresh()
}

export async function toggleListVisible(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const list = listOf(formData)
  const id = Number(formData.get('id'))
  if (!list || !Number.isInteger(id)) return

  const db = await getDb()
  await setRowVisible(db, list, id, formData.get('on') === '1')
  await noteListChange(list, id, session.login)
  refresh()
}

export async function deleteListRow(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const list = listOf(formData)
  const id = Number(formData.get('id'))
  if (!list || !Number.isInteger(id)) return

  const db = await getDb()
  await deleteRow(db, list, id)

  /*
    Загруженный файл при удалении записи не стирается. Он мог уже
    уехать на сайт и попасть в чей-то кеш или в выдачу, а главное —
    удаление нельзя отменить. Папка public/images/own от этого растёт,
    но это мегабайты, а не риск.
  */
  await noteListChange(list, id, session.login)
  refresh()
}

export async function moveListRow(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const list = listOf(formData)
  const id = Number(formData.get('id'))
  const direction = formData.get('direction') === 'up' ? 'up' : 'down'
  if (!list || !Number.isInteger(id)) return

  const db = await getDb()
  await moveRow(db, list, id, direction)
  await noteListChange(list, id, session.login)
  refresh()
}

/* ── Загрузка картинок ───────────────────────────────────────────── */

export interface UploadState {
  error?: string
  url?: string
}

/**
 * Фотография к снимку работы.
 *
 * Возвращает состояние, а не молчит: загрузка — единственное место в
 * админке, где отказ вероятен по причинам на стороне человека (снял в
 * HEIC, файл на 40 МБ, прислал PDF). Молча ничего не делать здесь
 * нельзя — он нажмёт ещё раз и ещё.
 */
export async function uploadWorkPhoto(
  _state: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await requireAdmin()

  const id = Number(formData.get('id'))
  const file = formData.get('file')
  const hint = String(formData.get('hint') ?? '')
  if (!Number.isInteger(id)) return { error: 'Не понятно, к какой записи' }
  if (!(file instanceof File)) return { error: 'Файл не пришёл' }

  try {
    const saved = await savePhoto(file, hint)
    const db = await getDb()
    await setRowField(db, 'work', id, 'photo', saved.url)
    await noteListChange('work', id, session.login)
    refresh()
    return { url: saved.url }
  } catch (error) {
    return { error: error instanceof UploadError ? error.message : 'Не получилось сохранить файл' }
  }
}

/**
 * Фото товара — по одному файлу за вызов.
 *
 * Владелец выбирает пачку, а браузер отправляет файлы по очереди. Одним
 * запросом шесть снимков с телефона по 5 МБ упёрлись бы в предел тела
 * запроса (26 МБ, см. next.config.ts), и пропала бы вся пачка разом.
 *
 * modelKey — «audi/q7», если это фото фаркопа на машине, или пусто для
 * общих фото самого фаркопа (см. src/catalog/own-photos.ts).
 *
 * Фото лежат своей таблицей, а не в таблице товаров: выгрузка
 * поставщика перезаписывает товары целиком, и снимки владельца
 * исчезали бы при каждом обновлении прайса.
 */
export async function uploadProductPhoto(formData: FormData): Promise<UploadState> {
  const session = await requireAdmin()

  const slug = String(formData.get('slug') ?? '')
  const modelKey = String(formData.get('modelKey') ?? '')
  const file = formData.get('file')
  if (!slug) return { error: 'Не понятно, к какому товару' }
  if (modelKey && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(modelKey)) return { error: 'Не понятно, какая машина' }
  if (!(file instanceof File)) return { error: 'Файл не пришёл' }

  try {
    const saved = await savePhoto(file, modelKey ? `${slug}-${modelKey.replace('/', '-')}` : slug)
    const db = await getDb()
    await addPhoto(db, slug, modelKey, saved.url)
    await markDirty(db, 'product', slug, session.login)
    forgetOwnPhotos()
    refresh()
    return { url: saved.url }
  } catch (error) {
    return { error: error instanceof UploadError ? error.message : 'Не получилось сохранить файл' }
  }
}

export async function deleteProductPhoto(id: number): Promise<void> {
  const session = await requireAdmin()
  const db = await getDb()
  const slug = await deletePhoto(db, id)
  if (slug) await markDirty(db, 'product', slug, session.login)
  forgetOwnPhotos()
  refresh()
}

export async function moveProductPhoto(id: number, delta: -1 | 1): Promise<void> {
  const session = await requireAdmin()
  const db = await getDb()
  const slug = await movePhoto(db, id, delta === -1 ? -1 : 1)
  if (slug) await markDirty(db, 'product', slug, session.login)
  forgetOwnPhotos()
  refresh()
}

/**
 * Форма акции и её позиции.
 *
 * Отдельное действие, потому что позиции — массив, а общий
 * обработчик полей кладёт строки. Передавать массив строкой JSON через
 * то же поле можно, но тогда любая правка названия акции проходила бы
 * проверку «а не JSON ли это», и однажды проверка ошиблась бы.
 */
export async function savePromoShape(formData: FormData): Promise<void> {
  const session = await requireAdmin()

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const kind = formData.get('kind') === 'list' ? 'list' : 'text'
  const raw = String(formData.get('items') ?? '[]')

  let items: { model: string; discount: string }[] = []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      items = parsed
        .map((item) => ({
          model: String((item as { model?: unknown }).model ?? '').trim(),
          discount: String((item as { discount?: unknown }).discount ?? '').trim(),
        }))
        // Пустые строки выбрасываются здесь, а не при показе: пустая
        // позиция в списке скидок на витрине выглядит ошибкой вёрстки.
        .filter((item) => item.model || item.discount)
    }
  } catch {
    return
  }

  const db = await getDb()
  await db.update(promos).set({ kind, items }).where(eq(promos.id, id))
  await noteListChange('promo', id, session.login)
  refresh()
}

/* ── Публикация ──────────────────────────────────────────────────── */

/**
 * Запускает публикацию сайта.
 *
 * Отвечает сразу: сама публикация идёт отдельным процессом полчаса.
 * Ход дела страница читает из журнала (см. src/admin/publish.ts).
 */
export async function publishSite(): Promise<void> {
  await requireAdmin()
  await startPublish()
  refresh()
}
