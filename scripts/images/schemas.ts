/**
 * Переносит чертежи из выгрузки поставщика к себе.
 *
 *   npx tsx scripts/images/schemas.ts                       — все чистые заводы
 *   npx tsx scripts/images/schemas.ts --maker=Baltex        — один
 *   npx tsx scripts/images/schemas.ts --plan                — только посчитать
 *
 * ── Зачем, если чертежи и так показываются ──
 *
 * Показывались они по прямой ссылке на сервер поставщика:
 *
 *   <img src="https://xn--80aumecw.xn--p1ai/shema/F.6312.001.jpg">
 *
 * То есть 3 630 карточек нашего каталога грузили картинку с чужого
 * сервера при каждом открытии. Это плохо сразу с нескольких сторон:
 *
 * - владелец сервера видит по Referer, какие наши страницы смотрят и
 *   сколько; фактически у него открыта статистика нашего каталога;
 * - он в любой момент может закрыть доступ по Referer — и 3 630
 *   карточек разом останутся без картинок;
 * - он может подменить любое изображение на что угодно, включая свою
 *   рекламу, и на нашем сайте это появится само;
 * - скорость наших страниц зависит от его сервера.
 *
 * Скачивание всё это снимает: файл ложится к нам, ссылка становится
 * своей. Нагрузка на чужой сервер при этом падает — сейчас он отдаёт
 * картинку каждому посетителю, а после будет один раз нам.
 *
 * ── Что берём ──
 *
 * Только чертежи заводов, у которых они без чужого знака. Список
 * проверен глазами: скачан образец от каждого из 23 заводов, у которых
 * в выгрузке вообще есть чертежи, и просмотрен. У Лидер-плюс, AvtoS,
 * Sheriff, Трейлер, БИЗОН, TAVIALS, АвтоСтандарт, AUTO-HAK, WESTFALIA,
 * Aragon, IMIOLA и Witter на чертеже замощён знак «ФАРКОП.РФ» с чужим
 * телефоном — эти не берём и не берегли бы даже локально.
 */
import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { probe } from './core/classify'
import { fetchBuffer } from './core/http'
import { readManifest, savePhoto, writeManifest } from './core/store'

/**
 * Заводы, чей чертёж в выгрузке чист.
 *
 * Первые семь — проверены раньше, их чертежи уже стоят на сайте.
 * Baltex, FarkopRos, TowRus и ZincaR добавлены 2 сентября 2026:
 * образцы просмотрены, знака нет. Это ещё 88 карточек.
 *
 * Список обязан совпадать с CLEAN_SCHEMA_MANUFACTURERS в
 * src/catalog/product-image.ts и CLEAN_SCHEMA в run.ts.
 */
const CLEAN = new Set([
  'Steinhof',
  'GALIA',
  'Oris',
  'ТСС',
  'PT GROUP',
  'Motodor',
  'Berg',
  'Baltex',
  'FarkopRos',
  'TowRus',
  'ZincaR',
])

interface Catalog {
  manufacturers: { id: number; name: string }[]
  products: { slug: string; article: string; manufacturerId: number; images: string[] | null }[]
}

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
}

async function main() {
  const onlyMaker = arg('maker')
  const planOnly = process.argv.includes('--plan')
  const limit = arg('limit') ? Number(arg('limit')) : undefined

  const catalog = JSON.parse(
    gunzipSync(readFileSync('data/catalog.json.gz')).toString(),
  ) as Catalog
  const names = new Map(catalog.manufacturers.map((m) => [m.id, m.name]))
  const manifest = await readManifest()

  const todo: { slug: string; article: string; maker: string; url: string }[] = []
  for (const product of catalog.products) {
    const maker = names.get(product.manufacturerId) ?? '?'
    if (!CLEAN.has(maker)) continue
    if (onlyMaker && maker !== onlyMaker) continue
    if (manifest[product.slug]) continue
    const url = (product.images ?? []).find((u) => u.includes('/shema/'))
    if (!url) continue
    todo.push({ slug: product.slug, article: product.article, maker, url })
  }

  const byMaker = new Map<string, number>()
  for (const item of todo) byMaker.set(item.maker, (byMaker.get(item.maker) ?? 0) + 1)
  console.log(`К переносу ${todo.length} чертежей:`)
  for (const [maker, count] of [...byMaker].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${maker.padEnd(12)} ${count}`)
  }
  if (planOnly) return

  let saved = 0
  let failed = 0
  let rejected = 0

  for (const item of todo.slice(0, limit ?? todo.length)) {
    const data = await fetchBuffer(item.url)
    if (!data || data.length < 3000) {
      failed++
      continue
    }
    const info = await probe(data)
    if (!info) {
      failed++
      continue
    }
    // Чертёж обязан выглядеть чертежом. Если классификатор говорит
    // «не чертёж» — файл всё равно сохраняем, но на сайт не выпускаем.
    //
    // Так вскрылась настоящая беда: у части чертежей GALIA — завода из
    // списка чистых — поверх замощён красный «ФАРКОП.РФ». Знак добавляет
    // цвета, картинка не проходит проверку на чертёж, и именно поэтому
    // она сюда и попала. Просто пропустить такие было бы полбеды:
    // страница тогда грузила бы ту же картинку по чужой ссылке. Поэтому
    // сохраняем и помечаем, что решение за человеком.
    if (info.kind !== 'drawing') rejected++

    const file = await savePhoto(item.slug, data)
    manifest[item.slug] = {
      article: item.article,
      file,
      source: 'supplier-schema',
      page: item.url,
      origin: item.url,
      kind: info.kind,
      width: info.width,
      height: info.height,
      colours: info.colours,
      entropy: Number(info.entropy.toFixed(2)),
      approved: info.kind === 'drawing',
    }
    saved++

    if (saved % 100 === 0) {
      await writeManifest(manifest)
      console.log(`  … ${saved} из ${todo.length}`)
    }
  }

  await writeManifest(manifest)
  console.log('')
  console.log(`Перенесено ${saved}, не скачалось ${failed}, из них не чертёж ${rejected} — ждут просмотра`)
  console.log('Дальше: npx tsx scripts/images/generate.ts')
}

void main()
