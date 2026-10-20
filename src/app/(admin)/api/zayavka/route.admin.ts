import { NextResponse } from 'next/server'
import { getDb } from '@/db/client'
import { requests } from '@/db/schema'
import { noteRequest, tooManyRequests } from '@/admin/request-limit'

/**
 * Приём заявок с сайта.
 *
 * ── Почему это здесь, а не на хостинге сайта ──
 *
 * Сайт — статические файлы на reg.ru: принять и записать заявку там
 * нечем, программы на той площадке не запускаются. Поэтому форма
 * отправляет заявку сюда, на сервер админки, и она сразу появляется в
 * разделе «Заявки» со всеми состояниями.
 *
 * Обратная сторона — запрос идёт с чужого домена, и браузер требует
 * разрешения (CORS). Разрешение выдаётся поимённо: только адреса
 * нашего сайта, не «всем подряд».
 *
 * ── Почему адрес не под проверкой входа ──
 *
 * Заявку оставляет посетитель, у него нет пароля. Значит адрес открыт
 * всему интернету, и защищать его приходится иначе: ограничением
 * частоты, ловушкой для роботов и проверкой согласия.
 *
 * ── Что сохраняется ──
 *
 * Имя, телефон, машина, комментарий и адрес страницы. Ничего сверх
 * того, что человек сам ввёл: ни отпечатка браузера, ни точного IP —
 * он нужен только чтобы считать частоту и в базу не попадает.
 */

/** Откуда разрешено отправлять. Чужие домены получат отказ браузера. */
const ALLOWED = new Set([
  'https://vashfarkop.ru',
  'https://www.vashfarkop.ru',
  'https://vashfarkop.online',
  'http://localhost:3001',
])

function cors(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED.has(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) })
}

/** Телефон без украшений: по нему считаем, что цифр достаточно. */
function digits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Обрезает поле: в базе не должно оказаться романа вместо комментария. */
function field(value: FormDataEntryValue | null, limit: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, limit)
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin')
  const headers = cors(origin)

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Не получилось прочитать форму' }, { status: 400, headers })
  }

  /*
    Ловушка: поле спрятано от человека стилями, но робот его видит в
    разметке и заполняет. Непустое — значит перед нами не покупатель.

    Отвечаем успехом, а не отказом: узнав про отказ, робота чинят под
    нашу проверку. Пусть считает, что всё прошло.
  */
  if (field(form.get('website'), 100) !== '') {
    return NextResponse.json({ ok: true }, { headers })
  }

  if (form.get('consent') !== 'on') {
    return NextResponse.json(
      { error: 'Без согласия на обработку данных заявку принять нельзя' },
      { status: 400, headers },
    )
  }

  const phone = field(form.get('phone'), 30)
  if (digits(phone).length < 10) {
    return NextResponse.json(
      { error: 'Проверьте номер телефона — кажется, он неполный' },
      { status: 400, headers },
    )
  }

  /*
    Частота считается по IP, который даёт nginx заголовком. Заявок с
    одного адреса бывает несколько — семья, автосервис, общий вайфай, —
    поэтому предел не «одна», а несколько за час.
  */
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for') ?? 'нет'
  if (tooManyRequests(ip)) {
    return NextResponse.json(
      { error: 'Слишком много заявок подряд. Позвоните нам или попробуйте позже' },
      { status: 429, headers },
    )
  }

  const db = await getDb()
  await db.insert(requests).values({
    name: field(form.get('name'), 120) || null,
    phone,
    car: field(form.get('car'), 120) || null,
    comment: field(form.get('comment'), 2000) || null,
    page: field(form.get('page'), 300) || null,
    status: 'new',
    createdAt: new Date().toISOString(),
  })

  noteRequest(ip)
  return NextResponse.json({ ok: true }, { headers })
}
