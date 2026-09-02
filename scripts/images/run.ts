/**
 * Сбор картинок товаров с сайтов заводов.
 *
 *   npx tsx scripts/images/run.ts                     — все источники
 *   npx tsx scripts/images/run.ts --source=treiler    — один
 *   npx tsx scripts/images/run.ts --limit=20          — первые двадцать карточек
 *   npx tsx scripts/images/run.ts --plan              — только посчитать, ничего не качая
 *
 * Почему берём у заводов, а не из выгрузки поставщика: в выгрузке все
 * снимки со стенда несут замощённый знак «ФАРКОП.РФ» с чужим телефоном.
 * Снимать знак нельзя — это ст. 1300 ГК, отдельный состав помимо
 * самого использования. Поэтому источник — сайт того завода, чьё
 * изделие мы продаём, где та же картинка выложена без чужого знака.
 *
 * Данные читаются из data/catalog.json.gz, а не из PGlite: базу держит
 * dev-сервер, у неё один писатель, и параллельный запуск её ронял бы.
 *
 * Скрипт можно прерывать и запускать заново: страницы лежат в кэше,
 * готовые артикулы пропускаются.
 */
import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { fetchBuffer } from './core/http'
import { probe, type ImageProbe } from './core/classify'
import { articleKey } from './core/match'
import { readManifest, savePhoto, writeManifest, type Manifest } from './core/store'
import type { Source } from './core/types'
import { leaderPlus } from './sources/leader-plus'
import { treiler } from './sources/treiler'

const SOURCES: Source[] = [leaderPlus, treiler]

/**
 * Заводы, чей чертёж из выгрузки поставщика чист.
 *
 * Держится в одном месте с src/catalog/product-image.ts и schemas.ts —
 * три списка обязаны совпадать, иначе парсер пойдёт искать картинки тем
 * товарам, у которых они уже есть.
 */
const CLEAN_SCHEMA = new Set([
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
  products: {
    slug: string
    article: string
    manufacturerId: number
    images: string[] | null
  }[]
}

interface Need {
  slug: string
  article: string
  manufacturer: string
}

function loadCatalog(): Catalog {
  return JSON.parse(gunzipSync(readFileSync('data/catalog.json.gz')).toString()) as Catalog
}

/** Товары, у которых сейчас стоит обобщённый рисунок по типу шара. */
function collectNeeds(catalog: Catalog, manifest: Manifest): Need[] {
  const names = new Map(catalog.manufacturers.map((m) => [m.id, m.name]))
  const needs: Need[] = []

  for (const product of catalog.products) {
    const manufacturer = names.get(product.manufacturerId) ?? '?'
    const hasCleanSchema =
      CLEAN_SCHEMA.has(manufacturer) && (product.images ?? []).some((u) => u.includes('/shema/'))
    if (hasCleanSchema) continue
    if (manifest[product.slug]) continue
    needs.push({ slug: product.slug, article: product.article, manufacturer })
  }
  return needs
}

function arg(name: string): string | undefined {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`))
  return found?.split('=')[1]
}

async function main() {
  const only = arg('source')
  const limit = arg('limit') ? Number(arg('limit')) : undefined
  const planOnly = process.argv.includes('--plan')

  const catalog = loadCatalog()
  const manifest = await readManifest()
  const needs = collectNeeds(catalog, manifest)

  console.log(`Товаров без своей картинки: ${needs.length}`)
  console.log(`Уже собрано в прошлые запуски: ${Object.keys(manifest).length}`)
  console.log('')

  const sources = SOURCES.filter((s) => !only || s.id === only)
  if (only && sources.length === 0) {
    console.error(`Источника «${only}» нет. Есть: ${SOURCES.map((s) => s.id).join(', ')}`)
    process.exit(1)
  }

  for (const source of sources) {
    const mine = needs.filter((n) => source.manufacturers.includes(n.manufacturer))
    if (mine.length === 0) {
      console.log(`${source.id}: нечего искать`)
      continue
    }

    // Ключ артикула → наш товар. Столкновений внутри завода нет,
    // это проверено по всей базе (scripts/images/match.test.ts).
    const bySlugKey = new Map<string, Need>()
    for (const need of mine) bySlugKey.set(articleKey(need.article), need)

    console.log(`${source.id} (${source.site}) — нужно ${mine.length}`)
    if (planOnly) continue

    let found = 0
    let saved = 0
    let skipped = 0

    for await (const product of source.discover({ needed: new Set(bySlugKey.keys()), limit })) {
      const need = bySlugKey.get(articleKey(product.article))
      if (!need) continue
      found++

      // Скачиваем все кадры карточки и выбираем лучший: чертёж бьёт всё
      // остальное независимо от того, каким он идёт в разметке.
      let best: { data: Buffer; url: string; info: ImageProbe } | null = null

      for (const image of product.images) {
        const data = await fetchBuffer(image.url, { referer: image.referer })
        if (!data || data.length < 4000) continue
        const info = await probe(data)
        if (!info) continue
        if (info.width < 300 || info.height < 200) continue
        if (!best || (best.info.kind !== 'drawing' && info.kind === 'drawing')) {
          best = { data, url: image.url, info }
        }
        if (best.info.kind === 'drawing') break
      }

      if (!best) {
        skipped++
        continue
      }

      const file = await savePhoto(need.slug, best.data)
      manifest[need.slug] = {
        article: need.article,
        file,
        source: source.id,
        page: product.pageUrl,
        origin: best.url,
        kind: best.info.kind,
        width: best.info.width,
        height: best.info.height,
        colours: best.info.colours,
        entropy: Number(best.info.entropy.toFixed(2)),
        // Чертёж выкладываем сразу: в кадре только изделие. Всё
        // остальное ждёт просмотра — на фотографиях бывают чужие номера
        // и телефоны автосалонов.
        approved: best.info.kind === 'drawing',
      }
      saved++

      if (saved % 25 === 0) {
        await writeManifest(manifest)
        console.log(`  … ${saved} сохранено`)
      }
    }

    await writeManifest(manifest)
    console.log(`  нашлось ${found}, сохранено ${saved}, без годной картинки ${skipped}`)
    console.log('')
  }

  const total = Object.keys(manifest).length
  const approved = Object.values(manifest).filter((r) => r.approved).length
  console.log(`Всего в манифесте ${total}, из них готовы к показу ${approved}`)
  console.log('Дальше: npx tsx scripts/images/generate.ts — собрать список для сайта')
}

void main()
