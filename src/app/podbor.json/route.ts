import { buildPickerIndex } from '@/catalog/queries'
import { getDb } from '@/db/client'

/**
 * Справочник подбора отдельным файлом.
 *
 * Он не входит в разметку страниц и не попадает в основной пакет:
 * подбор нужен не каждому посетителю, а тому, кто открыл списки. Файл
 * запрашивается при первом обращении к подбору и после этого лежит
 * в кеше браузера.
 *
 * Собирается на сборке, а не по запросу: данные меняются только при
 * импорте каталога.
 */
export const dynamic = 'force-static'

export async function GET() {
  const db = await getDb()
  const index = await buildPickerIndex(db)

  return Response.json(index, {
    headers: {
      // Содержимое меняется только вместе со сборкой, и адрес у него
      // постоянный — поэтому проверять свежесть раз в час достаточно.
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
