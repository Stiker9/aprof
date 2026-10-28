import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '@/db/client'

/**
 * Ночная копия базы — её забирает deploy/server/vashfarkop-backup.sh.
 *
 * ── Почему через админку, а не копией папки ──
 *
 * Базу держит работающая админка, и снятая на ходу копия файлов не
 * согласована — такая не откроется («Aborted()»). Остановить админку на
 * время копии — значит потерять заявки, пришедшие в эти секунды.
 * Поэтому базу выгружает сама админка встроенным dumpDataDir, как и для
 * публикации (src/admin/publish.ts): согласованный снимок без простоя.
 *
 * ── Кто может забрать ──
 *
 * В снимке заявки с телефонами покупателей. Отдаётся он только запросу
 * изнутри сервера и с ключом:
 *
 * — nginx ставит X-Forwarded-For каждому запросу снаружи. Есть заголовок
 *   — значит пришли из интернета, отказ, даже с верным ключом;
 * — ключ BACKUP_TOKEN лежит в .env.local и в скрипте копии. Нет ключа в
 *   настройках — адрес выключен совсем.
 */
export async function POST(request: Request): Promise<Response> {
  const token = process.env.BACKUP_TOKEN ?? ''
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  const outside = request.headers.has('x-forwarded-for') || request.headers.has('x-real-ip')

  if (!token || outside || !same(given, token)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const db = await getDb()
  const client = (db as unknown as { $client?: { dumpDataDir?: (c: 'gzip') => Promise<Blob> } }).$client
  if (typeof client?.dumpDataDir !== 'function') {
    return new NextResponse('База не умеет выгружаться', { status: 500 })
  }

  const blob = await client.dumpDataDir('gzip')
  return new NextResponse(blob, {
    headers: { 'content-type': 'application/gzip', 'cache-control': 'no-store' },
  })
}

/** Сравнение без утечки по времени: ключ не подобрать посимвольно. */
function same(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
